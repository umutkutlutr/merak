import { Controller, Get, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DB } from '../../db/db.module.js';
import type { Db } from '../../db/client.js';
import { Public } from '../identity/auth.guard.js';
import { ClockService } from '../../common/clock.js';
import { SchedulerLeaderService } from '../live-quiz/scheduler-leader.service.js';

@Controller()
export class HealthController {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly clock: ClockService,
    private readonly leader: SchedulerLeaderService,
  ) {}

  /** Liveness: process is up. */
  @Public()
  @Get('health')
  health() {
    return { status: 'ok', serverTime: this.clock.nowDate().toISOString() };
  }

  /** Readiness: database reachable; reports whether this process holds the live-quiz scheduler lock. */
  @Public()
  @Get('ready')
  async ready() {
    await this.db.execute(sql`select 1`);
    return {
      status: 'ok',
      database: 'ok',
      schedulerLeader: this.leader.isLeader,
      serverTime: this.clock.nowDate().toISOString(),
    };
  }

  /** Clients use this to estimate clock offset for display timers only. */
  @Public()
  @Get('time')
  time() {
    return { serverTime: this.clock.nowDate().toISOString(), serverTimeMs: this.clock.now() };
  }
}
