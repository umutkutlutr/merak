/**
 * Application schema (PostgreSQL schema `app`). Owned by the `app_api` role.
 * Module ownership is annotated per table; cross-module writes go through the owning service.
 *
 * Privacy levels: P0 public-ish (published content), P1 per-user private, P2 server-only secret
 * (answer keys, participation token hashes). P2 rows are never serialised to clients.
 */
import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

export const app = pgSchema('app');

// ---------- enums ----------
export const userRoleEnum = app.enum('user_role', ['member', 'editor', 'admin']);
export const reviewStatusEnum = app.enum('review_status', [
  'draft',
  'review',
  'approved',
  'published',
  'rejected',
  'archived',
]);
export const productionMethodEnum = app.enum('production_method', [
  'human',
  'ai_assisted',
  'ai_generated',
  'seed_sample',
]);
export const languageEnum = app.enum('language', ['tr', 'en']);
export const contentKindEnum = app.enum('content_kind', ['card', 'radar_pick']);
export const mediaTypeEnum = app.enum('media_type', ['book', 'film']);
export const quizSessionStatusEnum = app.enum('quiz_session_status', [
  'draft',
  'scheduled',
  'lobby',
  'live',
  'completed',
  'cancelled',
]);
export const sessionQuestionStatusEnum = app.enum('session_question_status', [
  'pending',
  'open',
  'closed',
  'revealed',
]);
export const cancelReasonEnum = app.enum('cancel_reason', [
  'admin_cancelled',
  'server_restart',
  'missed_start',
  'question_approval_withdrawn',
  'question_revision_changed',
]);
export const analyticsProducerEnum = app.enum('analytics_producer', ['server', 'client']);
export const xpReasonEnum = app.enum('xp_reason', ['content_completed']);

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
const createdAt = () => ts('created_at').notNull().defaultNow();
const updatedAt = () => ts('updated_at').notNull().defaultNow();

// ---------- profiles (owner: profiles) — P1 ----------
export const profiles = app.table(
  'profiles',
  {
    /** = auth.users.id (Supabase). No FK: the API role has no access to the auth schema by design. */
    id: uuid('id').primaryKey(),
    username: text('username').notNull(),
    displayName: text('display_name').notNull(),
    role: userRoleEnum('role').notNull().default('member'),
    interests: text('interests').array().notNull().default(sql`'{}'::text[]`),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique('profiles_username_key').on(t.username)],
);

// ---------- topics (owner: editorial-content) — P0 ----------
export const topics = app.table(
  'topics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [unique('topics_slug_key').on(t.slug)],
);

// ---------- content items + revisions (owner: editorial-content) — P0 when published ----------
export const contentItems = app.table(
  'content_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    kind: contentKindEnum('kind').notNull(),
    topicId: uuid('topic_id')
      .notNull()
      .references(() => topics.id),
    status: reviewStatusEnum('status').notNull().default('draft'),
    currentRevisionId: uuid('current_revision_id').references((): AnyPgColumn => contentRevisions.id),
    /** The immutable revision users see. Null unless status = published. */
    publishedRevisionId: uuid('published_revision_id').references((): AnyPgColumn => contentRevisions.id),
    reviewedBy: uuid('reviewed_by').references(() => profiles.id),
    reviewedAt: ts('reviewed_at'),
    reviewNote: text('review_note'),
    isSeedSample: boolean('is_seed_sample').notNull().default(false),
    createdBy: uuid('created_by').references(() => profiles.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique('content_items_slug_key').on(t.slug),
    index('content_items_status_kind_idx').on(t.status, t.kind),
    index('content_items_topic_idx').on(t.topicId),
  ],
);

export const contentRevisions = app.table(
  'content_revisions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contentItemId: uuid('content_item_id')
      .notNull()
      .references(() => contentItems.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    body: text('body').notNull(),
    readingMinutes: integer('reading_minutes'),
    mediaType: mediaTypeEnum('media_type'),
    creator: text('creator'),
    year: integer('year'),
    whyRecommended: text('why_recommended'),
    sourceUrl: text('source_url'),
    sourceTitle: text('source_title'),
    sourceVerified: boolean('source_verified').notNull().default(false),
    language: languageEnum('language').notNull().default('tr'),
    productionMethod: productionMethodEnum('production_method').notNull().default('human'),
    createdBy: uuid('created_by').references(() => profiles.id),
    createdAt: createdAt(),
  },
  (t) => [unique('content_revisions_item_version_key').on(t.contentItemId, t.version)],
);

// ---------- learning progress (owner: learning-progress) — P1 ----------
export const savedItems = app.table(
  'saved_items',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    contentItemId: uuid('content_item_id')
      .notNull()
      .references(() => contentItems.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ name: 'saved_items_pkey', columns: [t.userId, t.contentItemId] })],
);

export const learningCompletions = app.table(
  'learning_completions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    contentItemId: uuid('content_item_id')
      .notNull()
      .references(() => contentItems.id, { onDelete: 'cascade' }),
    completedAt: ts('completed_at').notNull(),
    xpAwarded: integer('xp_awarded').notNull(),
  },
  (t) => [
    unique('learning_completions_user_item_key').on(t.userId, t.contentItemId),
    index('learning_completions_user_time_idx').on(t.userId, t.completedAt),
  ],
);

/** Canonical XP ledger. Totals are SUM(amount); never written by the quiz modules. */
export const learningXpEvents = app.table(
  'learning_xp_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
    reason: xpReasonEnum('reason').notNull(),
    refId: uuid('ref_id').notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    unique('learning_xp_events_user_reason_ref_key').on(t.userId, t.reason, t.refId),
    index('learning_xp_events_user_idx').on(t.userId),
  ],
);

export const dailyTaskCompletions = app.table(
  'daily_task_completions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    taskKey: text('task_key').notNull(),
    /** Europe/Istanbul calendar date */
    localDate: date('local_date', { mode: 'string' }).notNull(),
    completedAt: ts('completed_at').notNull(),
  },
  (t) => [unique('daily_task_completions_user_task_date_key').on(t.userId, t.taskKey, t.localDate)],
);

// ---------- question bank (owner: question-bank) — revisions P0 after reveal; keys P2 ----------
export const questions = app.table(
  'questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    topicId: uuid('topic_id')
      .notNull()
      .references(() => topics.id),
    status: reviewStatusEnum('status').notNull().default('draft'),
    currentRevisionId: uuid('current_revision_id').references((): AnyPgColumn => questionRevisions.id),
    /** Set on approve/publish; cleared whenever a new revision is created. */
    approvedRevisionId: uuid('approved_revision_id').references((): AnyPgColumn => questionRevisions.id),
    reviewedBy: uuid('reviewed_by').references(() => profiles.id),
    reviewedAt: ts('reviewed_at'),
    reviewNote: text('review_note'),
    relatedContentItemId: uuid('related_content_item_id').references(() => contentItems.id),
    isSeedSample: boolean('is_seed_sample').notNull().default(false),
    createdBy: uuid('created_by').references(() => profiles.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('questions_status_idx').on(t.status), index('questions_topic_idx').on(t.topicId)],
);

export const questionRevisions = app.table(
  'question_revisions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    prompt: text('prompt').notNull(),
    explanation: text('explanation').notNull(),
    sourceUrl: text('source_url'),
    sourceTitle: text('source_title'),
    sourceVerified: boolean('source_verified').notNull().default(false),
    language: languageEnum('language').notNull().default('tr'),
    productionMethod: productionMethodEnum('production_method').notNull().default('human'),
    createdBy: uuid('created_by').references(() => profiles.id),
    createdAt: createdAt(),
  },
  (t) => [unique('question_revisions_question_version_key').on(t.questionId, t.version)],
);

export const questionOptions = app.table(
  'question_options',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionRevisionId: uuid('question_revision_id')
      .notNull()
      .references(() => questionRevisions.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    position: integer('position').notNull(),
  },
  (t) => [unique('question_options_revision_position_key').on(t.questionRevisionId, t.position)],
);

/** P2 — server-only answer key. Never joined into client-facing mappers. */
export const questionAnswerKeys = app.table('question_answer_keys', {
  questionRevisionId: uuid('question_revision_id')
    .primaryKey()
    .references(() => questionRevisions.id, { onDelete: 'cascade' }),
  correctOptionId: uuid('correct_option_id')
    .notNull()
    .references(() => questionOptions.id),
});

// ---------- live quiz (owner: live-quiz) ----------
export const quizSessions = app.table(
  'quiz_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    status: quizSessionStatusEnum('status').notNull().default('draft'),
    isTest: boolean('is_test').notNull().default(true),
    prizeMode: text('prize_mode').notNull().default('none'),
    scheduledStartAt: ts('scheduled_start_at').notNull(),
    lobbyOpensAt: ts('lobby_opens_at').notNull(),
    rulesVersion: text('rules_version').notNull(),
    /** Immutable snapshot of the rules used by this session (durations, points). */
    rules: jsonb('rules').notNull(),
    questionCount: integer('question_count').notNull(),
    stateVersion: integer('state_version').notNull().default(0),
    currentQuestionPosition: integer('current_question_position'),
    cancelledReason: cancelReasonEnum('cancelled_reason'),
    cancelDetail: text('cancel_detail'),
    cancelledAt: ts('cancelled_at'),
    cancelledBy: uuid('cancelled_by').references(() => profiles.id),
    startedAt: ts('started_at'),
    completedAt: ts('completed_at'),
    createdBy: uuid('created_by').references(() => profiles.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('quiz_sessions_status_start_idx').on(t.status, t.scheduledStartAt)],
);

export const sessionQuestions = app.table(
  'session_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => quizSessions.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id),
    /** Pinned at scheduling time; later edits create new revisions and never touch this row. */
    questionRevisionId: uuid('question_revision_id')
      .notNull()
      .references(() => questionRevisions.id),
    status: sessionQuestionStatusEnum('status').notNull().default('pending'),
    opensAt: ts('opens_at'),
    closesAt: ts('closes_at'),
    closedAt: ts('closed_at'),
    revealedAt: ts('revealed_at'),
  },
  (t) => [
    unique('session_questions_session_position_key').on(t.sessionId, t.position),
    unique('session_questions_session_question_key').on(t.sessionId, t.questionId),
    index('session_questions_status_idx').on(t.status),
  ],
);

export const sessionParticipants = app.table(
  'session_participants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => quizSessions.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id),
    /** P2: sha256 of the participation token handed to the joining device. */
    participationTokenHash: text('participation_token_hash').notNull(),
    /** First question position this participant may answer (late-join rule). */
    eligibleFromPosition: integer('eligible_from_position').notNull().default(1),
    joinedAt: ts('joined_at').notNull(),
    lastSeenAt: ts('last_seen_at').notNull(),
  },
  (t) => [
    unique('session_participants_session_user_key').on(t.sessionId, t.userId),
    index('session_participants_session_idx').on(t.sessionId),
  ],
);

/** Accepted answers only. Rejected attempts are never persisted here (they must not consume the answer right). */
export const answerReceipts = app.table(
  'answer_receipts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => quizSessions.id, { onDelete: 'cascade' }),
    sessionQuestionId: uuid('session_question_id')
      .notNull()
      .references(() => sessionQuestions.id, { onDelete: 'cascade' }),
    participantId: uuid('participant_id')
      .notNull()
      .references(() => sessionParticipants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id),
    optionId: uuid('option_id')
      .notNull()
      .references(() => questionOptions.id),
    idempotencyKey: uuid('idempotency_key').notNull(),
    /** Trusted server receipt time (API process clock), captured before any processing. */
    receivedAt: ts('received_at').notNull(),
    elapsedMs: integer('elapsed_ms').notNull(),
    isCorrect: boolean('is_correct').notNull(),
    points: integer('points').notNull(),
    /** Diagnostics only — client claims, never used for scoring. */
    clientSentAt: ts('client_sent_at'),
    clientRttMs: integer('client_rtt_ms'),
    createdAt: createdAt(),
  },
  (t) => [
    unique('answer_receipts_question_participant_key').on(t.sessionQuestionId, t.participantId),
    unique('answer_receipts_participant_idem_key').on(t.participantId, t.idempotencyKey),
    index('answer_receipts_session_participant_idx').on(t.sessionId, t.participantId),
  ],
);

/** Canonical per-session result rows, recomputable from answer_receipts. Owner: scoring-results. */
export const sessionResults = app.table(
  'session_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => quizSessions.id, { onDelete: 'cascade' }),
    participantId: uuid('participant_id')
      .notNull()
      .references(() => sessionParticipants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id),
    correctCount: integer('correct_count').notNull(),
    totalPoints: integer('total_points').notNull(),
    answeredCount: integer('answered_count').notNull(),
    rank: integer('rank').notNull(),
    lastAnswerAt: ts('last_answer_at'),
    rulesVersion: text('rules_version').notNull(),
    computedAt: ts('computed_at').notNull(),
  },
  (t) => [
    unique('session_results_session_participant_key').on(t.sessionId, t.participantId),
    index('session_results_user_idx').on(t.userId),
  ],
);

// ---------- analytics (owner: analytics) — P1 ----------
export const analyticsEvents = app.table(
  'analytics_events',
  {
    /** Producer-generated event id; duplicates are dropped. */
    id: uuid('id').primaryKey(),
    schemaVersion: integer('schema_version').notNull(),
    eventName: text('event_name').notNull(),
    eventTime: ts('event_time').notNull(),
    receivedAt: ts('received_at').notNull().defaultNow(),
    producer: analyticsProducerEnum('producer').notNull(),
    userId: uuid('user_id'),
    quizSessionId: uuid('quiz_session_id'),
    contentItemId: uuid('content_item_id'),
    props: jsonb('props'),
  },
  (t) => [
    index('analytics_events_name_time_idx').on(t.eventName, t.eventTime),
    index('analytics_events_user_time_idx').on(t.userId, t.eventTime),
  ],
);

// ---------- admin audit (owner: admin-audit) — P1 ----------
export const adminAuditLog = app.table(
  'admin_audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorUserId: uuid('actor_user_id').references(() => profiles.id),
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id'),
    reason: text('reason'),
    metadata: jsonb('metadata'),
    createdAt: createdAt(),
  },
  (t) => [index('admin_audit_log_created_idx').on(t.createdAt)],
);

export type DbSchema = {
  profiles: typeof profiles;
  topics: typeof topics;
  contentItems: typeof contentItems;
  contentRevisions: typeof contentRevisions;
  savedItems: typeof savedItems;
  learningCompletions: typeof learningCompletions;
  learningXpEvents: typeof learningXpEvents;
  dailyTaskCompletions: typeof dailyTaskCompletions;
  questions: typeof questions;
  questionRevisions: typeof questionRevisions;
  questionOptions: typeof questionOptions;
  questionAnswerKeys: typeof questionAnswerKeys;
  quizSessions: typeof quizSessions;
  sessionQuestions: typeof sessionQuestions;
  sessionParticipants: typeof sessionParticipants;
  answerReceipts: typeof answerReceipts;
  sessionResults: typeof sessionResults;
  analyticsEvents: typeof analyticsEvents;
  adminAuditLog: typeof adminAuditLog;
};
