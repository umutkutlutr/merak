import { Global, Module } from '@nestjs/common';
import type { Pool } from 'pg';
import { getEnv } from '../config/env.js';
import { createDb, createPool, type Db } from './client.js';

export const DB = Symbol('DB');
export const PG_POOL = Symbol('PG_POOL');

@Global()
@Module({
  providers: [
    { provide: PG_POOL, useFactory: () => createPool(getEnv().DATABASE_URL) },
    { provide: DB, inject: [PG_POOL], useFactory: (pool: Pool): Db => createDb(pool) },
  ],
  exports: [DB, PG_POOL],
})
export class DbModule {}
