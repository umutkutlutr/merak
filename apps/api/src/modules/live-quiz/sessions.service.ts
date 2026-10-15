import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, gt, inArray, or } from 'drizzle-orm';
import type {
  CurrentQuizResponse,
  JoinSessionResponse,
  MyAnswerView,
  OpenQuestionView,
  QuizSessionSummary,
  RevealView,
  SessionRules,
  SessionSnapshot,
} from '@merak/contracts';
import { DB } from '../../db/db.module.js';
import type { Db, DbOrTx } from '../../db/client.js';
import {
  answerReceipts,
  profiles,
  quizSessions,
  sessionParticipants,
  sessionQuestions,
} from '../../db/schema/index.js';
import { AppError } from '../../common/errors.js';
import { hashToken, newParticipationToken, seededShuffle } from '../../common/ids.js';
import { ClockService } from '../../common/clock.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { QuestionsService, type RevisionPublicView, type RevisionRevealView } from '../question-bank/questions.service.js';
import { ResultsService } from '../scoring-results/results.service.js';
import { eligibleFromPosition, isJoinable } from './state-machine.js';
import { MISSED_START_GRACE_MS } from './rules.js';

export type SessionRow = typeof quizSessions.$inferSelect;
export type SessionQuestionRow = typeof sessionQuestions.$inferSelect;
export type ParticipantRow = typeof sessionParticipants.$inferSelect;
export type ReceiptRow = typeof answerReceipts.$inferSelect;

export interface Viewer {
  userId: string;
  participantId: string | null;
}

@Injectable()
export class SessionsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly clock: ClockService,
    private readonly questions: QuestionsService,
    private readonly results: ResultsService,
    private readonly analytics: AnalyticsService,
  ) {}

  // ---------- reads ----------

  async getRow(sessionId: string, tx: DbOrTx = this.db): Promise<SessionRow> {
    const [row] = await tx.select().from(quizSessions).where(eq(quizSessions.id, sessionId)).limit(1);
    if (!row) throw new AppError('NOT_FOUND');
    return row;
  }

  async participantCount(sessionId: string, tx: DbOrTx = this.db): Promise<number> {
    const [row] = await tx
      .select({ n: count() })
      .from(sessionParticipants)
      .where(eq(sessionParticipants.sessionId, sessionId));
    return Number(row?.n ?? 0);
  }

  async findParticipant(sessionId: string, userId: string, tx: DbOrTx = this.db): Promise<ParticipantRow | null> {
    const [row] = await tx
      .select()
      .from(sessionParticipants)
      .where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.userId, userId)))
      .limit(1);
    return row ?? null;
  }

  /** Verifies the device-held participation token. Throws when the user is not a participant or the token mismatches. */
  async requireParticipant(sessionId: string, userId: string, token: string, tx: DbOrTx = this.db): Promise<ParticipantRow> {
    const p = await this.findParticipant(sessionId, userId, tx);
    if (!p) throw new AppError('NOT_PARTICIPANT');
    if (p.participationTokenHash !== hashToken(token)) throw new AppError('PARTICIPATION_TOKEN_INVALID');
    return p;
  }

  toSummary(row: SessionRow, participantCount: number): QuizSessionSummary {
    return {
      id: row.id,
      title: row.title,
      status: row.status,
      isTest: true,
      prizeMode: 'none',
      scheduledStartAt: row.scheduledStartAt.toISOString(),
      lobbyOpensAt: row.lobbyOpensAt.toISOString(),
      questionCount: row.questionCount,
      rules: row.rules as SessionRules,
      stateVersion: row.stateVersion,
      currentQuestionPosition: row.currentQuestionPosition,
      cancelledReason: row.cancelledReason,
      cancelledAt: row.cancelledAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      participantCount,
    };
  }

  /** The session the home screen shows: active first, else the next scheduled one. */
  async currentForUser(userId: string): Promise<CurrentQuizResponse> {
    const now = this.clock.nowDate();
    const [active] = await this.db
      .select()
      .from(quizSessions)
      .where(inArray(quizSessions.status, ['lobby', 'live']))
      .orderBy(asc(quizSessions.scheduledStartAt))
      .limit(1);
    let row = active;
    if (!row) {
      const [next] = await this.db
        .select()
        .from(quizSessions)
        .where(
          and(
            eq(quizSessions.status, 'scheduled'),
            gt(quizSessions.scheduledStartAt, new Date(now.getTime() - MISSED_START_GRACE_MS)),
          ),
        )
        .orderBy(asc(quizSessions.scheduledStartAt))
        .limit(1);
      row = next;
    }
    if (!row) {
      // Fall back to the user's most recent finished session so results stay reachable.
      const [recent] = await this.db
        .select({ s: quizSessions })
        .from(sessionParticipants)
        .innerJoin(quizSessions, eq(quizSessions.id, sessionParticipants.sessionId))
        .where(and(eq(sessionParticipants.userId, userId), inArray(quizSessions.status, ['completed', 'cancelled'])))
        .orderBy(desc(quizSessions.scheduledStartAt))
        .limit(1);
      row = recent?.s;
    }
    if (!row) return { session: null, serverTime: now.toISOString(), myParticipation: null };
    const [pc, p] = await Promise.all([this.participantCount(row.id), this.findParticipant(row.id, userId)]);
    return {
      session: this.toSummary(row, pc),
      serverTime: now.toISOString(),
      myParticipation: p ? { participantId: p.id, eligibleFromPosition: p.eligibleFromPosition } : null,
    };
  }

  // ---------- join ----------

  async join(userId: string, sessionId: string, token: string | undefined): Promise<JoinSessionResponse> {
    const now = this.clock.nowDate();
    const outcome = await this.db.transaction(async (tx) => {
      const [session] = await tx.select().from(quizSessions).where(eq(quizSessions.id, sessionId)).for('update');
      if (!session) throw new AppError('NOT_FOUND');
      if (session.status === 'cancelled') throw new AppError('SESSION_CANCELLED');
      if (session.status === 'completed') throw new AppError('SESSION_COMPLETED');
      if (!isJoinable(session.status)) throw new AppError('SESSION_NOT_JOINABLE');

      const existing = await this.findParticipant(sessionId, userId, tx);
      if (existing) {
        if (!token || hashToken(token) !== existing.participationTokenHash) {
          // Second device: the first participation is kept; M0 does not allow takeover.
          throw new AppError('PARTICIPATION_EXISTS');
        }
        await tx.update(sessionParticipants).set({ lastSeenAt: now }).where(eq(sessionParticipants.id, existing.id));
        return { participant: existing, token, resumed: true };
      }
      // Editors and admins can read answer keys (question bank, session pins), so they never play.
      const [me] = await tx.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, userId)).limit(1);
      if (me && me.role !== 'member') throw new AppError('STAFF_CANNOT_PLAY');
      const freshToken = newParticipationToken();
      const [participant] = await tx
        .insert(sessionParticipants)
        .values({
          sessionId,
          userId,
          participationTokenHash: hashToken(freshToken),
          eligibleFromPosition: eligibleFromPosition(session.status, session.currentQuestionPosition),
          joinedAt: now,
          lastSeenAt: now,
        })
        .returning();
      await this.analytics.recordServerEvent(
        { eventName: 'quiz_joined', userId, quizSessionId: sessionId, eventTime: now },
        tx,
      );
      return { participant: participant!, token: freshToken, resumed: false };
    });
    const snapshot = await this.snapshot(sessionId, { userId, participantId: outcome.participant.id });
    return {
      participantId: outcome.participant.id,
      participationToken: outcome.token,
      eligibleFromPosition: outcome.participant.eligibleFromPosition,
      resumed: outcome.resumed,
      snapshot,
    };
  }

  // ---------- snapshot (authoritative state for resync) ----------

  async snapshot(sessionId: string, viewer: Viewer | null): Promise<SessionSnapshot> {
    const now = this.clock.nowDate();
    const session = await this.getRow(sessionId);
    const pc = await this.participantCount(sessionId);
    const participant = viewer
      ? viewer.participantId
        ? await this.participantById(viewer.participantId)
        : await this.findParticipant(sessionId, viewer.userId)
      : null;
    const receipts = participant ? await this.receiptsFor(participant.id) : [];
    const sqRows = await this.sessionQuestionRows(sessionId);
    const byPosition = new Map(sqRows.map((q) => [q.position, q]));
    const myAnswers = await this.toMyAnswers(receipts, sqRows, now);

    let currentQuestion: SessionSnapshot['currentQuestion'] = null;
    if (session.currentQuestionPosition != null) {
      const sq = byPosition.get(session.currentQuestionPosition);
      if (sq) {
        const seed = participant?.id ?? viewer?.userId ?? 'anon';
        let open: OpenQuestionView | null = null;
        let reveal: RevealView | null = null;
        if (sq.status === 'open' && sq.closesAt && sq.closesAt.getTime() > now.getTime()) {
          open = this.toOpenView(sq, await this.questions.publicView(sq.questionRevisionId), seed);
        } else if (sq.status === 'open') {
          // Closes-at passed but the scheduler has not yet transitioned: expose nothing answerable, no key.
          open = null;
        }
        if (sq.status === 'revealed' || sq.status === 'closed') {
          if (sq.status === 'revealed') {
            const rv = await this.questions.revealView(sq.questionRevisionId);
            reveal = this.toRevealView(sq, rv, seed, myAnswers.find((a) => a.sessionQuestionId === sq.id) ?? null, session);
          }
        }
        currentQuestion = { position: sq.position, status: sq.status, open, reveal };
      }
    }

    const result = session.status === 'completed' ? await this.results.viewFor(sessionId, viewer?.userId ?? null) : null;
    return {
      serverTime: now.toISOString(),
      stateVersion: session.stateVersion,
      session: this.toSummary(session, pc),
      currentQuestion,
      myParticipation: participant
        ? { participantId: participant.id, eligibleFromPosition: participant.eligibleFromPosition, answers: myAnswers }
        : null,
      result,
    };
  }

  toOpenView(sq: SessionQuestionRow, view: RevisionPublicView, seed: string): OpenQuestionView {
    const shuffled = seededShuffle(view.options, `${seed}:${sq.id}`);
    return {
      sessionQuestionId: sq.id,
      position: sq.position,
      prompt: view.prompt,
      options: shuffled.map((o) => ({ optionId: o.optionId, label: o.label })),
      opensAt: sq.opensAt!.toISOString(),
      closesAt: sq.closesAt!.toISOString(),
      durationMs: sq.closesAt!.getTime() - sq.opensAt!.getTime(),
    };
  }

  toRevealView(
    sq: SessionQuestionRow,
    view: RevisionRevealView,
    seed: string,
    myAnswer: MyAnswerView | null,
    session: SessionRow,
  ): RevealView {
    const rules = session.rules as SessionRules;
    const shuffled = seededShuffle(view.options, `${seed}:${sq.id}`);
    const nextOpensAt =
      sq.position < session.questionCount && sq.revealedAt
        ? new Date(sq.revealedAt.getTime() + rules.revealDurationMs).toISOString()
        : null;
    return {
      sessionQuestionId: sq.id,
      position: sq.position,
      prompt: view.prompt,
      options: shuffled.map((o) => ({ optionId: o.optionId, label: o.label })),
      correctOptionId: view.correctOptionId,
      explanation: view.explanation,
      closedAt: (sq.closedAt ?? sq.closesAt)!.toISOString(),
      revealedAt: (sq.revealedAt ?? sq.closedAt ?? sq.closesAt)!.toISOString(),
      nextOpensAt,
      myAnswer,
    };
  }

  /** Correctness/points are exposed only once the question is revealed. */
  async toMyAnswers(receipts: ReceiptRow[], sqRows: SessionQuestionRow[], _now: Date): Promise<MyAnswerView[]> {
    const byId = new Map(sqRows.map((q) => [q.id, q]));
    return receipts
      .map((r) => {
        const sq = byId.get(r.sessionQuestionId);
        if (!sq) return null;
        const revealed = sq.status === 'revealed';
        return {
          receiptId: r.id,
          sessionQuestionId: r.sessionQuestionId,
          position: sq.position,
          optionId: r.optionId,
          receivedAt: r.receivedAt.toISOString(),
          elapsedMs: r.elapsedMs,
          isCorrect: revealed ? r.isCorrect : null,
          points: revealed ? r.points : null,
        } satisfies MyAnswerView;
      })
      .filter((x): x is MyAnswerView => x !== null)
      .sort((a, b) => a.position - b.position);
  }

  async sessionQuestionRows(sessionId: string, tx: DbOrTx = this.db): Promise<SessionQuestionRow[]> {
    return tx.select().from(sessionQuestions).where(eq(sessionQuestions.sessionId, sessionId)).orderBy(asc(sessionQuestions.position));
  }

  async receiptsFor(participantId: string, tx: DbOrTx = this.db): Promise<ReceiptRow[]> {
    return tx.select().from(answerReceipts).where(eq(answerReceipts.participantId, participantId));
  }

  async participantById(id: string, tx: DbOrTx = this.db): Promise<ParticipantRow | null> {
    const [row] = await tx.select().from(sessionParticipants).where(eq(sessionParticipants.id, id)).limit(1);
    return row ?? null;
  }

  /** Participants (with usernames) of a session, for broadcasts. */
  async participantsOf(sessionId: string): Promise<Array<ParticipantRow & { username: string }>> {
    const rows = await this.db
      .select({ p: sessionParticipants, username: profiles.username })
      .from(sessionParticipants)
      .innerJoin(profiles, eq(profiles.id, sessionParticipants.userId))
      .where(eq(sessionParticipants.sessionId, sessionId));
    return rows.map((r) => ({ ...r.p, username: r.username }));
  }

  /** Receipts for one session question keyed by participant id (used for personalized reveal broadcasts). */
  async receiptsForQuestion(sessionQuestionId: string): Promise<Map<string, ReceiptRow>> {
    const rows = await this.db.select().from(answerReceipts).where(eq(answerReceipts.sessionQuestionId, sessionQuestionId));
    return new Map(rows.map((r) => [r.participantId, r]));
  }

  /** My finished sessions (profile tab). */
  async myHistory(userId: string): Promise<Array<{ session: QuizSessionSummary; totalPoints: number | null; rank: number | null }>> {
    const rows = await this.db
      .select({ s: quizSessions })
      .from(sessionParticipants)
      .innerJoin(quizSessions, eq(quizSessions.id, sessionParticipants.sessionId))
      .where(and(eq(sessionParticipants.userId, userId), or(eq(quizSessions.status, 'completed'), eq(quizSessions.status, 'cancelled'))))
      .orderBy(desc(quizSessions.scheduledStartAt))
      .limit(20);
    const out = [];
    for (const r of rows) {
      const res = r.s.status === 'completed' ? await this.results.rowFor(r.s.id, userId) : null;
      out.push({ session: this.toSummary(r.s, await this.participantCount(r.s.id)), totalPoints: res?.totalPoints ?? null, rank: res?.rank ?? null });
    }
    return out;
  }
}

