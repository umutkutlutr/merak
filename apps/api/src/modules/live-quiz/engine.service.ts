import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, lte, sql } from 'drizzle-orm';
import type { AdminCreateSessionInput, CancelReason, SessionRules } from '@merak/contracts';
import { DB } from '../../db/db.module.js';
import type { Db, Tx } from '../../db/client.js';
import { quizSessions, sessionParticipants, sessionQuestions } from '../../db/schema/index.js';
import { AppError } from '../../common/errors.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { AuditService } from '../admin-audit/audit.service.js';
import { QuestionsService } from '../question-bank/questions.service.js';
import { ResultsService } from '../scoring-results/results.service.js';
import { buildRules, MISSED_START_GRACE_MS } from './rules.js';
import { canSessionTransition, TERMINAL_SESSION_STATES } from './state-machine.js';

export type Transition =
  | { kind: 'lobby'; sessionId: string; stateVersion: number }
  | { kind: 'opened'; sessionId: string; stateVersion: number; sessionQuestionId: string; position: number }
  | { kind: 'revealed'; sessionId: string; stateVersion: number; sessionQuestionId: string; position: number }
  | { kind: 'completed'; sessionId: string; stateVersion: number }
  | { kind: 'cancelled'; sessionId: string; stateVersion: number; reason: CancelReason; detail: string | null };

/**
 * All live-session state changes. Every method runs in one transaction, locks the session row
 * (SELECT ... FOR UPDATE) and re-checks the precondition inside the lock, so a repeated or
 * concurrent job can never open the same question twice or complete a session twice.
 */
@Injectable()
export class EngineService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly questions: QuestionsService,
    private readonly results: ResultsService,
    private readonly audit: AuditService,
    private readonly analytics: AnalyticsService,
  ) {}

  // ---------- admin ----------

  async create(actorUserId: string, input: AdminCreateSessionInput, now: Date): Promise<string> {
    const scheduledStartAt = new Date(input.scheduledStartAt);
    if (scheduledStartAt.getTime() <= now.getTime()) throw new AppError('SCHEDULE_IN_PAST');
    const rules = buildRules(input.rulesOverride);
    if (input.questionIds.length !== rules.questionCount) throw new AppError('QUESTION_COUNT_INVALID');
    if (new Set(input.questionIds).size !== input.questionIds.length) {
      throw new AppError('VALIDATION_FAILED', 'Aynı soru birden fazla kez seçilemez.');
    }
    return this.db.transaction(async (tx) => {
      const pins = await this.questions.resolveSchedulable(input.questionIds, tx);
      const lobbyOpensAt = new Date(scheduledStartAt.getTime() - rules.lobbyLeadMs);
      const [session] = await tx
        .insert(quizSessions)
        .values({
          title: input.title,
          status: 'scheduled',
          isTest: true,
          prizeMode: 'none',
          scheduledStartAt,
          lobbyOpensAt,
          rulesVersion: rules.rulesVersion,
          rules,
          questionCount: rules.questionCount,
          stateVersion: 1,
          createdBy: actorUserId,
        })
        .returning({ id: quizSessions.id });
      await tx.insert(sessionQuestions).values(
        pins.map((p, i) => ({
          sessionId: session!.id,
          position: i + 1,
          questionId: p.questionId,
          questionRevisionId: p.revisionId,
        })),
      );
      await this.audit.record(
        {
          actorUserId,
          action: 'session.create',
          targetType: 'quiz_session',
          targetId: session!.id,
          reason: input.reason ?? null,
          metadata: { scheduledStartAt: scheduledStartAt.toISOString(), rulesVersion: rules.rulesVersion, pins },
        },
        tx,
      );
      return session!.id;
    });
  }

  async cancel(
    sessionId: string,
    reason: CancelReason,
    detail: string | null,
    actorUserId: string | null,
    now: Date,
  ): Promise<Transition | null> {
    return this.db.transaction(async (tx) => {
      const [s] = await tx.select().from(quizSessions).where(eq(quizSessions.id, sessionId)).for('update');
      if (!s) throw new AppError('NOT_FOUND');
      if (TERMINAL_SESSION_STATES.includes(s.status)) {
        if (actorUserId) throw new AppError('INVALID_TRANSITION', 'Oturum zaten tamamlandı veya iptal edildi.');
        return null;
      }
      if (!canSessionTransition(s.status, 'cancelled')) throw new AppError('INVALID_TRANSITION');
      const stateVersion = s.stateVersion + 1;
      await tx
        .update(quizSessions)
        .set({ status: 'cancelled', cancelledReason: reason, cancelDetail: detail, cancelledAt: now, cancelledBy: actorUserId, stateVersion, updatedAt: now })
        .where(eq(quizSessions.id, sessionId));
      // Open questions are closed without reveal; receipts are preserved for audit.
      await tx
        .update(sessionQuestions)
        .set({ status: 'closed', closedAt: now })
        .where(and(eq(sessionQuestions.sessionId, sessionId), eq(sessionQuestions.status, 'open')));
      await this.audit.record(
        { actorUserId, action: actorUserId ? 'session.cancel' : 'session.auto_cancel', targetType: 'quiz_session', targetId: sessionId, reason: detail ?? reason, metadata: { from: s.status, cancelReason: reason } },
        tx,
      );
      return { kind: 'cancelled', sessionId, stateVersion, reason, detail };
    });
  }

  // ---------- scheduler-driven transitions ----------

  async toLobby(sessionId: string, now: Date): Promise<Transition | null> {
    return this.db.transaction(async (tx) => {
      const s = await this.lock(tx, sessionId);
      if (!s || s.status !== 'scheduled' || s.lobbyOpensAt.getTime() > now.getTime()) return null;
      const invalid = await this.revalidate(tx, sessionId);
      if (invalid) return this.cancelInTx(tx, s, invalid.reason, `Soru ${invalid.questionId}`, now);
      const stateVersion = s.stateVersion + 1;
      await tx.update(quizSessions).set({ status: 'lobby', stateVersion, updatedAt: now }).where(eq(quizSessions.id, sessionId));
      return { kind: 'lobby', sessionId, stateVersion };
    });
  }

  async start(sessionId: string, now: Date): Promise<Transition | null> {
    return this.db.transaction(async (tx) => {
      const s = await this.lock(tx, sessionId);
      if (!s || s.status !== 'lobby' || s.scheduledStartAt.getTime() > now.getTime()) return null;
      const invalid = await this.revalidate(tx, sessionId);
      if (invalid) return this.cancelInTx(tx, s, invalid.reason, `Soru ${invalid.questionId}`, now);
      const opened = await this.openQuestion(tx, s, 1, now);
      if (!opened) return this.cancelInTx(tx, s, 'question_approval_withdrawn', 'İlk soru açılamadı', now);
      const stateVersion = s.stateVersion + 1;
      await tx
        .update(quizSessions)
        .set({ status: 'live', currentQuestionPosition: 1, startedAt: now, stateVersion, updatedAt: now })
        .where(eq(quizSessions.id, sessionId));
      return { kind: 'opened', sessionId, stateVersion, sessionQuestionId: opened, position: 1 };
    });
  }

  /** open -> closed -> revealed, in one step at closesAt (answers past closesAt are already rejected by the window rule). */
  async closeAndReveal(sessionId: string, sessionQuestionId: string, now: Date): Promise<Transition | null> {
    return this.db.transaction(async (tx) => {
      const s = await this.lock(tx, sessionId);
      if (!s || s.status !== 'live') return null;
      const updated = await tx
        .update(sessionQuestions)
        .set({ status: 'revealed', closedAt: now, revealedAt: now })
        .where(and(eq(sessionQuestions.id, sessionQuestionId), eq(sessionQuestions.status, 'open'), lte(sessionQuestions.closesAt, now)))
        .returning({ position: sessionQuestions.position });
      if (updated.length === 0) return null;
      const stateVersion = s.stateVersion + 1;
      await tx.update(quizSessions).set({ stateVersion, updatedAt: now }).where(eq(quizSessions.id, sessionId));
      return { kind: 'revealed', sessionId, stateVersion, sessionQuestionId, position: updated[0]!.position };
    });
  }

  /** After the reveal window: open the next question, or complete the session and freeze results. */
  async advance(sessionId: string, now: Date): Promise<Transition | null> {
    return this.db.transaction(async (tx) => {
      const s = await this.lock(tx, sessionId);
      if (!s || s.status !== 'live' || s.currentQuestionPosition == null) return null;
      const rules = s.rules as SessionRules;
      const [current] = await tx
        .select()
        .from(sessionQuestions)
        .where(and(eq(sessionQuestions.sessionId, sessionId), eq(sessionQuestions.position, s.currentQuestionPosition)))
        .limit(1);
      if (!current || current.status !== 'revealed' || !current.revealedAt) return null;
      if (current.revealedAt.getTime() + rules.revealDurationMs > now.getTime()) return null;

      const stateVersion = s.stateVersion + 1;
      if (s.currentQuestionPosition < s.questionCount) {
        const next = s.currentQuestionPosition + 1;
        const opened = await this.openQuestion(tx, s, next, now);
        if (!opened) return this.cancelInTx(tx, s, 'question_approval_withdrawn', `Soru ${next} açılamadı`, now);
        await tx.update(quizSessions).set({ currentQuestionPosition: next, stateVersion, updatedAt: now }).where(eq(quizSessions.id, sessionId));
        return { kind: 'opened', sessionId, stateVersion, sessionQuestionId: opened, position: next };
      }
      const ranked = await this.results.computeAndStore(tx, sessionId, s.rulesVersion, now);
      await tx.update(quizSessions).set({ status: 'completed', completedAt: now, stateVersion, updatedAt: now }).where(eq(quizSessions.id, sessionId));
      for (const r of ranked) {
        await this.analytics.recordServerEvent(
          { eventName: 'quiz_completed', userId: r.userId, quizSessionId: sessionId, eventTime: now, props: { totalPoints: r.totalPoints, rank: r.rank } },
          tx,
        );
      }
      return { kind: 'completed', sessionId, stateVersion };
    });
  }

  /**
   * M0 restart policy: in-progress sessions are cancelled (answers kept, excluded from rankings);
   * scheduled sessions that missed their start by more than the grace period are cancelled too.
   */
  async recoverAfterRestart(now: Date): Promise<Transition[]> {
    const inProgress = await this.db.select({ id: quizSessions.id }).from(quizSessions).where(inArray(quizSessions.status, ['lobby', 'live']));
    const out: Transition[] = [];
    for (const s of inProgress) {
      const t = await this.cancel(s.id, 'server_restart', 'API süreci canlı oturum sırasında yeniden başladı', null, now);
      if (t) out.push(t);
    }
    const missed = await this.db
      .select({ id: quizSessions.id })
      .from(quizSessions)
      .where(and(eq(quizSessions.status, 'scheduled'), lte(quizSessions.scheduledStartAt, new Date(now.getTime() - MISSED_START_GRACE_MS))));
    for (const s of missed) {
      const t = await this.cancel(s.id, 'missed_start', 'Planlanan başlangıç kaçırıldı (API kapalıydı)', null, now);
      if (t) out.push(t);
    }
    return out;
  }

  // ---------- due-work queries for the scheduler ----------

  async dueWork(now: Date): Promise<{
    toLobby: string[];
    toStart: string[];
    toClose: Array<{ sessionId: string; sessionQuestionId: string }>;
    toAdvance: string[];
  }> {
    const toLobby = await this.db
      .select({ id: quizSessions.id })
      .from(quizSessions)
      .where(and(eq(quizSessions.status, 'scheduled'), lte(quizSessions.lobbyOpensAt, now)));
    const toStart = await this.db
      .select({ id: quizSessions.id })
      .from(quizSessions)
      .where(and(eq(quizSessions.status, 'lobby'), lte(quizSessions.scheduledStartAt, now)));
    const toClose = await this.db
      .select({ sessionId: sessionQuestions.sessionId, sessionQuestionId: sessionQuestions.id })
      .from(sessionQuestions)
      .where(and(eq(sessionQuestions.status, 'open'), lte(sessionQuestions.closesAt, now)));
    const toAdvance = await this.db
      .select({ id: quizSessions.id })
      .from(quizSessions)
      .innerJoin(
        sessionQuestions,
        and(eq(sessionQuestions.sessionId, quizSessions.id), eq(sessionQuestions.position, quizSessions.currentQuestionPosition)),
      )
      .where(
        and(
          eq(quizSessions.status, 'live'),
          eq(sessionQuestions.status, 'revealed'),
          sql`${sessionQuestions.revealedAt} + make_interval(secs => ((${quizSessions.rules}->>'revealDurationMs')::numeric / 1000.0)) <= ${now}`,
        ),
      );
    return {
      toLobby: toLobby.map((r) => r.id),
      toStart: toStart.map((r) => r.id),
      toClose,
      toAdvance: toAdvance.map((r) => r.id),
    };
  }

  // ---------- internals ----------

  private async lock(tx: Tx, sessionId: string) {
    const [s] = await tx.select().from(quizSessions).where(eq(quizSessions.id, sessionId)).for('update');
    return s ?? null;
  }

  private async revalidate(tx: Tx, sessionId: string) {
    const pins = await tx
      .select({ questionId: sessionQuestions.questionId, revisionId: sessionQuestions.questionRevisionId })
      .from(sessionQuestions)
      .where(eq(sessionQuestions.sessionId, sessionId));
    const v = await this.questions.validatePinned(pins, tx);
    return v.ok ? null : v;
  }

  /** Returns the session question id when the question was opened by THIS call, null otherwise. */
  private async openQuestion(tx: Tx, s: typeof quizSessions.$inferSelect, position: number, now: Date): Promise<string | null> {
    const rules = s.rules as SessionRules;
    const closesAt = new Date(now.getTime() + rules.questionDurationMs);
    const updated = await tx
      .update(sessionQuestions)
      .set({ status: 'open', opensAt: now, closesAt })
      .where(and(eq(sessionQuestions.sessionId, s.id), eq(sessionQuestions.position, position), eq(sessionQuestions.status, 'pending')))
      .returning({ id: sessionQuestions.id });
    return updated[0]?.id ?? null;
  }

  private async cancelInTx(
    tx: Tx,
    s: typeof quizSessions.$inferSelect,
    reason: CancelReason,
    detail: string,
    now: Date,
  ): Promise<Transition> {
    const stateVersion = s.stateVersion + 1;
    await tx
      .update(quizSessions)
      .set({ status: 'cancelled', cancelledReason: reason, cancelDetail: detail, cancelledAt: now, stateVersion, updatedAt: now })
      .where(eq(quizSessions.id, s.id));
    await tx
      .update(sessionQuestions)
      .set({ status: 'closed', closedAt: now })
      .where(and(eq(sessionQuestions.sessionId, s.id), eq(sessionQuestions.status, 'open')));
    await this.audit.record(
      { actorUserId: null, action: 'session.auto_cancel', targetType: 'quiz_session', targetId: s.id, reason: detail, metadata: { from: s.status, cancelReason: reason } },
      tx,
    );
    return { kind: 'cancelled', sessionId: s.id, stateVersion, reason, detail };
  }

  /** Admin view helper: participants count per session is read elsewhere; this exposes pins for revalidation display. */
  async pinsWithValidity(sessionId: string) {
    const pins = await this.db
      .select({ questionId: sessionQuestions.questionId, revisionId: sessionQuestions.questionRevisionId })
      .from(sessionQuestions)
      .where(eq(sessionQuestions.sessionId, sessionId));
    const invalid = new Set<string>();
    for (const p of pins) {
      const v = await this.questions.validatePinned([p]);
      if (!v.ok) invalid.add(p.questionId);
    }
    return { pins, invalid };
  }

  async participantIds(sessionId: string): Promise<string[]> {
    const rows = await this.db.select({ id: sessionParticipants.id }).from(sessionParticipants).where(eq(sessionParticipants.sessionId, sessionId));
    return rows.map((r) => r.id);
  }
}
