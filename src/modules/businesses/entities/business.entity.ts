import { TenantAwareEntity } from 'src/common/entities/tenant-aware.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Branch } from './branch.entity';

@Entity('businesses')
export class Business extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'PEN' })
  currency: string;

  @Column({ name: 'timezone', default: 'America/Lima' })
  timezone: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Branch, (branch) => branch.business, { cascade: true })
  branches: Branch[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
