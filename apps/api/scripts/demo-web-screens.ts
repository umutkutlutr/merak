/**
 * Browser demo: two independent users (separate browser contexts = separate sessions) play one
 * prize-less test session through the Expo WEB build, plus admin screens. Captures screenshots
 * into docs/reports/evidence/. This is a web preview, NOT a native iOS/Android verification.
 *
 *   API_URL / WEB_URL / ADMIN_URL env override defaults (3000 / 8081 / 5173).
 *   PW_CHROMIUM points at a Chromium binary when the Playwright-managed one is absent.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { chromium, type BrowserContext, type Page } from 'playwright';

const API = process.env.API_URL ?? 'http://localhost:3000';
const WEB = process.env.WEB_URL ?? 'http://localhost:8081';
const ADMIN = process.env.ADMIN_URL ?? 'http://localhost:5173';
const AUTH = process.env.SUPABASE_AUTH_URL ?? 'http://localhost:9999';
const PASSWORD = process.env.SEED_PASSWORD ?? 'Merak-Local-123';
const OUT = path.resolve(__dirname, '../../../docs/reports/evidence');
const START_IN_MS = Number(process.env.DEMO_START_IN_MS ?? 75_000);
const QUESTION_MS = 8_000;
const REVEAL_MS = 3_000;
const LOBBY_LEAD_MS = 25_000;

const t0 = Date.now();
const log = (who: string, msg: string) => console.log(`[+${String(Date.now() - t0).padStart(6)}ms] ${who.padEnd(7)} ${msg}`);
const summary: Record<string, unknown> = { startedAt: new Date().toISOString(), environment: 'Expo web (react-native-web) in headless Chromium via Playwright — NOT native', steps: [] as string[] };
const step = (s: string) => {
  (summary.steps as string[]).push(s);
  log('demo', s);
};

async function login(email: string): Promise<string> {
  const res = await fetch(`${AUTH}/token?grant_type=password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: PASSWORD }) });
  if (!res.ok) throw new Error(`login ${email} failed`);
  return ((await res.json()) as { access_token: string }).access_token;
}
async function api<T>(token: string, method: string, p: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${p}`, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
  const json = (await res.json()) as T & { error?: { code: string; message: string } };
  if (!res.ok) throw new Error(`${method} ${p} -> ${res.status} ${json.error?.code}: ${json.error?.message}`);
  return json;
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
  log('shot', name);
}

async function webLogin(ctx: BrowserContext, email: string): Promise<Page> {
  const page = await ctx.newPage();
  page.on('pageerror', (e) => log('pageerr', `${email}: ${e.message}`));
  await page.goto(WEB, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('login-email').waitFor({ timeout: 120_000 });
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(PASSWORD);
  await page.getByTestId('login-submit').click();
  await page.getByTestId('home-screen').waitFor({ timeout: 60_000 });
  await page.getByTestId('quiz-session-card').waitFor({ timeout: 30_000 }).catch(() => undefined);
  return page;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  // ---- API prep: editorial gate + schedule ----
  const [editor, admin] = await Promise.all([login('editor@merak.local'), login('admin@merak.local')]);
  const { items } = await api<{ items: Array<{ id: string; status: string }> }>(editor, 'GET', '/admin/questions');
  const pick = items.slice(0, 5);
  for (const q of pick) {
    let s = q.status;
    if (s === 'archived') { await api(editor, 'POST', `/admin/questions/${q.id}/reopen`, {}); s = 'draft'; }
    if (s === 'draft' || s === 'rejected') { await api(editor, 'POST', `/admin/questions/${q.id}/submit_review`, {}); s = 'review'; }
    if (s === 'review') { await api(editor, 'POST', `/admin/questions/${q.id}/approve`, { reason: 'TEST ONAYI — otomatik web demo, insan incelemesi değildir', approvalKind: 'automated_test' }); s = 'approved'; }
    if (s === 'approved') await api(editor, 'POST', `/admin/questions/${q.id}/publish`, {});
  }
  // The app's Yarış tab shows the earliest active session. Cancel leftovers (e.g. from an aborted
  // earlier run) so both browsers and the admin view refer to the session this run schedules.
  const open = await api<{ items: Array<{ id: string; status: string }> }>(admin, 'GET', '/admin/sessions');
  for (const s of open.items.filter((x) => ['scheduled', 'lobby', 'live'].includes(x.status))) {
    await api(admin, 'POST', `/admin/sessions/${s.id}/cancel`, { reason: 'Web demo öncesi temizlik: önceki demo oturumu' });
    step(`cancelled leftover session ${s.id} (${s.status})`);
  }
  const scheduledStartAt = new Date(Date.now() + START_IN_MS).toISOString();
  const session = await api<{ id: string }>(admin, 'POST', '/admin/sessions', { title: 'Web demo — ödülsüz test', scheduledStartAt, questionIds: pick.map((q) => q.id), rulesOverride: { questionDurationMs: QUESTION_MS, revealDurationMs: REVEAL_MS, lobbyLeadMs: LOBBY_LEAD_MS }, reason: 'demo:web' });
  step(`session ${session.id} scheduled for ${scheduledStartAt}`);
  summary.sessionId = session.id;

  const executablePath = process.env.PW_CHROMIUM ?? (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const browser = await chromium.launch({ headless: true, executablePath, args: ['--no-sandbox'] });
  try {
    const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'tr-TR' };
    const ctxA = await browser.newContext(phone);
    const ctxB = await browser.newContext(phone);
    const [a, b] = await Promise.all([webLogin(ctxA, 'ayse@merak.local'), webLogin(ctxB, 'mehmet@merak.local')]);
    step('two independent browser contexts logged in through the web UI (ayse, mehmet)');
    await shot(a, '01-home-ayse');

    // Culture flow on ayse: discover -> detail -> complete -> save
    await a.getByRole('link', { name: /Keşfet/ }).or(a.getByText('Keşfet', { exact: true })).first().click();
    await a.getByTestId('discover-screen').waitFor();
    await shot(a, '02-discover');
    // Scope to the active screen: inactive tab screens stay mounted underneath on web.
    // Pick a card this user has not completed yet (the demo may run again on the same database;
    // for a completed card the 'Tamamladım' button is intentionally disabled).
    await a.getByTestId('discover-screen').locator('[data-testid^="content-card-"]').filter({ hasNotText: 'Tamamlandı' }).first().click();
    await a.getByTestId('content-detail').waitFor();
    await shot(a, '03-content-detail');
    await a.getByTestId('content-complete').click();
    await a.getByTestId('content-toast').waitFor({ timeout: 10_000 });
    await a.getByTestId('content-save').click();
    await a.waitForTimeout(500);
    await shot(a, '04-content-completed-saved');
    step('ayse completed and saved a card (XP once; toast shown)');
    await a.goBack();
    await a.getByTestId('discover-screen').waitFor();
    await a.getByText('Kültür', { exact: true }).first().click();
    await a.getByTestId('culture-screen').waitFor();
    await shot(a, '05-culture-radar');

    // Quiz: both join from the Yarış tab
    for (const [who, page] of [['ayse', a], ['mehmet', b]] as const) {
      await page.getByText('Yarış', { exact: true }).first().click();
      await page.getByTestId('play-screen').waitFor();
      await page.getByTestId('play-screen').getByTestId('quiz-open').click();
      await page.getByTestId('quiz-screen').waitFor();
      await page.getByTestId('quiz-join').click();
      await page.getByTestId('quiz-waiting').waitFor({ timeout: 20_000 });
      log(who, 'joined and is waiting');
    }
    await shot(a, '06-waiting-room-ayse');
    await shot(b, '06-waiting-room-mehmet');
    step('both joined; waiting room shows server-timed countdown');

    // Play all questions as they open
    const answers = { ayse: 0, mehmet: 0 };
    const play = async (who: 'ayse' | 'mehmet', page: Page, optionIndex: number) => {
      for (let i = 0; i < 5; i++) {
        await page.getByTestId('quiz-question').waitFor({ timeout: 90_000 });
        const prompt = await page.getByTestId('quiz-prompt').innerText();
        log(who, `question visible: "${prompt.slice(0, 40)}…"`);
        if (i === 0) await shot(page, `07-live-question-${who}`);
        await page.getByTestId(`quiz-option-${optionIndex}`).click();
        await page.getByText('Cevabın kabul edildi').waitFor({ timeout: 10_000 });
        answers[who] += 1;
        if (i === 0) await shot(page, `08-answer-accepted-${who}`);
        await page.getByTestId('quiz-reveal').waitFor({ timeout: 30_000 });
        if (i === 0) await shot(page, `09-reveal-${who}`);
        await page.getByTestId('quiz-reveal').waitFor({ state: 'detached', timeout: 30_000 }).catch(() => undefined);
      }
      await page.getByTestId('quiz-result').waitFor({ timeout: 60_000 });
      await shot(page, `10-result-${who}`);
      const points = await page.getByTestId('result-points').innerText();
      log(who, `RESULT ${points}`);
      return points;
    };
    const [pa, pb] = await Promise.all([play('ayse', a, 0), play('mehmet', b, 3)]);
    summary.results = { ayse: pa, mehmet: pb, answers };
    step(`session completed in both browsers (ayse ${pa}, mehmet ${pb})`);

    // Result -> related card (quiz_to_content_opened)
    if (await a.getByTestId('result-related').count()) {
      await a.getByTestId('result-related').click();
      await a.getByTestId('content-detail').waitFor();
      await shot(a, '11-quiz-to-content');
      step('ayse opened the related card from the result screen');
    }
    await a.getByText('Profil', { exact: true }).first().click().catch(() => undefined);
    await a.getByTestId('profile-screen').waitFor({ timeout: 15_000 }).catch(() => undefined);
    await shot(a, '12-profile-ayse');

    // Admin
    const ctxC = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'tr-TR' });
    const c = await ctxC.newPage();
    await c.goto(ADMIN, { waitUntil: 'domcontentloaded' });
    await c.getByTestId('admin-email').fill('admin@merak.local');
    await c.getByTestId('admin-password').fill(PASSWORD);
    await c.getByTestId('admin-submit').click();
    await c.getByTestId('nav-questions').waitFor({ timeout: 30_000 });
    await c.waitForTimeout(1000);
    await shot(c, '13-admin-questions');
    await c.getByTestId('nav-sessions').click();
    await c.waitForTimeout(1500);
    await shot(c, '14-admin-sessions');
    await c.getByTestId('nav-audit').click();
    await c.waitForTimeout(1000);
    await shot(c, '15-admin-audit');
    step('admin screens captured');

    const adminView = await api<{ status: string; answerCount: number; participantCount: number }>(admin, 'GET', `/admin/sessions/${session.id}`);
    if (adminView.status !== 'completed' || adminView.participantCount !== 2) throw new Error(`admin view mismatch: ${adminView.status}, participants ${adminView.participantCount}`);
    summary.adminView = adminView;
    summary.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(OUT, 'web-demo-summary.json'), JSON.stringify(summary, null, 2));
    console.log('\nWEB DEMO OK', JSON.stringify(adminView));
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('WEB DEMO FAILED', err);
  process.exit(1);
});
