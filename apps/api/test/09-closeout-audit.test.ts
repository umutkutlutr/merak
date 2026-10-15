/**
 * M0 closeout — fixes and evidence gaps from the adversarial review of the seven closeout risks
 * (docs/reports/M0_CLOSEOUT_REPORT.md §6):
 *  R2  staff cannot play; editors do not see session pins; WS/REST payloads carry no key before the reveal
 *  R3  every admin route refuses members; a WS token that expires after the handshake stops working
 *  R4  the production bootstrap path cancels sessions interrupted by a restart
 *  R5  an option from another question's revision is refused and does not use up the answer
 *  R6  approvals record person vs test shortcut; links are pinned with the revision; lobby→live re-check
 *  R7  an admin cancel during a live session keeps receipts, ranks nobody and refuses new answers
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AdminAuditEntry, AdminQuestion, AdminSession, ContentCardSummary, WsAck } from '@merak/contracts';
import { WS_EVENTS } from '@merak/contracts';
import type { Pool } from 'pg';
import {
  adminQuery,
  api,
  connectWs,
  correctOptionFor,
  createTestApp,
  createUser,
  emitAck,
  getState,
  joinSession,
  mintToken,
  publishQuestion,
  scheduleSession,
  submitAnswer,
  uuid,
  waitFor,
  type TestApp,
  type TestUser,
} from './harness.js';
import { runSeed } from '../src/seed/seed.js';
import { createApp } from '../src/main.js';
import { getEnv, setEnvForTests } from '../src/config/env.js';
import { SchedulerLeaderService } from '../src/modules/live-quiz/scheduler-leader.service.js';
import { PG_POOL } from '../src/db/db.module.js';

let t: TestApp;
let editor: TestUser;
let admin: TestUser;
let drafts: AdminQuestion[];
let questionIds: string[];

beforeAll(async () => {
  t = await createTestApp();
  await runSeed({ quiet: true, skipUsers: true });
  editor = await createUser(t, 'editor');
  admin = await createUser(t, 'admin');
  drafts = (await api<{ items: AdminQuestion[] }>(t.baseUrl, editor.token, 'GET', '/admin/questions')).body.items;
  questionIds = (await Promise.all(drafts.slice(0, 5).map((d) => publishQuestion(t, editor, d.id)))).map((q) => q.id);
});
afterAll(async () => {
  await t.close();
});

async function liveSession(players: number): Promise<{ session: AdminSession; users: Array<{ u: TestUser; token: string }> }> {
  const session = (await scheduleSession(t, admin, questionIds, { startInMs: 5_000, lobbyLeadMs: 0 })).body;
  const users = [];
  for (let i = 0; i < players; i++) {
    const u = await createUser(t, 'member', `p${i}`);
    users.push({ u, token: (await joinSession(t, u, session.id)).body.participationToken as string });
  }
  await t.advance(5_000);
  return { session, users };
}

const editInput = (q: AdminQuestion, patch: Record<string, unknown> = {}) => ({
  topicId: q.topic.id,
  prompt: q.currentRevision.prompt,
  explanation: q.currentRevision.explanation,
  options: q.currentRevision.options.map((o) => ({ label: o.label, isCorrect: o.isCorrect })),
  sourceUrl: q.currentRevision.sourceUrl,
  sourceTitle: q.currentRevision.sourceTitle,
  sourceVerified: false,
  language: 'tr',
  productionMethod: 'human',
  relatedContentItemId: q.relatedContentItemId,
  reason: 'closeout test edit',
  ...patch,
});

const getQuestion = async (id: string) => (await api<AdminQuestion>(t.baseUrl, editor.token, 'GET', `/admin/questions/${id}`)).body;

describe('R6 editorial provenance', () => {
  it('an approval records whether a person or a test shortcut approved it; an edit clears it', async () => {
    const id = drafts[6]!.id;
    await api(t.baseUrl, editor.token, 'POST', `/admin/questions/${id}/submit_review`, {});
    await api(t.baseUrl, editor.token, 'POST', `/admin/questions/${id}/approve`, { reason: 'okudum' });
    const human = await getQuestion(id);
    expect(human.approvalKind).toBe('editor_review');

    await api(t.baseUrl, editor.token, 'PATCH', `/admin/questions/${id}`, editInput(human, { prompt: `${human.currentRevision.prompt} (düzeltme)` }));
    const edited = await getQuestion(id);
    expect(edited.status).toBe('draft');
    expect(edited.approvalKind).toBeNull();

    const published = await publishQuestion(t, editor, id); // harness = test shortcut
    expect(published.approvalKind).toBe('automated_test');
    const audit = await adminQuery<{ kind: string }>(
      `select metadata->>'approvalKind' as kind from app.admin_audit_log where action = 'question.approve' and target_id = '${id}' order by created_at`,
    );
    if ('error' in audit) throw new Error(audit.error);
    expect(audit.rows.map((r) => r.kind)).toEqual(['editor_review', 'automated_test']);

    const session = (await scheduleSession(t, admin, [id, ...questionIds.slice(0, 4)])).body;
    expect(session.questions.every((q) => q.approvalKind === 'automated_test')).toBe(true);
    await api(t.baseUrl, admin.token, 'POST', `/admin/sessions/${session.id}/cancel`, { reason: 'test temizliği' });

    const card = (await api<{ items: Array<{ id: string }> }>(t.baseUrl, editor.token, 'GET', '/admin/content')).body.items[0]!;
    const contentWithKind = await api(t.baseUrl, editor.token, 'POST', `/admin/content/${card.id}/approve`, { approvalKind: 'automated_test' });
    expect(contentWithKind.status).toBe(400);
  });

  it('the lobby→live re-check cancels a session whose question lost approval during the lobby', async () => {
    const session = (await scheduleSession(t, admin, questionIds, { startInMs: 120_000, lobbyLeadMs: 60_000 })).body;
    await t.advance(60_000);
    expect((await api<AdminSession>(t.baseUrl, admin.token, 'GET', `/admin/sessions/${session.id}`)).body.status).toBe('lobby');
    await api(t.baseUrl, editor.token, 'POST', `/admin/questions/${questionIds[3]}/archive`, { reason: 'kaynak hatalı' });
    await t.advance(60_000);
    const after = (await api<AdminSession>(t.baseUrl, admin.token, 'GET', `/admin/sessions/${session.id}`)).body;
    expect(after.status).toBe('cancelled');
    expect(after.cancelledReason).toBe('question_approval_withdrawn');
    await publishQuestion(t, editor, questionIds[3]!); // archived → reopen → … → published again for later tests
  });

  it('a completed session keeps the topic and related card it ran with when the question is edited afterwards', async () => {
    const { session, users } = await liveSession(1);
    const [a] = users as [{ u: TestUser; token: string }];
    for (let i = 0; i < 5; i++) {
      await t.advance(12_000);
      await t.advance(6_000);
    }
    const before = await api(t.baseUrl, a.u.token, 'GET', `/quiz/sessions/${session.id}/result`);
    expect(before.status).toBe(200);
    const relatedBefore = before.body.result.questions[0].relatedContent?.id ?? null;

    const cards = (await api<{ items: ContentCardSummary[] }>(t.baseUrl, a.u.token, 'GET', '/content?kind=card')).body.items;
    const q = await getQuestion(questionIds[0]!);
    const other = cards.find((c) => c.id !== relatedBefore && c.topic.id !== q.topic.id)!;
    const edit = await api(t.baseUrl, editor.token, 'PATCH', `/admin/questions/${q.id}`, editInput(q, { relatedContentItemId: other.id, topicId: other.topic.id }));
    expect(edit.status).toBe(200); // a draft edit, never approved

    const after = await api(t.baseUrl, a.u.token, 'GET', `/quiz/sessions/${session.id}/result`);
    expect(after.body.result.questions[0].relatedContent?.id ?? null).toBe(relatedBefore);
    expect(after.body.result.questions[0].relatedContent?.id).not.toBe(other.id);
    await publishQuestion(t, editor, q.id);
  });
});

describe('R2 staff and payload exposure', () => {
  it('editor and admin accounts cannot join a session as players', async () => {
    const session = (await scheduleSession(t, admin, questionIds)).body;
    for (const staff of [editor, admin]) {
      const r = await joinSession(t, staff, session.id);
      expect(r.status).toBe(403);
      expect(r.body.error.code).toBe('STAFF_CANNOT_PLAY');
    }
    const member = await createUser(t, 'member');
    expect((await joinSession(t, member, session.id)).status).toBe(201);
    await api(t.baseUrl, admin.token, 'POST', `/admin/sessions/${session.id}/cancel`, { reason: 'test temizliği' });
  });

  it('editors do not see which questions an upcoming session pinned; admins do', async () => {
    const session = (await scheduleSession(t, admin, questionIds)).body;
    const entryFor = async (u: TestUser) =>
      (await api<{ items: AdminAuditEntry[] }>(t.baseUrl, u.token, 'GET', '/admin/audit?limit=500')).body.items.find(
        (e) => e.action === 'session.create' && e.targetId === session.id,
      )!;
    expect((await entryFor(admin)).metadata).toHaveProperty('pins');
    const forEditor = await entryFor(editor);
    expect(forEditor.metadata).not.toHaveProperty('pins');
    for (const id of questionIds) expect(JSON.stringify(forEditor)).not.toContain(id);
    await api(t.baseUrl, admin.token, 'POST', `/admin/sessions/${session.id}/cancel`, { reason: 'test temizliği' });
  });

  it('the WS question.opened push and /state for a user who has not joined carry no answer key', async () => {
    const session = (await scheduleSession(t, admin, questionIds, { startInMs: 5_000, lobbyLeadMs: 0 })).body;
    const a = await createUser(t, 'member');
    const token = (await joinSession(t, a, session.id)).body.participationToken as string;
    const s = await connectWs(t.baseUrl, a.token);
    try {
      expect((await emitAck<WsAck>(s, WS_EVENTS.subscribe, { sessionId: session.id, participationToken: token })).ok).toBe(true);
      const opened = waitFor(s, WS_EVENTS.questionOpened);
      await t.advance(5_000);
      const payload = JSON.stringify(await opened);
      for (const leak of ['correctOptionId', 'isCorrect', 'explanation']) expect(payload).not.toContain(leak);
      const outsider = await createUser(t, 'member');
      const snap = JSON.stringify(await getState(t, outsider, session.id));
      expect(snap).not.toMatch(/"correctOptionId":"/);
      expect(snap).not.toContain('explanation');
    } finally {
      s.close();
      await api(t.baseUrl, admin.token, 'POST', `/admin/sessions/${session.id}/cancel`, { reason: 'test temizliği' });
    }
  });
});

describe('R3 authorization and token expiry', () => {
  it('members are refused on every admin route, editors on every session/analytics route', async () => {
    const member = await createUser(t, 'member');
    const anyId = questionIds[0]!;
    const routes: Array<[string, string, unknown?]> = [
      ['GET', '/admin/topics'],
      ['GET', '/admin/content'],
      ['POST', '/admin/content', {}],
      ['PATCH', `/admin/content/${anyId}`, {}],
      ['POST', `/admin/content/${anyId}/approve`, {}],
      ['GET', '/admin/questions'],
      ['GET', `/admin/questions/${anyId}`],
      ['POST', '/admin/questions', {}],
      ['PATCH', `/admin/questions/${anyId}`, {}],
      ['POST', `/admin/questions/${anyId}/approve`, {}],
      ['GET', '/admin/sessions'],
      ['GET', `/admin/sessions/${anyId}`],
      ['POST', '/admin/sessions', {}],
      ['POST', `/admin/sessions/${anyId}/cancel`, { reason: 'x' }],
      ['GET', '/admin/audit'],
      ['GET', '/admin/analytics/active-users'],
    ];
    for (const [method, path, body] of routes) {
      const r = await api(t.baseUrl, member.token, method, path, body);
      expect([path, r.status, r.body?.error?.code]).toEqual([path, 403, 'FORBIDDEN']);
    }
    for (const [method, path, body] of routes.filter(([, p]) => p.startsWith('/admin/sessions') || p.startsWith('/admin/analytics'))) {
      const r = await api(t.baseUrl, editor.token, method, path, body);
      expect([path, r.status]).toEqual([path, 403]);
    }
  });

  it('a WebSocket whose token expires after the handshake can no longer resync', async () => {
    const session = (await scheduleSession(t, admin, questionIds)).body;
    const a = await createUser(t, 'member');
    const token = (await joinSession(t, a, session.id)).body.participationToken as string;
    // Expired 3 s ago: inside the verifier's 5 s tolerance, so the handshake is still accepted.
    const short = await mintToken({ sub: a.sub, expiresIn: '-3s' });
    const s = await connectWs(t.baseUrl, short.token);
    try {
      expect((await emitAck<WsAck>(s, WS_EVENTS.subscribe, { sessionId: session.id, participationToken: token })).ok).toBe(true);
      await new Promise((r) => setTimeout(r, 2_500));
      const re = await emitAck<WsAck>(s, WS_EVENTS.resync, { sessionId: session.id });
      expect(re).toMatchObject({ ok: false, code: 'AUTH_TOKEN_EXPIRED' });
    } finally {
      s.close();
      await api(t.baseUrl, admin.token, 'POST', `/admin/sessions/${session.id}/cancel`, { reason: 'test temizliği' });
    }
  });
});

describe('R4 restart recovery on the production bootstrap path', () => {
  it('an API process that boots while no leader holds the lock cancels the interrupted live session', async () => {
    const { session, users } = await liveSession(1);
    const [a] = users as [{ u: TestUser; token: string }];
    const leader = t.app.get(SchedulerLeaderService);
    await leader.release(); // the previous process is gone
    const original = getEnv();
    setEnvForTests({ ...original, QUIZ_SCHEDULER_ENABLED: true });
    const app2 = await createApp();
    setEnvForTests(original);
    try {
      await app2.listen(0); // onApplicationBootstrap → leader → recoverAfterRestart
      expect(app2.get(SchedulerLeaderService).isLeader).toBe(true);
      const after = await getState(t, a.u, session.id);
      expect(after.session.status).toBe('cancelled');
      expect(after.session.cancelledReason).toBe('server_restart');
    } finally {
      await app2.close();
      await app2.get<Pool>(PG_POOL).end().catch(() => undefined);
      expect(await leader.tryAcquire()).toBe(true);
    }
  });
});

describe('R5 option binding', () => {
  it("an option of another question's pinned revision is refused and does not use up the answer", async () => {
    const { session, users } = await liveSession(1);
    const [a] = users as [{ u: TestUser; token: string }];
    const q1 = (await getState(t, a.u, session.id)).currentQuestion!.open!;
    const q2 = await adminQuery<{ id: string }>(`select id from app.session_questions where session_id = '${session.id}' and position = 2`);
    if ('error' in q2) throw new Error(q2.error);
    const foreign = (await correctOptionFor(t, q2.rows[0]!.id)).correctOptionId;
    const body = { sessionQuestionId: q1.sessionQuestionId, idempotencyKey: uuid(), participationToken: a.token };
    const bad = await submitAnswer(t, a.u, session.id, { ...body, optionId: foreign });
    expect(bad.body.error.code).toBe('OPTION_INVALID');
    const good = await submitAnswer(t, a.u, session.id, { ...body, idempotencyKey: uuid(), optionId: q1.options[0]!.optionId });
    expect(good.status).toBe(201);
  });
});

describe('R7 admin cancel during a live session', () => {
  it('keeps the receipts, ranks nobody, refuses new answers and reveals no key', async () => {
    const { session, users } = await liveSession(2);
    const [a, b] = users as [{ u: TestUser; token: string }, { u: TestUser; token: string }];
    const q = (await getState(t, a.u, session.id)).currentQuestion!.open!;
    const { correctOptionId } = await correctOptionFor(t, q.sessionQuestionId);
    const ok = await submitAnswer(t, a.u, session.id, { sessionQuestionId: q.sessionQuestionId, optionId: correctOptionId, idempotencyKey: uuid(), participationToken: a.token });
    expect(ok.status).toBe(201);

    const cancelled = await api<AdminSession>(t.baseUrl, admin.token, 'POST', `/admin/sessions/${session.id}/cancel`, { reason: 'canlı test iptali' });
    expect(cancelled.body.status).toBe('cancelled');
    expect(cancelled.body.cancelledReason).toBe('admin_cancelled');

    const receipts = await adminQuery<{ n: string }>(
      `select count(*) as n from app.answer_receipts r join app.session_participants p on p.id = r.participant_id where p.session_id = '${session.id}'`,
    );
    if ('error' in receipts) throw new Error(receipts.error);
    expect(receipts.rows[0]!.n).toBe('1');
    const results = await adminQuery<{ n: string }>(`select count(*) as n from app.session_results where session_id = '${session.id}'`);
    if ('error' in results) throw new Error(results.error);
    expect(results.rows[0]!.n).toBe('0');
    expect((await api(t.baseUrl, a.u.token, 'GET', `/quiz/sessions/${session.id}/result`)).status).toBe(409);

    const late = await submitAnswer(t, b.u, session.id, { sessionQuestionId: q.sessionQuestionId, optionId: correctOptionId, idempotencyKey: uuid(), participationToken: b.token });
    expect(late.body.error.code).toBe('SESSION_CANCELLED');
    const snap = JSON.stringify(await getState(t, b.u, session.id));
    expect(snap).not.toMatch(/"correctOptionId":"/);
  });
});
