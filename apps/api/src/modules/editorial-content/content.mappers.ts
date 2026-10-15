import type { ContentCardSummary, ContentDetail, Topic } from '@merak/contracts';
import type { contentItems, contentRevisions, topics } from '../../db/schema/index.js';

export type ItemRow = typeof contentItems.$inferSelect;
export type RevisionRow = typeof contentRevisions.$inferSelect;
export type TopicRow = typeof topics.$inferSelect;

export const toTopic = (t: TopicRow): Topic => ({ id: t.id, slug: t.slug, name: t.name });

export function toSummary(
  item: ItemRow,
  rev: RevisionRow,
  topic: TopicRow,
  flags: { isSaved: boolean; isCompleted: boolean },
): ContentCardSummary {
  return {
    id: item.id,
    slug: item.slug,
    kind: item.kind,
    topic: toTopic(topic),
    title: rev.title,
    summary: rev.summary,
    readingMinutes: rev.readingMinutes,
    mediaType: rev.mediaType,
    creator: rev.creator,
    year: rev.year,
    isSaved: flags.isSaved,
    isCompleted: flags.isCompleted,
    publishedAt: item.status === 'published' ? item.updatedAt.toISOString() : null,
  };
}

export function toDetail(
  item: ItemRow,
  rev: RevisionRow,
  topic: TopicRow,
  flags: { isSaved: boolean; isCompleted: boolean },
): ContentDetail {
  return {
    ...toSummary(item, rev, topic, flags),
    body: rev.body,
    whyRecommended: rev.whyRecommended,
    source: { url: rev.sourceUrl, title: rev.sourceTitle, verified: rev.sourceVerified },
    language: rev.language,
    productionMethod: rev.productionMethod,
    revisionVersion: rev.version,
  };
}
