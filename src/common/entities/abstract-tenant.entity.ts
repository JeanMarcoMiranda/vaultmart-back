import { Column, Index } from 'typeorm';

export abstract class AbstractTenantEntity {
  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;
}
