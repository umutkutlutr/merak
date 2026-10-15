import { Inject, Injectable, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ENV, type Env } from '../../config/env.js';
import { ClockService } from '../../common/clock.js';
import { EngineService, type Transition } from './engine.service.js';
import { QuizGateway } from './quiz.gateway.js';
import { SchedulerLeaderService } from './scheduler-leader.service.js';

/**
 * Drives sessions forward on a fixed tick. Only the advisory-lock holder advances state.
 * Device timers are for display; this loop plus persisted timestamps are the source of truth.
 */
@Injectable()
export class SchedulerService implements OnApplicationBootstrap, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private ticks = 0;

  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly engine: EngineService,
    private readonly gateway: QuizGateway,
    private readonly leader: SchedulerLeaderService,
    private readonly clock: ClockService,
    private readonly logger: Logger,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.env.QUIZ_SCHEDULER_ENABLED) {
      this.logger.warn('live-quiz scheduler disabled by configuration', 'Scheduler');
      return;
    }
    const isLeader = await this.leader.tryAcquire();
    if (isLeader) {
      const cancelled = await this.engine.recoverAfterRestart(this.clock.nowDate());
      if (cancelled.length) {
        this.logger.warn({ sessions: cancelled.map((c) => c.sessionId) }, 'sessions cancelled during restart recovery', 'Scheduler');
      }
    }
    this.timer = setInterval(() => void this.tick(), this.env.QUIZ_SCHEDULER_TICK_MS);
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** One scheduler pass. Public so tests can drive it deterministically. */
  async tick(): Promise<Transition[]> {
    if (this.running) return [];
    this.running = true;
    const applied: Transition[] = [];
    try {
      this.ticks += 1;
      if (!this.leader.isLeader) {
        if (this.ticks % 40 === 0) await this.leader.tryAcquire();
        return [];
      }
      // Bounded re-loop so chained transitions (lobby->live with lobbyLead 0) don't wait a tick.
      for (let round = 0; round < 3; round++) {
        const now = this.clock.nowDate();
        const work = await this.engine.dueWork(now);
        const batch: Array<Promise<Transition | null>> = [];
        for (const id of work.toLobby) batch.push(this.engine.toLobby(id, now));
        for (const id of work.toStart) batch.push(this.engine.start(id, now));
        for (const q of work.toClose) batch.push(this.engine.closeAndReveal(q.sessionId, q.sessionQuestionId, now));
        for (const id of work.toAdvance) batch.push(this.engine.advance(id, now));
        if (batch.length === 0) break;
        const results = await Promise.all(batch.map((p) => p.catch((err) => (this.logger.error({ err }, 'transition failed', 'Scheduler'), null))));
        const done = results.filter((t): t is Transition => t !== null);
        for (const t of done) {
          applied.push(t);
          await this.gateway.broadcast(t).catch((err) => this.logger.error({ err }, 'broadcast failed', 'Scheduler'));
        }
        if (done.length === 0) break;
      }
      return applied;
    } catch (err) {
      this.logger.error({ err }, 'scheduler tick failed', 'Scheduler');
      return applied;
    } finally {
      this.running = false;
    }
  }
}
