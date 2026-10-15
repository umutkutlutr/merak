import { z } from 'zod';
import {
  IsoDateTimeSchema,
  LanguageSchema,
  ProductionMethodSchema,
  UuidSchema,
} from './common.js';

export const TopicSchema = z.object({
  id: UuidSchema,
  slug: z.string(),
  name: z.string(),
});
export type Topic = z.infer<typeof TopicSchema>;

export const ContentKindSchema = z.enum(['card', 'radar_pick']);
export type ContentKind = z.infer<typeof ContentKindSchema>;

export const MediaTypeSchema = z.enum(['book', 'film']);

export const ContentCardSummarySchema = z.object({
  id: UuidSchema,
  slug: z.string(),
  kind: ContentKindSchema,
  topic: TopicSchema,
  title: z.string(),
  summary: z.string(),
  readingMinutes: z.number().int().positive().nullable(),
  /** Radar picks only */
  mediaType: MediaTypeSchema.nullable(),
  creator: z.string().nullable(),
  year: z.number().int().nullable(),
  isSaved: z.boolean(),
  isCompleted: z.boolean(),
  publishedAt: IsoDateTimeSchema.nullable(),
});
export type ContentCardSummary = z.infer<typeof ContentCardSummarySchema>;

export const ContentDetailSchema = ContentCardSummarySchema.extend({
  body: z.string(),
  /** Radar picks: short editorial reason for the recommendation. */
  whyRecommended: z.string().nullable(),
  source: z.object({
    url: z.url().nullable(),
    title: z.string().nullable(),
    /** True only when an editor marked the source as checked. Seed content is never 'verified'. */
    verified: z.boolean(),
  }),
  language: LanguageSchema,
  productionMethod: ProductionMethodSchema,
  revisionVersion: z.number().int().positive(),
});
export type ContentDetail = z.infer<typeof ContentDetailSchema>;

export const FeedQuerySchema = z.object({
  kind: ContentKindSchema.optional(),
  topic: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

export const FeedResponseSchema = z.object({
  items: z.array(ContentCardSummarySchema),
  topics: z.array(TopicSchema),
});
export type FeedResponse = z.infer<typeof FeedResponseSchema>;

export const SaveResponseSchema = z.object({ saved: z.boolean() });
export type SaveResponse = z.infer<typeof SaveResponseSchema>;

export const CompleteResponseSchema = z.object({
  completed: z.literal(true),
  /** XP awarded by THIS call. 0 when the item was already completed. */
  xpAwarded: z.number().int().nonnegative(),
  alreadyCompleted: z.boolean(),
  learningXpTotal: z.number().int().nonnegative(),
  dailyTask: z.object({
    progress: z.number().int().nonnegative(),
    target: z.number().int().positive(),
    completed: z.boolean(),
    completedNow: z.boolean(),
  }),
});
export type CompleteResponse = z.infer<typeof CompleteResponseSchema>;
