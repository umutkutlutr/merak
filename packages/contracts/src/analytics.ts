import { z } from 'zod';
import { IsoDateTimeSchema, UuidSchema } from './common.js';

export const AnalyticsEventNameSchema = z.enum([
  'signup_completed',
  'content_opened',
  'content_completed',
  'content_saved',
  'daily_task_completed',
  'quiz_joined',
  'answer_accepted',
  'quiz_completed',
  'quiz_to_content_opened',
  'connection_interrupted',
  'state_resynced',
]);
export type AnalyticsEventName = z.infer<typeof AnalyticsEventNameSchema>;

/** Events a client may report about itself. Everything else is server-produced. */
export const ClientAnalyticsEventNameSchema = z.enum([
  'content_opened',
  'quiz_to_content_opened',
  'connection_interrupted',
  'state_resynced',
]);
export type ClientAnalyticsEventName = z.infer<typeof ClientAnalyticsEventNameSchema>;

export const ANALYTICS_SCHEMA_VERSION = 1;

export const ClientAnalyticsEventInputSchema = z
  .object({
    eventId: UuidSchema,
    schemaVersion: z.literal(ANALYTICS_SCHEMA_VERSION),
    eventName: ClientAnalyticsEventNameSchema,
    eventTime: IsoDateTimeSchema,
    contentItemId: UuidSchema.optional(),
    quizSessionId: UuidSchema.optional(),
    /** Small, non-personal bag. Server rejects keys that look like tokens/emails. */
    props: z.record(z.string().max(40), z.union([z.string().max(200), z.number(), z.boolean()])).optional(),
  })
  .strict();
export type ClientAnalyticsEventInput = z.infer<typeof ClientAnalyticsEventInputSchema>;

export const ClientAnalyticsBatchSchema = z.object({
  events: z.array(ClientAnalyticsEventInputSchema).min(1).max(50),
});

export const AnalyticsIngestResponseSchema = z.object({
  accepted: z.number().int().nonnegative(),
  duplicates: z.number().int().nonnegative(),
});
