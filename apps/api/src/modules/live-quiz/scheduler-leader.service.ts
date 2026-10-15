import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import type { Pool, PoolClient } from 'pg';
import { PG_POOL } from '../../db/db.module.js';

/** Stable key for pg_advisory_lock; the same for every API process of this deployment. */
export const SCHEDULER_LOCK_KEY = 7_283_001;

/**
 * Single-authority guard for the live-quiz scheduler.
 * A session-level PostgreSQL advisory lock is held on a dedicated connection for the lifetime of
 * the process. Only the holder advances sessions; a second instance started by mistake keeps
 * serving HTTP/WS but logs loudly and never opens or closes questions. The lock is released
 * automatically when the connection dies (crash, kill -9).
 */
@Injectable()
export class SchedulerLeaderService implements OnModuleDestroy {
  private client: PoolClient | null = null;
  private leader = false;

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly logger: Logger,
  ) {}

  get isLeader(): boolean {
    return this.leader;
  }

  async tryAcquire(): Promise<boolean> {
    if (this.leader) return true;
    if (!this.client) {
      this.client = await this.pool.connect();
      this.client.on('error', (err) => {
        this.logger.error({ err }, 'scheduler lock connection error; leadership lost', 'SchedulerLeader');
        this.leader = false;
        this.client = null;
      });
    }
    const res = await this.client.query<{ locked: boolean }>('select pg_try_advisory_lock($1) as locked', [
      SCHEDULER_LOCK_KEY,
    ]);
    this.leader = res.rows[0]?.locked === true;
    if (!this.leader) {
      this.logger.warn(
        'another API process holds the live-quiz scheduler lock; this process will NOT advance sessions',
        'SchedulerLeader',
      );
    }
    return this.leader;
  }

  async release(): Promise<void> {
    if (this.client) {
      try {
        if (this.leader) await this.client.query('select pg_advisory_unlock($1)', [SCHEDULER_LOCK_KEY]);
      } catch {
        /* connection may already be gone */
      }
      this.client.release();
      this.client = null;
    }
    this.leader = false;
  }

  async onModuleDestroy(): Promise<void> {
    await this.release();
  }
}
