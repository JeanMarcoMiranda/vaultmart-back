import { User } from 'src/modules/users/entities/user.entity';

/**
 * Shape of req.user when authenticated via the jwt-refresh strategy.
 * Wraps the User entity with the raw refresh token needed for rotation validation.
 */
export interface AuthenticatedRefreshUser {
  user: User;
  rawRefreshToken: string;
}
