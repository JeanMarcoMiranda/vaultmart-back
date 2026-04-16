import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UserBranchAssignment } from './entities/user-branch-assignment.entity';
import { TenantContext } from '../tenants/tenants-context.service';
import { DataSource } from 'typeorm/browser';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

const ROLES_REQUIRING_BRANCH = [UserRole.MANAGER, UserRole.WORKER];

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserBranchAssignment)
    private readonly assigmentRepository: Repository<UserBranchAssignment>,
    private readonly tenantContext: TenantContext,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Private Helpers ─────────────────────────────────────────────────────

  private get tenantId() {
    return this.tenantContext.tenantId;
  }

  // ─── Queries ─────────────────────────────────────────────────────────────

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      where: { tenantId: this.tenantId },
      relations: { branchAssignments: { branch: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, tenantId: this.tenantId },
      relations: { branchAssignments: { branch: true } },
    });

    if (!user) throw new NotFoundException(`User ${id} not found`);

    return user;
  }

  // Used by AuthService - searches without filtering by tenantId
  async findByEmailAndTenant(
    email: string,
    tenantId: string,
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, tenantId },
      relations: { branchAssignments: { branch: true } },
    });
  }

  // ─── Mutations ───────────────────────────────────────────────────────────

  async create(userCreateDto: CreateUserDto): Promise<User> {
    // Validate that MANAGER and WORKER have branchId
    if (
      ROLES_REQUIRING_BRANCH.includes(userCreateDto.role) &&
      !userCreateDto.branchId
    ) {
      throw new BadRequestException(
        `Role ${userCreateDto.role} requires a branchId`,
      );
    }

    // Check if email already exists in the same tenant
    const existingUser = await this.userRepository.findOne({
      where: { email: userCreateDto.email, tenantId: this.tenantId },
    });
    if (existingUser) {
      throw new ConflictException(`A user with that email already exists`);
    }

    const passwordHash = await bcrypt.hash(userCreateDto.password, 12);

    // We use QueryRunner to create the user and assignment in a single transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = queryRunner.manager.create(User, {
        email: userCreateDto.email,
        password: passwordHash,
        firstName: userCreateDto.firstName,
        lastName: userCreateDto.lastName,
        role: userCreateDto.role,
        tenantId: this.tenantId,
      });
      await queryRunner.manager.save(user);

      if (userCreateDto.branchId) {
        const assignment = queryRunner.manager.create(UserBranchAssignment, {
          userId: user.id,
          branchId: userCreateDto.branchId,
          tenantId: this.tenantId,
        });
        await queryRunner.manager.save(assignment);
      }

      await queryRunner.commitTransaction();
      return this.findById(user.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, updateDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    // If the role is updated to one that requires a branch, validate branchId
    const newRole = updateDto.role ?? user.role;
    if (ROLES_REQUIRING_BRANCH.includes(newRole) && !updateDto.branchId) {
      const hasAssignment = await this.assigmentRepository.findOne({
        where: { userId: id, tenantId: this.tenantId },
      });

      if (!hasAssignment) {
        throw new BadRequestException(
          `Role ${newRole} requires an assigned branch`,
        );
      }
    }

    if (updateDto.firstName) user.firstName = updateDto.firstName;
    if (updateDto.lastName) user.lastName = updateDto.lastName;
    if (updateDto.role) user.role = updateDto.role;
    if (updateDto.isActive !== undefined) user.isActive = updateDto.isActive;

    await this.userRepository.save(user);

    if (updateDto.branchId) {
      await this.assignBranch(id, updateDto.branchId);
    }

    return this.findById(id);
  }

  async deactivate(id: string): Promise<void> {
    const user = await this.findById(id);

    user.isActive = false;

    // Invalidate refresh token on deactivate
    user.refreshTokenHash = null;
    await this.userRepository.save(user);
  }

  // ─── Branch Assignment Management ────────────────────────────────────────

  async assignBranch(userId: string, branchId: string): Promise<void> {
    await this.findById(userId); // validate user exists in this tenant

    // Delete previous assignment if exists
    await this.assigmentRepository.delete({ userId, tenantId: this.tenantId });

    const assignment = this.assigmentRepository.create({
      userId,
      branchId,
      tenantId: this.tenantId,
    });
    await this.assigmentRepository.save(assignment);
  }

  async removeBranchAssignment(userId: string): Promise<void> {
    await this.findById(userId);
    await this.assigmentRepository.delete({ userId, tenantId: this.tenantId });
  }

  // ─── Methods used by AuthService ─────────────────────────────────────────

  async updateRefreshTokenHash(
    userId: string,
    hash: string | null,
  ): Promise<void> {
    await this.userRepository.update(userId, { refreshTokenHash: hash });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, { lastLoginAt: new Date() });
  }
}
