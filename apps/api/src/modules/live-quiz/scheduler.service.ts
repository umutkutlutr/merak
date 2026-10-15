import { Inject, Injectable, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ENV, type Env } from '../../config/env.js';
import { ClockService } from '../../common/clock.js';
import { EngineService, type Transition } from './engine.service.js';
import { QuizGateway } from './quiz.gateway.js';
import { SchedulerLeaderService } from './scheduler-leader.service.js';

/** How often a process without scheduler authority checks whether the lock has become free. */
const TAKEOVER_RETRY_MS = 10_000;

/**
 * Drives sessions forward on a fixed tick. Only the advisory-lock holder advances state.
 * Device timers are for display; this loop plus persisted timestamps are the source of truth.
 */
@Injectable()
export class SchedulerService implements OnApplicationBootstrap, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private takeoverTimer: NodeJS.Timeout | null = null;
  private running = false;
  /** True once this process has held scheduler authority at least once (at boot or by takeover). */
  private hasLed = false;

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
    if (await this.leader.tryAcquire()) {
      this.hasLed = true;
      const cancelled = await this.engine.recoverAfterRestart(this.clock.nowDate());
      if (cancelled.length) {
        this.logger.warn({ sessions: cancelled.map((c) => c.sessionId) }, 'sessions cancelled during restart recovery', 'Scheduler');
      }
    }
    this.timer = setInterval(() => void this.tick(), this.env.QUIZ_SCHEDULER_TICK_MS);
    this.timer.unref?.();
    this.takeoverTimer = setInterval(() => void this.takeOver(), TAKEOVER_RETRY_MS);
    this.takeoverTimer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    if (this.takeoverTimer) clearInterval(this.takeoverTimer);
    this.timer = null;
    this.takeoverTimer = null;
  }

  /**
   * Tries to (re)gain scheduler authority when this process does not hold it. Public so tests can drive it.
   * - A process that never led before and gains the lock now takes over from a leader that died or lost its
   *   lock mid-session. Its clients may have been cut off, so the M0 restart policy applies: in-progress
   *   sessions are cancelled (`server_restart`, answers kept, not ranked) instead of being resumed.
   * - A process that led before (its own lock connection dropped and came back) resumes from the persisted
   *   state: its clients and timers were never interrupted.
   * A second process that merely boots while a healthy leader holds the lock never gets here with success,
   * so it cannot cancel that leader's session.
   */
  async takeOver(): Promise<Transition[]> {
    if (await this.leader.verify()) return [];
    const ledBefore = this.hasLed;
    if (!(await this.leader.tryAcquire())) return [];
    this.hasLed = true;
    if (ledBefore) {
      this.logger.warn('scheduler lock reacquired by the previous leader; resuming from persisted state', 'Scheduler');
      return [];
    }
    const cancelled = await this.engine.recoverAfterRestart(this.clock.nowDate());
    this.logger.warn({ sessions: cancelled.map((c) => c.sessionId) }, 'scheduler authority taken over; in-progress sessions cancelled', 'Scheduler');
    for (const t of cancelled) await this.gateway.broadcast(t).catch((err) => this.logger.error({ err }, 'broadcast failed', 'Scheduler'));
    return cancelled;
  }

  /** One scheduler pass. Public so tests can drive it deterministically. */
  async tick(): Promise<Transition[]> {
    if (this.running) return [];
    this.running = true;
    const applied: Transition[] = [];
    try {
      // Not (or no longer) the lock holder: never advance. Regaining authority is takeOver()'s job.
      if (!(await this.leader.verify())) return [];
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
