#!/usr/bin/env node
/**
 * Real Supabase Auth (GoTrue) flow against a running local stack + API. No mocks, no bypass.
 *   AUTH_URL=http://localhost:9999 API_URL=http://localhost:3000 node scripts/smoke/auth-flow.mjs
 * Prints one JSON line per step; tokens are never printed.
 */
import { createHmac, randomUUID } from 'node:crypto';

const AUTH = process.env.AUTH_URL ?? 'http://localhost:9999';
const API = process.env.API_URL ?? 'http://localhost:3000';
const results = [];
const step = (name, ok, detail = {}) => {
  results.push({ name, ok });
  console.log(JSON.stringify({ step: name, ok, ...detail }));
};
const json = async (res) => {
  const t = await res.text();
  try { return JSON.parse(t); } catch { return { raw: t.slice(0, 120) }; }
};
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const header = (jwt) => JSON.parse(Buffer.from(jwt.split('.')[0], 'base64url').toString());
const claims = (jwt) => JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString());
const me = (token) => fetch(`${API}/me`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

const email = `smoke-${randomUUID().slice(0, 8)}@merak.local`;
const password = 'Smoke-Pass-123';

let r = await fetch(`${AUTH}/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
let body = await json(r);
step('gotrue.signup', r.ok && !!body.access_token, { status: r.status });
const signupToken = body.access_token;
const h = header(signupToken);
const c = claims(signupToken);
step('jwt.shape', h.alg === 'HS256' && c.aud === 'authenticated' && typeof c.sub === 'string', { alg: h.alg, iss: c.iss, aud: c.aud, hasExp: typeof c.exp === 'number' });

r = await me(signupToken); body = await json(r);
step('api.me.first_call_creates_profile', r.status === 200 && body.created === true, { status: r.status });

r = await fetch(`${AUTH}/token?grant_type=password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
body = await json(r);
const access1 = body.access_token; const refresh1 = body.refresh_token;
step('gotrue.password_login', r.ok && !!access1 && !!refresh1, { status: r.status });

r = await fetch(`${AUTH}/token?grant_type=refresh_token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: refresh1 }) });
body = await json(r);
const access2 = body.access_token; const refresh2 = body.refresh_token;
step('gotrue.refresh', r.ok && !!access2 && refresh2 !== refresh1, { status: r.status, rotated: refresh2 !== refresh1 });

r = await me(access2); body = await json(r);
step('api.me.refreshed_token_accepted', r.status === 200 && body.created === false, { status: r.status });

const [hh, pp, ss] = access2.split('.');
const tampered = `${hh}.${pp}.${ss.slice(0, -2)}${ss.endsWith('AA') ? 'BB' : 'AA'}`;
r = await me(tampered); body = await json(r);
step('api.rejects_tampered_signature', r.status === 401 && body.error?.code === 'AUTH_INVALID_TOKEN', { status: r.status, code: body.error?.code });

const forgedPayload = { ...claims(access2), exp: Math.floor(Date.now() / 1000) + 600 };
const forgedSig = createHmac('sha256', 'not-the-real-secret-0123456789-0123456789').update(`${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(forgedPayload)}`).digest('base64url');
r = await me(`${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(forgedPayload)}.${forgedSig}`); body = await json(r);
step('api.rejects_foreign_secret', r.status === 401 && body.error?.code === 'AUTH_INVALID_TOKEN', { status: r.status, code: body.error?.code });

r = await me(`${b64({ alg: 'none', typ: 'JWT' })}.${b64(forgedPayload)}.`); body = await json(r);
step('api.rejects_alg_none', r.status === 401, { status: r.status, code: body.error?.code });

r = await me(null); body = await json(r);
step('api.rejects_missing_token', r.status === 401 && body.error?.code === 'AUTH_REQUIRED', { status: r.status, code: body.error?.code });

r = await fetch(`${AUTH}/logout?scope=global`, { method: 'POST', headers: { Authorization: `Bearer ${access2}` } });
step('gotrue.logout', r.status === 204 || r.ok, { status: r.status });

r = await fetch(`${AUTH}/token?grant_type=refresh_token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: refresh2 }) });
body = await json(r);
step('gotrue.refresh_after_logout_rejected', !r.ok, { status: r.status, error: body.error_code ?? body.error ?? body.msg });

// Known M0 property (documented, not a pass/fail gate): the API verifies JWTs statelessly, so an access
// token issued before logout stays valid until its exp (GOTRUE_JWT_EXP=3600 s).
r = await me(access2);
console.log(JSON.stringify({ step: 'info.access_token_after_logout', status: r.status, note: 'stateless JWT: valid until exp; logout revokes refresh tokens only' }));

const failed = results.filter((x) => !x.ok).map((x) => x.name);
console.log(JSON.stringify({ summary: { steps: results.length, failed } }));
process.exit(failed.length ? 1 : 0);
