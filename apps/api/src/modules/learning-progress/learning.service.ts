import { Inject, Injectable } from '@nestjs/common';
import { and, countDistinct, desc, eq, sql } from 'drizzle-orm';
import type {
  CompleteResponse,
  ContentCardSummary,
  DailyTask,
  LearningProgress,
  SaveResponse,
} from '@merak/contracts';
import { DB } from '../../db/db.module.js';
import type { Db, DbOrTx } from '../../db/client.js';
import {
  contentItems,
  contentRevisions,
  dailyTaskCompletions,
  learningCompletions,
  learningXpEvents,
  savedItems,
  topics,
} from '../../db/schema/index.js';
import { AppError } from '../../common/errors.js';
import { istanbulLocalDate } from '../../common/time.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { toSummary } from '../editorial-content/content.mappers.js';

/** M0_DENEY_AYARI — XP per completed micro-content. Not a product decision. */
export const XP_PER_COMPLETION = 10;
export const DAILY_TASK_KEY = 'complete_3_distinct' as const;
export const DAILY_TASK_TARGET = 3;
export const DAILY_TASK_TITLE = 'Bugün 3 farklı içerik tamamla';

@Injectable()
export class LearningService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly analytics: AnalyticsService,
  ) {}

  async save(userId: string, contentItemId: string): Promise<SaveResponse> {
    await this.assertPublished(contentItemId);
    const inserted = await this.db
      .insert(savedItems)
      .values({ userId, contentItemId })
      .onConflictDoNothing()
      .returning({ userId: savedItems.userId });
    if (inserted.length > 0) {
      await this.analytics.recordServerEvent({ eventName: 'content_saved', userId, contentItemId });
    }
    return { saved: true };
  }

  async unsave(userId: string, contentItemId: string): Promise<SaveResponse> {
    await this.db
      .delete(savedItems)
      .where(and(eq(savedItems.userId, userId), eq(savedItems.contentItemId, contentItemId)));
    return { saved: false };
  }

  /**
   * Idempotent completion. XP is written exactly once per (user, item) thanks to the unique
   * constraint on learning_completions and on learning_xp_events(user, reason, ref).
   * Daily task: counts DISTINCT items completed on the same Europe/Istanbul date.
   */
  async complete(userId: string, contentItemId: string, nowMs: number): Promise<CompleteResponse> {
    const now = new Date(nowMs);
    const localDate = istanbulLocalDate(now);
    return this.db.transaction(async (tx) => {
      // One completion per user at a time: under READ COMMITTED two concurrent completions would each count
      // only their own new row and both miss the third distinct item, losing the daily-task record.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`learning-complete:${userId}`}, 0))`);
      await this.assertPublished(contentItemId, tx);
      const inserted = await tx
        .insert(learningCompletions)
        .values({ userId, contentItemId, completedAt: now, xpAwarded: XP_PER_COMPLETION })
        .onConflictDoNothing()
        .returning({ id: learningCompletions.id });
      const firstTime = inserted.length > 0;
      let xpAwarded = 0;
      if (firstTime) {
        const xp = await tx
          .insert(learningXpEvents)
          .values({ userId, amount: XP_PER_COMPLETION, reason: 'content_completed', refId: contentItemId })
          .onConflictDoNothing()
          .returning({ id: learningXpEvents.id });
        xpAwarded = xp.length > 0 ? XP_PER_COMPLETION : 0;
        await this.analytics.recordServerEvent(
          { eventName: 'content_completed', userId, contentItemId, eventTime: now },
          tx,
        );
      }
      const progress = await this.dailyProgress(userId, localDate, tx);
      let completedNow = false;
      if (progress >= DAILY_TASK_TARGET) {
        const done = await tx
          .insert(dailyTaskCompletions)
          .values({ userId, taskKey: DAILY_TASK_KEY, localDate, completedAt: now })
          .onConflictDoNothing()
          .returning({ id: dailyTaskCompletions.id });
        if (done.length > 0) {
          completedNow = true;
          await this.analytics.recordServerEvent(
            {
              eventName: 'daily_task_completed',
              userId,
              eventTime: now,
              props: { taskKey: DAILY_TASK_KEY, localDate },
            },
            tx,
          );
        }
      }
      const learningXpTotal = await this.xpTotal(userId, tx);
      return {
        completed: true,
        xpAwarded,
        alreadyCompleted: !firstTime,
        learningXpTotal,
        dailyTask: {
          progress: Math.min(progress, DAILY_TASK_TARGET),
          target: DAILY_TASK_TARGET,
          completed: progress >= DAILY_TASK_TARGET,
          completedNow,
        },
      };
    });
  }

  async progress(userId: string, nowMs: number): Promise<LearningProgress> {
    const localDate = istanbulLocalDate(nowMs);
    const [completed, saved, xp, daily] = await Promise.all([
      this.db
        .select({ n: countDistinct(learningCompletions.contentItemId) })
        .from(learningCompletions)
        .where(eq(learningCompletions.userId, userId)),
      this.db.select({ n: countDistinct(savedItems.contentItemId) }).from(savedItems).where(eq(savedItems.userId, userId)),
      this.xpTotal(userId),
      this.dailyProgress(userId, localDate),
    ]);
    return {
      learningXpTotal: xp,
      completedCount: Number(completed[0]?.n ?? 0),
      savedCount: Number(saved[0]?.n ?? 0),
      dailyTask: this.dailyTaskView(localDate, daily),
    };
  }

  async savedList(userId: string): Promise<ContentCardSummary[]> {
    const rows = await this.db
      .select({ item: contentItems, rev: contentRevisions, topic: topics, completed: learningCompletions.userId })
      .from(savedItems)
      .innerJoin(contentItems, eq(contentItems.id, savedItems.contentItemId))
      .innerJoin(contentRevisions, eq(contentRevisions.id, contentItems.publishedRevisionId))
      .innerJoin(topics, eq(topics.id, contentItems.topicId))
      .leftJoin(
        learningCompletions,
        and(eq(learningCompletions.contentItemId, contentItems.id), eq(learningCompletions.userId, userId)),
      )
      .where(and(eq(savedItems.userId, userId), eq(contentItems.status, 'published')))
      .orderBy(desc(savedItems.createdAt));
    return rows.map((r) => toSummary(r.item, r.rev, r.topic, { isSaved: true, isCompleted: !!r.completed }));
  }

  private dailyTaskView(localDate: string, progress: number): DailyTask {
    return {
      key: DAILY_TASK_KEY,
      title: DAILY_TASK_TITLE,
      localDate,
      target: DAILY_TASK_TARGET,
      progress: Math.min(progress, DAILY_TASK_TARGET),
      completed: progress >= DAILY_TASK_TARGET,
    };
  }

  private async dailyProgress(userId: string, localDate: string, tx: DbOrTx = this.db): Promise<number> {
    const [row] = await tx
      .select({ n: countDistinct(learningCompletions.contentItemId) })
      .from(learningCompletions)
      .where(
        and(
          eq(learningCompletions.userId, userId),
          sql`(${learningCompletions.completedAt} at time zone 'Europe/Istanbul')::date = ${localDate}::date`,
        ),
      );
    return Number(row?.n ?? 0);
  }

  private async xpTotal(userId: string, tx: DbOrTx = this.db): Promise<number> {
    const [row] = await tx
      .select({ total: sql<number>`coalesce(sum(${learningXpEvents.amount}), 0)::int` })
      .from(learningXpEvents)
      .where(eq(learningXpEvents.userId, userId));
    return Number(row?.total ?? 0);
  }

  private async assertPublished(contentItemId: string, tx: DbOrTx = this.db): Promise<void> {
    const [row] = await tx
      .select({ status: contentItems.status })
      .from(contentItems)
      .where(eq(contentItems.id, contentItemId))
      .limit(1);
    if (!row || row.status !== 'published') throw new AppError('CONTENT_NOT_PUBLISHED');
  }
}
