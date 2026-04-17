import { UserRole } from 'src/modules/users/entities/user.entity';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  tenantId: string;
  role: UserRole;
  branchId?: string; // this is only for MANAGER and WORKER
}
