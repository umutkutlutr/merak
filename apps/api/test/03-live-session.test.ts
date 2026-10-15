/**
 * K04 — two independent users complete the same five-question session; results survive re-login.
 * K05 — scoring boundaries on the trusted server clock.
 * K09 — nothing leaks before reveal / unopened questions are unreachable.
 * K12 — result -> related card; quiz and culture events are recorded separately.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AdminQuestion, AdminSession, SessionResultView, SessionSnapshot } from '@merak/contracts';
import { adminQuery, api, correctOptionFor, createTestApp, createUser, getState, mintToken, publishQuestion, scheduleSession, joinSession, submitAnswer, uuid, type TestApp, type TestUser } from './harness.js';
import { runSeed } from '../src/seed/seed.js';

let t: TestApp;
let editor: TestUser;
let admin: TestUser;
let ayse: TestUser;
let mehmet: TestUser;
let session: AdminSession;
let ayseToken: string;
let mehmetToken: string;
const expected = { ayse: { points: 0, correct: 0 }, mehmet: { points: 0, correct: 0 } };

beforeAll(async () => {
  t = await createTestApp();
  await runSeed({ quiet: true, skipUsers: true });
  editor = await createUser(t, 'editor');
  admin = await createUser(t, 'admin');
  ayse = await createUser(t, 'member', 'ayse');
  mehmet = await createUser(t, 'member', 'mehmet');
  const drafts = (await api<{ items: AdminQuestion[] }>(t.baseUrl, editor.token, 'GET', '/admin/questions')).body.items;
  const published = await Promise.all(drafts.slice(0, 5).map((d) => publishQuestion(t, editor, d.id)));
  session = (await scheduleSession(t, admin, published.map((p) => p.id), { startInMs: 120_000 })).body;
});
afterAll(async () => {
  await t.close();
});

async function openQuestion(user: TestUser): Promise<NonNullable<SessionSnapshot['currentQuestion']>['open']> {
  const s = await getState(t, user, session.id);
  return s.currentQuestion?.open ?? null;
}

describe('K04/K05/K09/K12 live session', () => {
  it('home/current shows the upcoming prize-less test session without any question content', async () => {
    const cur = await api(t.baseUrl, ayse.token, 'GET', '/quiz/current');
    expect(cur.body.session.id).toBe(session.id);
    expect(cur.body.session.isTest).toBe(true);
    expect(cur.body.session.prizeMode).toBe('none');
    expect(JSON.stringify(cur.body)).not.toMatch(/prompt|options|correct/);
  });
  it('both users join before the lobby; snapshot has no current question', async () => {
    const a = await joinSession(t, ayse, session.id);
    const m = await joinSession(t, mehmet, session.id);
    expect(a.status).toBe(201);
    expect(m.status).toBe(201);
    ayseToken = a.body.participationToken;
    mehmetToken = m.body.participationToken;
    expect(a.body.eligibleFromPosition).toBe(1);
    expect(a.body.snapshot.currentQuestion).toBeNull();
    expect(m.body.snapshot.session.participantCount).toBe(2);
  });
  it('scheduled → lobby → live on the server timeline; Q1 opens with per-user option order and no key (K09)', async () => {
    await t.advance(60_000);
    expect((await getState(t, ayse, session.id)).session.status).toBe('lobby');
    await t.advance(60_000);
    const sa = await getState(t, ayse, session.id);
    const sm = await getState(t, mehmet, session.id);
    expect(sa.session.status).toBe('live');
    expect(sa.currentQuestion?.status).toBe('open');
    const qa = sa.currentQuestion!.open!;
    const qm = sm.currentQuestion!.open!;
    expect(qa.sessionQuestionId).toBe(qm.sessionQuestionId);
    expect([...qa.options.map((o) => o.optionId)].sort()).toEqual([...qm.options.map((o) => o.optionId)].sort());
    expect(qa.durationMs).toBe(12_000);
    // No answer key, explanation or unopened prompts anywhere in the user-facing snapshot.
    const text = JSON.stringify(sa);
    expect(text).not.toMatch(/correctOptionId|explanation|isCorrect":true/);
    const pending = await adminQuery<{ prompt: string }>(`select r.prompt from app.session_questions sq join app.question_revisions r on r.id = sq.question_revision_id where sq.session_id = '${session.id}' and sq.position = 2`);
    if ('error' in pending) throw new Error(pending.error);
    expect(text).not.toContain(pending.rows[0]!.prompt);
    // The pending question is not answerable or retrievable through the API.
    const pendingId = await adminQuery<{ id: string }>(`select id from app.session_questions where session_id = '${session.id}' and position = 2`);
    if ('error' in pendingId) throw new Error(pendingId.error);
    const r = await submitAnswer(t, ayse, session.id, { sessionQuestionId: pendingId.rows[0]!.id, optionId: qa.options[0]!.optionId, idempotencyKey: uuid(), participationToken: ayseToken });
    expect(r.body.error.code).toBe('QUESTION_NOT_OPEN');
  });
  it('K05: correct at the opening instant = 100, correct 1 ms before close = 60, wrong = 0, at the closing instant = rejected', async () => {
    const q = (await openQuestion(ayse))!;
    const { correctOptionId } = await correctOptionFor(t, q.sessionQuestionId);
    const wrong = q.options.find((o) => o.optionId !== correctOptionId)!.optionId;
    // ayse answers correctly exactly at opensAt (clock offset unchanged since the tick that opened it)
    expect(t.clock.now()).toBe(Date.parse(q.opensAt));
    const a = await submitAnswer(t, ayse, session.id, { sessionQuestionId: q.sessionQuestionId, optionId: correctOptionId, idempotencyKey: uuid(), participationToken: ayseToken });
    expect(a.status).toBe(201);
    expect(a.body.status).toBe('accepted');
    expect(a.body).not.toHaveProperty('isCorrect');
    expect(a.body).not.toHaveProperty('points');
    expected.ayse.points += 100;
    expected.ayse.correct += 1;
    // mehmet answers correctly 1 ms before close
    t.clock.__freezeForTests(Date.parse(q.closesAt) - 1);
    const m = await submitAnswer(t, mehmet, session.id, { sessionQuestionId: q.sessionQuestionId, optionId: correctOptionId, idempotencyKey: uuid(), participationToken: mehmetToken });
    expect(m.status).toBe(201);
    expected.mehmet.points += 60;
    expected.mehmet.correct += 1;
    // a third user joins late during Q1: eligible from Q2 only
    const late = await createUser(t, 'member', 'late');
    const lj = await joinSession(t, late, session.id);
    expect(lj.body.eligibleFromPosition).toBe(2);
    // at the closing instant nothing is accepted any more (even before the scheduler closes it)
    t.clock.__freezeForTests(Date.parse(q.closesAt));
    const lateAnswer = await submitAnswer(t, late, session.id, { sessionQuestionId: q.sessionQuestionId, optionId: wrong, idempotencyKey: uuid(), participationToken: lj.body.participationToken });
    expect(lateAnswer.body.error.code).toBe('QUESTION_CLOSED');
    const state = await getState(t, ayse, session.id);
    expect(state.currentQuestion?.open).toBeNull(); // past closesAt: not answerable, no key yet
    expect(JSON.stringify(state)).not.toContain('correctOptionId');
  });
  it('reveal exposes the key + own result only after close; wrong answers score 0', async () => {
    await t.advance(0);
    const sa = await getState(t, ayse, session.id);
    expect(sa.currentQuestion?.status).toBe('revealed');
    const rv = sa.currentQuestion!.reveal!;
    expect(rv.myAnswer?.isCorrect).toBe(true);
    expect(rv.myAnswer?.points).toBe(100);
    const sm = await getState(t, mehmet, session.id);
    expect(sm.currentQuestion!.reveal!.myAnswer?.points).toBe(60);
    expect(rv.correctOptionId).toBeTruthy();
    expect(rv.explanation.length).toBeGreaterThan(5);
    // Q2: ayse wrong (0), mehmet no answer (0)
    await t.advance(6_000);
    const q2 = (await openQuestion(ayse))!;
    expect(q2.position).toBe(2);
    const { correctOptionId } = await correctOptionFor(t, q2.sessionQuestionId);
    const wrong = q2.options.find((o) => o.optionId !== correctOptionId)!.optionId;
    const r = await submitAnswer(t, ayse, session.id, { sessionQuestionId: q2.sessionQuestionId, optionId: wrong, idempotencyKey: uuid(), participationToken: ayseToken });
    expect(r.status).toBe(201);
    await t.advance(12_000);
    const s2 = await getState(t, ayse, session.id);
    expect(s2.currentQuestion!.reveal!.myAnswer!.points).toBe(0);
    expect(s2.currentQuestion!.reveal!.myAnswer!.isCorrect).toBe(false);
    expect((await getState(t, mehmet, session.id)).currentQuestion!.reveal!.myAnswer).toBeNull();
  });
  it('remaining questions: mehmet answers halfway (80 points each) and the session completes with canonical results', async () => {
    for (let pos = 3; pos <= 5; pos++) {
      await t.advance(6_000);
      const q = (await openQuestion(mehmet))!;
      expect(q.position).toBe(pos);
      const { correctOptionId } = await correctOptionFor(t, q.sessionQuestionId);
      await t.advance(6_000); // half-way
      const r = await submitAnswer(t, mehmet, session.id, { sessionQuestionId: q.sessionQuestionId, optionId: correctOptionId, idempotencyKey: uuid(), participationToken: mehmetToken });
      expect(r.status).toBe(201);
      expected.mehmet.points += 80;
      expected.mehmet.correct += 1;
      await t.advance(6_000);
    }
    await t.advance(6_000);
    const s = await getState(t, ayse, session.id);
    expect(s.session.status).toBe('completed');
    expect(s.result).not.toBeNull();
    const ra = (await api<{ result: SessionResultView }>(t.baseUrl, ayse.token, 'GET', `/quiz/sessions/${session.id}/result`)).body.result;
    const rm = (await api<{ result: SessionResultView }>(t.baseUrl, mehmet.token, 'GET', `/quiz/sessions/${session.id}/result`)).body.result;
    expect(ra.totalPoints).toBe(expected.ayse.points);
    expect(ra.correctCount).toBe(expected.ayse.correct);
    expect(rm.totalPoints).toBe(expected.mehmet.points);
    expect(rm.correctCount).toBe(expected.mehmet.correct);
    expect(rm.rank).toBe(1);
    expect(ra.rank).toBe(2);
    expect(ra.participantCount).toBe(3);
    expect(ra.questions).toHaveLength(5);
    expect(ra.questions.map((q) => q.points)).toEqual([100, 0, 0, 0, 0]);
    expect(ra.leaderboard.find((l) => l.isMe)?.username).toBe(ayse.username);
    // quiz events were recorded as server facts
    const ev = await adminQuery<{ event_name: string; n: string }>(`select event_name, count(*) as n from app.analytics_events where quiz_session_id = '${session.id}' and producer = 'server' group by 1 order by 1`);
    if ('error' in ev) throw new Error(ev.error);
    expect(Object.fromEntries(ev.rows.map((r) => [r.event_name, Number(r.n)]))).toMatchObject({ quiz_joined: 3, answer_accepted: 6, quiz_completed: 3 });
  });
  it('results survive re-login and are reproducible from receipts', async () => {
    const fresh = await mintToken({ sub: ayse.sub, email: 'ayse@test.local' });
    const again = (await api<{ result: SessionResultView }>(t.baseUrl, fresh.token, 'GET', `/quiz/sessions/${session.id}/result`)).body.result;
    expect(again.totalPoints).toBe(expected.ayse.points);
    const history = await api(t.baseUrl, fresh.token, 'GET', '/quiz/history');
    expect(history.body.items[0].session.id).toBe(session.id);
    expect(history.body.items[0].totalPoints).toBe(expected.ayse.points);
    const sums = await adminQuery<{ participant_id: string; pts: string }>(`select participant_id, sum(points) as pts from app.answer_receipts where session_id = '${session.id}' group by 1`);
    const stored = await adminQuery<{ participant_id: string; total_points: number }>(`select participant_id, total_points from app.session_results where session_id = '${session.id}'`);
    if ('error' in sums || 'error' in stored) throw new Error('query failed');
    for (const s of stored.rows) {
      const fromReceipts = Number(sums.rows.find((x) => x.participant_id === s.participant_id)?.pts ?? 0);
      expect(s.total_points).toBe(fromReceipts);
    }
  });
  it('K12: result links to a related published card; opening it is recorded as a client event separate from server facts', async () => {
    const r = (await api<{ result: SessionResultView }>(t.baseUrl, ayse.token, 'GET', `/quiz/sessions/${session.id}/result`)).body.result;
    const related = r.questions.map((q) => q.relatedContent).find((c) => c);
    expect(related).toBeTruthy();
    const detail = await api(t.baseUrl, ayse.token, 'GET', `/content/${related!.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.body.length).toBeGreaterThan(50);
    const evId = uuid();
    const ingest = await api(t.baseUrl, ayse.token, 'POST', '/events', {
      events: [
        { eventId: evId, schemaVersion: 1, eventName: 'quiz_to_content_opened', eventTime: new Date().toISOString(), contentItemId: related!.id, quizSessionId: session.id },
        { eventId: evId, schemaVersion: 1, eventName: 'quiz_to_content_opened', eventTime: new Date().toISOString(), contentItemId: related!.id, quizSessionId: session.id },
      ],
    });
    expect(ingest.body).toEqual({ accepted: 1, duplicates: 1 });
    const bad = await api(t.baseUrl, ayse.token, 'POST', '/events', { events: [{ eventId: uuid(), schemaVersion: 1, eventName: 'answer_accepted', eventTime: new Date().toISOString() }] });
    expect(bad.body.error.code).toBe('VALIDATION_FAILED'); // clients cannot claim server facts
    const rows = await adminQuery<{ producer: string; event_name: string }>(`select producer, event_name from app.analytics_events where id = '${evId}'`);
    if ('error' in rows) throw new Error(rows.error);
    expect(rows.rows[0]).toEqual({ producer: 'client', event_name: 'quiz_to_content_opened' });
  });
});
