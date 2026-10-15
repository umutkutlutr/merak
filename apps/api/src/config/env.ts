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
