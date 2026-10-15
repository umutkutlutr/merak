import { describe, expect, it, vi } from 'vitest';
import type { Logger } from 'nestjs-pino';
import type { Pool, PoolClient } from 'pg';
import { SchedulerLeaderService } from './scheduler-leader.service.js';

/** A lock connection that accepts the lock, then never answers again (silent network loss). */
function silentPool(): { pool: Pool; release: ReturnType<typeof vi.fn> } {
  const release = vi.fn();
  let calls = 0;
  const client = {
    on: vi.fn(),
    release,
    query: vi.fn(() => {
      calls += 1;
      return calls === 1 ? Promise.resolve({ rows: [{ locked: true }] }) : new Promise(() => undefined);
    }),
  } as unknown as PoolClient;
  return { pool: { connect: vi.fn(async () => client) } as unknown as Pool, release };
}

const logger = { error: vi.fn(), warn: vi.fn() } as unknown as Logger;

describe('SchedulerLeaderService.verify', () => {
  it('gives up leadership and drops the connection when the lock connection stops answering', async () => {
    const { pool, release } = silentPool();
    const leader = new SchedulerLeaderService(pool, logger);
    leader.verifyTimeoutMs = 50;
    expect(await leader.tryAcquire()).toBe(true);
    const started = Date.now();
    expect(await leader.verify()).toBe(false);
    expect(Date.now() - started).toBeLessThan(1_000);
    expect(leader.isLeader).toBe(false);
    expect(release).toHaveBeenCalledWith(expect.any(Error)); // release(err) destroys the socket, freeing the lock
  });
});
