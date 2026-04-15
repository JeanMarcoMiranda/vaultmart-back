import { TenantAwareEntity } from 'src/common/entities/tenant-aware.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('branches')
export class Branch extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({nullable: true})
  phone: string;

  @Column({default: true})
}
