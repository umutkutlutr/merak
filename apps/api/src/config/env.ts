import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGINS: z.string().default(''),
  DATABASE_URL: z.string().min(1),
  DATABASE_ADMIN_URL: z.string().optional(),
  SUPABASE_AUTH_URL: z.string().url(),
  SUPABASE_JWT_SECRET: z.string().optional(),
  SUPABASE_JWKS_URL: z.string().url().optional().or(z.literal('')),
  AUTH_JWT_ISSUER: z.string().min(1),
  AUTH_JWT_AUDIENCE: z.string().min(1).default('authenticated'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  QUIZ_SCHEDULER_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v !== 'false' && v !== '0'),
  QUIZ_SCHEDULER_TICK_MS: z.coerce.number().int().min(50).max(5000).default(250),
  SEED_PASSWORD: z.string().min(8).optional(),
});

export type Env = z.infer<typeof EnvSchema> & { corsOrigins: string[] };

let cached: Env | null = null;

/** JWT secrets that are public (local stack defaults in this repo, CI, Supabase CLI docs); never valid in production. */
const PUBLIC_DEV_JWT_SECRETS = new Set<string>([
  'merak-local-dev-jwt-secret-do-not-use-in-prod-0123456789', // apps/api/.env.example, scripts/local-stack/env.sh
  'ci-only-jwt-secret-0123456789-0123456789-0123456789', // .github/workflows/ci.yml
  'super-secret-jwt-token-with-at-least-32-characters-long', // Supabase CLI local default (supabase start)
]);

export function loadEnv(overrides: Partial<Record<string, string>> = {}): Env {
  const parsed = EnvSchema.safeParse({ ...process.env, ...overrides });
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment: ${issues}`);
  }
  const env = parsed.data;
  if (!env.SUPABASE_JWT_SECRET && !env.SUPABASE_JWKS_URL) {
    throw new Error('Invalid environment: set SUPABASE_JWT_SECRET (HS256) or SUPABASE_JWKS_URL (JWKS)');
  }
  if (env.SUPABASE_JWT_SECRET && env.SUPABASE_JWT_SECRET.length < 32) {
    throw new Error('Invalid environment: SUPABASE_JWT_SECRET must be at least 32 characters');
  }
  if (env.NODE_ENV === 'production' && env.SUPABASE_JWT_SECRET && PUBLIC_DEV_JWT_SECRETS.has(env.SUPABASE_JWT_SECRET)) {
    // These values are published in this repository or in Supabase's docs: anyone could mint an admin token.
    throw new Error('Invalid environment: SUPABASE_JWT_SECRET is a public development default and is refused in production');
  }
  return {
    ...env,
    corsOrigins: env.CORS_ORIGINS.split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

export function getEnv(): Env {
  if (!cached) cached = loadEnv();
  return cached;
}

/** Test helper: replace the cached env (integration tests point at a throwaway database). */
export function setEnvForTests(env: Env): void {
  cached = env;
}

export const ENV = Symbol('ENV');
