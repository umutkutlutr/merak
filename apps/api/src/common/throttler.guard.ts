import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { AuthedRequest } from '../modules/identity/auth.guard.js';

/** HTTP-only rate limiting keyed by user id when authenticated, else by IP. */
@Injectable()
export class HttpThrottlerGuard extends ThrottlerGuard {
  override async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (ctx.getType() !== 'http') return true;
    return super.canActivate(ctx);
  }

  protected override async getTracker(req: Record<string, unknown>): Promise<string> {
    const auth = (req as unknown as AuthedRequest).auth;
    if (auth?.userId) return `user:${auth.userId}`;
    const ip = (req as { ip?: string }).ip ?? (req as { socket?: { remoteAddress?: string } }).socket?.remoteAddress ?? 'unknown';
    return `ip:${ip}`;
  }
}
