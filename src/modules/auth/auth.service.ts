import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ─── Login ────────────────────────────────────────────────────────────────

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmailAndTenant(
      loginDto.email,
      loginDto.tenantId,
    );

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new ForbiddenException('User is inactive');

    const passwordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user);

    // We save the hash of the refresh token in the database(never the access token)
    const refreshHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.usersService.updateRefreshTokenHash(user.id, refreshHash);
    await this.usersService.updateLastLogin(user.id);

    return tokens;
  }

  // ─── Refresh ──────────────────────────────────────────────────────────────

  async refresh(user: User, incomingRefreshToken: string) {
    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('Session expired, try loggin in again');
    }

    const tokenValid = await bcrypt.compare(
      incomingRefreshToken,
      user.refreshTokenHash,
    );
    if (!tokenValid) throw new UnauthorizedException('Invalid refresh token');

    const tokens = await this.generateTokens(user);

    // Rotation: we invalidate the previous refresh token by saving the new hash
    const newRefreshHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.usersService.updateRefreshTokenHash(user.id, newRefreshHash);

    return tokens;
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async logout(userId: string) {
    // This invalidates the refresh token by setting the hash to null
    await this.usersService.updateRefreshTokenHash(userId, null);
  }

  // ─── Helpers privados ────────────────────────────────────────────────────

  private async generateTokens(user: User) {
    // We extract the branchId from the first assigned branch if exists
    const branchId = user.branchAssignments?.[0]?.branchId ?? undefined;

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      branchId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
