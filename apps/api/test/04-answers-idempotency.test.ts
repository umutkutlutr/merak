/** K06 — duplicate/parallel/lost-ack submissions produce one answer and one score effect. K07 — client claims are ignored; bad identity is refused. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AdminQuestion, AdminSession, OpenQuestionView } from '@merak/contracts';
import { adminQuery, api, correctOptionFor, createTestApp, createUser, getState, joinSession, mintToken, publishQuestion, scheduleSession, submitAnswer, uuid, type TestApp, type TestUser } from './harness.js';
import { runSeed } from '../src/seed/seed.js';

let t: TestApp;
let admin: TestUser;
let session: AdminSession;
let ayse: TestUser;
let ayseToken: string;
let mehmet: TestUser;
let mehmetToken: string;
let zehra: TestUser;
let zehraToken: string;
let q1: OpenQuestionView;

beforeAll(async () => {
  t = await createTestApp();
  await runSeed({ quiet: true, skipUsers: true });
  const editor = await createUser(t, 'editor');
  admin = await createUser(t, 'admin');
  ayse = await createUser(t, 'member', 'ayse');
  const drafts = (await api<{ items: AdminQuestion[] }>(t.baseUrl, editor.token, 'GET', '/admin/questions')).body.items;
  const published = await Promise.all(drafts.slice(0, 5).map((d) => publishQuestion(t, editor, d.id)));
  session = (await scheduleSession(t, admin, published.map((p) => p.id), { startInMs: 10_000, lobbyLeadMs: 0 })).body;
  ayseToken = (await joinSession(t, ayse, session.id)).body.participationToken;
  mehmet = await createUser(t, 'member', 'mehmet');
  mehmetToken = (await joinSession(t, mehmet, session.id)).body.participationToken;
  zehra = await createUser(t, 'member', 'zehra');
  zehraToken = (await joinSession(t, zehra, session.id)).body.participationToken;
  await t.advance(10_000);
  q1 = (await getState(t, ayse, session.id)).currentQuestion!.open!;
});
afterAll(async () => {
  await t.close();
});

const receiptCount = async (participantHint: string) => {
  const r = await adminQuery<{ n: string }>(`select count(*) as n from app.answer_receipts r join app.session_participants p on p.id = r.participant_id where p.user_id = '${participantHint}' and r.session_id = '${session.id}'`);
  if ('error' in r) throw new Error(r.error);
  return Number(r.rows[0]!.n);
};

describe('K06 idempotency and single-answer guarantee', () => {
  it('8 parallel submissions with different keys => exactly one accepted, the rest ANSWER_ALREADY_ACCEPTED, one DB row', async () => {
    const results = await Promise.all(
      q1.options.concat(q1.options).map((o) => submitAnswer(t, ayse, session.id, { sessionQuestionId: q1.sessionQuestionId, optionId: o.optionId, idempotencyKey: uuid(), participationToken: ayseToken })),
    );
    const accepted = results.filter((r) => r.status === 201);
    const rejected = results.filter((r) => r.status !== 201);
    expect(accepted).toHaveLength(1);
    expect(rejected).toHaveLength(7);
    expect(new Set(rejected.map((r) => r.body.error.code))).toEqual(new Set(['ANSWER_ALREADY_ACCEPTED']));
    expect(await receiptCount(ayse.sub)).toBe(1);
  });
  it('same key + same payload replays the same receipt; same key + different payload is refused; a new key cannot change the answer', async () => {
    const key = uuid();
    const token = mehmetToken;
    const q = (await getState(t, mehmet, session.id)).currentQuestion!.open!;
    const [opt1, opt2] = q.options;
    const first = await submitAnswer(t, mehmet, session.id, { sessionQuestionId: q.sessionQuestionId, optionId: opt1!.optionId, idempotencyKey: key, participationToken: token });
    expect(first.status).toBe(201);
    expect(first.body.replayed).toBe(false);
    const replay = await submitAnswer(t, mehmet, session.id, { sessionQuestionId: q.sessionQuestionId, optionId: opt1!.optionId, idempotencyKey: key, participationToken: token });
    expect(replay.status).toBe(201);
    expect(replay.body.replayed).toBe(true);
    expect(replay.body.receiptId).toBe(first.body.receiptId);
    const conflict = await submitAnswer(t, mehmet, session.id, { sessionQuestionId: q.sessionQuestionId, optionId: opt2!.optionId, idempotencyKey: key, participationToken: token });
    expect(conflict.body.error.code).toBe('IDEMPOTENCY_KEY_CONFLICT');
    const change = await submitAnswer(t, mehmet, session.id, { sessionQuestionId: q.sessionQuestionId, optionId: opt2!.optionId, idempotencyKey: uuid(), participationToken: token });
    expect(change.body.error.code).toBe('ANSWER_ALREADY_ACCEPTED');
    expect(await receiptCount(mehmet.sub)).toBe(1);
    const stored = await adminQuery<{ option_id: string }>(`select option_id from app.answer_receipts where id = '${first.body.receiptId}'`);
    if ('error' in stored) throw new Error(stored.error);
    expect(stored.rows[0]!.option_id).toBe(opt1!.optionId);
  });
  it('lost ack: the receipt can be re-fetched by key, and the replay still works after the question closed', async () => {
    const token = zehraToken;
    const q = (await getState(t, zehra, session.id)).currentQuestion!.open!;
    const key = uuid();
    const first = await submitAnswer(t, zehra, session.id, { sessionQuestionId: q.sessionQuestionId, optionId: q.options[0]!.optionId, idempotencyKey: key, participationToken: token });
    expect(first.status).toBe(201);
    // "response lost" -> client asks by key
    const byKey = await api(t.baseUrl, zehra.token, 'GET', `/quiz/sessions/${session.id}/answers/${key}`);
    expect(byKey.body.receiptId).toBe(first.body.receiptId);
    // another user cannot read it
    expect((await api(t.baseUrl, ayse.token, 'GET', `/quiz/sessions/${session.id}/answers/${key}`)).status).toBe(404);
    // close the question; the previously accepted receipt is untouched and still replayable
    await t.advance(12_000);
    expect((await getState(t, zehra, session.id)).currentQuestion!.status).toBe('revealed');
    const replay = await submitAnswer(t, zehra, session.id, { sessionQuestionId: q.sessionQuestionId, optionId: q.options[0]!.optionId, idempotencyKey: key, participationToken: token });
    expect(replay.status).toBe(201);
    expect(replay.body.replayed).toBe(true);
    const fresh = await submitAnswer(t, zehra, session.id, { sessionQuestionId: q.sessionQuestionId, optionId: q.options[1]!.optionId, idempotencyKey: uuid(), participationToken: token });
    expect(['ANSWER_ALREADY_ACCEPTED', 'QUESTION_CLOSED']).toContain(fresh.body.error.code);
    expect(await receiptCount(zehra.sub)).toBe(1);
    const snap = await getState(t, zehra, session.id);
    expect(snap.myParticipation!.answers).toHaveLength(1);
    expect(snap.myParticipation!.answers[0]!.isCorrect).not.toBeNull();
  });
  it('a rejected invalid request does not consume the participant’s single answer', async () => {
    await t.advance(6_000); // Q2 opens
    const q = (await getState(t, ayse, session.id)).currentQuestion!.open!;
    expect(q.position).toBe(2);
    const bad = await submitAnswer(t, ayse, session.id, { sessionQuestionId: q.sessionQuestionId, optionId: uuid(), idempotencyKey: uuid(), participationToken: ayseToken });
    expect(bad.body.error.code).toBe('OPTION_INVALID');
    const badToken = await submitAnswer(t, ayse, session.id, { sessionQuestionId: q.sessionQuestionId, optionId: q.options[0]!.optionId, idempotencyKey: uuid(), participationToken: 'x'.repeat(40) });
    expect(badToken.body.error.code).toBe('PARTICIPATION_TOKEN_INVALID');
    const ok = await submitAnswer(t, ayse, session.id, { sessionQuestionId: q.sessionQuestionId, optionId: q.options[0]!.optionId, idempotencyKey: uuid(), participationToken: ayseToken });
    expect(ok.status).toBe(201);
    expect(await receiptCount(ayse.sub)).toBe(2);
  });
});

describe('K07 client claims and identity', () => {
  it('clientTimestamp / clientScore / userId in the body are ignored; the score comes from the server receipt time', async () => {
    await t.advance(12_000); // reveal Q2
    await t.advance(6_000); // Q3 opens
    const q = (await getState(t, ayse, session.id)).currentQuestion!.open!;
    expect(q.position).toBe(3);
    const { correctOptionId } = await correctOptionFor(t, q.sessionQuestionId);
    await t.advance(6_000); // half-way => 80 points
    const r = await submitAnswer(t, ayse, session.id, {
      sessionQuestionId: q.sessionQuestionId,
      optionId: correctOptionId,
      idempotencyKey: uuid(),
      participationToken: ayseToken,
      clientSentAt: q.opensAt, // claims "I answered instantly"
      clientRttMs: 0,
      clientTimestamp: q.opensAt,
      clientScore: 100,
      points: 100,
      elapsedMs: 0,
      userId: admin.sub,
      receivedAt: q.opensAt,
    });
    expect(r.status).toBe(201);
    await t.advance(6_000); // reveal
    const snap = await getState(t, ayse, session.id);
    const mine = snap.myParticipation!.answers.find((a) => a.position === 3)!;
    expect(mine.elapsedMs).toBe(6_000);
    expect(mine.points).toBe(80);
    const row = await adminQuery<{ client_sent_at: string | null; received_at: string }>(`select client_sent_at, received_at from app.answer_receipts where id = '${mine.receiptId}'`);
    if ('error' in row) throw new Error(row.error);
    expect(row.rows[0]!.client_sent_at).not.toBeNull(); // kept for diagnostics only
  });
  it('expired / foreign tokens and other users’ identities are refused on the answer endpoint', async () => {
    await t.advance(6_000); // Q4 opens
    const q = (await getState(t, ayse, session.id)).currentQuestion!.open!;
    const body = { sessionQuestionId: q.sessionQuestionId, optionId: q.options[0]!.optionId, idempotencyKey: uuid(), participationToken: ayseToken };
    const expired = await api(t.baseUrl, (await mintToken({ sub: ayse.sub, expiresIn: '-1m' })).token, 'POST', `/quiz/sessions/${session.id}/answers`, body);
    expect(expired.body.error.code).toBe('AUTH_TOKEN_EXPIRED');
    const forged = await api(t.baseUrl, (await mintToken({ sub: ayse.sub, secret: 'forged-secret-0123456789-0123456789-0123456789' })).token, 'POST', `/quiz/sessions/${session.id}/answers`, body);
    expect(forged.body.error.code).toBe('AUTH_INVALID_TOKEN');
    // Someone else with ayse's participation token but their own identity: not a participant.
    const stranger = await createUser(t, 'member', 'stranger');
    const impersonate = await api(t.baseUrl, stranger.token, 'POST', `/quiz/sessions/${session.id}/answers`, body);
    expect(impersonate.body.error.code).toBe('NOT_PARTICIPANT');
    expect(await receiptCount(ayse.sub)).toBe(3);
  });
  it('request limits: oversized bodies are refused and the answer endpoint is rate limited per user', async () => {
    const big = await fetch(`${t.baseUrl}/quiz/sessions/${session.id}/answers`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ayse.token}` }, body: JSON.stringify({ pad: 'x'.repeat(40_000) }) });
    expect(big.status).toBe(413);
    const q = (await getState(t, ayse, session.id)).currentQuestion!.open!;
    const burst = await Promise.all(
      Array.from({ length: 40 }, () => submitAnswer(t, ayse, session.id, { sessionQuestionId: q.sessionQuestionId, optionId: q.options[0]!.optionId, idempotencyKey: uuid(), participationToken: ayseToken })),
    );
    expect(burst.some((r) => r.status === 429 && r.body.error.code === 'RATE_LIMITED')).toBe(true);
  });
});
