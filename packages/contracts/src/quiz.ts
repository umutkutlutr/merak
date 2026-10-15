import { z } from 'zod';
import { ContentCardSummarySchema } from './content.js';
import { ErrorCodeSchema, IsoDateTimeSchema, UuidSchema } from './common.js';

export const QuizSessionStatusSchema = z.enum([
  'draft',
  'scheduled',
  'lobby',
  'live',
  'completed',
  'cancelled',
]);
export type QuizSessionStatus = z.infer<typeof QuizSessionStatusSchema>;

export const SessionQuestionStatusSchema = z.enum(['pending', 'open', 'closed', 'revealed']);
export type SessionQuestionStatus = z.infer<typeof SessionQuestionStatusSchema>;

export const CancelReasonSchema = z.enum([
  'admin_cancelled',
  'server_restart',
  'missed_start',
  'question_approval_withdrawn',
  'question_revision_changed',
]);
export type CancelReason = z.infer<typeof CancelReasonSchema>;

/** Rule snapshot persisted per session; immutable once the session leaves 'draft'. */
export const SessionRulesSchema = z.object({
  rulesVersion: z.string(),
  timezone: z.literal('Europe/Istanbul'),
  questionCount: z.number().int().positive(),
  questionDurationMs: z.number().int().positive(),
  revealDurationMs: z.number().int().positive(),
  lobbyLeadMs: z.number().int().nonnegative(),
  points: z.object({ base: z.number().int(), speedBonusMax: z.number().int() }),
});
export type SessionRules = z.infer<typeof SessionRulesSchema>;

export const QuizSessionSummarySchema = z.object({
  id: UuidSchema,
  title: z.string(),
  status: QuizSessionStatusSchema,
  /** Always true in M0: prize-less local test. */
  isTest: z.literal(true),
  prizeMode: z.literal('none'),
  scheduledStartAt: IsoDateTimeSchema,
  lobbyOpensAt: IsoDateTimeSchema,
  questionCount: z.number().int().positive(),
  rules: SessionRulesSchema,
  stateVersion: z.number().int().nonnegative(),
  currentQuestionPosition: z.number().int().positive().nullable(),
  cancelledReason: CancelReasonSchema.nullable(),
  cancelledAt: IsoDateTimeSchema.nullable(),
  completedAt: IsoDateTimeSchema.nullable(),
  participantCount: z.number().int().nonnegative(),
});
export type QuizSessionSummary = z.infer<typeof QuizSessionSummarySchema>;

export const CurrentQuizResponseSchema = z.object({
  /** The next/active session visible to users, or null when nothing is planned. */
  session: QuizSessionSummarySchema.nullable(),
  serverTime: IsoDateTimeSchema,
  /** Present when the caller already joined this session. */
  myParticipation: z
    .object({ participantId: UuidSchema, eligibleFromPosition: z.number().int().positive() })
    .nullable(),
});
export type CurrentQuizResponse = z.infer<typeof CurrentQuizResponseSchema>;

export const QuestionOptionViewSchema = z.object({
  optionId: UuidSchema,
  label: z.string(),
});

/** Only ever produced for a question whose status is 'open' (or later). Never carries the answer key. */
export const OpenQuestionViewSchema = z.object({
  sessionQuestionId: UuidSchema,
  position: z.number().int().positive(),
  prompt: z.string(),
  /** Per-user stable order (seeded by participant + question). */
  options: z.array(QuestionOptionViewSchema),
  opensAt: IsoDateTimeSchema,
  closesAt: IsoDateTimeSchema,
  durationMs: z.number().int().positive(),
});
export type OpenQuestionView = z.infer<typeof OpenQuestionViewSchema>;

export const MyAnswerViewSchema = z.object({
  receiptId: UuidSchema,
  sessionQuestionId: UuidSchema,
  position: z.number().int().positive(),
  optionId: UuidSchema,
  receivedAt: IsoDateTimeSchema,
  elapsedMs: z.number().int().nonnegative(),
  /** Null until the question is revealed. */
  isCorrect: z.boolean().nullable(),
  points: z.number().int().nonnegative().nullable(),
});
export type MyAnswerView = z.infer<typeof MyAnswerViewSchema>;

/** Produced only after closesAt has passed on the server. */
export const RevealViewSchema = z.object({
  sessionQuestionId: UuidSchema,
  position: z.number().int().positive(),
  prompt: z.string(),
  options: z.array(QuestionOptionViewSchema),
  correctOptionId: UuidSchema,
  explanation: z.string(),
  closedAt: IsoDateTimeSchema,
  revealedAt: IsoDateTimeSchema,
  /** Next question opens at this time (or null when the session completes after this question). */
  nextOpensAt: IsoDateTimeSchema.nullable(),
  myAnswer: MyAnswerViewSchema.nullable(),
});
export type RevealView = z.infer<typeof RevealViewSchema>;

export const LeaderboardRowSchema = z.object({
  rank: z.number().int().positive(),
  participantId: UuidSchema,
  username: z.string(),
  totalPoints: z.number().int().nonnegative(),
  correctCount: z.number().int().nonnegative(),
  isMe: z.boolean(),
});

export const SessionResultViewSchema = z.object({
  sessionId: UuidSchema,
  participantId: UuidSchema.nullable(),
  correctCount: z.number().int().nonnegative(),
  totalPoints: z.number().int().nonnegative(),
  answeredCount: z.number().int().nonnegative(),
  rank: z.number().int().positive().nullable(),
  participantCount: z.number().int().nonnegative(),
  questions: z.array(
    z.object({
      sessionQuestionId: UuidSchema,
      position: z.number().int().positive(),
      prompt: z.string(),
      correctOptionId: UuidSchema,
      correctLabel: z.string(),
      explanation: z.string(),
      myOptionId: UuidSchema.nullable(),
      myLabel: z.string().nullable(),
      isCorrect: z.boolean(),
      points: z.number().int().nonnegative(),
      relatedContent: ContentCardSummarySchema.nullable(),
    }),
  ),
  leaderboard: z.array(LeaderboardRowSchema),
  /** Tie rule: equal points share the rank; the secondary sort key (earlier last-answer) is visual only. */
  tieRule: z.literal('equal_points_share_rank'),
});
export type SessionResultView = z.infer<typeof SessionResultViewSchema>;

export const SessionSnapshotSchema = z.object({
  serverTime: IsoDateTimeSchema,
  stateVersion: z.number().int().nonnegative(),
  session: QuizSessionSummarySchema,
  currentQuestion: z
    .object({
      position: z.number().int().positive(),
      status: SessionQuestionStatusSchema,
      /** Present only while the question is open. */
      open: OpenQuestionViewSchema.nullable(),
      /** Present once the question is closed/revealed. */
      reveal: RevealViewSchema.nullable(),
    })
    .nullable(),
  myParticipation: z
    .object({
      participantId: UuidSchema,
      eligibleFromPosition: z.number().int().positive(),
      answers: z.array(MyAnswerViewSchema),
    })
    .nullable(),
  result: SessionResultViewSchema.nullable(),
});
export type SessionSnapshot = z.infer<typeof SessionSnapshotSchema>;

export const JoinSessionInputSchema = z
  .object({
    /** Returned by a previous join on this device; proves ownership of the participation on reconnect. */
    participationToken: z.string().min(16).max(256).optional(),
  })
  .strict();

export const JoinSessionResponseSchema = z.object({
  participantId: UuidSchema,
  participationToken: z.string(),
  eligibleFromPosition: z.number().int().positive(),
  resumed: z.boolean(),
  snapshot: SessionSnapshotSchema,
});
export type JoinSessionResponse = z.infer<typeof JoinSessionResponseSchema>;

export const AnswerSubmitInputSchema = z
  .object({
    sessionQuestionId: UuidSchema,
    optionId: UuidSchema,
    /** Client-generated UUID; the same key always returns the same receipt. */
    idempotencyKey: UuidSchema,
    participationToken: z.string().min(16).max(256),
    /** Diagnostics only. Never used for scoring. */
    clientSentAt: IsoDateTimeSchema.optional(),
    clientRttMs: z.number().int().nonnegative().max(60_000).optional(),
  })
  // Unknown fields such as clientScore / clientTimestamp are stripped, never trusted.
  .strip();
export type AnswerSubmitInput = z.infer<typeof AnswerSubmitInputSchema>;

export const AnswerReceiptSchema = z.object({
  status: z.literal('accepted'),
  receiptId: UuidSchema,
  sessionQuestionId: UuidSchema,
  position: z.number().int().positive(),
  optionId: UuidSchema,
  receivedAt: IsoDateTimeSchema,
  /** True when this call matched an earlier accepted receipt (idempotent replay). */
  replayed: z.boolean(),
});
export type AnswerReceipt = z.infer<typeof AnswerReceiptSchema>;

export const AnswerRejectedSchema = z.object({
  status: z.literal('rejected'),
  code: ErrorCodeSchema,
  message: z.string(),
});

export const SessionResultResponseSchema = z.object({
  result: SessionResultViewSchema,
});
