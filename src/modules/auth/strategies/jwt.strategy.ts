import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TenantContext } from 'src/modules/tenants/tenants-context.service';
import { UsersService } from 'src/modules/users/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
    private readonly tenantContext: TenantContext,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    // We inyect the tenantId from the token to the tenant context
    // So that all services can use it
    this.tenantContext.tenantId = payload.tenantId;

    const user = await this.usersService.findByEmailAndTenant(
      payload.email,
      payload.tenantId,
    );

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid token or user is inactive');
    }

    // What we return here is what we get in the request.user
    return user;
  }
}
