/** K10 — server restart and admin cancel keep records, invalidate the session, never show half success; single scheduler authority. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client } from 'pg';
import type { AdminQuestion, AdminSession } from '@merak/contracts';
import { adminQuery, api, createTestApp, createUser, getState, joinSession, publishQuestion, scheduleSession, submitAnswer, uuid, type TestApp, type TestUser } from './harness.js';
import { runSeed } from '../src/seed/seed.js';
import { EngineService } from '../src/modules/live-quiz/engine.service.js';
import { SCHEDULER_LOCK_KEY } from '../src/modules/live-quiz/scheduler-leader.service.js';
import { TEST_ADMIN_DATABASE_URL } from './setup.js';

let t: TestApp;
let admin: TestUser;
let member: TestUser;
let questionIds: string[];

beforeAll(async () => {
  t = await createTestApp();
  await runSeed({ quiet: true, skipUsers: true });
  const editor = await createUser(t, 'editor');
  admin = await createUser(t, 'admin');
  member = await createUser(t, 'member');
  const drafts = (await api<{ items: AdminQuestion[] }>(t.baseUrl, editor.token, 'GET', '/admin/questions')).body.items;
  questionIds = (await Promise.all(drafts.slice(0, 5).map((d) => publishQuestion(t, editor, d.id)))).map((q) => q.id);
});
afterAll(async () => {
  await t.close();
});

describe('K10 restart recovery and cancellation', () => {
  it('API restart during a live session: session cancelled (server_restart), answers preserved, not ranked, no results', async () => {
    const session = (await scheduleSession(t, admin, questionIds, { startInMs: 5_000, lobbyLeadMs: 0 })).body;
    const token = (await joinSession(t, member, session.id)).body.participationToken;
    await t.advance(5_000);
    const q = (await getState(t, member, session.id)).currentQuestion!.open!;
    const r = await submitAnswer(t, member, session.id, { sessionQuestionId: q.sessionQuestionId, optionId: q.options[0]!.optionId, idempotencyKey: uuid(), participationToken: token });
    expect(r.status).toBe(201);
    // Simulate the process coming back up: the bootstrap hook runs recovery.
    const cancelled = await t.app.get(EngineService).recoverAfterRestart(t.clock.nowDate());
    expect(cancelled.map((c) => [c.sessionId, c.kind])).toEqual([[session.id, 'cancelled']]);
    const s = await getState(t, member, session.id);
    expect(s.session.status).toBe('cancelled');
    expect(s.session.cancelledReason).toBe('server_restart');
    expect(s.result).toBeNull();
    expect(s.currentQuestion?.status).toBe('closed'); // closed without reveal
    expect(JSON.stringify(s)).not.toContain('correctOptionId');
    const kept = await adminQuery<{ n: string }>(`select count(*) as n from app.answer_receipts where session_id = '${session.id}'`);
    const results = await adminQuery<{ n: string }>(`select count(*) as n from app.session_results where session_id = '${session.id}'`);
    if ('error' in kept || 'error' in results) throw new Error('query failed');
    expect(Number(kept.rows[0]!.n)).toBe(1);
    expect(Number(results.rows[0]!.n)).toBe(0);
    expect((await api(t.baseUrl, member.token, 'GET', `/quiz/sessions/${session.id}/result`)).status).toBe(409);
    expect((await joinSession(t, member, session.id, token)).body.error.code).toBe('SESSION_CANCELLED');
    // a later tick does nothing to a terminal session
    await t.advance(60_000);
    expect((await getState(t, member, session.id)).session.status).toBe('cancelled');
    expect((await getState(t, member, session.id)).stateVersion).toBe(s.stateVersion);
  });
  it('admin cancel is terminal, audited with actor and reason, visible to users; non-admins cannot cancel', async () => {
    const session = (await scheduleSession(t, admin, questionIds, { startInMs: 120_000 })).body;
    await joinSession(t, member, session.id);
    expect((await api(t.baseUrl, member.token, 'POST', `/admin/sessions/${session.id}/cancel`, { reason: 'x' })).status).toBe(403);
    const c = await api<AdminSession>(t.baseUrl, admin.token, 'POST', `/admin/sessions/${session.id}/cancel`, { reason: 'Soru 3 hatalı' });
    expect(c.status).toBe(201);
    expect(c.body.status).toBe('cancelled');
    expect(c.body.cancelledReason).toBe('admin_cancelled');
    const again = await api(t.baseUrl, admin.token, 'POST', `/admin/sessions/${session.id}/cancel`, { reason: 'tekrar' });
    expect(again.body.error.code).toBe('INVALID_TRANSITION');
    const audit = (await api(t.baseUrl, admin.token, 'GET', '/admin/audit')).body.items.find((a: any) => a.action === 'session.cancel' && a.targetId === session.id);
    expect(audit.actorUserId).toBe(admin.sub);
    expect(audit.reason).toBe('Soru 3 hatalı');
    const view = await api(t.baseUrl, member.token, 'GET', '/quiz/current');
    expect(view.body.session?.status ?? 'none').not.toBe('scheduled');
  });
  it('a scheduled session whose start was missed while the API was down is cancelled on recovery (missed_start)', async () => {
    const session = (await scheduleSession(t, admin, questionIds, { startInMs: 30_000, lobbyLeadMs: 0 })).body;
    t.clock.__freezeForTests(t.clock.now() + 30_000 + 61_000);
    const cancelled = await t.app.get(EngineService).recoverAfterRestart(t.clock.nowDate());
    expect(cancelled.find((c) => c.sessionId === session.id)?.kind).toBe('cancelled');
    expect((await getState(t, member, session.id)).session.cancelledReason).toBe('missed_start');
  });
  it('single authority: a second process cannot take the scheduler lock while this one holds it', async () => {
    const other = new Client({ connectionString: TEST_ADMIN_DATABASE_URL });
    await other.connect();
    try {
      const r = await other.query<{ locked: boolean }>('select pg_try_advisory_lock($1) as locked', [SCHEDULER_LOCK_KEY]);
      expect(r.rows[0]!.locked).toBe(false);
    } finally {
      await other.end();
    }
  });
  it('a repeated job cannot open or reveal the same question twice (idempotent transitions)', async () => {
    const session = (await scheduleSession(t, admin, questionIds, { startInMs: 5_000, lobbyLeadMs: 0 })).body;
    await joinSession(t, member, session.id);
    t.clock.__freezeForTests(t.clock.now() + 5_000);
    const engine = t.app.get(EngineService);
    expect((await engine.toLobby(session.id, t.clock.nowDate()))?.kind).toBe('lobby');
    expect(await engine.toLobby(session.id, t.clock.nowDate())).toBeNull();
    const first = await engine.start(session.id, t.clock.nowDate());
    const second = await engine.start(session.id, t.clock.nowDate());
    expect(first?.kind).toBe('opened');
    expect(second).toBeNull();
    // parallel ticks
    t.clock.__freezeForTests(t.clock.now() + 12_000);
    const [a, b, c] = await Promise.all([t.scheduler.tick(), t.scheduler.tick(), t.scheduler.tick()]);
    expect([a, b, c].filter((x) => x.length > 0)).toHaveLength(1);
    const versions = await adminQuery<{ state_version: number; status: string }>(`select state_version, status from app.quiz_sessions where id = '${session.id}'`);
    if ('error' in versions) throw new Error(versions.error);
    expect(versions.rows[0]!.status).toBe('live');
    const q1 = await adminQuery<{ status: string }>(`select status from app.session_questions where session_id = '${session.id}' and position = 1`);
    if ('error' in q1) throw new Error(q1.error);
    expect(q1.rows[0]!.status).toBe('revealed');
  });
});
