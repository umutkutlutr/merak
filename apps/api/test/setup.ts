/**
 * Integration test bootstrap: runs ONCE per test file (files run serially).
 * Creates a throwaway database (merak_test), the roles the privilege tests need, the `app` schema
 * owned by app_api, then applies the real SQL migrations as app_api — the same path as production.
 */
import 'dotenv/config';
import { beforeAll } from 'vitest';
import { Client } from 'pg';
import { loadEnv, setEnvForTests } from '../src/config/env.js';
import { runMigrations } from '../src/db/migrate.js';

const ADMIN_URL = process.env.DATABASE_ADMIN_URL ?? 'postgres://postgres:postgres@127.0.0.1:54329/merak';
const TEST_DB = process.env.TEST_DB_NAME ?? 'merak_test';
const APP_ROLE = 'app_api';
const APP_PASS = process.env.TEST_APP_DB_PASSWORD ?? 'app_api_local_dev';
export const TEST_JWT_SECRET = 'merak-test-jwt-secret-0123456789-abcdefghijklmnopqrstuvwxyz';
export const TEST_ISSUER = 'http://localhost:9999';
export const TEST_AUDIENCE = 'authenticated';

function withDb(url: string, db: string): string {
  const u = new URL(url);
  u.pathname = `/${db}`;
  return u.toString();
}

export const TEST_DATABASE_URL = (() => {
  const u = new URL(withDb(ADMIN_URL, TEST_DB));
  u.username = APP_ROLE;
  u.password = APP_PASS;
  return u.toString();
})();
export const TEST_ADMIN_DATABASE_URL = withDb(ADMIN_URL, TEST_DB);

async function bootstrap(): Promise<void> {
  const root = new Client({ connectionString: withDb(ADMIN_URL, 'postgres') });
  await root.connect();
  try {
    await root.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${APP_ROLE}') THEN CREATE ROLE ${APP_ROLE} LOGIN NOINHERIT PASSWORD '${APP_PASS}'; END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
    END $$;`);
    const { rows } = await root.query('SELECT 1 FROM pg_database WHERE datname = $1', [TEST_DB]);
    if (rows.length === 0) await root.query(`CREATE DATABASE ${TEST_DB}`);
  } finally {
    await root.end();
  }
  const admin = new Client({ connectionString: TEST_ADMIN_DATABASE_URL });
  await admin.connect();
  try {
    await admin.query('DROP SCHEMA IF EXISTS app CASCADE');
    await admin.query(`CREATE SCHEMA app AUTHORIZATION ${APP_ROLE}`);
    await admin.query(`GRANT CREATE ON DATABASE ${TEST_DB} TO ${APP_ROLE}`);
    await admin.query(`REVOKE ALL ON SCHEMA public FROM ${APP_ROLE}; GRANT USAGE ON SCHEMA public TO ${APP_ROLE};`);
  } finally {
    await admin.end();
  }
  await runMigrations(TEST_DATABASE_URL);

  setEnvForTests(
    loadEnv({
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      PORT: '3999',
      CORS_ORIGINS: '',
      DATABASE_URL: TEST_DATABASE_URL,
      DATABASE_ADMIN_URL: TEST_ADMIN_DATABASE_URL,
      SUPABASE_AUTH_URL: process.env.SUPABASE_AUTH_URL ?? 'http://localhost:9999',
      SUPABASE_JWT_SECRET: TEST_JWT_SECRET,
      SUPABASE_JWKS_URL: '',
      AUTH_JWT_ISSUER: TEST_ISSUER,
      AUTH_JWT_AUDIENCE: TEST_AUDIENCE,
      QUIZ_SCHEDULER_ENABLED: 'false',
      QUIZ_SCHEDULER_TICK_MS: '250',
      SEED_PASSWORD: 'Merak-Local-123',
    }),
  );
}

beforeAll(async () => {
  await bootstrap();
});
