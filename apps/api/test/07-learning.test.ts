/** K11 — completion awards XP once; quiz totals untouched; the daily task counts three DISTINCT items. Plus save/privacy/analytics split. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ContentCardSummary } from '@merak/contracts';
import { adminQuery, api, createTestApp, createUser, uuid, type TestApp, type TestUser } from './harness.js';
import { runSeed } from '../src/seed/seed.js';
import { AnalyticsService } from '../src/modules/analytics/analytics.service.js';

let t: TestApp;
let ayse: TestUser;
let cards: ContentCardSummary[];

beforeAll(async () => {
  t = await createTestApp();
  await runSeed({ quiet: true, skipUsers: true });
  ayse = await createUser(t, 'member', 'ayse');
  cards = (await api(t.baseUrl, ayse.token, 'GET', '/content?kind=card')).body.items;
});
afterAll(async () => {
  await t.close();
});

describe('K11 learning progress', () => {
  it('feed exposes >= 12 published cards in >= 3 topics and 4 radar picks; details carry source + production method', async () => {
    expect(cards.length).toBeGreaterThanOrEqual(12);
    expect(new Set(cards.map((c) => c.topic.slug)).size).toBeGreaterThanOrEqual(3);
    const radar = (await api(t.baseUrl, ayse.token, 'GET', '/content?kind=radar_pick')).body.items;
    expect(radar).toHaveLength(4);
    expect(radar.every((r: any) => r.mediaType && r.creator)).toBe(true);
    const detail = (await api(t.baseUrl, ayse.token, 'GET', `/content/${cards[0]!.slug}`)).body;
    expect(detail.source.url).toMatch(/^https?:\/\//);
    expect(detail.source.verified).toBe(false);
    expect(detail.productionMethod).toBe('seed_sample');
    const radarDetail = (await api(t.baseUrl, ayse.token, 'GET', `/content/${radar[0].id}`)).body;
    expect(radarDetail.whyRecommended.length).toBeGreaterThan(10);
  });
  it('completing awards XP exactly once, even under parallel requests; replays return xpAwarded 0', async () => {
    const card = cards[0]!;
    const burst = await Promise.all(Array.from({ length: 5 }, () => api(t.baseUrl, ayse.token, 'POST', `/content/${card.id}/complete`)));
    expect(burst.every((r) => r.status === 201)).toBe(true);
    const awarded = burst.map((r) => r.body.xpAwarded);
    expect(awarded.filter((x) => x === 10)).toHaveLength(1);
    expect(burst.every((r) => r.body.learningXpTotal === 10)).toBe(true);
    const again = await api(t.baseUrl, ayse.token, 'POST', `/content/${card.id}/complete`);
    expect(again.body).toMatchObject({ completed: true, xpAwarded: 0, alreadyCompleted: true, learningXpTotal: 10 });
    const ledger = await adminQuery<{ n: string }>(`select count(*) as n from app.learning_xp_events where user_id = '${ayse.sub}'`);
    if ('error' in ledger) throw new Error(ledger.error);
    expect(Number(ledger.rows[0]!.n)).toBe(1);
    const me = await api(t.baseUrl, ayse.token, 'GET', '/me');
    expect(me.body.profile.learningXpTotal).toBe(10);
    const detail = (await api(t.baseUrl, ayse.token, 'GET', `/content/${card.id}`)).body;
    expect(detail.isCompleted).toBe(true);
  });
  it('daily task counts three DISTINCT completions in Europe/Istanbul; the same item repeated does not count', async () => {
    const after2 = await api(t.baseUrl, ayse.token, 'POST', `/content/${cards[1]!.id}/complete`);
    expect(after2.body.dailyTask).toMatchObject({ progress: 2, target: 3, completed: false, completedNow: false });
    const after3 = await api(t.baseUrl, ayse.token, 'POST', `/content/${cards[2]!.id}/complete`);
    expect(after3.body.dailyTask).toMatchObject({ progress: 3, completed: true, completedNow: true });
    const after4 = await api(t.baseUrl, ayse.token, 'POST', `/content/${cards[3]!.id}/complete`);
    expect(after4.body.dailyTask).toMatchObject({ progress: 3, completed: true, completedNow: false });
    const progress = await api(t.baseUrl, ayse.token, 'GET', '/learning/progress');
    expect(progress.body).toMatchObject({ learningXpTotal: 40, completedCount: 4, dailyTask: { completed: true, progress: 3 } });
    const ev = await adminQuery<{ n: string }>(`select count(*) as n from app.analytics_events where event_name = 'daily_task_completed' and user_id = '${ayse.sub}'`);
    if ('error' in ev) throw new Error(ev.error);
    expect(Number(ev.rows[0]!.n)).toBe(1);
    const mehmet = await createUser(t, 'member', 'mehmet');
    for (let i = 0; i < 3; i++) await api(t.baseUrl, mehmet.token, 'POST', `/content/${cards[0]!.id}/complete`);
    const p2 = await api(t.baseUrl, mehmet.token, 'GET', '/learning/progress');
    expect(p2.body.dailyTask.progress).toBe(1);
    expect(p2.body.learningXpTotal).toBe(10);
  });
  it('daily task is recorded once when the 2nd and 3rd distinct items are completed concurrently', async () => {
    for (let round = 0; round < 5; round++) {
      const u = await createUser(t, 'member', `race${round}`);
      await api(t.baseUrl, u.token, 'POST', `/content/${cards[0]!.id}/complete`);
      const pair = await Promise.all([cards[1]!, cards[2]!].map((c) => api(t.baseUrl, u.token, 'POST', `/content/${c.id}/complete`)));
      expect(pair.map((r) => r.status)).toEqual([201, 201]);
      expect(pair.filter((r) => r.body.dailyTask.completedNow)).toHaveLength(1);
      const rows = await adminQuery<{ n: string }>(`select count(*) as n from app.daily_task_completions where user_id = '${u.sub}'`);
      if ('error' in rows) throw new Error(rows.error);
      expect(rows.rows[0]!.n).toBe('1');
    }
  });

  it('day boundary: a completion at 23:30 Istanbul and another at 00:30 the next day fall in different task days', async () => {
    const zeynep = await createUser(t, 'member', 'zeynep');
    const at = (iso: string) => {
      t.clock.__freezeForTests(Date.parse(iso));
    };
    at('2026-10-20T20:30:00Z'); // 23:30 Istanbul
    await api(t.baseUrl, zeynep.token, 'POST', `/content/${cards[0]!.id}/complete`);
    await api(t.baseUrl, zeynep.token, 'POST', `/content/${cards[1]!.id}/complete`);
    at('2026-10-20T21:30:00Z'); // 00:30 next day Istanbul
    const r = await api(t.baseUrl, zeynep.token, 'POST', `/content/${cards[2]!.id}/complete`);
    expect(r.body.dailyTask).toMatchObject({ progress: 1, completed: false });
    expect((await api(t.baseUrl, zeynep.token, 'GET', '/learning/progress')).body.dailyTask.localDate).toBe('2026-10-21');
    t.clock.__freezeForTests(Date.now());
  });
  it('save / unsave persist, saved list works, unpublished content is refused', async () => {
    const card = cards[5]!;
    expect((await api(t.baseUrl, ayse.token, 'POST', `/content/${card.id}/save`)).body).toEqual({ saved: true });
    expect((await api(t.baseUrl, ayse.token, 'POST', `/content/${card.id}/save`)).body).toEqual({ saved: true });
    const saved = (await api(t.baseUrl, ayse.token, 'GET', '/learning/saved')).body.items;
    expect(saved.map((s: any) => s.id)).toEqual([card.id]);
    expect((await api(t.baseUrl, ayse.token, 'DELETE', `/content/${card.id}/save`)).body).toEqual({ saved: false });
    expect((await api(t.baseUrl, ayse.token, 'GET', '/learning/saved')).body.items).toEqual([]);
    expect((await api(t.baseUrl, ayse.token, 'POST', `/content/${uuid()}/complete`)).body.error.code).toBe('CONTENT_NOT_PUBLISHED');
    const saveEvents = await adminQuery<{ n: string }>(`select count(*) as n from app.analytics_events where event_name = 'content_saved' and user_id = '${ayse.sub}'`);
    if ('error' in saveEvents) throw new Error(saveEvents.error);
    expect(Number(saveEvents.rows[0]!.n)).toBe(1); // second save was a no-op
  });
  it('learning XP has no quiz write path: no quiz table references the XP ledger and the ledger has one reason', async () => {
    const reasons = await adminQuery<{ enumlabel: string }>("select e.enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'xp_reason'");
    if ('error' in reasons) throw new Error(reasons.error);
    expect(reasons.rows.map((r) => r.enumlabel)).toEqual(['content_completed']);
    const fks = await adminQuery<{ n: string }>("select count(*) as n from information_schema.table_constraints where table_schema = 'app' and constraint_type = 'FOREIGN KEY' and table_name in ('answer_receipts','session_results') and constraint_name ilike '%xp%'");
    if ('error' in fks) throw new Error(fks.error);
    expect(Number(fks.rows[0]!.n)).toBe(0);
  });
  it('active-user split: culture-active users come from completions/saves, not from content_opened; sets are separate', async () => {
    const opened = await api(t.baseUrl, ayse.token, 'POST', '/events', { events: [{ eventId: uuid(), schemaVersion: 1, eventName: 'content_opened', eventTime: new Date().toISOString(), contentItemId: cards[0]!.id }] });
    expect(opened.body.accepted).toBe(1);
    const analytics = t.app.get(AnalyticsService);
    const rows = await analytics.activeUsersByDay(new Date(Date.now() - 86_400_000 * 30), new Date(Date.now() + 86_400_000 * 30));
    const totalCulture = rows.reduce((s, r) => s + r.cultureActive, 0);
    const totalQuiz = rows.reduce((s, r) => s + r.quizActive, 0);
    expect(totalCulture).toBeGreaterThanOrEqual(3); // ayse, mehmet, zeynep completed things
    expect(totalQuiz).toBe(0); // nobody played a quiz in this file
  });
});
