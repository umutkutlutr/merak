import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AppError } from '../../common/errors.js';
import { JwtVerifier, type AuthUser } from './jwt-verifier.js';

export const IS_PUBLIC = 'merak:isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);

export interface AuthedRequest extends Request {
  auth: AuthUser;
  receivedAtMs: number;
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  const req = ctx.switchToHttp().getRequest<AuthedRequest>();
  return req.auth;
});

export const ReceivedAt = createParamDecorator((_data: unknown, ctx: ExecutionContext): number => {
  const req = ctx.switchToHttp().getRequest<AuthedRequest>();
  return req.receivedAtMs;
});

export function extractBearer(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly verifier: JwtVerifier,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    // WebSocket handlers authenticate in the handshake middleware (QuizGateway.afterInit).
    if (ctx.getType() !== 'http') return true;
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const token = extractBearer(req.headers.authorization);
    if (!token) throw new AppError('AUTH_REQUIRED');
    req.auth = await this.verifier.verify(token);
    return true;
  }
}
