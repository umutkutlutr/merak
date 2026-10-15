import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from './env.js';

const base = {
  DATABASE_URL: 'postgres://x:y@localhost:1/db',
  SUPABASE_AUTH_URL: 'http://localhost:9999',
  SUPABASE_JWKS_URL: '',
  AUTH_JWT_ISSUER: 'http://localhost:9999',
  AUTH_JWT_AUDIENCE: 'authenticated',
};
/** The local-stack default, read from the committed example file (the value anyone with the repo knows). */
const exampleSecret = /^SUPABASE_JWT_SECRET=(.*)$/m.exec(readFileSync(join(__dirname, '../../.env.example'), 'utf8'))![1]!.trim();

describe('loadEnv JWT secret guard', () => {
  it('accepts the committed local default outside production', () => {
    expect(loadEnv({ ...base, NODE_ENV: 'development', SUPABASE_JWT_SECRET: exampleSecret }).SUPABASE_JWT_SECRET).toBe(exampleSecret);
  });
  it('refuses public development secrets in production', () => {
    for (const secret of [exampleSecret, 'super-secret-jwt-token-with-at-least-32-characters-long']) {
      expect(() => loadEnv({ ...base, NODE_ENV: 'production', SUPABASE_JWT_SECRET: secret })).toThrow(/public development default/);
    }
  });
  it('accepts a private secret in production', () => {
    expect(() => loadEnv({ ...base, NODE_ENV: 'production', SUPABASE_JWT_SECRET: 'a'.repeat(16) + 'private-' + 'b'.repeat(24) })).not.toThrow();
  });
});
