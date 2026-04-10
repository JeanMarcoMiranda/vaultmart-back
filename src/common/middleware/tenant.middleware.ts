import {
  BadRequestException,
  Injectable,
  NestMiddleware,
  NotFoundException,
} from '@nestjs/common';
import { NextFunction } from 'express';
import { TenantsService } from 'src/modules/tenants/tenants.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantsService: TenantsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      throw new BadRequestException('X-Tenant-ID header is missing');
    }

    const tenant = await this.tenantsService.findOne(tenantId);

    if (!tenant || !tenant.isActive) {
      throw new NotFoundException('Tenant not found or inactive');
    }

    req['tenantId'] = tenantId;
    next();
  }
}
