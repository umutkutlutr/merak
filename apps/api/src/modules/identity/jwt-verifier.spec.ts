import { describe, expect, it } from 'vitest';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
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

describe('JwtVerifier (JWKS mode — hosted Supabase asymmetric keys)', () => {
  it('accepts an ES256 token whose kid is in the JWKS; rejects a foreign key and an HS256 token', async () => {
    const { privateKey, publicKey } = await generateKeyPair('ES256');
    const other = await generateKeyPair('ES256');
    const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'ES256', use: 'sig' };
    const server = http.createServer((_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ keys: [jwk] }));
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
    const port = (server.address() as AddressInfo).port;
    try {
      const jwksEnv = loadEnv({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgres://x:y@localhost:1/db',
        SUPABASE_AUTH_URL: ISS,
        SUPABASE_JWT_SECRET: '',
        SUPABASE_JWKS_URL: `http://127.0.0.1:${port}/.well-known/jwks.json`,
        AUTH_JWT_ISSUER: ISS,
        AUTH_JWT_AUDIENCE: 'authenticated',
      });
      const v = new JwtVerifier(jwksEnv);
      expect(v.mode).toBe('jwks');
      const sub = randomUUID();
      const good = await new SignJWT({ role: 'authenticated' }).setProtectedHeader({ alg: 'ES256', kid: 'k1' }).setSubject(sub).setIssuer(ISS).setAudience('authenticated').setIssuedAt().setExpirationTime('5m').sign(privateKey);
      expect((await v.verify(good)).userId).toBe(sub);
      const foreign = await new SignJWT({}).setProtectedHeader({ alg: 'ES256', kid: 'k1' }).setSubject(sub).setIssuer(ISS).setAudience('authenticated').setExpirationTime('5m').sign(other.privateKey);
      expect(await codeOf(v.verify(foreign))).toBe('AUTH_INVALID_TOKEN');
      expect(await codeOf(v.verify(await sign({ sub })))).toBe('AUTH_INVALID_TOKEN'); // HS256 not accepted in JWKS mode
    } finally {
      server.close();
    }
  });
});
