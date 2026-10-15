import { randomInt } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import type { Profile, UpdateProfileInput, UserRole } from '@merak/contracts';
import { DB } from '../../db/db.module.js';
import type { Db, DbOrTx } from '../../db/client.js';
import { learningXpEvents, profiles } from '../../db/schema/index.js';
import { AppError, isPgUniqueViolation } from '../../common/errors.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import type { AuthUser } from '../identity/jwt-verifier.js';

/**
 * Default public name for a new profile. Usernames appear on other players' leaderboards, so the default
 * never derives from the e-mail address (KVKK: no personal data shown to others without a choice). The
 * user picks a real name later with PATCH /me.
 */
function usernameCandidate(): string {
  return `oyuncu_${randomInt(0, 36 ** 6).toString(36).padStart(6, '0')}`;
}

@Injectable()
export class ProfilesService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly analytics: AnalyticsService,
  ) {}

  async getRole(userId: string): Promise<UserRole | null> {
    const [row] = await this.db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);
    return row?.role ?? null;
  }

  async findById(userId: string, tx: DbOrTx = this.db): Promise<Profile | null> {
    const [row] = await tx.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
    if (!row) return null;
    const xp = await this.learningXpTotal(userId, tx);
    return this.toProfile(row, xp);
  }

  /** Creates the profile on first authenticated call. Returns { created: true } exactly once. */
  async ensureProfile(auth: AuthUser): Promise<{ profile: Profile; created: boolean }> {
    const existing = await this.findById(auth.userId);
    if (existing) return { profile: existing, created: false };

    for (let attempt = 0; attempt < 6; attempt++) {
      const username = usernameCandidate();
      try {
        const created = await this.db.transaction(async (tx) => {
          const inserted = await tx
            .insert(profiles)
            .values({ id: auth.userId, username, displayName: username })
            .onConflictDoNothing({ target: profiles.id })
            .returning();
          if (inserted.length === 0) return null; // raced: another request created it
          await this.analytics.recordServerEvent(
            { eventName: 'signup_completed', userId: auth.userId },
            tx,
          );
          return inserted[0]!;
        });
        if (created) return { profile: this.toProfile(created, 0), created: true };
        const raced = await this.findById(auth.userId);
        if (raced) return { profile: raced, created: false };
      } catch (err) {
        if (isPgUniqueViolation(err, 'profiles_username_key')) continue; // try another username
        throw err;
      }
    }
    throw new AppError('INTERNAL', 'Kullanıcı adı üretilemedi.');
  }

  async update(userId: string, input: UpdateProfileInput): Promise<Profile> {
    const patch: Partial<typeof profiles.$inferInsert> = { updatedAt: new Date() };
    if (input.username !== undefined) patch.username = input.username;
    if (input.displayName !== undefined) patch.displayName = input.displayName;
    if (input.interests !== undefined) patch.interests = input.interests;
    try {
      const [row] = await this.db.update(profiles).set(patch).where(eq(profiles.id, userId)).returning();
      if (!row) throw new AppError('NOT_FOUND');
      return this.toProfile(row, await this.learningXpTotal(userId));
    } catch (err) {
      if (isPgUniqueViolation(err, 'profiles_username_key')) throw new AppError('USERNAME_TAKEN');
      throw err;
    }
  }

  async learningXpTotal(userId: string, tx: DbOrTx = this.db): Promise<number> {
    const [row] = await tx
      .select({ total: sql<number>`coalesce(sum(${learningXpEvents.amount}), 0)::int` })
      .from(learningXpEvents)
      .where(eq(learningXpEvents.userId, userId));
    return Number(row?.total ?? 0);
  }

  private toProfile(row: typeof profiles.$inferSelect, learningXpTotal: number): Profile {
    return {
      id: row.id,
      username: row.username,
      displayName: row.displayName,
      role: row.role,
      interests: row.interests,
      learningXpTotal,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
