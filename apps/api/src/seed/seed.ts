/**
 * Idempotent local seed. Loads ÖRNEK TEST İÇERİĞİ and local test accounts.
 *  - Refuses to run when NODE_ENV=production.
 *  - Cards/Radar picks are published as seed samples (visible badge; audit action content.seed_publish).
 *  - Questions stay in DRAFT: auto-loading is not editorial approval.
 * Usage: pnpm --filter @merak/api db:seed
 */
import 'reflect-metadata';
process.env.QUIZ_SCHEDULER_ENABLED = 'false';
process.env.LOG_LEVEL = process.env.SEED_LOG_LEVEL ?? 'warn';
import { NestFactory } from '@nestjs/core';
import { and, eq } from 'drizzle-orm';
import { AppModule } from '../app.module.js';
import { getEnv } from '../config/env.js';
import { DB } from '../db/db.module.js';
import type { Db } from '../db/client.js';
import { contentItems, profiles, questionRevisions, questions, topics } from '../db/schema/index.js';
import { AuditService } from '../modules/admin-audit/audit.service.js';
import { ContentService } from '../modules/editorial-content/content.service.js';
import { QuestionsService } from '../modules/question-bank/questions.service.js';
import { SEED_CARDS, SEED_QUESTIONS, SEED_RADAR_PICKS, SEED_TOPICS, SEED_USERS } from './data.js';
import { GoTrueAdmin } from './gotrue-admin.js';

export interface SeedSummary {
  users: { created: number; existing: number };
  topics: number;
  content: { created: number; existing: number };
  questions: { created: number; existing: number };
}

export async function runSeed(opts: { quiet?: boolean } = {}): Promise<SeedSummary> {
  const env = getEnv();
  if (env.NODE_ENV === 'production') throw new Error('Seed refuses to run in production');
  const password = env.SEED_PASSWORD ?? 'Merak-Local-123';
  const log = (msg: string) => {
    if (!opts.quiet) console.log(`[seed] ${msg}`);
  };

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'], abortOnError: false });
  try {
    const db = app.get<Db>(DB);
    const content = app.get(ContentService);
    const questionsSvc = app.get(QuestionsService);
    const audit = app.get(AuditService);

    // ---- users (Supabase Auth admin API) + roles ----
    const gotrue = await GoTrueAdmin.create(env.SUPABASE_AUTH_URL, {
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || undefined,
      jwtSecret: env.SUPABASE_JWT_SECRET,
      issuer: env.AUTH_JWT_ISSUER,
      audience: env.AUTH_JWT_AUDIENCE,
    });
    const users = { created: 0, existing: 0 };
    for (const u of SEED_USERS) {
      const r = await gotrue.ensureUser(u.email, password);
      r.created ? users.created++ : users.existing++;
      await db
        .insert(profiles)
        .values({ id: r.id, username: u.username, displayName: u.displayName, role: u.role })
        .onConflictDoUpdate({ target: profiles.id, set: { role: u.role, updatedAt: new Date() } });
      log(`user ${u.email} (${u.role}) ${r.created ? 'created' : 'exists'}`);
    }

    // ---- topics ----
    for (const t of SEED_TOPICS) {
      await db
        .insert(topics)
        .values({ slug: t.slug, name: t.name, sortOrder: t.sortOrder })
        .onConflictDoUpdate({ target: topics.slug, set: { name: t.name, sortOrder: t.sortOrder } });
    }
    const topicRows = await db.select().from(topics);
    const topicId = (slug: string) => {
      const row = topicRows.find((t) => t.slug === slug);
      if (!row) throw new Error(`topic missing: ${slug}`);
      return row.id;
    };

    // ---- content (cards + radar picks) ----
    const contentStats = { created: 0, existing: 0 };
    for (const c of [...SEED_CARDS, ...SEED_RADAR_PICKS]) {
      const [exists] = await db.select({ id: contentItems.id }).from(contentItems).where(eq(contentItems.slug, c.slug)).limit(1);
      if (exists) {
        contentStats.existing++;
        continue;
      }
      const { topic, slug, ...rest } = c;
      const item = await content.adminCreate(null, { ...rest, slug, topicId: topicId(topic) }, { isSeedSample: true });
      // Seed publish: explicit, audited, and NOT an editorial approval.
      await db.transaction(async (tx) => {
        await tx
          .update(contentItems)
          .set({ status: 'published', publishedRevisionId: item.currentRevision.id, updatedAt: new Date() })
          .where(eq(contentItems.id, item.id));
        await audit.record(
          { actorUserId: null, action: 'content.seed_publish', targetType: 'content_item', targetId: item.id, reason: 'ÖRNEK TEST İÇERİĞİ — yerel seed; editör onayı değildir', metadata: { slug } },
          tx,
        );
      });
      contentStats.created++;
    }
    log(`content: ${contentStats.created} created, ${contentStats.existing} existing`);

    // ---- questions (DRAFT) ----
    const slugToId = new Map((await db.select({ id: contentItems.id, slug: contentItems.slug }).from(contentItems)).map((r) => [r.slug, r.id]));
    const qStats = { created: 0, existing: 0 };
    for (const sq of SEED_QUESTIONS) {
      const [exists] = await db
        .select({ id: questionRevisions.id })
        .from(questionRevisions)
        .innerJoin(questions, eq(questions.id, questionRevisions.questionId))
        .where(and(eq(questionRevisions.prompt, sq.prompt), eq(questionRevisions.version, 1), eq(questions.isSeedSample, true)))
        .limit(1);
      if (exists) {
        qStats.existing++;
        continue;
      }
      const { topic, relatedSlug, ...rest } = sq;
      await questionsSvc.adminCreate(
        null,
        { ...rest, topicId: topicId(topic), relatedContentItemId: relatedSlug ? (slugToId.get(relatedSlug) ?? null) : null },
        { isSeedSample: true },
      );
      qStats.created++;
    }
    log(`questions (draft): ${qStats.created} created, ${qStats.existing} existing`);

    const summary: SeedSummary = { users, topics: SEED_TOPICS.length, content: contentStats, questions: qStats };
    log(`done ${JSON.stringify(summary)}`);
    return summary;
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[seed] failed', err);
      process.exit(1);
    });
}
