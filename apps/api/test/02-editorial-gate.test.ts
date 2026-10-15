/** K03 — unapproved questions cannot be scheduled; approved revisions are pinned and never change silently. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AdminQuestion } from '@merak/contracts';
import { adminQuery, api, createTestApp, createUser, publishQuestion, scheduleSession, type TestApp, type TestUser } from './harness.js';
import { runSeed } from '../src/seed/seed.js';

let t: TestApp;
let editor: TestUser;
let admin: TestUser;
let drafts: AdminQuestion[];

beforeAll(async () => {
  t = await createTestApp();
  await runSeed({ quiet: true, skipUsers: true });
  editor = await createUser(t, 'editor');
  admin = await createUser(t, 'admin');
  drafts = (await api<{ items: AdminQuestion[] }>(t.baseUrl, editor.token, 'GET', '/admin/questions')).body.items;
});
afterAll(async () => {
  await t.close();
});

const edit = (q: AdminQuestion, prompt: string) => ({
  topicId: q.topic.id,
  prompt,
  explanation: q.currentRevision.explanation,
  options: q.currentRevision.options.map((o) => ({ label: o.label, isCorrect: o.isCorrect })),
  sourceUrl: q.currentRevision.sourceUrl,
  sourceTitle: q.currentRevision.sourceTitle,
  sourceVerified: false,
  language: 'tr',
  productionMethod: 'human',
  reason: 'typo fix',
});

describe('K03 editorial gate', () => {
  it('draft questions cannot be scheduled', async () => {
    const r = await scheduleSession(t, admin, drafts.slice(0, 5).map((q) => q.id));
    expect(r.status).toBe(409);
    expect((r.body as any).error.code).toBe('QUESTION_NOT_APPROVED');
  });
  it('lifecycle draft → review → approved → published, reject needs a reason, invalid transitions are refused', async () => {
    const q = drafts[0]!;
    expect((await api(t.baseUrl, editor.token, 'POST', `/admin/questions/${q.id}/approve`, {})).body.error.code).toBe('INVALID_TRANSITION');
    expect((await api(t.baseUrl, editor.token, 'POST', `/admin/questions/${q.id}/submit_review`, {})).body.status).toBe('review');
    expect((await api(t.baseUrl, editor.token, 'POST', `/admin/questions/${q.id}/reject`, {})).body.error.code).toBe('VALIDATION_FAILED');
    const rejected = await api(t.baseUrl, editor.token, 'POST', `/admin/questions/${q.id}/reject`, { reason: 'kaynak eksik' });
    expect(rejected.body.status).toBe('rejected');
    expect(rejected.body.reviewNote).toBe('kaynak eksik');
    expect((await api(t.baseUrl, editor.token, 'POST', `/admin/questions/${q.id}/submit_review`, {})).body.status).toBe('review');
    const approved = await api(t.baseUrl, editor.token, 'POST', `/admin/questions/${q.id}/approve`, { reason: 'ok' });
    expect(approved.body.status).toBe('approved');
    expect(approved.body.approvedRevisionId).toBe(q.currentRevision.id);
    // approved but not published => still not schedulable (pool release is explicit)
    const others = await Promise.all(drafts.slice(1, 5).map((d) => publishQuestion(t, editor, d.id)));
    const r = await scheduleSession(t, admin, [q.id, ...others.map((o) => o.id)]);
    expect((r.body as any).error.code).toBe('QUESTION_NOT_APPROVED');
    expect((await api(t.baseUrl, editor.token, 'POST', `/admin/questions/${q.id}/publish`, {})).body.status).toBe('published');
    const ok = await scheduleSession(t, admin, [q.id, ...others.map((o) => o.id)]);
    expect(ok.status).toBe(201);
    expect(ok.body.questions.map((x) => x.revisionVersion)).toEqual([1, 1, 1, 1, 1]);
    expect(ok.body.questions.every((x) => x.revisionStillValid)).toBe(true);
    const audit = await api(t.baseUrl, editor.token, 'GET', '/admin/audit?limit=50');
    expect(audit.body.items.map((a: any) => a.action)).toEqual(expect.arrayContaining(['question.reject', 'question.approve', 'question.publish', 'session.create']));
    expect(audit.body.items.find((a: any) => a.action === 'question.reject').reason).toBe('kaynak eksik');
  });
  it('editing an approved question creates a new revision, invalidates approval, and never alters the pinned revision', async () => {
    const published = await Promise.all(drafts.slice(5, 10).map((d) => publishQuestion(t, editor, d.id)));
    const session = (await scheduleSession(t, admin, published.map((p) => p.id))).body;
    const target = published[0]!;
    const pinnedRevisionId = session.questions[0]!.questionRevisionId;
    expect(pinnedRevisionId).toBe(target.currentRevision.id);

    const edited = await api<AdminQuestion>(t.baseUrl, editor.token, 'PATCH', `/admin/questions/${target.id}`, edit(target, 'DÜZENLENMİŞ: ' + target.currentRevision.prompt));
    expect(edited.status).toBe(200);
    expect(edited.body.status).toBe('draft');
    expect(edited.body.approvedRevisionId).toBeNull();
    expect(edited.body.currentRevision.version).toBe(2);
    expect(edited.body.currentRevision.id).not.toBe(pinnedRevisionId);

    const pinned = await adminQuery<{ prompt: string }>(`select prompt from app.question_revisions where id = '${pinnedRevisionId}'`);
    if ('error' in pinned) throw new Error(pinned.error);
    expect(pinned.rows[0]!.prompt).toBe(target.currentRevision.prompt); // unchanged
    const adminView = await api(t.baseUrl, admin.token, 'GET', `/admin/sessions/${session.id}`);
    expect(adminView.body.questions[0].revisionStillValid).toBe(false);
    expect(adminView.body.questions[0].questionRevisionId).toBe(pinnedRevisionId);

    // The scheduler re-validates before the lobby and refuses to run the session.
    await t.advance(60_000);
    const after = await api(t.baseUrl, admin.token, 'GET', `/admin/sessions/${session.id}`);
    expect(after.body.status).toBe('cancelled');
    expect(after.body.cancelledReason).toBe('question_approval_withdrawn');
  });
  it('re-approving a NEW revision does not silently swap it into an already scheduled session', async () => {
    const published = await Promise.all(drafts.slice(7, 12).map((d) => publishQuestion(t, editor, d.id)));
    const session = (await scheduleSession(t, admin, published.map((p) => p.id))).body;
    const target = published[2]!;
    await api(t.baseUrl, editor.token, 'PATCH', `/admin/questions/${target.id}`, edit(target, 'v2 ' + target.currentRevision.prompt));
    const v2 = await publishQuestion(t, editor, target.id);
    expect(v2.currentRevision.version).toBe(2);
    expect(v2.approvedRevisionId).toBe(v2.currentRevision.id);
    await t.advance(60_000);
    const after = await api(t.baseUrl, admin.token, 'GET', `/admin/sessions/${session.id}`);
    expect(after.body.status).toBe('cancelled');
    expect(after.body.cancelledReason).toBe('question_revision_changed');
    expect(after.body.questions[2].questionRevisionId).toBe(target.currentRevision.id); // still v1 pinned
  });
  it('withdrawing approval (reject after approve) cancels the scheduled session with a visible reason', async () => {
    const fresh = await Promise.all(
      drafts.slice(0, 5).map(async (d) => {
        const q = (await api<AdminQuestion>(t.baseUrl, editor.token, 'GET', `/admin/questions/${d.id}`)).body;
        if (q.status === 'published') return q;
        if (q.status === 'draft' || q.status === 'rejected') await api(t.baseUrl, editor.token, 'POST', `/admin/questions/${d.id}/submit_review`, {});
        if (q.status !== 'approved') await api(t.baseUrl, editor.token, 'POST', `/admin/questions/${d.id}/approve`, { reason: 'ok' });
        await api(t.baseUrl, editor.token, 'POST', `/admin/questions/${d.id}/publish`, {});
        return (await api<AdminQuestion>(t.baseUrl, editor.token, 'GET', `/admin/questions/${d.id}`)).body;
      }),
    );
    const session = (await scheduleSession(t, admin, fresh.map((p) => p.id))).body;
    expect(session.status).toBe('scheduled');
    const archived = await api(t.baseUrl, editor.token, 'POST', `/admin/questions/${fresh[1]!.id}/archive`, { reason: 'hatalı' });
    expect(archived.body.status).toBe('archived');
    await t.advance(60_000);
    const after = await api(t.baseUrl, admin.token, 'GET', `/admin/sessions/${session.id}`);
    expect(after.body.status).toBe('cancelled');
    expect(after.body.cancelledReason).toBe('question_approval_withdrawn');
    const member = await createUser(t, 'member');
    const view = await api(t.baseUrl, member.token, 'GET', `/quiz/sessions/${session.id}`);
    expect(view.body.session.cancelledReason).toBe('question_approval_withdrawn');
  });
});
