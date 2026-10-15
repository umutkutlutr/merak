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
  /** A lock connection that stops answering (silent network loss) must not freeze the scheduler. */
  verifyTimeoutMs = 3_000;

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
      const client = await this.pool.connect();
      this.client = client;
      client.on('error', (err) => {
        // Connection died (network, pg_terminate_backend, server restart): the advisory lock is gone
        // with it, so this process must stop advancing sessions immediately.
        this.logger.error({ err }, 'scheduler lock connection error; leadership lost', 'SchedulerLeader');
        this.leader = false;
        if (this.client === client) this.client = null;
        try {
          client.release(err);
        } catch {
          /* already released */
        }
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

  /**
   * Confirms on the lock connection that this backend still holds the advisory lock. Called before
   * every scheduler pass so leadership loss is detected even if no 'error' event was delivered.
   */
  async verify(): Promise<boolean> {
    if (!this.leader || !this.client) {
      this.leader = false;
      return false;
    }
    let timer: NodeJS.Timeout | undefined;
    try {
      const query = this.client.query<{ held: boolean }>(
        "select exists(select 1 from pg_locks where locktype = 'advisory' and objid = $1 and pid = pg_backend_pid() and granted) as held",
        [SCHEDULER_LOCK_KEY],
      );
      query.catch(() => undefined); // a late rejection after a timeout must not become an unhandled rejection
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`scheduler lock verification timed out after ${this.verifyTimeoutMs} ms`)), this.verifyTimeoutMs);
      });
      const res = await Promise.race([query, timeout]);
      this.leader = res.rows[0]?.held === true;
    } catch (err) {
      this.logger.error({ err }, 'scheduler lock verification failed; leadership lost', 'SchedulerLeader');
      this.leader = false;
      const dead = this.client;
      this.client = null;
      try {
        dead?.release(err as Error); // destroys the connection, which frees the advisory lock server-side
      } catch {
        /* ignore */
      }
    } finally {
      clearTimeout(timer);
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
