/** K08 — reconnect returns the authoritative state and previous answers; second device and late-join rules. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AdminQuestion, AdminSession, WsAck } from '@merak/contracts';
import { WS_EVENTS } from '@merak/contracts';
import { api, connectWs, createTestApp, createUser, emitAck, getState, joinSession, publishQuestion, scheduleSession, submitAnswer, uuid, waitFor, type TestApp, type TestUser } from './harness.js';
import { runSeed } from '../src/seed/seed.js';
import { QuizGateway } from '../src/modules/live-quiz/quiz.gateway.js';

let t: TestApp;
let session: AdminSession;
let ayse: TestUser;
let ayseToken: string;

beforeAll(async () => {
  t = await createTestApp();
  await runSeed({ quiet: true, skipUsers: true });
  const editor = await createUser(t, 'editor');
  const admin = await createUser(t, 'admin');
  ayse = await createUser(t, 'member', 'ayse');
  const drafts = (await api<{ items: AdminQuestion[] }>(t.baseUrl, editor.token, 'GET', '/admin/questions')).body.items;
  const published = await Promise.all(drafts.slice(0, 5).map((d) => publishQuestion(t, editor, d.id)));
  session = (await scheduleSession(t, admin, published.map((p) => p.id), { startInMs: 10_000, lobbyLeadMs: 0 })).body;
  ayseToken = (await joinSession(t, ayse, session.id)).body.participationToken;
});
afterAll(async () => {
  await t.close();
});

describe('K08 reconnect, second device, late join', () => {
  it('WS: unauthenticated sockets are refused; wrong participation token is refused at subscribe', async () => {
    await expect(connectWs(t.baseUrl, 'not-a-token')).rejects.toBeTruthy();
    const s = await connectWs(t.baseUrl, ayse.token);
    const ack = await emitAck<WsAck>(s, WS_EVENTS.subscribe, { sessionId: session.id, participationToken: 'wrong-token-wrong-token' });
    expect(ack.ok).toBe(false);
    expect(ack.ok === false && ack.code).toBe('PARTICIPATION_TOKEN_INVALID');
    s.close();
  });
  it('subscribe returns the snapshot; question.opened is pushed with a rising stateVersion; resync returns the same truth', async () => {
    const s = await connectWs(t.baseUrl, ayse.token);
    const ack = await emitAck<WsAck>(s, WS_EVENTS.subscribe, { sessionId: session.id, participationToken: ayseToken });
    expect(ack.ok).toBe(true);
    const v0 = ack.ok ? ack.snapshot.stateVersion : -1;
    const opened = waitFor<{ stateVersion: number; question: { position: number; options: unknown[] } }>(s, WS_EVENTS.questionOpened);
    await t.advance(10_000);
    const ev = await opened;
    expect(ev.stateVersion).toBeGreaterThan(v0);
    expect(ev.question.position).toBe(1);
    expect(JSON.stringify(ev)).not.toContain('correctOptionId');
    const re = await emitAck<WsAck>(s, WS_EVENTS.resync, { sessionId: session.id });
    expect(re.ok && re.snapshot.stateVersion).toBe(ev.stateVersion);
    expect(re.ok && re.snapshot.currentQuestion?.open?.sessionQuestionId).toBe((ev.question as any).sessionQuestionId);
    s.close();
  });
  it('after a disconnect the user comes back to the same participation with their recorded answer', async () => {
    const q = (await getState(t, ayse, session.id)).currentQuestion!.open!;
    const r = await submitAnswer(t, ayse, session.id, { sessionQuestionId: q.sessionQuestionId, optionId: q.options[0]!.optionId, idempotencyKey: uuid(), participationToken: ayseToken });
    expect(r.status).toBe(201);
    // "app reopened": join again with the stored token
    const rejoin = await joinSession(t, ayse, session.id, ayseToken);
    expect(rejoin.status).toBe(201);
    expect(rejoin.body.resumed).toBe(true);
    expect(rejoin.body.participantId).toBe(rejoin.body.snapshot.myParticipation.participantId);
    expect(rejoin.body.snapshot.myParticipation.answers).toHaveLength(1);
    expect(rejoin.body.snapshot.myParticipation.answers[0].optionId).toBe(q.options[0]!.optionId);
    expect(rejoin.body.snapshot.myParticipation.answers[0].isCorrect).toBeNull(); // still open: no leak
    // reconnecting mid-question keeps the common window: the same closesAt is reported
    expect(rejoin.body.snapshot.currentQuestion.open.closesAt).toBe(q.closesAt);
    // personalised option order is stable across reconnects
    expect(rejoin.body.snapshot.currentQuestion.open.options.map((o: any) => o.optionId)).toEqual(q.options.map((o) => o.optionId));
    const s = await connectWs(t.baseUrl, ayse.token);
    const ack = await emitAck<WsAck>(s, WS_EVENTS.subscribe, { sessionId: session.id, participationToken: ayseToken });
    expect(ack.ok && ack.snapshot.myParticipation?.answers.length).toBe(1);
    s.close();
  });
  it('a second device (no token) cannot take over the participation in M0', async () => {
    const second = await joinSession(t, ayse, session.id);
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('PARTICIPATION_EXISTS');
    const wrong = await joinSession(t, ayse, session.id, 'some-other-token-value-1234');
    expect(wrong.body.error.code).toBe('PARTICIPATION_EXISTS');
  });
  it('late join: a user joining while Q2 is open competes from Q3; missed questions score 0', async () => {
    await t.advance(12_000); // reveal Q1
    await t.advance(6_000); // Q2 opens
    const late = await createUser(t, 'member', 'late');
    const lj = await joinSession(t, late, session.id);
    expect(lj.body.eligibleFromPosition).toBe(3);
    const q2 = (await getState(t, late, session.id)).currentQuestion!.open!;
    expect(q2.position).toBe(2);
    const refused = await submitAnswer(t, late, session.id, { sessionQuestionId: q2.sessionQuestionId, optionId: q2.options[0]!.optionId, idempotencyKey: uuid(), participationToken: lj.body.participationToken });
    expect(refused.body.error.code).toBe('NOT_ELIGIBLE_FOR_QUESTION');
    await t.advance(12_000);
    await t.advance(6_000); // Q3 opens
    const q3 = (await getState(t, late, session.id)).currentQuestion!.open!;
    expect(q3.position).toBe(3);
    const ok = await submitAnswer(t, late, session.id, { sessionQuestionId: q3.sessionQuestionId, optionId: q3.options[0]!.optionId, idempotencyKey: uuid(), participationToken: lj.body.participationToken });
    expect(ok.status).toBe(201);
    // finish the session
    for (let i = 0; i < 3; i++) {
      await t.advance(12_000);
      await t.advance(6_000);
    }
    const res = await api(t.baseUrl, late.token, 'GET', `/quiz/sessions/${session.id}/result`);
    expect(res.status).toBe(200);
    expect(res.body.result.questions.slice(0, 2).map((q: any) => q.points)).toEqual([0, 0]);
    expect(res.body.result.answeredCount).toBe(1);
  });
  it('the gateway drops socket membership on disconnect (no ghost members)', async () => {
    const gw = t.app.get(QuizGateway);
    const s = await connectWs(t.baseUrl, ayse.token);
    await emitAck<WsAck>(s, WS_EVENTS.subscribe, { sessionId: session.id, participationToken: ayseToken });
    expect(gw.memberCount(session.id)).toBeGreaterThanOrEqual(1);
    s.close();
    await new Promise((r) => setTimeout(r, 200));
    expect(gw.memberCount(session.id)).toBe(0);
  });
});
