import { Inject, Injectable } from '@nestjs/common';
import { createRemoteJWKSet, errors as joseErrors, jwtVerify, type JWTPayload } from 'jose';
import { ENV, type Env } from '../../config/env.js';
import { AppError } from '../../common/errors.js';

export interface AuthUser {
  userId: string;
  /** Present for email sign-ins. Never persisted in the app schema. */
  email: string | null;
  authRole: string | null;
  authSessionId: string | null;
}

/**
 * Verifies Supabase Auth JWTs. Two signing modes:
 *  - HS256 shared secret (local GoTrue / `supabase start`)   -> SUPABASE_JWT_SECRET
 *  - Asymmetric keys via JWKS (hosted Supabase projects)     -> SUPABASE_JWKS_URL
 * Signature, exp, iss and aud are always enforced. The user id is ONLY ever read from `sub`.
 */
@Injectable()
export class JwtVerifier {
  private readonly secret: Uint8Array | null;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet> | null;
  private readonly issuer: string;
  private readonly audience: string;

  constructor(@Inject(ENV) env: Env) {
    this.issuer = env.AUTH_JWT_ISSUER;
    this.audience = env.AUTH_JWT_AUDIENCE;
    if (env.SUPABASE_JWKS_URL) {
      this.jwks = createRemoteJWKSet(new URL(env.SUPABASE_JWKS_URL));
      this.secret = null;
    } else {
      this.secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
      this.jwks = null;
    }
  }

  get mode(): 'hs256' | 'jwks' {
    return this.jwks ? 'jwks' : 'hs256';
  }

  async verify(token: string): Promise<AuthUser> {
    let payload: JWTPayload;
    try {
      const result = this.jwks
        ? await jwtVerify(token, this.jwks, {
            issuer: this.issuer,
            audience: this.audience,
            algorithms: ['ES256', 'RS256'],
            clockTolerance: 5,
          })
        : await jwtVerify(token, this.secret as Uint8Array, {
            issuer: this.issuer,
            audience: this.audience,
            algorithms: ['HS256'],
            clockTolerance: 5,
          });
      payload = result.payload;
    } catch (err) {
      if (err instanceof joseErrors.JWTExpired) throw new AppError('AUTH_TOKEN_EXPIRED');
      throw new AppError('AUTH_INVALID_TOKEN');
    }
    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw new AppError('AUTH_INVALID_TOKEN');
    }
    return {
      userId: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : null,
      authRole: typeof payload.role === 'string' ? payload.role : null,
      authSessionId: typeof payload.session_id === 'string' ? payload.session_id : null,
    };
  }
}
