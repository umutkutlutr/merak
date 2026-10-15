-- Privileges: the app schema is private to the API role. Supabase Data API roles (anon,
-- authenticated, service_role) and PUBLIC get nothing, even if the schema were ever exposed.
-- RLS is enabled on every table as defense in depth (no policies => deny for non-owners).
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated', 'service_role', 'PUBLIC'] LOOP
    IF r = 'PUBLIC' OR EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA app FROM %s', r);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA app FROM %s', r);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA app FROM %s', r);
    END IF;
  END LOOP;
END $$;
--> statement-breakpoint
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'app' LOOP
    EXECUTE format('ALTER TABLE app.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;
--> statement-breakpoint
ALTER TABLE "app"."answer_receipts" ADD CONSTRAINT "answer_receipts_points_range" CHECK ("points" >= 0 AND "points" <= 100);
--> statement-breakpoint
ALTER TABLE "app"."answer_receipts" ADD CONSTRAINT "answer_receipts_elapsed_nonneg" CHECK ("elapsed_ms" >= 0);
--> statement-breakpoint
ALTER TABLE "app"."session_questions" ADD CONSTRAINT "session_questions_position_positive" CHECK ("position" >= 1);
--> statement-breakpoint
ALTER TABLE "app"."session_questions" ADD CONSTRAINT "session_questions_window" CHECK ("closes_at" IS NULL OR "opens_at" IS NULL OR "closes_at" > "opens_at");
--> statement-breakpoint
ALTER TABLE "app"."quiz_sessions" ADD CONSTRAINT "quiz_sessions_question_count_positive" CHECK ("question_count" >= 1);
--> statement-breakpoint
ALTER TABLE "app"."quiz_sessions" ADD CONSTRAINT "quiz_sessions_m0_prizeless" CHECK ("prize_mode" = 'none' AND "is_test" = true);
--> statement-breakpoint
ALTER TABLE "app"."session_participants" ADD CONSTRAINT "session_participants_eligible_positive" CHECK ("eligible_from_position" >= 1);
--> statement-breakpoint
ALTER TABLE "app"."learning_xp_events" ADD CONSTRAINT "learning_xp_events_amount_positive" CHECK ("amount" > 0);
--> statement-breakpoint
ALTER TABLE "app"."session_results" ADD CONSTRAINT "session_results_rank_positive" CHECK ("rank" >= 1);
