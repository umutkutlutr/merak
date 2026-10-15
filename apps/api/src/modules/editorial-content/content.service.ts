import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import type {
  AdminContentInput,
  AdminContentItem,
  ContentCardSummary,
  ContentDetail,
  ContentKind,
  ReviewAction,
  ReviewStatus,
  Topic,
} from '@merak/contracts';
import { DB } from '../../db/db.module.js';
import type { Db, DbOrTx } from '../../db/client.js';
import {
  contentItems,
  contentRevisions,
  learningCompletions,
  savedItems,
  topics,
} from '../../db/schema/index.js';
import { AppError, isPgUniqueViolation } from '../../common/errors.js';
import { AuditService } from '../admin-audit/audit.service.js';
import { toDetail, toSummary, toTopic } from './content.mappers.js';

/** Allowed review transitions (shared by content and questions). */
export const REVIEW_TRANSITIONS: Record<ReviewAction, { from: ReviewStatus[]; to: ReviewStatus }> = {
  submit_review: { from: ['draft', 'rejected'], to: 'review' },
  approve: { from: ['review'], to: 'approved' },
  reject: { from: ['review', 'approved'], to: 'rejected' },
  publish: { from: ['approved'], to: 'published' },
  archive: { from: ['draft', 'review', 'approved', 'published', 'rejected'], to: 'archived' },
  reopen: { from: ['rejected', 'archived'], to: 'draft' },
};

export function assertTransition(action: ReviewAction, from: ReviewStatus): ReviewStatus {
  const rule = REVIEW_TRANSITIONS[action];
  if (!rule.from.includes(from)) {
    throw new AppError('INVALID_TRANSITION', `'${from}' durumundan '${action}' yapılamaz.`);
  }
  return rule.to;
}

@Injectable()
export class ContentService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly audit: AuditService,
  ) {}

  async listTopics(): Promise<Topic[]> {
    const rows = await this.db.select().from(topics).orderBy(asc(topics.sortOrder), asc(topics.name));
    return rows.map(toTopic);
  }

  // ---------- public (published only) ----------

  async listPublished(
    userId: string,
    filter: { kind?: ContentKind; topic?: string; limit: number },
  ): Promise<ContentCardSummary[]> {
    const conds = [eq(contentItems.status, 'published')];
    if (filter.kind) conds.push(eq(contentItems.kind, filter.kind));
    if (filter.topic) conds.push(eq(topics.slug, filter.topic));
    const rows = await this.db
      .select({
        item: contentItems,
        rev: contentRevisions,
        topic: topics,
        saved: savedItems.userId,
        completed: learningCompletions.userId,
      })
      .from(contentItems)
      .innerJoin(contentRevisions, eq(contentRevisions.id, contentItems.publishedRevisionId))
      .innerJoin(topics, eq(topics.id, contentItems.topicId))
      .leftJoin(
        savedItems,
        and(eq(savedItems.contentItemId, contentItems.id), eq(savedItems.userId, userId)),
      )
      .leftJoin(
        learningCompletions,
        and(
          eq(learningCompletions.contentItemId, contentItems.id),
          eq(learningCompletions.userId, userId),
        ),
      )
      .where(and(...conds))
      .orderBy(asc(topics.sortOrder), desc(contentItems.updatedAt))
      .limit(filter.limit);
    return rows.map((r) =>
      toSummary(r.item, r.rev, r.topic, { isSaved: !!r.saved, isCompleted: !!r.completed }),
    );
  }

  async getPublishedDetail(userId: string, idOrSlug: string): Promise<ContentDetail> {
    const isUuid = /^[0-9a-f-]{36}$/i.test(idOrSlug);
    const [row] = await this.db
      .select({
        item: contentItems,
        rev: contentRevisions,
        topic: topics,
        saved: savedItems.userId,
        completed: learningCompletions.userId,
      })
      .from(contentItems)
      .innerJoin(contentRevisions, eq(contentRevisions.id, contentItems.publishedRevisionId))
      .innerJoin(topics, eq(topics.id, contentItems.topicId))
      .leftJoin(
        savedItems,
        and(eq(savedItems.contentItemId, contentItems.id), eq(savedItems.userId, userId)),
      )
      .leftJoin(
        learningCompletions,
        and(
          eq(learningCompletions.contentItemId, contentItems.id),
          eq(learningCompletions.userId, userId),
        ),
      )
      .where(
        and(
          eq(contentItems.status, 'published'),
          isUuid ? eq(contentItems.id, idOrSlug) : eq(contentItems.slug, idOrSlug),
        ),
      )
      .limit(1);
    if (!row) throw new AppError('CONTENT_NOT_PUBLISHED');
    return toDetail(row.item, row.rev, row.topic, {
      isSaved: !!row.saved,
      isCompleted: !!row.completed,
    });
  }

  /** Summaries for a set of ids (published only), with the user's flags. */
  async summariesByIds(userId: string, ids: string[]): Promise<Map<string, ContentCardSummary>> {
    if (ids.length === 0) return new Map();
    const rows = await this.db
      .select({
        item: contentItems,
        rev: contentRevisions,
        topic: topics,
        saved: savedItems.userId,
        completed: learningCompletions.userId,
      })
      .from(contentItems)
      .innerJoin(contentRevisions, eq(contentRevisions.id, contentItems.publishedRevisionId))
      .innerJoin(topics, eq(topics.id, contentItems.topicId))
      .leftJoin(
        savedItems,
        and(eq(savedItems.contentItemId, contentItems.id), eq(savedItems.userId, userId)),
      )
      .leftJoin(
        learningCompletions,
        and(
          eq(learningCompletions.contentItemId, contentItems.id),
          eq(learningCompletions.userId, userId),
        ),
      )
      .where(and(eq(contentItems.status, 'published'), inArray(contentItems.id, ids)));
    const map = new Map<string, ContentCardSummary>();
    for (const r of rows) {
      map.set(
        r.item.id,
        toSummary(r.item, r.rev, r.topic, { isSaved: !!r.saved, isCompleted: !!r.completed }),
      );
    }
    return map;
  }

  /** Related published card for a question: explicit link first, otherwise same topic. */
  async relatedCardFor(
    userId: string,
    relatedContentItemId: string | null,
    topicId: string,
  ): Promise<ContentCardSummary | null> {
    if (relatedContentItemId) {
      const m = await this.summariesByIds(userId, [relatedContentItemId]);
      const hit = m.get(relatedContentItemId);
      if (hit) return hit;
    }
    const [row] = await this.db
      .select({ id: contentItems.id })
      .from(contentItems)
      .where(
        and(
          eq(contentItems.status, 'published'),
          eq(contentItems.kind, 'card'),
          eq(contentItems.topicId, topicId),
        ),
      )
      .orderBy(desc(contentItems.updatedAt))
      .limit(1);
    if (!row) return null;
    const m = await this.summariesByIds(userId, [row.id]);
    return m.get(row.id) ?? null;
  }

  async assertPublished(contentItemId: string, tx: DbOrTx = this.db): Promise<void> {
    const [row] = await tx
      .select({ status: contentItems.status })
      .from(contentItems)
      .where(eq(contentItems.id, contentItemId))
      .limit(1);
    if (!row || row.status !== 'published') throw new AppError('CONTENT_NOT_PUBLISHED');
  }

  // ---------- admin ----------

  async adminList(): Promise<AdminContentItem[]> {
    const rows = await this.db
      .select({ item: contentItems, rev: contentRevisions, topic: topics })
      .from(contentItems)
      .innerJoin(contentRevisions, eq(contentRevisions.id, contentItems.currentRevisionId))
      .innerJoin(topics, eq(topics.id, contentItems.topicId))
      .orderBy(desc(contentItems.updatedAt));
    return rows.map((r) => this.toAdmin(r.item, r.rev, r.topic));
  }

  async adminGet(id: string, tx: DbOrTx = this.db): Promise<AdminContentItem> {
    const [r] = await tx
      .select({ item: contentItems, rev: contentRevisions, topic: topics })
      .from(contentItems)
      .innerJoin(contentRevisions, eq(contentRevisions.id, contentItems.currentRevisionId))
      .innerJoin(topics, eq(topics.id, contentItems.topicId))
      .where(eq(contentItems.id, id))
      .limit(1);
    if (!r) throw new AppError('NOT_FOUND');
    return this.toAdmin(r.item, r.rev, r.topic);
  }

  async adminCreate(
    actorUserId: string | null,
    input: AdminContentInput,
    opts: { isSeedSample?: boolean } = {},
  ): Promise<AdminContentItem> {
    const slug = input.slug ?? slugify(input.title);
    try {
      const id = await this.db.transaction(async (tx) => {
        const [item] = await tx
          .insert(contentItems)
          .values({
            slug,
            kind: input.kind,
            topicId: input.topicId,
            status: 'draft',
            isSeedSample: opts.isSeedSample ?? false,
            createdBy: actorUserId,
          })
          .returning();
        const [rev] = await tx
          .insert(contentRevisions)
          .values({ ...revisionValues(input), contentItemId: item!.id, version: 1, createdBy: actorUserId })
          .returning();
        await tx
          .update(contentItems)
          .set({ currentRevisionId: rev!.id })
          .where(eq(contentItems.id, item!.id));
        await this.audit.record(
          {
            actorUserId,
            action: 'content.create',
            targetType: 'content_item',
            targetId: item!.id,
            reason: input.reason ?? null,
            metadata: { version: 1, kind: input.kind },
          },
          tx,
        );
        return item!.id;
      });
      return this.adminGet(id);
    } catch (err) {
      if (isPgUniqueViolation(err, 'content_items_slug_key')) {
        throw new AppError('VALIDATION_FAILED', 'Bu slug zaten kullanılıyor.', { slug });
      }
      throw err;
    }
  }

  /** Any edit creates a new revision and drops the item back to draft (approval invalidated). */
  async adminUpdate(actorUserId: string, id: string, input: AdminContentInput): Promise<AdminContentItem> {
    await this.db.transaction(async (tx) => {
      const [item] = await tx.select().from(contentItems).where(eq(contentItems.id, id)).for('update');
      if (!item) throw new AppError('NOT_FOUND');
      const [mv] = await tx
        .select({ maxVersion: sql<number>`coalesce(max(${contentRevisions.version}), 0)::int` })
        .from(contentRevisions)
        .where(eq(contentRevisions.contentItemId, id));
      const version = Number(mv?.maxVersion ?? 0) + 1;
      const [rev] = await tx
        .insert(contentRevisions)
        .values({ ...revisionValues(input), contentItemId: id, version, createdBy: actorUserId })
        .returning();
      await tx
        .update(contentItems)
        .set({
          currentRevisionId: rev!.id,
          topicId: input.topicId,
          kind: input.kind,
          status: 'draft',
          reviewedBy: null,
          reviewedAt: null,
          reviewNote: null,
          updatedAt: new Date(),
        })
        .where(eq(contentItems.id, id));
      await this.audit.record(
        {
          actorUserId,
          action: 'content.update',
          targetType: 'content_item',
          targetId: id,
          reason: input.reason ?? null,
          metadata: { version, previousStatus: item.status },
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
  ): Promise<AdminContentItem> {
    if (action === 'reject' && !input.reason) {
      throw new AppError('VALIDATION_FAILED', 'Ret için gerekçe zorunlu.');
    }
    await this.db.transaction(async (tx) => {
      const [item] = await tx.select().from(contentItems).where(eq(contentItems.id, id)).for('update');
      if (!item) throw new AppError('NOT_FOUND');
      if (input.expectedRevisionId && input.expectedRevisionId !== item.currentRevisionId) {
        throw new AppError('REVISION_STALE');
      }
      const to = assertTransition(action, item.status);
      const patch: Partial<typeof contentItems.$inferInsert> = { status: to, updatedAt: new Date() };
      if (action === 'approve' || action === 'reject') {
        patch.reviewedBy = actorUserId;
        patch.reviewedAt = new Date();
        patch.reviewNote = input.reason ?? null;
      }
      if (action === 'publish') patch.publishedRevisionId = item.currentRevisionId;
      if (action === 'archive') patch.publishedRevisionId = null;
      await tx.update(contentItems).set(patch).where(eq(contentItems.id, id));
      await this.audit.record(
        {
          actorUserId,
          action: `content.${action}`,
          targetType: 'content_item',
          targetId: id,
          reason: input.reason ?? null,
          metadata: { from: item.status, to, revisionId: item.currentRevisionId },
        },
        tx,
      );
    });
    return this.adminGet(id);
  }

  private toAdmin(
    item: typeof contentItems.$inferSelect,
    rev: typeof contentRevisions.$inferSelect,
    topic: typeof topics.$inferSelect,
  ): AdminContentItem {
    return {
      id: item.id,
      slug: item.slug,
      kind: item.kind,
      topic: toTopic(topic),
      status: item.status,
      currentRevision: {
        id: rev.id,
        version: rev.version,
        title: rev.title,
        summary: rev.summary,
        body: rev.body,
        readingMinutes: rev.readingMinutes,
        mediaType: rev.mediaType,
        creator: rev.creator,
        year: rev.year,
        whyRecommended: rev.whyRecommended,
        sourceUrl: rev.sourceUrl,
        sourceTitle: rev.sourceTitle,
        sourceVerified: rev.sourceVerified,
        language: rev.language,
        productionMethod: rev.productionMethod,
        createdAt: rev.createdAt.toISOString(),
      },
      publishedRevisionId: item.publishedRevisionId,
      reviewedBy: item.reviewedBy,
      reviewedAt: item.reviewedAt?.toISOString() ?? null,
      reviewNote: item.reviewNote,
      isSeedSample: item.isSeedSample,
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}

function revisionValues(input: AdminContentInput) {
  return {
    title: input.title,
    summary: input.summary,
    body: input.body,
    readingMinutes: input.readingMinutes ?? null,
    mediaType: input.mediaType ?? null,
    creator: input.creator ?? null,
    year: input.year ?? null,
    whyRecommended: input.whyRecommended ?? null,
    sourceUrl: input.sourceUrl,
    sourceTitle: input.sourceTitle,
    sourceVerified: input.sourceVerified,
    language: input.language,
    productionMethod: input.productionMethod,
  };
}

export function slugify(s: string): string {
  const map: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', İ: 'i' };
  return s
    .toLowerCase()
    .replace(/[çğıöşüİ]/g, (c) => map[c] ?? c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

