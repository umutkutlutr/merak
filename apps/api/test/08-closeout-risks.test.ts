/**
 * M0 closeout — targeted evidence for the risks in M0_KAPANIS_PROMPTU §5 that the earlier suites
 * did not discriminate:
 *  R5  a request received before closesAt but processed after the reveal follows the receivedAt rule;
 *      receivedAt is stamped only after the full body arrived (slow-body requests cannot pick after reveal);
 *  R1/R10 answer transactions are serialised with session transitions (no receipt after completion);
 *      a replay with the same key still returns the old receipt after the session completed;
 *  R4  a second API process does not cancel or advance a healthy live session; losing the lock
 *      connection stops the leader from advancing; a process that takes over from a dead leader cancels
 *      the interrupted session (M0 restart policy) instead of resuming and ranking it.
 */
import http from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client } from 'pg';
import type { AdminQuestion, AdminSession } from '@merak/contracts';
import { adminQuery, api, correctOptionFor, createTestApp, createUser, getState, joinSession, publishQuestion, scheduleSession, submitAnswer, uuid, type TestApp, type TestUser } from './harness.js';
import { TEST_ADMIN_DATABASE_URL } from './setup.js';
import { runSeed } from '../src/seed/seed.js';
import { createApp } from '../src/main.js';
import { getEnv, setEnvForTests } from '../src/config/env.js';
import { EngineService } from '../src/modules/live-quiz/engine.service.js';
import { SchedulerLeaderService, SCHEDULER_LOCK_KEY } from '../src/modules/live-quiz/scheduler-leader.service.js';
import { SchedulerService } from '../src/modules/live-quiz/scheduler.service.js';
import { ClockService } from '../src/common/clock.js';
import { PG_POOL } from '../src/db/db.module.js';
import type { Pool } from 'pg';
import type { AddressInfo } from 'node:net';

let t: TestApp;
let admin: TestUser;
let questionIds: string[];

beforeAll(async () => {
  t = await createTestApp();
  await runSeed({ quiet: true, skipUsers: true });
  const editor = await createUser(t, 'editor');
  admin = await createUser(t, 'admin');
  const drafts = (await api<{ items: AdminQuestion[] }>(t.baseUrl, editor.token, 'GET', '/admin/questions')).body.items;
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

describe('R5 receivedAt rule at the close boundary', () => {
  it('received 1 ms before closesAt but processed after the reveal → accepted with 60 points; received at closesAt → rejected', async () => {
    const { session, users } = await liveSession(2);
    const [a, b] = users as [{ u: TestUser; token: string }, { u: TestUser; token: string }];
    const q = (await getState(t, a.u, session.id)).currentQuestion!.open!;
    const closesAt = Date.parse(q.closesAt);
    const { correctOptionId } = await correctOptionFor(t, q.sessionQuestionId);
    // The scheduler closes and reveals first …
    const revealed = await t.app.get(EngineService).closeAndReveal(session.id, q.sessionQuestionId, new Date(closesAt));
    expect(revealed?.kind).toBe('revealed');
    // … then a request whose trusted receipt time is 1 ms before close is processed.
    t.clock.__freezeForTests(closesAt - 1);
    const late = await submitAnswer(t, a.u, session.id, { sessionQuestionId: q.sessionQuestionId, optionId: correctOptionId, idempotencyKey: uuid(), participationToken: a.token });
    expect(late.status).toBe(201);
    t.clock.__freezeForTests(closesAt);
    const atClose = await submitAnswer(t, b.u, session.id, { sessionQuestionId: q.sessionQuestionId, optionId: correctOptionId, idempotencyKey: uuid(), participationToken: b.token });
    expect(atClose.body.error.code).toBe('QUESTION_CLOSED');
    const snap = await getState(t, a.u, session.id);
    const mine = snap.myParticipation!.answers.find((x) => x.sessionQuestionId === q.sessionQuestionId)!;
    expect(mine.elapsedMs).toBe(q.durationMs - 1);
    expect(mine.points).toBe(60);
    expect(mine.isCorrect).toBe(true);
  });

  it('slow body: headers sent before closesAt, body after → receivedAt is taken after the body, so it is rejected', async () => {
    const { session, users } = await liveSession(1);
    const [a] = users as [{ u: TestUser; token: string }];
    const q = (await getState(t, a.u, session.id)).currentQuestion!.open!;
    const closesAt = Date.parse(q.closesAt);
    t.clock.__freezeForTests(Date.parse(q.opensAt) + 1_000); // well inside the window while headers arrive
    const body = JSON.stringify({ sessionQuestionId: q.sessionQuestionId, optionId: q.options[0]!.optionId, idempotencyKey: uuid(), participationToken: a.token });
    const url = new URL(`${t.baseUrl}/quiz/sessions/${session.id}/answers`);
    const result = await new Promise<{ status: number; body: any }>((resolve, reject) => {
      const req = http.request(
        { method: 'POST', hostname: url.hostname, port: url.port, path: url.pathname, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), Authorization: `Bearer ${a.u.token}` } },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => resolve({ status: res.statusCode ?? 0, body: JSON.parse(data) }));
        },
      );
      req.on('error', reject);
      req.flushHeaders();
      setTimeout(() => {
        t.clock.__freezeForTests(closesAt); // the question closes while the body is still in flight
        req.end(body);
      }, 300);
    });
    expect(result.status).toBe(409);
    expect(result.body.error.code).toBe('QUESTION_CLOSED');
  });
});

describe('R1/R10 serialisation with transitions and replay after completion', () => {
  it('an answer in flight while a transition holds the session lock waits, then sees the committed state (no receipt after completion)', async () => {
    const { session, users } = await liveSession(1);
    const [a] = users as [{ u: TestUser; token: string }];
    const q = (await getState(t, a.u, session.id)).currentQuestion!.open!;
    const tx = new Client({ connectionString: TEST_ADMIN_DATABASE_URL });
    await tx.connect();
    try {
      await tx.query('begin');
      await tx.query('select id from app.quiz_sessions where id = $1 for update', [session.id]); // what every engine transition does
      let settled = false;
      const pending = submitAnswer(t, a.u, session.id, { sessionQuestionId: q.sessionQuestionId, optionId: q.options[0]!.optionId, idempotencyKey: uuid(), participationToken: a.token }).then((r) => {
        settled = true;
        return r;
      });
      await new Promise((r) => setTimeout(r, 400));
      expect(settled).toBe(false); // blocked behind the transition
      await tx.query("update app.quiz_sessions set status = 'completed', completed_at = now() where id = $1", [session.id]);
      await tx.query('commit');
      const res = await pending;
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('SESSION_COMPLETED');
    } finally {
      await tx.end();
    }
    const n = await adminQuery<{ n: string }>(`select count(*) as n from app.answer_receipts where session_id = '${session.id}'`);
    if ('error' in n) throw new Error(n.error);
    expect(Number(n.rows[0]!.n)).toBe(0);
  });

  it('after the session completed, the same idempotency key still returns the original receipt; a new key is refused', async () => {
    const { session, users } = await liveSession(1);
    const [a] = users as [{ u: TestUser; token: string }];
    const q = (await getState(t, a.u, session.id)).currentQuestion!.open!;
    const key = uuid();
    const body = { sessionQuestionId: q.sessionQuestionId, optionId: q.options[0]!.optionId, idempotencyKey: key, participationToken: a.token };
    const first = await submitAnswer(t, a.u, session.id, body);
    expect(first.status).toBe(201);
    for (let i = 0; i < 5; i++) {
      await t.advance(12_000);
      await t.advance(6_000);
    }
    expect((await getState(t, a.u, session.id)).session.status).toBe('completed');
    const replay = await submitAnswer(t, a.u, session.id, body);
    expect(replay.status).toBe(201);
    expect(replay.body.replayed).toBe(true);
    expect(replay.body.receiptId).toBe(first.body.receiptId);
    const fresh = await submitAnswer(t, a.u, session.id, { ...body, idempotencyKey: uuid(), optionId: q.options[1]!.optionId });
    expect(['ANSWER_ALREADY_ACCEPTED', 'SESSION_COMPLETED']).toContain(fresh.body.error.code);
  });
});

describe('R4 single scheduler authority', () => {
  it('a second API process started during a healthy live session neither cancels nor advances it', async () => {
    const { session, users } = await liveSession(1);
    const [a] = users as [{ u: TestUser; token: string }];
    const before = await getState(t, a.u, session.id);
    expect(before.session.status).toBe('live');
    const original = getEnv();
    setEnvForTests({ ...original, QUIZ_SCHEDULER_ENABLED: true }); // the second process runs its scheduler + restart recovery
    const app2 = await createApp();
    setEnvForTests(original);
    try {
      await app2.listen(0); // runs onApplicationBootstrap → tryAcquire → (not leader) → no recovery
      const port = (app2.getHttpServer().address() as AddressInfo).port;
      const ready = (await (await fetch(`http://127.0.0.1:${port}/ready`)).json()) as { schedulerLeader: boolean };
      expect(ready.schedulerLeader).toBe(false);
      expect(app2.get(SchedulerLeaderService).isLeader).toBe(false);
      // On app2's clock Q1 is already overdue, so a leader would close it: app2 must not.
      app2.get(ClockService).__freezeForTests(t.clock.now() + 13_000);
      expect(await app2.get(SchedulerService).tick()).toEqual([]);
      expect(await app2.get(SchedulerService).takeOver()).toEqual([]); // the healthy leader still holds the lock
      await new Promise((r) => setTimeout(r, 600)); // let app2's real 250 ms ticker run a few passes
      const mid = await getState(t, a.u, session.id);
      expect(mid.session.status).toBe('live');
      expect(mid.stateVersion).toBe(before.stateVersion);
      expect(mid.session.cancelledReason).toBeNull();
      // The first process keeps authority and advances normally.
      await t.advance(12_000);
      expect((await getState(t, a.u, session.id)).currentQuestion!.status).toBe('revealed');
    } finally {
      await app2.close();
      await app2.get<Pool>(PG_POOL).end().catch(() => undefined);
    }
  });

  it('when the lock connection dies the process stops advancing until it holds the lock again', async () => {
    const { session, users } = await liveSession(1);
    const [a] = users as [{ u: TestUser; token: string }];
    const leader = t.app.get(SchedulerLeaderService);
    // Advisory locks are per database: only this test database's holder matters (another API on the same
    // cluster, e.g. a demo server on the `merak` database, holds its own independent lock).
    const holder = await adminQuery<{ pid: number }>(
      `select pid from pg_locks where locktype = 'advisory' and objid = ${SCHEDULER_LOCK_KEY} and granted and database = (select oid from pg_database where datname = current_database())`,
    );
    if ('error' in holder) throw new Error(holder.error);
    expect(holder.rows).toHaveLength(1);
    await adminQuery(`select pg_terminate_backend(${holder.rows[0]!.pid})`);
    await new Promise((r) => setTimeout(r, 200));
    const v0 = (await getState(t, a.u, session.id)).stateVersion;
    t.clock.__freezeForTests(t.clock.now() + 12_000); // Q1 is due to close
    const applied = await t.scheduler.tick();
    expect(applied).toEqual([]);
    expect(leader.isLeader).toBe(false);
    expect((await getState(t, a.u, session.id)).stateVersion).toBe(v0);
    expect(await leader.tryAcquire()).toBe(true); // lock is free again → reacquire
    const resumed = await t.scheduler.tick();
    expect(resumed.map((x) => x.kind)).toContain('revealed');
  });

  it('a process that takes over from a leader that died cancels the interrupted session instead of ranking it', async () => {
    const { session, users } = await liveSession(1);
    const [a] = users as [{ u: TestUser; token: string }];
    const leader = t.app.get(SchedulerLeaderService);
    const original = getEnv();
    setEnvForTests({ ...original, QUIZ_SCHEDULER_ENABLED: true });
    const app2 = await createApp();
    setEnvForTests(original);
    try {
      await app2.listen(0);
      const scheduler2 = app2.get(SchedulerService);
      expect(await scheduler2.takeOver()).toEqual([]); // leader alive: nothing to take over
      await leader.release(); // the leader process dies: its lock connection is gone
      const taken = await scheduler2.takeOver();
      expect(app2.get(SchedulerLeaderService).isLeader).toBe(true);
      expect(taken.map((x) => x.sessionId)).toContain(session.id);
      const after = await getState(t, a.u, session.id);
      expect(after.session.status).toBe('cancelled');
      expect(after.session.cancelledReason).toBe('server_restart');
      const result = await api(t.baseUrl, a.u.token, 'GET', `/quiz/sessions/${session.id}/result`);
      expect(result.status).toBe(409); // an interrupted session is never ranked
    } finally {
      await app2.close();
      await app2.get<Pool>(PG_POOL).end().catch(() => undefined);
      expect(await leader.tryAcquire()).toBe(true); // hand authority back to the test app for later tests
    }
  });
});
