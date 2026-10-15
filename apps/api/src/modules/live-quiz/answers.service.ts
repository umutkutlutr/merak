import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { computePoints, type AnswerReceipt, type AnswerSubmitInput, type SessionRules } from '@merak/contracts';
import { DB } from '../../db/db.module.js';
import type { Db, Tx } from '../../db/client.js';
import { answerReceipts, questionOptions, quizSessions, sessionParticipants, sessionQuestions } from '../../db/schema/index.js';
import { AppError, isPgUniqueViolation } from '../../common/errors.js';
import { hashToken } from '../../common/ids.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { QuestionsService } from '../question-bank/questions.service.js';
import { answerWindow } from './state-machine.js';

type ReceiptRow = typeof answerReceipts.$inferSelect;

/**
 * Answer acceptance. Invariants:
 *  - receivedAt is the trusted server time captured at request entry (middleware), never client time;
 *  - one accepted answer per (participant, question); first valid acceptance wins, no changes;
 *  - same idempotency key + same payload => same receipt; same key + different payload => 409;
 *  - rejected requests persist nothing, so they never consume the participant's single answer;
 *  - correctness and points are computed and stored in the same transaction but not returned until reveal.
 */
@Injectable()
export class AnswersService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly questions: QuestionsService,
    private readonly analytics: AnalyticsService,
  ) {}

  async submit(userId: string, sessionId: string, input: AnswerSubmitInput, receivedAtMs: number): Promise<AnswerReceipt> {
    const receivedAt = new Date(receivedAtMs);
    try {
      return await this.db.transaction((tx) => this.submitInTx(tx, userId, sessionId, input, receivedAt));
    } catch (err) {
      if (isPgUniqueViolation(err)) {
        // Lost the race on the unique constraint: resolve exactly like a replay.
        return await this.db.transaction((tx) => this.submitInTx(tx, userId, sessionId, input, receivedAt));
      }
      throw err;
    }
  }

  private async submitInTx(tx: Tx, userId: string, sessionId: string, input: AnswerSubmitInput, receivedAt: Date): Promise<AnswerReceipt> {
    // 0) Serialise with session transitions. Every engine transition (close/reveal, advance, complete,
    //    cancel) takes FOR UPDATE on this row, which conflicts with FOR KEY SHARE. So an answer either
    //    commits before a transition reads receipts (and is counted), or it runs after the transition
    //    committed and sees the new status. Lock order (session -> participant) matches join().
    const [session] = await tx
      .select({ rules: quizSessions.rules, status: quizSessions.status })
      .from(quizSessions)
      .where(eq(quizSessions.id, sessionId))
      .for('key share');
    if (!session) throw new AppError('NOT_FOUND');

    // Serialise submissions of the same participant.
    const [participant] = await tx
      .select()
      .from(sessionParticipants)
      .where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.userId, userId)))
      .for('update');
    if (!participant) throw new AppError('NOT_PARTICIPANT');
    if (participant.participationTokenHash !== hashToken(input.participationToken)) throw new AppError('PARTICIPATION_TOKEN_INVALID');

    const [sq] = await tx
      .select()
      .from(sessionQuestions)
      .where(and(eq(sessionQuestions.id, input.sessionQuestionId), eq(sessionQuestions.sessionId, sessionId)))
      .limit(1);
    if (!sq) throw new AppError('NOT_FOUND', 'Soru bu oturuma ait değil.');

    // 1) Idempotent replay / conflict on the key.
    const [byKey] = await tx
      .select()
      .from(answerReceipts)
      .where(and(eq(answerReceipts.participantId, participant.id), eq(answerReceipts.idempotencyKey, input.idempotencyKey)))
      .limit(1);
    if (byKey) {
      if (byKey.sessionQuestionId === input.sessionQuestionId && byKey.optionId === input.optionId) {
        return this.toReceipt(byKey, sq.position, true);
      }
      throw new AppError('IDEMPOTENCY_KEY_CONFLICT');
    }
    // 2) Already answered with another key: no changes allowed.
    const [existing] = await tx
      .select()
      .from(answerReceipts)
      .where(and(eq(answerReceipts.participantId, participant.id), eq(answerReceipts.sessionQuestionId, sq.id)))
      .limit(1);
    if (existing) throw new AppError('ANSWER_ALREADY_ACCEPTED', undefined, { receiptId: existing.id });

    // 3) Session must still be running. (Replays above are answered even for finished sessions.)
    if (session.status === 'cancelled') throw new AppError('SESSION_CANCELLED');
    if (session.status === 'completed') throw new AppError('SESSION_COMPLETED');
    if (session.status !== 'live') throw new AppError('QUESTION_NOT_OPEN');

    // 4) Window — decided ONLY by the pinned opensAt/closesAt and the trusted receivedAt
    //    (M0 rule: opensAt <= receivedAt < closesAt). A request received before closesAt is accepted
    //    even if its transaction runs after the scheduler already closed/revealed the question;
    //    receivedAt is stamped after the full body arrived, so the client chose before the reveal.
    if (sq.status === 'pending' || !sq.opensAt || !sq.closesAt) throw new AppError('QUESTION_NOT_OPEN');
    const w = answerWindow(receivedAt.getTime(), sq.opensAt.getTime(), sq.closesAt.getTime());
    if (w === 'before_open') throw new AppError('QUESTION_NOT_OPEN');
    if (w === 'closed') throw new AppError('QUESTION_CLOSED');

    // 5) Late-join eligibility.
    if (sq.position < participant.eligibleFromPosition) throw new AppError('NOT_ELIGIBLE_FOR_QUESTION');

    // 6) Option must belong to the pinned revision.
    const [option] = await tx
      .select({ id: questionOptions.id })
      .from(questionOptions)
      .where(and(eq(questionOptions.id, input.optionId), eq(questionOptions.questionRevisionId, sq.questionRevisionId)))
      .limit(1);
    if (!option) throw new AppError('OPTION_INVALID');

    // 7) Score with the session's frozen rules.
    const rules = session.rules as SessionRules;
    const correctOptionId = await this.questions.answerKey(sq.questionRevisionId, tx);
    const elapsedMs = receivedAt.getTime() - sq.opensAt.getTime();
    const durationMs = sq.closesAt.getTime() - sq.opensAt.getTime();
    const isCorrect = option.id === correctOptionId;
    const points = computePoints(isCorrect, elapsedMs, durationMs, rules.points);

    const [receipt] = await tx
      .insert(answerReceipts)
      .values({
        sessionId,
        sessionQuestionId: sq.id,
        participantId: participant.id,
        userId,
        optionId: option.id,
        idempotencyKey: input.idempotencyKey,
        receivedAt,
        elapsedMs,
        isCorrect,
        points,
        clientSentAt: input.clientSentAt ? new Date(input.clientSentAt) : null,
        clientRttMs: input.clientRttMs ?? null,
      })
      .returning();
    await this.analytics.recordServerEvent(
      { eventName: 'answer_accepted', userId, quizSessionId: sessionId, eventTime: receivedAt, props: { position: sq.position, elapsedMs } },
      tx,
    );
    return this.toReceipt(receipt!, sq.position, false);
  }

  /** Lost-ack recovery: look a receipt up by its idempotency key without resubmitting. */
  async findByKey(userId: string, sessionId: string, idempotencyKey: string): Promise<AnswerReceipt> {
    const [row] = await this.db
      .select({ r: answerReceipts, position: sessionQuestions.position })
      .from(answerReceipts)
      .innerJoin(sessionQuestions, eq(sessionQuestions.id, answerReceipts.sessionQuestionId))
      .where(and(eq(answerReceipts.userId, userId), eq(answerReceipts.sessionId, sessionId), eq(answerReceipts.idempotencyKey, idempotencyKey)))
      .limit(1);
    if (!row) throw new AppError('NOT_FOUND');
    return this.toReceipt(row.r, row.position, true);
  }

  private toReceipt(r: ReceiptRow, position: number, replayed: boolean): AnswerReceipt {
    // Deliberately excludes isCorrect/points: nothing leaks before the reveal.
    return {
      status: 'accepted',
      receiptId: r.id,
      sessionQuestionId: r.sessionQuestionId,
      position,
      optionId: r.optionId,
      receivedAt: r.receivedAt.toISOString(),
      replayed,
    };
  }
}
