import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import type { SessionResultView } from '@merak/contracts';
import { DB } from '../../db/db.module.js';
import type { Db, DbOrTx } from '../../db/client.js';
import {
  answerReceipts,
  profiles,
  quizSessions,
  sessionParticipants,
  sessionQuestions,
  sessionResults,
} from '../../db/schema/index.js';
import { AppError } from '../../common/errors.js';
import { ContentService } from '../editorial-content/content.service.js';
import { QuestionsService } from '../question-bank/questions.service.js';

export interface RankedRow {
  participantId: string;
  userId: string;
  username: string;
  correctCount: number;
  totalPoints: number;
  answeredCount: number;
  lastAnswerAt: Date | null;
  rank: number;
}

/**
 * Pure ranking: points desc; equal points share the rank (1,1,3). Secondary order (earlier last
 * answer, then username) is only for stable display and gives no advantage.
 */
export function rankParticipants(rows: Omit<RankedRow, 'rank'>[]): RankedRow[] {
  const sorted = rows.slice().sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    const la = a.lastAnswerAt?.getTime() ?? Number.POSITIVE_INFINITY;
    const lb = b.lastAnswerAt?.getTime() ?? Number.POSITIVE_INFINITY;
    if (la !== lb) return la - lb;
    return a.username.localeCompare(b.username);
  });
  let rank = 0;
  let prevPoints: number | null = null;
  return sorted.map((r, i) => {
    if (prevPoints === null || r.totalPoints !== prevPoints) {
      rank = i + 1;
      prevPoints = r.totalPoints;
    }
    return { ...r, rank };
  });
}

@Injectable()
export class ResultsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly questions: QuestionsService,
    private readonly content: ContentService,
  ) {}

  /** Recomputes canonical results from receipts. Idempotent; safe to call again (upsert). */
  async computeAndStore(tx: DbOrTx, sessionId: string, rulesVersion: string, now: Date): Promise<RankedRow[]> {
    const participants = await tx
      .select({ p: sessionParticipants, username: profiles.username })
      .from(sessionParticipants)
      .innerJoin(profiles, eq(profiles.id, sessionParticipants.userId))
      .where(eq(sessionParticipants.sessionId, sessionId));
    const receipts = await tx.select().from(answerReceipts).where(eq(answerReceipts.sessionId, sessionId));
    const agg = new Map<string, { correct: number; points: number; answered: number; last: Date | null }>();
    for (const r of receipts) {
      const a = agg.get(r.participantId) ?? { correct: 0, points: 0, answered: 0, last: null };
      a.answered += 1;
      a.points += r.points;
      if (r.isCorrect) a.correct += 1;
      if (!a.last || r.receivedAt > a.last) a.last = r.receivedAt;
      agg.set(r.participantId, a);
    }
    const ranked = rankParticipants(
      participants.map(({ p, username }) => {
        const a = agg.get(p.id) ?? { correct: 0, points: 0, answered: 0, last: null };
        return {
          participantId: p.id,
          userId: p.userId,
          username,
          correctCount: a.correct,
          totalPoints: a.points,
          answeredCount: a.answered,
          lastAnswerAt: a.last,
        };
      }),
    );
    for (const r of ranked) {
      await tx
        .insert(sessionResults)
        .values({
          sessionId,
          participantId: r.participantId,
          userId: r.userId,
          correctCount: r.correctCount,
          totalPoints: r.totalPoints,
          answeredCount: r.answeredCount,
          rank: r.rank,
          lastAnswerAt: r.lastAnswerAt,
          rulesVersion,
          computedAt: now,
        })
        .onConflictDoUpdate({
          target: [sessionResults.sessionId, sessionResults.participantId],
          set: {
            correctCount: r.correctCount,
            totalPoints: r.totalPoints,
            answeredCount: r.answeredCount,
            rank: r.rank,
            lastAnswerAt: r.lastAnswerAt,
            computedAt: now,
          },
        });
    }
    return ranked;
  }

  async rowFor(sessionId: string, userId: string): Promise<typeof sessionResults.$inferSelect | null> {
    const [row] = await this.db
      .select()
      .from(sessionResults)
      .where(and(eq(sessionResults.sessionId, sessionId), eq(sessionResults.userId, userId)))
      .limit(1);
    return row ?? null;
  }

  async viewFor(sessionId: string, userId: string | null): Promise<SessionResultView> {
    const [session] = await this.db.select().from(quizSessions).where(eq(quizSessions.id, sessionId)).limit(1);
    if (!session) throw new AppError('NOT_FOUND');
    if (session.status !== 'completed') throw new AppError('INVALID_TRANSITION', 'Oturum henüz tamamlanmadı.');

    const rows = await this.db
      .select({ r: sessionResults, username: profiles.username })
      .from(sessionResults)
      .innerJoin(profiles, eq(profiles.id, sessionResults.userId))
      .where(eq(sessionResults.sessionId, sessionId))
      .orderBy(asc(sessionResults.rank), asc(sessionResults.lastAnswerAt), asc(profiles.username));
    const mine = userId ? rows.find((x) => x.r.userId === userId) ?? null : null;

    const sqRows = await this.db
      .select()
      .from(sessionQuestions)
      .where(eq(sessionQuestions.sessionId, sessionId))
      .orderBy(asc(sessionQuestions.position));
    const myReceipts = mine
      ? await this.db.select().from(answerReceipts).where(eq(answerReceipts.participantId, mine.r.participantId))
      : [];
    const receiptBySq = new Map(myReceipts.map((r) => [r.sessionQuestionId, r]));

    const questions: SessionResultView['questions'] = [];
    for (const sq of sqRows) {
      // Only revealed questions are shown with their key (completed sessions reveal everything they ran).
      if (sq.status !== 'revealed' && sq.status !== 'closed') continue;
      const rv = await this.questions.revealView(sq.questionRevisionId);
      const my = receiptBySq.get(sq.id) ?? null;
      const labelOf = (id: string | null) => rv.options.find((o) => o.optionId === id)?.label ?? null;
      questions.push({
        sessionQuestionId: sq.id,
        position: sq.position,
        prompt: rv.prompt,
        correctOptionId: rv.correctOptionId,
        correctLabel: labelOf(rv.correctOptionId) ?? '',
        explanation: rv.explanation,
        myOptionId: my?.optionId ?? null,
        myLabel: labelOf(my?.optionId ?? null),
        isCorrect: my?.isCorrect ?? false,
        points: my?.points ?? 0,
        relatedContent: userId ? await this.content.relatedCardFor(userId, rv.relatedContentItemId, rv.topicId) : null,
      });
    }

    const leaderboard = rows.slice(0, 50).map((x) => ({
      rank: x.r.rank,
      participantId: x.r.participantId,
      username: x.username,
      totalPoints: x.r.totalPoints,
      correctCount: x.r.correctCount,
      isMe: userId === x.r.userId,
    }));
    if (mine && !leaderboard.some((l) => l.isMe)) {
      leaderboard.push({
        rank: mine.r.rank,
        participantId: mine.r.participantId,
        username: mine.username,
        totalPoints: mine.r.totalPoints,
        correctCount: mine.r.correctCount,
        isMe: true,
      });
    }

    return {
      sessionId,
      participantId: mine?.r.participantId ?? null,
      correctCount: mine?.r.correctCount ?? 0,
      totalPoints: mine?.r.totalPoints ?? 0,
      answeredCount: mine?.r.answeredCount ?? 0,
      rank: mine?.r.rank ?? null,
      participantCount: rows.length,
      questions,
      leaderboard,
      tieRule: 'equal_points_share_rank',
    };
  }
}
