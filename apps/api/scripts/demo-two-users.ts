/**
 * Two independent users complete one prize-less test session end to end, through the public
 * API and Socket.IO exactly as the mobile app does. Prints a timeline and the final result.
 *
 *   pnpm --filter @merak/api demo:two-users            (API must be running on API_URL)
 *
 * Steps: editor test-approves + publishes 5 seed questions -> admin schedules a session a few
 * seconds ahead with short test durations -> ayse & mehmet join + subscribe -> each answers
 * every question as soon as it opens -> session completes -> results + related content.
 * The editor approval here is a TEST approval by an automated script, not a human review.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { io, type Socket } from 'socket.io-client';
import { WS_EVENTS, type JoinSessionResponse, type OpenQuestionView, type SessionResultView } from '@merak/contracts';

const API = process.env.API_URL ?? 'http://localhost:3000';
const AUTH = process.env.SUPABASE_AUTH_URL ?? 'http://localhost:9999';
const PASSWORD = process.env.SEED_PASSWORD ?? 'Merak-Local-123';
const QUESTION_MS = Number(process.env.DEMO_QUESTION_MS ?? 4000);
const REVEAL_MS = Number(process.env.DEMO_REVEAL_MS ?? 1500);
const START_IN_MS = Number(process.env.DEMO_START_IN_MS ?? 3000);

const t0 = Date.now();
const log = (who: string, msg: string) => console.log(`[+${String(Date.now() - t0).padStart(5)}ms] ${who.padEnd(7)} ${msg}`);

async function login(email: string): Promise<string> {
  const res = await fetch(`${AUTH}/token?grant_type=password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: PASSWORD }) });
  if (!res.ok) throw new Error(`login ${email}: ${res.status} ${await res.text()}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

async function api<T>(token: string, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
  const json = (await res.json()) as T & { error?: { code: string; message: string } };
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${json.error?.code}: ${json.error?.message}`);
  return json;
}

async function main() {
  const [editor, admin, ayse, mehmet] = (await Promise.all(['editor', 'admin', 'ayse', 'mehmet'].map((u) => login(`${u}@merak.local`)))) as [string, string, string, string];
  for (const tok of [ayse, mehmet]) await api(tok, 'GET', '/me');

  // 1) Editorial gate: test-approve and publish five seed questions (recorded in the audit log).
  const { items } = await api<{ items: Array<{ id: string; status: string; currentRevision: { prompt: string } }> }>(editor, 'GET', '/admin/questions');
  const pick = items.slice(0, 5);
  for (const q of pick) {
    let status = q.status;
    if (status === 'draft' || status === 'rejected') { await api(editor, 'POST', `/admin/questions/${q.id}/submit_review`, {}); status = 'review'; }
    if (status === 'review') { await api(editor, 'POST', `/admin/questions/${q.id}/approve`, { reason: 'TEST ONAYI — otomatik demo betiği, insan incelemesi değildir', approvalKind: 'automated_test' }); status = 'approved'; }
    if (status === 'approved') { await api(editor, 'POST', `/admin/questions/${q.id}/publish`, {}); }
  }
  log('editor', `5 questions test-approved + published`);

  // 2) Admin schedules a prize-less test session.
  const scheduledStartAt = new Date(Date.now() + START_IN_MS).toISOString();
  const session = await api<{ id: string; title: string }>(admin, 'POST', '/admin/sessions', {
    title: 'M0 demo — ödülsüz test oturumu',
    scheduledStartAt,
    questionIds: pick.map((q) => q.id),
    rulesOverride: { questionDurationMs: QUESTION_MS, revealDurationMs: REVEAL_MS, lobbyLeadMs: 0 },
    reason: 'demo:two-users',
  });
  log('admin', `session ${session.id} scheduled for ${scheduledStartAt}`);

  // 3) Two independent clients.
  const players = [
    { name: 'ayse', token: ayse, pickCorrect: true },
    { name: 'mehmet', token: mehmet, pickCorrect: false },
  ];
  const done: Promise<void>[] = [];
  for (const p of players) {
    const join = await api<JoinSessionResponse>(p.token, 'POST', `/quiz/sessions/${session.id}/join`, {});
    log(p.name, `joined (participant ${join.participantId.slice(0, 8)}, eligibleFrom ${join.eligibleFromPosition})`);
    const socket: Socket = io(API, { auth: { token: p.token }, transports: ['websocket'] });
    done.push(
      new Promise<void>((resolve, reject) => {
        socket.on('connect_error', (e) => reject(new Error(`ws connect_error ${e.message}`)));
        socket.on('connect', () => {
          socket.emit(WS_EVENTS.subscribe, { sessionId: session.id, participationToken: join.participationToken }, (ack: { ok: boolean; code?: string }) => {
            log(p.name, `subscribed ok=${ack.ok}${ack.code ? ' ' + ack.code : ''}`);
          });
        });
        socket.on(WS_EVENTS.lobby, (e: { participantCount: number }) => log(p.name, `lobby (participants=${e.participantCount})`));
        socket.on(WS_EVENTS.questionOpened, async (e: { question: OpenQuestionView; stateVersion: number }) => {
          const q = e.question;
          log(p.name, `Q${q.position} opened: "${q.prompt.slice(0, 40)}…" options=${q.options.length} (v${e.stateVersion})`);
          // Decide quickly; the server scores on its own receipt time.
          const delay = p.pickCorrect ? 300 : 900;
          await new Promise((r) => setTimeout(r, delay));
          // The client does not know the key; "pickCorrect" players simply choose the first option
          // which is right only sometimes — the point is to show scoring differences.
          const optionId = q.options[p.pickCorrect ? 0 : q.options.length - 1]!.optionId;
          try {
            const receipt = await api<{ receiptId: string; replayed: boolean }>(p.token, 'POST', `/quiz/sessions/${session.id}/answers`, {
              sessionQuestionId: q.sessionQuestionId, optionId, idempotencyKey: randomUUID(), participationToken: join.participationToken,
            });
            log(p.name, `  answered Q${q.position} -> accepted ${receipt.receiptId.slice(0, 8)}`);
          } catch (err) {
            log(p.name, `  answer Q${q.position} rejected: ${(err as Error).message}`);
          }
        });
        socket.on(WS_EVENTS.questionRevealed, (e: { reveal: { position: number; myAnswer: { isCorrect: boolean; points: number } | null } }) => {
          const my = e.reveal.myAnswer;
          log(p.name, `Q${e.reveal.position} revealed: ${my ? `${my.isCorrect ? 'correct' : 'wrong'} ${my.points}p` : 'no answer'}`);
        });
        socket.on(WS_EVENTS.sessionCancelled, (e: { reason: string }) => reject(new Error(`cancelled: ${e.reason}`)));
        socket.on(WS_EVENTS.sessionCompleted, async () => {
          const { result } = await api<{ result: SessionResultView }>(p.token, 'GET', `/quiz/sessions/${session.id}/result`);
          log(p.name, `COMPLETED rank ${result.rank}/${result.participantCount}, ${result.correctCount} correct, ${result.totalPoints} points`);
          const related = result.questions.find((q) => q.relatedContent)?.relatedContent;
          if (related) {
            await api(p.token, 'POST', '/events', { events: [{ eventId: randomUUID(), schemaVersion: 1, eventName: 'quiz_to_content_opened', eventTime: new Date().toISOString(), contentItemId: related.id, quizSessionId: session.id }] });
            log(p.name, `  -> opened related card "${related.title}" (quiz_to_content_opened)`);
          }
          socket.close();
          resolve();
        });
      }),
    );
  }
  await Promise.all(done);
  const adminView = await api<{ status: string; answerCount: number; participantCount: number }>(admin, 'GET', `/admin/sessions/${session.id}`);
  log('admin', `session status=${adminView.status} participants=${adminView.participantCount} answers=${adminView.answerCount}`);
  console.log('\nDEMO OK');
}

main().catch((err) => { console.error('DEMO FAILED', err); process.exit(1); });
