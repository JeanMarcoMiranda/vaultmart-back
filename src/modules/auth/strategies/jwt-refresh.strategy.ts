import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express'; // <-- IMPORTANTE: sin esto, TypeScript marca error en `.headers.authorization`
import { UsersService } from 'src/modules/users/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthenticatedRefreshUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET')!,
      passReqToCallback: true, // <-- IMPORTANTE: sin esto, Express manda el payload en el lugar de "req" y tu app rompe
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<AuthenticatedRefreshUser> {
    const rawToken = req.headers.authorization?.split(' ')[1];
    if (!rawToken) throw new UnauthorizedException('Refresh token not found');

    const user = await this.usersService.findByEmailAndTenant(
      payload.email,
      payload.tenantId,
    );

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User inactive or not found');
    }

    // Return a typed object instead of mutating the User entity
    return { user, rawRefreshToken: rawToken };
  }
}
