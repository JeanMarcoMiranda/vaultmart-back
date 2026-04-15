import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantContext } from './tenants-context.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  providers: [TenantsService, TenantContext],
  controllers: [TenantsController],
  exports: [TenantsService, TypeOrmModule, TenantContext],
})
export class TenantsModule {}
