import { z } from 'zod';
import { IsoDateTimeSchema, UserRoleSchema, UuidSchema } from './common.js';

export const UsernameSchema = z
  .string()
  .min(3)
  .max(24)
  .regex(/^[a-z0-9_]+$/, 'Küçük harf, rakam ve alt çizgi kullan.');

export const ProfileSchema = z.object({
  id: UuidSchema,
  username: UsernameSchema,
  displayName: z.string().min(1).max(60),
  role: UserRoleSchema,
  interests: z.array(z.string().min(1).max(40)).max(10),
  learningXpTotal: z.number().int().nonnegative(),
  createdAt: IsoDateTimeSchema,
});
export type Profile = z.infer<typeof ProfileSchema>;

export const UpdateProfileInputSchema = z
  .object({
    username: UsernameSchema.optional(),
    displayName: z.string().min(1).max(60).optional(),
    interests: z.array(z.string().min(1).max(40)).max(10).optional(),
  })
  .strict();
export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;

export const MeResponseSchema = z.object({
  profile: ProfileSchema,
  /** true when this request created the profile (first login). */
  created: z.boolean(),
});
export type MeResponse = z.infer<typeof MeResponseSchema>;
