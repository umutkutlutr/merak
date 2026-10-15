CREATE SCHEMA IF NOT EXISTS "app";
--> statement-breakpoint
CREATE TYPE "app"."analytics_producer" AS ENUM('server', 'client');--> statement-breakpoint
CREATE TYPE "app"."cancel_reason" AS ENUM('admin_cancelled', 'server_restart', 'missed_start', 'question_approval_withdrawn', 'question_revision_changed');--> statement-breakpoint
CREATE TYPE "app"."content_kind" AS ENUM('card', 'radar_pick');--> statement-breakpoint
CREATE TYPE "app"."language" AS ENUM('tr', 'en');--> statement-breakpoint
CREATE TYPE "app"."media_type" AS ENUM('book', 'film');--> statement-breakpoint
CREATE TYPE "app"."production_method" AS ENUM('human', 'ai_assisted', 'ai_generated', 'seed_sample');--> statement-breakpoint
CREATE TYPE "app"."quiz_session_status" AS ENUM('draft', 'scheduled', 'lobby', 'live', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "app"."review_status" AS ENUM('draft', 'review', 'approved', 'published', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "app"."session_question_status" AS ENUM('pending', 'open', 'closed', 'revealed');--> statement-breakpoint
CREATE TYPE "app"."user_role" AS ENUM('member', 'editor', 'admin');--> statement-breakpoint
CREATE TYPE "app"."xp_reason" AS ENUM('content_completed');--> statement-breakpoint
CREATE TABLE "app"."admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"reason" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."analytics_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"schema_version" integer NOT NULL,
	"event_name" text NOT NULL,
	"event_time" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"producer" "app"."analytics_producer" NOT NULL,
	"user_id" uuid,
	"quiz_session_id" uuid,
	"content_item_id" uuid,
	"props" jsonb
);
--> statement-breakpoint
CREATE TABLE "app"."answer_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"session_question_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"elapsed_ms" integer NOT NULL,
	"is_correct" boolean NOT NULL,
	"points" integer NOT NULL,
	"client_sent_at" timestamp with time zone,
	"client_rtt_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "answer_receipts_question_participant_key" UNIQUE("session_question_id","participant_id"),
	CONSTRAINT "answer_receipts_participant_idem_key" UNIQUE("participant_id","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "app"."content_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"kind" "app"."content_kind" NOT NULL,
	"topic_id" uuid NOT NULL,
	"status" "app"."review_status" DEFAULT 'draft' NOT NULL,
	"current_revision_id" uuid,
	"published_revision_id" uuid,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"is_seed_sample" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_items_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "app"."content_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_item_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"body" text NOT NULL,
	"reading_minutes" integer,
	"media_type" "app"."media_type",
	"creator" text,
	"year" integer,
	"why_recommended" text,
	"source_url" text,
	"source_title" text,
	"source_verified" boolean DEFAULT false NOT NULL,
	"language" "app"."language" DEFAULT 'tr' NOT NULL,
	"production_method" "app"."production_method" DEFAULT 'human' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_revisions_item_version_key" UNIQUE("content_item_id","version")
);
--> statement-breakpoint
CREATE TABLE "app"."daily_task_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"task_key" text NOT NULL,
	"local_date" date NOT NULL,
	"completed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "daily_task_completions_user_task_date_key" UNIQUE("user_id","task_key","local_date")
);
--> statement-breakpoint
CREATE TABLE "app"."learning_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content_item_id" uuid NOT NULL,
	"completed_at" timestamp with time zone NOT NULL,
	"xp_awarded" integer NOT NULL,
	CONSTRAINT "learning_completions_user_item_key" UNIQUE("user_id","content_item_id")
);
--> statement-breakpoint
CREATE TABLE "app"."learning_xp_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"reason" "app"."xp_reason" NOT NULL,
	"ref_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_xp_events_user_reason_ref_key" UNIQUE("user_id","reason","ref_id")
);
--> statement-breakpoint
CREATE TABLE "app"."profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"role" "app"."user_role" DEFAULT 'member' NOT NULL,
	"interests" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_username_key" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "app"."question_answer_keys" (
	"question_revision_id" uuid PRIMARY KEY NOT NULL,
	"correct_option_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."question_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_revision_id" uuid NOT NULL,
	"label" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "question_options_revision_position_key" UNIQUE("question_revision_id","position")
);
--> statement-breakpoint
CREATE TABLE "app"."question_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"prompt" text NOT NULL,
	"explanation" text NOT NULL,
	"source_url" text,
	"source_title" text,
	"source_verified" boolean DEFAULT false NOT NULL,
	"language" "app"."language" DEFAULT 'tr' NOT NULL,
	"production_method" "app"."production_method" DEFAULT 'human' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "question_revisions_question_version_key" UNIQUE("question_id","version")
);
--> statement-breakpoint
CREATE TABLE "app"."questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"status" "app"."review_status" DEFAULT 'draft' NOT NULL,
	"current_revision_id" uuid,
	"approved_revision_id" uuid,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"related_content_item_id" uuid,
	"is_seed_sample" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."quiz_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"status" "app"."quiz_session_status" DEFAULT 'draft' NOT NULL,
	"is_test" boolean DEFAULT true NOT NULL,
	"prize_mode" text DEFAULT 'none' NOT NULL,
	"scheduled_start_at" timestamp with time zone NOT NULL,
	"lobby_opens_at" timestamp with time zone NOT NULL,
	"rules_version" text NOT NULL,
	"rules" jsonb NOT NULL,
	"question_count" integer NOT NULL,
	"state_version" integer DEFAULT 0 NOT NULL,
	"current_question_position" integer,
	"cancelled_reason" "app"."cancel_reason",
	"cancel_detail" text,
	"cancelled_at" timestamp with time zone,
	"cancelled_by" uuid,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."saved_items" (
	"user_id" uuid NOT NULL,
	"content_item_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_items_pkey" PRIMARY KEY("user_id","content_item_id")
);
--> statement-breakpoint
CREATE TABLE "app"."session_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"participation_token_hash" text NOT NULL,
	"eligible_from_position" integer DEFAULT 1 NOT NULL,
	"joined_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL,
	CONSTRAINT "session_participants_session_user_key" UNIQUE("session_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "app"."session_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"question_id" uuid NOT NULL,
	"question_revision_id" uuid NOT NULL,
	"status" "app"."session_question_status" DEFAULT 'pending' NOT NULL,
	"opens_at" timestamp with time zone,
	"closes_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"revealed_at" timestamp with time zone,
	CONSTRAINT "session_questions_session_position_key" UNIQUE("session_id","position"),
	CONSTRAINT "session_questions_session_question_key" UNIQUE("session_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "app"."session_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"correct_count" integer NOT NULL,
	"total_points" integer NOT NULL,
	"answered_count" integer NOT NULL,
	"rank" integer NOT NULL,
	"last_answer_at" timestamp with time zone,
	"rules_version" text NOT NULL,
	"computed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "session_results_session_participant_key" UNIQUE("session_id","participant_id")
);
--> statement-breakpoint
CREATE TABLE "app"."topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "topics_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "app"."admin_audit_log" ADD CONSTRAINT "admin_audit_log_actor_user_id_profiles_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."answer_receipts" ADD CONSTRAINT "answer_receipts_session_id_quiz_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "app"."quiz_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."answer_receipts" ADD CONSTRAINT "answer_receipts_session_question_id_session_questions_id_fk" FOREIGN KEY ("session_question_id") REFERENCES "app"."session_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."answer_receipts" ADD CONSTRAINT "answer_receipts_participant_id_session_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "app"."session_participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."answer_receipts" ADD CONSTRAINT "answer_receipts_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."answer_receipts" ADD CONSTRAINT "answer_receipts_option_id_question_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "app"."question_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."content_items" ADD CONSTRAINT "content_items_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "app"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."content_items" ADD CONSTRAINT "content_items_current_revision_id_content_revisions_id_fk" FOREIGN KEY ("current_revision_id") REFERENCES "app"."content_revisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."content_items" ADD CONSTRAINT "content_items_published_revision_id_content_revisions_id_fk" FOREIGN KEY ("published_revision_id") REFERENCES "app"."content_revisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."content_items" ADD CONSTRAINT "content_items_reviewed_by_profiles_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."content_items" ADD CONSTRAINT "content_items_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."content_revisions" ADD CONSTRAINT "content_revisions_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "app"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."content_revisions" ADD CONSTRAINT "content_revisions_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."daily_task_completions" ADD CONSTRAINT "daily_task_completions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."learning_completions" ADD CONSTRAINT "learning_completions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."learning_completions" ADD CONSTRAINT "learning_completions_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "app"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."learning_xp_events" ADD CONSTRAINT "learning_xp_events_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."question_answer_keys" ADD CONSTRAINT "question_answer_keys_question_revision_id_question_revisions_id_fk" FOREIGN KEY ("question_revision_id") REFERENCES "app"."question_revisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."question_answer_keys" ADD CONSTRAINT "question_answer_keys_correct_option_id_question_options_id_fk" FOREIGN KEY ("correct_option_id") REFERENCES "app"."question_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."question_options" ADD CONSTRAINT "question_options_question_revision_id_question_revisions_id_fk" FOREIGN KEY ("question_revision_id") REFERENCES "app"."question_revisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."question_revisions" ADD CONSTRAINT "question_revisions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "app"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."question_revisions" ADD CONSTRAINT "question_revisions_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."questions" ADD CONSTRAINT "questions_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "app"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."questions" ADD CONSTRAINT "questions_current_revision_id_question_revisions_id_fk" FOREIGN KEY ("current_revision_id") REFERENCES "app"."question_revisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."questions" ADD CONSTRAINT "questions_approved_revision_id_question_revisions_id_fk" FOREIGN KEY ("approved_revision_id") REFERENCES "app"."question_revisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."questions" ADD CONSTRAINT "questions_reviewed_by_profiles_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."questions" ADD CONSTRAINT "questions_related_content_item_id_content_items_id_fk" FOREIGN KEY ("related_content_item_id") REFERENCES "app"."content_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."questions" ADD CONSTRAINT "questions_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."quiz_sessions" ADD CONSTRAINT "quiz_sessions_cancelled_by_profiles_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."quiz_sessions" ADD CONSTRAINT "quiz_sessions_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."saved_items" ADD CONSTRAINT "saved_items_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."saved_items" ADD CONSTRAINT "saved_items_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "app"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."session_participants" ADD CONSTRAINT "session_participants_session_id_quiz_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "app"."quiz_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."session_participants" ADD CONSTRAINT "session_participants_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."session_questions" ADD CONSTRAINT "session_questions_session_id_quiz_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "app"."quiz_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."session_questions" ADD CONSTRAINT "session_questions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "app"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."session_questions" ADD CONSTRAINT "session_questions_question_revision_id_question_revisions_id_fk" FOREIGN KEY ("question_revision_id") REFERENCES "app"."question_revisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."session_results" ADD CONSTRAINT "session_results_session_id_quiz_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "app"."quiz_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."session_results" ADD CONSTRAINT "session_results_participant_id_session_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "app"."session_participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."session_results" ADD CONSTRAINT "session_results_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_audit_log_created_idx" ON "app"."admin_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "analytics_events_name_time_idx" ON "app"."analytics_events" USING btree ("event_name","event_time");--> statement-breakpoint
CREATE INDEX "analytics_events_user_time_idx" ON "app"."analytics_events" USING btree ("user_id","event_time");--> statement-breakpoint
CREATE INDEX "answer_receipts_session_participant_idx" ON "app"."answer_receipts" USING btree ("session_id","participant_id");--> statement-breakpoint
CREATE INDEX "content_items_status_kind_idx" ON "app"."content_items" USING btree ("status","kind");--> statement-breakpoint
CREATE INDEX "content_items_topic_idx" ON "app"."content_items" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "learning_completions_user_time_idx" ON "app"."learning_completions" USING btree ("user_id","completed_at");--> statement-breakpoint
CREATE INDEX "learning_xp_events_user_idx" ON "app"."learning_xp_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "questions_status_idx" ON "app"."questions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "questions_topic_idx" ON "app"."questions" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "quiz_sessions_status_start_idx" ON "app"."quiz_sessions" USING btree ("status","scheduled_start_at");--> statement-breakpoint
CREATE INDEX "session_participants_session_idx" ON "app"."session_participants" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "session_questions_status_idx" ON "app"."session_questions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "session_results_user_idx" ON "app"."session_results" USING btree ("user_id");