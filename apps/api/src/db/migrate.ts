/**
 * Runs SQL migrations from ../../drizzle. Connects as the application role (DATABASE_URL), which
 * owns the `app` schema, so every table it creates is owned by `app_api` and nothing is granted
 * to the Supabase Data API roles (anon/authenticated/service_role).
 * Usage: pnpm --filter @merak/api db:migrate
 */
import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'node:path';
import { createDb, createPool } from './client.js';

export const MIGRATIONS_FOLDER = path.resolve(__dirname, '../../drizzle');

export async function runMigrations(connectionString: string): Promise<void> {
  const pool = createPool(connectionString, 2);
  try {
    const db = createDb(pool);
    await migrate(db, {
      migrationsFolder: MIGRATIONS_FOLDER,
      migrationsSchema: 'app',
      migrationsTable: 'schema_migrations',
    });
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  runMigrations(url)
    .then(() => {
      console.log('[migrate] done');
    })
    .catch((err) => {
      console.error('[migrate] failed', err);
      process.exit(1);
    });
}
