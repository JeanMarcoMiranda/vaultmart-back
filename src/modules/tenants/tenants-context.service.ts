import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  private _tenantId: string;

  set tenantId(id: string) {
    this._tenantId = id;
  }

  get tenantId(): string {
    if (!this._tenantId) {
      throw new Error('Tenant ID not set');
    }
    return this._tenantId;
  }
}
