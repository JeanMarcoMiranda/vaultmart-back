import { Body, Controller, Get, Post } from '@nestjs/common';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantService: TenantsService) {}

  @Post()
  create(@Body() body: { name: string; slug: string }) {
    return this.tenantService.create(body.name, body.slug);
  }

  @Get()
  findAll() {
    return this.tenantService.findAll();
  }
}
