import { describe, expect, it } from 'vitest';
import { SignJWT } from 'jose';
import { randomUUID } from 'node:crypto';
import { loadEnv } from '../../config/env.js';
import { JwtVerifier } from './jwt-verifier.js';
import { AppError } from '../../common/errors.js';

const SECRET = 'unit-test-secret-0123456789-0123456789-0123456789';
const ISS = 'http://localhost:9999';
const env = loadEnv({
  NODE_ENV: 'test',
  DATABASE_URL: 'postgres://x:y@localhost:1/db',
  SUPABASE_AUTH_URL: ISS,
  SUPABASE_JWT_SECRET: SECRET,
  SUPABASE_JWKS_URL: '',
  AUTH_JWT_ISSUER: ISS,
  AUTH_JWT_AUDIENCE: 'authenticated',
});
const verifier = new JwtVerifier(env);

async function sign(opts: { sub?: string; secret?: string; iss?: string; aud?: string; exp?: string; claims?: Record<string, unknown> } = {}) {
  const j = new SignJWT({ role: 'authenticated', email: 'a@b.c', ...(opts.claims ?? {}) }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt();
  if (opts.sub !== undefined) j.setSubject(opts.sub);
  j.setIssuer(opts.iss ?? ISS).setAudience(opts.aud ?? 'authenticated').setExpirationTime(opts.exp ?? '5m');
  return j.sign(new TextEncoder().encode(opts.secret ?? SECRET));
}

const codeOf = async (p: Promise<unknown>) => {
  try {
    await p;
    return 'OK';
  } catch (e) {
    return e instanceof AppError ? e.code : 'OTHER';
  }
};

describe('JwtVerifier (HS256 mode)', () => {
  it('accepts a valid Supabase-shaped token and reads the user id from sub only', async () => {
    const sub = randomUUID();
    const u = await verifier.verify(await sign({ sub, claims: { userId: 'attacker-chosen', user_id: 'nope' } }));
    expect(u.userId).toBe(sub);
    expect(u.email).toBe('a@b.c');
  });
  it('rejects an expired token with AUTH_TOKEN_EXPIRED', async () => {
    expect(await codeOf(verifier.verify(await sign({ sub: randomUUID(), exp: '-1h' })))).toBe('AUTH_TOKEN_EXPIRED');
  });
  it('rejects wrong secret, issuer, audience, missing sub and alg=none', async () => {
    expect(await codeOf(verifier.verify(await sign({ sub: randomUUID(), secret: 'other-secret-0123456789-0123456789-0123456789' })))).toBe('AUTH_INVALID_TOKEN');
    expect(await codeOf(verifier.verify(await sign({ sub: randomUUID(), iss: 'https://evil.example' })))).toBe('AUTH_INVALID_TOKEN');
    expect(await codeOf(verifier.verify(await sign({ sub: randomUUID(), aud: 'service_role' })))).toBe('AUTH_INVALID_TOKEN');
    expect(await codeOf(verifier.verify(await sign({})))).toBe('AUTH_INVALID_TOKEN');
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: randomUUID(), iss: ISS, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 300 })).toString('base64url');
    expect(await codeOf(verifier.verify(`${header}.${payload}.`))).toBe('AUTH_INVALID_TOKEN');
    expect(await codeOf(verifier.verify('garbage'))).toBe('AUTH_INVALID_TOKEN');
  });
});
