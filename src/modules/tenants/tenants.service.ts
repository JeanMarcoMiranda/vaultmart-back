import { ConflictException, Injectable } from '@nestjs/common';
import { Tenant } from './entities/tenant.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async create(name: string, slug: string): Promise<Tenant> {
    const existing = await this.tenantRepository.findOne({ where: { slug } });

    if (existing) {
      throw new ConflictException('Tenant with this slug already exists');
    }

    const tenant = this.tenantRepository.create({ name, slug });
    return await this.tenantRepository.save(tenant);
  }

  async findAll(): Promise<Tenant[]> {
    return await this.tenantRepository.find();
  }

  async findOne(id: string): Promise<Tenant | null> {
    return await this.tenantRepository.findOne({
      where: { id, isActive: true },
    });
  }
}
