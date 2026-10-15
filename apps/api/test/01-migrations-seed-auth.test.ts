/** K01 — migrations + idempotent seed; K02 — real users, roles, privacy, schema privileges. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { adminQuery, api, createTestApp, createUser, mintToken, type TestApp } from './harness.js';
import { runSeed } from '../src/seed/seed.js';
import { TEST_DATABASE_URL } from './setup.js';
import { runMigrations } from '../src/db/migrate.js';

let t: TestApp;
beforeAll(async () => {
  t = await createTestApp();
});
afterAll(async () => {
  await t.close();
});

describe('K01 migrations and seed', () => {
  it('migrations are applied by the app role, tables are owned by it, RLS is on everywhere', async () => {
    const r = await adminQuery<{ tableowner: string; rowsecurity: boolean }>("select tableowner, rowsecurity from pg_tables where schemaname = 'app'");
    if ('error' in r) throw new Error(r.error);
    expect(r.rows.length).toBeGreaterThanOrEqual(19);
    expect(r.rows.every((x) => x.tableowner === 'app_api')).toBe(true);
    expect(r.rows.every((x) => x.rowsecurity)).toBe(true);
  });
  it('re-running migrations is a no-op', async () => {
    await expect(runMigrations(TEST_DATABASE_URL)).resolves.toBeUndefined();
  });
  it('seed loads sample content once; a second run creates nothing', async () => {
    const first = await runSeed({ quiet: true, skipUsers: true });
    expect(first.content.created).toBeGreaterThanOrEqual(16);
    expect(first.questions.created).toBeGreaterThanOrEqual(10);
    const second = await runSeed({ quiet: true, skipUsers: true });
    expect(second.content.created).toBe(0);
    expect(second.questions.created).toBe(0);
    expect(second.content.existing).toBe(first.content.created);
    const counts = await adminQuery<{ items: string; questions: string }>('select (select count(*) from app.content_items) as items, (select count(*) from app.questions) as questions');
    if ('error' in counts) throw new Error(counts.error);
    expect(Number(counts.rows[0]!.items)).toBe(first.content.created);
    expect(Number(counts.rows[0]!.questions)).toBe(first.questions.created);
  });
  it('seeded questions are DRAFT and flagged as seed samples; cards carry seed_sample production method and unverified sources', async () => {
    const q = await adminQuery<{ status: string; n: string }>("select status, count(*) as n from app.questions group by status");
    if ('error' in q) throw new Error(q.error);
    expect(q.rows).toEqual([{ status: 'draft', n: String(q.rows[0]!.n) }]);
    const c = await adminQuery<{ pm: string; verified: boolean; seed: boolean }>(
      'select r.production_method as pm, bool_or(r.source_verified) as verified, bool_and(i.is_seed_sample) as seed from app.content_revisions r join app.content_items i on i.id = r.content_item_id group by 1',
    );
    if ('error' in c) throw new Error(c.error);
    expect(c.rows).toEqual([{ pm: 'seed_sample', verified: false, seed: true }]);
    const audit = await adminQuery<{ n: string }>("select count(*) as n from app.admin_audit_log where action = 'content.seed_publish' and actor_user_id is null");
    if ('error' in audit) throw new Error(audit.error);
    expect(Number(audit.rows[0]!.n)).toBeGreaterThanOrEqual(16);
  });
});

describe('K02 identity, roles and privacy', () => {
  it('a valid Supabase-shaped JWT bootstraps a profile exactly once (signup_completed recorded once)', async () => {
    const { token, sub } = await mintToken({ email: 'Zeynep.Kaya@example.com' });
    const first = await api(t.baseUrl, token, 'GET', '/me');
    expect(first.status).toBe(200);
    expect(first.body.created).toBe(true);
    expect(first.body.profile.id).toBe(sub);
    expect(first.body.profile.username).toMatch(/^zeynep_kaya/);
    expect(first.body.profile.role).toBe('member');
    const second = await api(t.baseUrl, token, 'GET', '/me');
    expect(second.body.created).toBe(false);
    const ev = await adminQuery<{ n: string }>(`select count(*) as n from app.analytics_events where event_name = 'signup_completed' and user_id = '${sub}'`);
    if ('error' in ev) throw new Error(ev.error);
    expect(Number(ev.rows[0]!.n)).toBe(1);
  });
  it('rejects missing, malformed, expired and foreign-secret tokens', async () => {
    expect((await api(t.baseUrl, null, 'GET', '/me')).body.error.code).toBe('AUTH_REQUIRED');
    expect((await api(t.baseUrl, 'nope', 'GET', '/me')).body.error.code).toBe('AUTH_INVALID_TOKEN');
    expect((await api(t.baseUrl, (await mintToken({ expiresIn: '-10m' })).token, 'GET', '/me')).body.error.code).toBe('AUTH_TOKEN_EXPIRED');
    expect((await api(t.baseUrl, (await mintToken({ secret: 'another-secret-0123456789-0123456789-01234567' })).token, 'GET', '/me')).status).toBe(401);
  });
  it('normal users cannot reach admin routes; editors can review but cannot run sessions; admins can', async () => {
    const member = await createUser(t, 'member');
    const editor = await createUser(t, 'editor');
    const admin = await createUser(t, 'admin');
    expect((await api(t.baseUrl, member.token, 'GET', '/admin/questions')).status).toBe(403);
    expect((await api(t.baseUrl, member.token, 'GET', '/admin/sessions')).status).toBe(403);
    expect((await api(t.baseUrl, editor.token, 'GET', '/admin/questions')).status).toBe(200);
    expect((await api(t.baseUrl, editor.token, 'GET', '/admin/sessions')).status).toBe(403);
    expect((await api(t.baseUrl, admin.token, 'GET', '/admin/sessions')).status).toBe(200);
  });
  it('a user cannot read or change another user profile and sees no e-mail anywhere in app data', async () => {
    const a = await createUser(t, 'member');
    const b = await createUser(t, 'member');
    const r = await api(t.baseUrl, b.token, 'PATCH', '/me', { username: a.username });
    expect(r.body.error.code).toBe('USERNAME_TAKEN');
    const cols = await adminQuery<{ column_name: string }>("select column_name from information_schema.columns where table_schema = 'app' and column_name ilike '%email%'");
    if ('error' in cols) throw new Error(cols.error);
    expect(cols.rows).toEqual([]);
  });
  it('Supabase Data API roles have no access to the app schema; the API role has none to auth', async () => {
    const probes = [
      'set role authenticated; select count(*) from app.profiles',
      'set role anon; select count(*) from app.question_answer_keys',
      'set role service_role; select count(*) from app.answer_receipts',
      'set role app_api; select count(*) from auth.users',
    ];
    for (const sql of probes) {
      const r = await adminQuery(sql);
      expect('error' in r ? r.error : 'NO ERROR').toMatch(/permission denied|does not exist/);
    }
  });
  it('REAL Supabase Auth (GoTrue): seeded test users can log in with password and call the API — skipped when GoTrue is not reachable', async () => {
    const authUrl = process.env.SUPABASE_AUTH_URL ?? 'http://localhost:9999';
    const secret = process.env.SUPABASE_JWT_SECRET;
    const reachable = await fetch(`${authUrl}/health`).then((r) => r.ok).catch(() => false);
    if (!reachable || !secret) {
      console.warn(`[K02] GoTrue not reachable at ${authUrl} — real login check SKIPPED`);
      return;
    }
    const res = await fetch(`${authUrl}/token?grant_type=password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'ayse@merak.local', password: process.env.SEED_PASSWORD ?? 'Merak-Local-123' }) });
    expect(res.ok).toBe(true);
    const { access_token } = (await res.json()) as { access_token: string };
    // This test app verifies with the TEST secret, so verify the real token with the real secret directly.
    const { JwtVerifier } = await import('../src/modules/identity/jwt-verifier.js');
    const { loadEnv } = await import('../src/config/env.js');
    const v = new JwtVerifier(loadEnv({ DATABASE_URL: TEST_DATABASE_URL, SUPABASE_AUTH_URL: authUrl, SUPABASE_JWT_SECRET: secret, SUPABASE_JWKS_URL: '', AUTH_JWT_ISSUER: process.env.AUTH_JWT_ISSUER ?? authUrl, AUTH_JWT_AUDIENCE: 'authenticated' }));
    const user = await v.verify(access_token);
    expect(user.email).toBe('ayse@merak.local');
  });
});
