import { z } from 'zod';
import { ContentCardSummarySchema } from './content.js';

export const DailyTaskSchema = z.object({
  key: z.literal('complete_3_distinct'),
  title: z.string(),
  /** Local date in Europe/Istanbul, YYYY-MM-DD */
  localDate: z.string(),
  target: z.number().int().positive(),
  progress: z.number().int().nonnegative(),
  completed: z.boolean(),
});
export type DailyTask = z.infer<typeof DailyTaskSchema>;

export const LearningProgressSchema = z.object({
  learningXpTotal: z.number().int().nonnegative(),
  completedCount: z.number().int().nonnegative(),
  savedCount: z.number().int().nonnegative(),
  dailyTask: DailyTaskSchema,
});
export type LearningProgress = z.infer<typeof LearningProgressSchema>;

export const SavedItemsResponseSchema = z.object({
  items: z.array(ContentCardSummarySchema),
});
