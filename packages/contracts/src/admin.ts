import { z } from 'zod';
import {
  IsoDateTimeSchema,
  LanguageSchema,
  ProductionMethodSchema,
  ReviewStatusSchema,
  UuidSchema,
} from './common.js';
import { TopicSchema, ContentKindSchema, MediaTypeSchema } from './content.js';
import { CancelReasonSchema, QuizSessionSummarySchema, SessionQuestionStatusSchema } from './quiz.js';

// ---------- Questions ----------

export const AdminQuestionOptionSchema = z.object({
  id: UuidSchema,
  label: z.string(),
  position: z.number().int().nonnegative(),
  /** Visible to admins only; this field never leaves admin routes. */
  isCorrect: z.boolean(),
});

export const AdminQuestionRevisionSchema = z.object({
  id: UuidSchema,
  version: z.number().int().positive(),
  prompt: z.string(),
  explanation: z.string(),
  options: z.array(AdminQuestionOptionSchema),
  sourceUrl: z.url().nullable(),
  sourceTitle: z.string().nullable(),
  sourceVerified: z.boolean(),
  language: LanguageSchema,
  productionMethod: ProductionMethodSchema,
  createdAt: IsoDateTimeSchema,
  createdBy: UuidSchema.nullable(),
});

export const AdminQuestionSchema = z.object({
  id: UuidSchema,
  topic: TopicSchema,
  status: ReviewStatusSchema,
  /** Latest revision (the one that status refers to). */
  currentRevision: AdminQuestionRevisionSchema,
  approvedRevisionId: UuidSchema.nullable(),
  reviewedBy: UuidSchema.nullable(),
  reviewedAt: IsoDateTimeSchema.nullable(),
  reviewNote: z.string().nullable(),
  relatedContentItemId: UuidSchema.nullable(),
  isSeedSample: z.boolean(),
  updatedAt: IsoDateTimeSchema,
});
export type AdminQuestion = z.infer<typeof AdminQuestionSchema>;

export const AdminQuestionInputSchema = z
  .object({
    topicId: UuidSchema,
    prompt: z.string().min(8).max(400),
    explanation: z.string().min(1).max(1000),
    options: z
      .array(z.object({ label: z.string().min(1).max(120), isCorrect: z.boolean() }))
      .length(4)
      .refine((o) => o.filter((x) => x.isCorrect).length === 1, 'Tam olarak bir doğru seçenek olmalı.'),
    sourceUrl: z.url().nullable(),
    sourceTitle: z.string().max(200).nullable(),
    sourceVerified: z.boolean().default(false),
    language: LanguageSchema.default('tr'),
    productionMethod: ProductionMethodSchema.default('human'),
    relatedContentItemId: UuidSchema.nullable().optional(),
    /** Audit reason for edits. */
    reason: z.string().max(300).optional(),
  })
  .strict();
export type AdminQuestionInput = z.infer<typeof AdminQuestionInputSchema>;

export const ReviewTransitionInputSchema = z
  .object({
    /** Required for reject; optional elsewhere. Stored in the audit log. */
    reason: z.string().max(300).optional(),
    /** Optimistic concurrency: the revision the admin reviewed. */
    expectedRevisionId: UuidSchema.optional(),
  })
  .strict();
export type ReviewTransitionInput = z.infer<typeof ReviewTransitionInputSchema>;

export const ReviewActionSchema = z.enum(['submit_review', 'approve', 'reject', 'publish', 'archive', 'reopen']);
export type ReviewAction = z.infer<typeof ReviewActionSchema>;

// ---------- Content ----------

export const AdminContentRevisionSchema = z.object({
  id: UuidSchema,
  version: z.number().int().positive(),
  title: z.string(),
  summary: z.string(),
  body: z.string(),
  readingMinutes: z.number().int().positive().nullable(),
  mediaType: MediaTypeSchema.nullable(),
  creator: z.string().nullable(),
  year: z.number().int().nullable(),
  whyRecommended: z.string().nullable(),
  sourceUrl: z.url().nullable(),
  sourceTitle: z.string().nullable(),
  sourceVerified: z.boolean(),
  language: LanguageSchema,
  productionMethod: ProductionMethodSchema,
  createdAt: IsoDateTimeSchema,
});

export const AdminContentItemSchema = z.object({
  id: UuidSchema,
  slug: z.string(),
  kind: ContentKindSchema,
  topic: TopicSchema,
  status: ReviewStatusSchema,
  currentRevision: AdminContentRevisionSchema,
  publishedRevisionId: UuidSchema.nullable(),
  reviewedBy: UuidSchema.nullable(),
  reviewedAt: IsoDateTimeSchema.nullable(),
  reviewNote: z.string().nullable(),
  isSeedSample: z.boolean(),
  updatedAt: IsoDateTimeSchema,
});
export type AdminContentItem = z.infer<typeof AdminContentItemSchema>;

export const AdminContentInputSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/).min(3).max(80).optional(),
    kind: ContentKindSchema,
    topicId: UuidSchema,
    title: z.string().min(2).max(140),
    summary: z.string().min(2).max(300),
    body: z.string().min(2).max(6000),
    readingMinutes: z.number().int().positive().max(60).nullable().optional(),
    mediaType: MediaTypeSchema.nullable().optional(),
    creator: z.string().max(120).nullable().optional(),
    year: z.number().int().min(0).max(2100).nullable().optional(),
    whyRecommended: z.string().max(400).nullable().optional(),
    sourceUrl: z.url().nullable(),
    sourceTitle: z.string().max(200).nullable(),
    sourceVerified: z.boolean().default(false),
    language: LanguageSchema.default('tr'),
    productionMethod: ProductionMethodSchema.default('human'),
    reason: z.string().max(300).optional(),
  })
  .strict();
export type AdminContentInput = z.infer<typeof AdminContentInputSchema>;

// ---------- Sessions ----------

export const AdminSessionQuestionSchema = z.object({
  sessionQuestionId: UuidSchema,
  position: z.number().int().positive(),
  questionId: UuidSchema,
  questionRevisionId: UuidSchema,
  revisionVersion: z.number().int().positive(),
  prompt: z.string(),
  status: SessionQuestionStatusSchema,
  opensAt: IsoDateTimeSchema.nullable(),
  closesAt: IsoDateTimeSchema.nullable(),
  /** True when the question's current approved revision still matches the pinned one. */
  revisionStillValid: z.boolean(),
});

export const AdminSessionSchema = QuizSessionSummarySchema.extend({
  questions: z.array(AdminSessionQuestionSchema),
  createdBy: UuidSchema.nullable(),
  createdAt: IsoDateTimeSchema,
  answerCount: z.number().int().nonnegative(),
});
export type AdminSession = z.infer<typeof AdminSessionSchema>;

export const AdminCreateSessionInputSchema = z
  .object({
    title: z.string().min(2).max(120),
    scheduledStartAt: IsoDateTimeSchema,
    /** Exactly five approved/published question ids, in play order. */
    questionIds: z.array(UuidSchema).length(5),
    /**
     * Test-only overrides (M0). Bounded on the server. Production rules are fixed by rulesVersion.
     */
    rulesOverride: z
      .object({
        questionDurationMs: z.number().int().min(1000).max(60_000).optional(),
        revealDurationMs: z.number().int().min(250).max(30_000).optional(),
        lobbyLeadMs: z.number().int().min(0).max(600_000).optional(),
      })
      .strict()
      .optional(),
    reason: z.string().max(300).optional(),
  })
  .strict();
export type AdminCreateSessionInput = z.infer<typeof AdminCreateSessionInputSchema>;

export const AdminCancelSessionInputSchema = z
  .object({ reason: z.string().min(3).max(300) })
  .strict();

export const AdminAuditEntrySchema = z.object({
  id: UuidSchema,
  actorUserId: UuidSchema.nullable(),
  actorUsername: z.string().nullable(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string().nullable(),
  reason: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: IsoDateTimeSchema,
});
export type AdminAuditEntry = z.infer<typeof AdminAuditEntrySchema>;

export const AdminCancelReasonSchema = CancelReasonSchema;
