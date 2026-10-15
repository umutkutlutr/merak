-- M0 closeout. (1) A question's topic and related card are approved with its text, so they live on the
-- immutable revision a session pins; editing the working copy on `questions` cannot change a pinned session.
-- (2) Every approval records whether a person reviewed it or a test/demo shortcut approved it.
ALTER TABLE "app"."question_revisions" ADD COLUMN "topic_id" uuid;--> statement-breakpoint
ALTER TABLE "app"."question_revisions" ADD COLUMN "related_content_item_id" uuid;--> statement-breakpoint
UPDATE "app"."question_revisions" r SET "topic_id" = q."topic_id", "related_content_item_id" = q."related_content_item_id" FROM "app"."questions" q WHERE q."id" = r."question_id";--> statement-breakpoint
ALTER TABLE "app"."question_revisions" ALTER COLUMN "topic_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."question_revisions" ADD CONSTRAINT "question_revisions_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "app"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."question_revisions" ADD CONSTRAINT "question_revisions_related_content_item_id_content_items_id_fk" FOREIGN KEY ("related_content_item_id") REFERENCES "app"."content_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."questions" ADD COLUMN "approval_kind" text;--> statement-breakpoint
-- Existing local approvals: the bulk button and demo scripts always wrote a 'TEST ONAYI' note; anything else
-- was a single approval by a signed-in editor.
UPDATE "app"."questions" SET "approval_kind" = CASE WHEN "review_note" ILIKE 'TEST ONAYI%' THEN 'automated_test' ELSE 'editor_review' END WHERE "approved_revision_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."questions" ADD CONSTRAINT "questions_approval_kind_check" CHECK ("approval_kind" IN ('editor_review', 'automated_test') AND "approved_revision_id" IS NOT NULL OR "approval_kind" IS NULL AND "approved_revision_id" IS NULL);
