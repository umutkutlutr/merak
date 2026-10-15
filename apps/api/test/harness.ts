import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SignJWT } from 'jose';
import { Client } from 'pg';
import { eq } from 'drizzle-orm';
import { io, type Socket } from 'socket.io-client';
import type { AdminQuestion, AdminSession, SessionSnapshot } from '@merak/contracts';
import { createApp } from '../src/main.js';
import { ClockService } from '../src/common/clock.js';
import { DB, PG_POOL } from '../src/db/db.module.js';
import type { Db } from '../src/db/client.js';
import { profiles } from '../src/db/schema/index.js';
import { SchedulerLeaderService } from '../src/modules/live-quiz/scheduler-leader.service.js';
import { SchedulerService } from '../src/modules/live-quiz/scheduler.service.js';
import { TEST_ADMIN_DATABASE_URL, TEST_AUDIENCE, TEST_ISSUER, TEST_JWT_SECRET } from './setup.js';
import type { Pool } from 'pg';

export interface TestApp {
  app: NestExpressApplication;
  baseUrl: string;
  db: Db;
  clock: ClockService;
  scheduler: SchedulerService;
  /** Advance the test clock and run scheduler passes until nothing is due. */
  advance(ms: number): Promise<void>;
  close(): Promise<void>;
}

/** Uses the SAME bootstrap as production (main.ts createApp): body parser, limits, CORS, guards, middleware order. */
export async function createTestApp(): Promise<TestApp> {
  const app = await createApp();
  await app.listen(0);
  const port = (app.getHttpServer().address() as AddressInfo).port;
  const clock = app.get(ClockService);
  clock.__freezeForTests(Date.now());
  const scheduler = app.get(SchedulerService);
  const leader = app.get(SchedulerLeaderService);
  await leader.tryAcquire();
  const db = app.get<Db>(DB);
  return {
    app,
    baseUrl: `http://127.0.0.1:${port}`,
    db,
    clock,
    scheduler,
    async advance(ms) {
      clock.__freezeForTests(clock.now() + ms);
      for (let i = 0; i < 5; i++) {
        const applied = await scheduler.tick();
        if (applied.length === 0) break;
      }
    },
    async close() {
      await leader.release();
      await app.close();
      await app.get<Pool>(PG_POOL).end().catch(() => undefined);
    },
  };
}

export interface TokenOpts {
  sub?: string;
  email?: string;
  expiresIn?: string;
  issuer?: string;
  audience?: string;
  secret?: string;
  extra?: Record<string, unknown>;
}

export async function mintToken(opts: TokenOpts = {}): Promise<{ token: string; sub: string }> {
  const sub = opts.sub ?? randomUUID();
  const token = await new SignJWT({ email: opts.email ?? `${sub.slice(0, 8)}@test.local`, role: 'authenticated', aud: opts.audience ?? TEST_AUDIENCE, ...(opts.extra ?? {}) })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(sub)
    .setIssuer(opts.issuer ?? TEST_ISSUER)
    .setIssuedAt()
    .setExpirationTime(opts.expiresIn ?? '1h')
    .sign(new TextEncoder().encode(opts.secret ?? TEST_JWT_SECRET));
  return { token, sub };
}

export interface ApiResponse<T = any> {
  status: number;
  body: T;
}

export async function api<T = any>(baseUrl: string, token: string | null, method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<ApiResponse<T>> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    /* non-json */
  }
  return { status: res.status, body: parsed as T };
}

export interface TestUser {
  sub: string;
  token: string;
  username: string;
}

/** Creates an authenticated user (profile bootstrapped via GET /me) with the given role. */
export async function createUser(t: TestApp, role: 'member' | 'editor' | 'admin' = 'member', name?: string): Promise<TestUser> {
  const { token, sub } = await mintToken({ email: `${name ?? role}-${randomUUID().slice(0, 6)}@test.local` });
  const me = await api(t.baseUrl, token, 'GET', '/me');
  if (me.status !== 200) throw new Error(`bootstrap failed: ${JSON.stringify(me.body)}`);
  if (role !== 'member') await t.db.update(profiles).set({ role }).where(eq(profiles.id, sub));
  return { sub, token, username: me.body.profile.username };
}

/** Pushes a question through review -> approved -> published as the given editor (from whatever state it is in). */
export async function publishQuestion(t: TestApp, editor: TestUser, id: string): Promise<AdminQuestion> {
  const current = (await api<AdminQuestion>(t.baseUrl, editor.token, 'GET', `/admin/questions/${id}`)).body;
  const steps: string[] = [];
  if (current.status === 'archived') steps.push('reopen', 'submit_review', 'approve', 'publish');
  else if (current.status === 'draft' || current.status === 'rejected') steps.push('submit_review', 'approve', 'publish');
  else if (current.status === 'review') steps.push('approve', 'publish');
  else if (current.status === 'approved') steps.push('publish');
  for (const action of steps) {
    const r = await api(t.baseUrl, editor.token, 'POST', `/admin/questions/${id}/${action}`, action === 'approve' ? { reason: 'test approval' } : {});
    if (r.status >= 300) throw new Error(`${action} failed: ${JSON.stringify(r.body)}`);
  }
  return (await api<AdminQuestion>(t.baseUrl, editor.token, 'GET', `/admin/questions/${id}`)).body;
}

export async function scheduleSession(
  t: TestApp,
  admin: TestUser,
  questionIds: string[],
  opts: { startInMs?: number; questionDurationMs?: number; revealDurationMs?: number; lobbyLeadMs?: number; title?: string } = {},
): Promise<ApiResponse<AdminSession>> {
  return api<AdminSession>(t.baseUrl, admin.token, 'POST', '/admin/sessions', {
    title: opts.title ?? 'test session',
    scheduledStartAt: new Date(t.clock.now() + (opts.startInMs ?? 120_000)).toISOString(),
    questionIds,
    rulesOverride: {
      questionDurationMs: opts.questionDurationMs ?? 12_000,
      revealDurationMs: opts.revealDurationMs ?? 6_000,
      lobbyLeadMs: opts.lobbyLeadMs ?? 60_000,
    },
  });
}

export async function joinSession(t: TestApp, user: TestUser, sessionId: string, participationToken?: string) {
  return api(t.baseUrl, user.token, 'POST', `/quiz/sessions/${sessionId}/join`, participationToken ? { participationToken } : {});
}

export async function getState(t: TestApp, user: TestUser, sessionId: string): Promise<SessionSnapshot> {
  const r = await api<SessionSnapshot>(t.baseUrl, user.token, 'GET', `/quiz/sessions/${sessionId}/state`);
  if (r.status !== 200) throw new Error(`state failed: ${JSON.stringify(r.body)}`);
  return r.body;
}

export async function submitAnswer(t: TestApp, user: TestUser, sessionId: string, body: Record<string, unknown>) {
  return api(t.baseUrl, user.token, 'POST', `/quiz/sessions/${sessionId}/answers`, body);
}

export function connectWs(baseUrl: string, token: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = io(baseUrl, { auth: { token }, transports: ['websocket'], reconnection: false });
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', (err) => reject(err));
  });
}

export function emitAck<T = any>(socket: Socket, event: string, payload: unknown): Promise<T> {
  return new Promise((resolve) => socket.emit(event, payload, (ack: T) => resolve(ack)));
}

export function waitFor<T = any>(socket: Socket, event: string, timeoutMs = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), timeoutMs);
    socket.once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

/** Superuser helper for privilege probes. */
export async function adminQuery<T = any>(sql: string): Promise<{ rows: T[] } | { error: string }> {
  const c = new Client({ connectionString: TEST_ADMIN_DATABASE_URL });
  await c.connect();
  try {
    const r = await c.query(sql);
    return { rows: r.rows as T[] };
  } catch (err) {
    return { error: (err as Error).message };
  } finally {
    await c.end();
  }
}

/** Reads the correct option id of a question revision straight from the DB (test oracle only). */
export async function correctOptionFor(t: TestApp, sessionQuestionId: string): Promise<{ correctOptionId: string; questionRevisionId: string }> {
  const r = await adminQuery<{ correct_option_id: string; question_revision_id: string }>(
    `select k.correct_option_id, k.question_revision_id from app.session_questions sq join app.question_answer_keys k on k.question_revision_id = sq.question_revision_id where sq.id = '${sessionQuestionId}'`,
  );
  if ('error' in r || !r.rows[0]) throw new Error('no key');
  return { correctOptionId: r.rows[0].correct_option_id, questionRevisionId: r.rows[0].question_revision_id };
}

export const uuid = () => randomUUID();
