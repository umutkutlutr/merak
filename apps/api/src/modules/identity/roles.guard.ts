import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@merak/contracts';
import { AppError } from '../../common/errors.js';
import { ProfilesService } from '../profiles/profiles.service.js';
import type { AuthedRequest } from './auth.guard.js';

export const ROLES_KEY = 'merak:roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Server-side role check. The role lives in app.profiles and is read per request; a hidden
 * button in a client is never an authorization boundary.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly profiles: ProfilesService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (ctx.getType() !== 'http') return true;
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    if (!req.auth) throw new AppError('AUTH_REQUIRED');
    const role = await this.profiles.getRole(req.auth.userId);
    if (!role || !required.includes(role)) throw new AppError('FORBIDDEN');
    return true;
  }
}
