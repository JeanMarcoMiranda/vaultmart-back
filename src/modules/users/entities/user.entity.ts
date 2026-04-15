import { TenantAwareEntity } from 'src/common/entities/tenant-aware.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { UserBranchAssignment } from './user-branch-assignment.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  OWNER = 'owner',
  MANAGER = 'manager',
  WORKER = 'worker',
  SUPPLIER = 'supplier',
}

@Entity('users')
@Unique(['email', 'tenantId'])
export class User extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.WORKER })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'refresh_token_hash', nullable: true })
  refreshTokenHash: string | null;

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt: Date | null;

  @OneToMany(() => UserBranchAssignment, (a) => a.user, { cascade: true })
  branchAssignments: UserBranchAssignment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
