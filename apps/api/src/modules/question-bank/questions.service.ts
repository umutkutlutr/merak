import { Inject, Injectable } from '@nestjs/common';
import { asc, desc, eq, inArray, sql } from 'drizzle-orm';
import type { AdminQuestion, AdminQuestionInput, ReviewAction } from '@merak/contracts';
import { DB } from '../../db/db.module.js';
import type { Db, DbOrTx } from '../../db/client.js';
import {
  questionAnswerKeys,
  questionOptions,
  questionRevisions,
  questions,
  topics,
} from '../../db/schema/index.js';
import { AppError } from '../../common/errors.js';
import { AuditService } from '../admin-audit/audit.service.js';
import { assertTransition } from '../editorial-content/content.service.js';
import { toTopic } from '../editorial-content/content.mappers.js';

/** Client-safe shape of a pinned revision (no answer key). */
export interface RevisionPublicView {
  revisionId: string;
  questionId: string;
  prompt: string;
  options: Array<{ optionId: string; label: string; position: number }>;
}

/** Server-only: revealed after close. */
export interface RevisionRevealView extends RevisionPublicView {
  correctOptionId: string;
  explanation: string;
  topicId: string;
  relatedContentItemId: string | null;
}

@Injectable()
export class QuestionsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly audit: AuditService,
  ) {}

  // ---------- server-only reads used by the live engine ----------

  async publicView(revisionId: string, tx: DbOrTx = this.db): Promise<RevisionPublicView> {
    const [rev] = await tx.select().from(questionRevisions).where(eq(questionRevisions.id, revisionId)).limit(1);
    if (!rev) throw new AppError('NOT_FOUND');
    const opts = await tx
      .select()
      .from(questionOptions)
      .where(eq(questionOptions.questionRevisionId, revisionId))
      .orderBy(asc(questionOptions.position));
    return {
      revisionId,
      questionId: rev.questionId,
      prompt: rev.prompt,
      options: opts.map((o) => ({ optionId: o.id, label: o.label, position: o.position })),
    };
  }

  /** Must only be called for a question whose close time has passed, or for scoring inside a transaction. */
  async revealView(revisionId: string, tx: DbOrTx = this.db): Promise<RevisionRevealView> {
    const base = await this.publicView(revisionId, tx);
    const [rev] = await tx
      .select({
        explanation: questionRevisions.explanation,
        correctOptionId: questionAnswerKeys.correctOptionId,
        topicId: questions.topicId,
        relatedContentItemId: questions.relatedContentItemId,
      })
      .from(questionRevisions)
      .innerJoin(questionAnswerKeys, eq(questionAnswerKeys.questionRevisionId, questionRevisions.id))
      .innerJoin(questions, eq(questions.id, questionRevisions.questionId))
      .where(eq(questionRevisions.id, revisionId))
      .limit(1);
    if (!rev) throw new AppError('NOT_FOUND');
    return { ...base, ...rev };
  }

  async answerKey(revisionId: string, tx: DbOrTx = this.db): Promise<string> {
    const [row] = await tx
      .select({ correctOptionId: questionAnswerKeys.correctOptionId })
      .from(questionAnswerKeys)
      .where(eq(questionAnswerKeys.questionRevisionId, revisionId))
      .limit(1);
    if (!row) throw new AppError('NOT_FOUND');
    return row.correctOptionId;
  }

  /**
   * Resolves question ids to the revisions a session may pin. A question is schedulable only when it
   * is `published` and its approved revision is still its current revision.
   */
  async resolveSchedulable(
    questionIds: string[],
    tx: DbOrTx = this.db,
  ): Promise<Array<{ questionId: string; revisionId: string }>> {
    const rows = await tx
      .select({
        id: questions.id,
        status: questions.status,
        currentRevisionId: questions.currentRevisionId,
        approvedRevisionId: questions.approvedRevisionId,
      })
      .from(questions)
      .where(inArray(questions.id, questionIds));
    const byId = new Map(rows.map((r) => [r.id, r]));
    return questionIds.map((id) => {
      const q = byId.get(id);
      if (!q) throw new AppError('NOT_FOUND', `Soru bulunamadı: ${id}`);
      if (q.status !== 'published' || !q.approvedRevisionId || q.approvedRevisionId !== q.currentRevisionId) {
        throw new AppError('QUESTION_NOT_APPROVED', undefined, { questionId: id, status: q.status });
      }
      return { questionId: id, revisionId: q.approvedRevisionId };
    });
  }

  /** Re-validation used before lobby/live: is each pinned revision still the approved+current one? */
  async validatePinned(
    pins: Array<{ questionId: string; revisionId: string }>,
    tx: DbOrTx = this.db,
  ): Promise<{ ok: true } | { ok: false; reason: 'question_approval_withdrawn' | 'question_revision_changed'; questionId: string }> {
    if (pins.length === 0) return { ok: true };
    const rows = await tx
      .select({
        id: questions.id,
        status: questions.status,
        currentRevisionId: questions.currentRevisionId,
        approvedRevisionId: questions.approvedRevisionId,
      })
      .from(questions)
      .where(inArray(questions.id, pins.map((p) => p.questionId)));
    const byId = new Map(rows.map((r) => [r.id, r]));
    for (const p of pins) {
      const q = byId.get(p.questionId);
      if (!q || !['approved', 'published'].includes(q.status) || !q.approvedRevisionId) {
        return { ok: false, reason: 'question_approval_withdrawn', questionId: p.questionId };
      }
      if (q.approvedRevisionId !== p.revisionId || q.currentRevisionId !== p.revisionId) {
        return { ok: false, reason: 'question_revision_changed', questionId: p.questionId };
      }
    }
    return { ok: true };
  }

  // ---------- admin ----------

  async adminList(): Promise<AdminQuestion[]> {
    const rows = await this.db
      .select({ q: questions, rev: questionRevisions, topic: topics })
      .from(questions)
      .innerJoin(questionRevisions, eq(questionRevisions.id, questions.currentRevisionId))
      .innerJoin(topics, eq(topics.id, questions.topicId))
      .orderBy(desc(questions.updatedAt));
    const optionRows = rows.length
      ? await this.db
          .select({ o: questionOptions, correct: questionAnswerKeys.correctOptionId })
          .from(questionOptions)
          .leftJoin(questionAnswerKeys, eq(questionAnswerKeys.questionRevisionId, questionOptions.questionRevisionId))
          .where(inArray(questionOptions.questionRevisionId, rows.map((r) => r.rev.id)))
          .orderBy(asc(questionOptions.position))
      : [];
    const byRev = new Map<string, Array<{ id: string; label: string; position: number; isCorrect: boolean }>>();
    for (const r of optionRows) {
      const list = byRev.get(r.o.questionRevisionId) ?? [];
      list.push({ id: r.o.id, label: r.o.label, position: r.o.position, isCorrect: r.correct === r.o.id });
      byRev.set(r.o.questionRevisionId, list);
    }
    return rows.map((r) => this.toAdmin(r.q, r.rev, r.topic, byRev.get(r.rev.id) ?? []));
  }

  async adminGet(id: string, tx: DbOrTx = this.db): Promise<AdminQuestion> {
    const [r] = await tx
      .select({ q: questions, rev: questionRevisions, topic: topics })
      .from(questions)
      .innerJoin(questionRevisions, eq(questionRevisions.id, questions.currentRevisionId))
      .innerJoin(topics, eq(topics.id, questions.topicId))
      .where(eq(questions.id, id))
      .limit(1);
    if (!r) throw new AppError('NOT_FOUND');
    const opts = await tx
      .select({ o: questionOptions, correct: questionAnswerKeys.correctOptionId })
      .from(questionOptions)
      .leftJoin(questionAnswerKeys, eq(questionAnswerKeys.questionRevisionId, questionOptions.questionRevisionId))
      .where(eq(questionOptions.questionRevisionId, r.rev.id))
      .orderBy(asc(questionOptions.position));
    return this.toAdmin(
      r.q,
      r.rev,
      r.topic,
      opts.map((x) => ({ id: x.o.id, label: x.o.label, position: x.o.position, isCorrect: x.correct === x.o.id })),
    );
  }

  async adminCreate(
    actorUserId: string | null,
    input: AdminQuestionInput,
    opts: { isSeedSample?: boolean } = {},
  ): Promise<AdminQuestion> {
    const id = await this.db.transaction(async (tx) => {
      const [q] = await tx
        .insert(questions)
        .values({
          topicId: input.topicId,
          status: 'draft',
          relatedContentItemId: input.relatedContentItemId ?? null,
          isSeedSample: opts.isSeedSample ?? false,
          createdBy: actorUserId,
        })
        .returning();
      const revId = await this.insertRevision(tx, q!.id, 1, input, actorUserId);
      await tx.update(questions).set({ currentRevisionId: revId }).where(eq(questions.id, q!.id));
      await this.audit.record(
        { actorUserId, action: 'question.create', targetType: 'question', targetId: q!.id, reason: input.reason ?? null, metadata: { version: 1 } },
        tx,
      );
      return q!.id;
    });
    return this.adminGet(id);
  }

  /** Edits create a new revision; previous approval is invalidated (approvedRevisionId cleared, status draft). */
  async adminUpdate(actorUserId: string, id: string, input: AdminQuestionInput): Promise<AdminQuestion> {
    await this.db.transaction(async (tx) => {
      const [q] = await tx.select().from(questions).where(eq(questions.id, id)).for('update');
      if (!q) throw new AppError('NOT_FOUND');
      const [mv] = await tx
        .select({ maxVersion: sql<number>`coalesce(max(${questionRevisions.version}), 0)::int` })
        .from(questionRevisions)
        .where(eq(questionRevisions.questionId, id));
      const version = Number(mv?.maxVersion ?? 0) + 1;
      const revId = await this.insertRevision(tx, id, version, input, actorUserId);
      await tx
        .update(questions)
        .set({
          currentRevisionId: revId,
          approvedRevisionId: null,
          topicId: input.topicId,
          relatedContentItemId: input.relatedContentItemId ?? null,
          status: 'draft',
          reviewedBy: null,
          reviewedAt: null,
          reviewNote: null,
          updatedAt: new Date(),
        })
        .where(eq(questions.id, id));
      await this.audit.record(
        {
          actorUserId,
          action: 'question.update',
          targetType: 'question',
          targetId: id,
          reason: input.reason ?? null,
          metadata: { version, previousStatus: q.status, previousApprovedRevisionId: q.approvedRevisionId },
        },
        tx,
      );
    });
    return this.adminGet(id);
  }

  async adminTransition(
    actorUserId: string,
    id: string,
    action: ReviewAction,
    input: { reason?: string; expectedRevisionId?: string },
  ): Promise<AdminQuestion> {
    if (action === 'reject' && !input.reason) throw new AppError('VALIDATION_FAILED', 'Ret için gerekçe zorunlu.');
    await this.db.transaction(async (tx) => {
      const [q] = await tx.select().from(questions).where(eq(questions.id, id)).for('update');
      if (!q) throw new AppError('NOT_FOUND');
      if (input.expectedRevisionId && input.expectedRevisionId !== q.currentRevisionId) throw new AppError('REVISION_STALE');
      const to = assertTransition(action, q.status);
      const patch: Partial<typeof questions.$inferInsert> = { status: to, updatedAt: new Date() };
      if (action === 'approve') {
        patch.approvedRevisionId = q.currentRevisionId;
        patch.reviewedBy = actorUserId;
        patch.reviewedAt = new Date();
        patch.reviewNote = input.reason ?? null;
      }
      if (action === 'reject' || action === 'archive' || action === 'reopen') {
        patch.approvedRevisionId = null;
        if (action === 'reject') {
          patch.reviewedBy = actorUserId;
          patch.reviewedAt = new Date();
          patch.reviewNote = input.reason ?? null;
        }
      }
      await tx.update(questions).set(patch).where(eq(questions.id, id));
      await this.audit.record(
        {
          actorUserId,
          action: `question.${action}`,
          targetType: 'question',
          targetId: id,
          reason: input.reason ?? null,
          metadata: { from: q.status, to, revisionId: q.currentRevisionId },
        },
        tx,
      );
    });
    return this.adminGet(id);
  }

  private async insertRevision(
    tx: DbOrTx,
    questionId: string,
    version: number,
    input: AdminQuestionInput,
    actorUserId: string | null,
  ): Promise<string> {
    const [rev] = await tx
      .insert(questionRevisions)
      .values({
        questionId,
        version,
        prompt: input.prompt,
        explanation: input.explanation,
        sourceUrl: input.sourceUrl,
        sourceTitle: input.sourceTitle,
        sourceVerified: input.sourceVerified,
        language: input.language,
        productionMethod: input.productionMethod,
        createdBy: actorUserId,
      })
      .returning({ id: questionRevisions.id });
    const inserted = await tx
      .insert(questionOptions)
      .values(input.options.map((o, i) => ({ questionRevisionId: rev!.id, label: o.label, position: i })))
      .returning({ id: questionOptions.id, position: questionOptions.position });
    const correctIndex = input.options.findIndex((o) => o.isCorrect);
    const correct = inserted.find((o) => o.position === correctIndex);
    if (!correct) throw new AppError('VALIDATION_FAILED', 'Doğru seçenek bulunamadı.');
    await tx.insert(questionAnswerKeys).values({ questionRevisionId: rev!.id, correctOptionId: correct.id });
    return rev!.id;
  }

  private toAdmin(
    q: typeof questions.$inferSelect,
    rev: typeof questionRevisions.$inferSelect,
    topic: typeof topics.$inferSelect,
    options: Array<{ id: string; label: string; position: number; isCorrect: boolean }>,
  ): AdminQuestion {
    return {
      id: q.id,
      topic: toTopic(topic),
      status: q.status,
      currentRevision: {
        id: rev.id,
        version: rev.version,
        prompt: rev.prompt,
        explanation: rev.explanation,
        options,
        sourceUrl: rev.sourceUrl,
        sourceTitle: rev.sourceTitle,
        sourceVerified: rev.sourceVerified,
        language: rev.language,
        productionMethod: rev.productionMethod,
        createdAt: rev.createdAt.toISOString(),
        createdBy: rev.createdBy,
      },
      approvedRevisionId: q.approvedRevisionId,
      reviewedBy: q.reviewedBy,
      reviewedAt: q.reviewedAt?.toISOString() ?? null,
      reviewNote: q.reviewNote,
      relatedContentItemId: q.relatedContentItemId,
      isSeedSample: q.isSeedSample,
      updatedAt: q.updatedAt.toISOString(),
    };
  }
}

