import { useEffect, useState } from 'react';
import type { AdminQuestion, AdminQuestionInput, ReviewAction, Topic } from '@merak/contracts';
import { api, errText } from '../lib/api';

const actionsFor = (status: string): ReviewAction[] =>
  ({ draft: ['submit_review', 'archive'], review: ['approve', 'reject'], approved: ['publish', 'reject', 'archive'], published: ['archive'], rejected: ['submit_review', 'reopen'], archived: ['reopen'] })[status] as ReviewAction[] ?? [];
const actionLabel: Record<ReviewAction, string> = { submit_review: 'İncelemeye gönder', approve: 'Onayla', reject: 'Reddet', publish: 'Havuza yayınla', archive: 'Arşivle', reopen: 'Yeniden aç' };

export function QuestionsPage() {
  const [items, setItems] = useState<AdminQuestion[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<AdminQuestion | 'new' | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const load = async () => {
    try {
      const [q, t] = await Promise.all([api<{ items: AdminQuestion[] }>('GET', '/admin/questions'), api<{ items: Topic[] }>('GET', '/admin/topics')]);
      setItems(q.items);
      setTopics(t.items);
    } catch (e) {
      setMsg({ kind: 'error', text: errText(e) });
    }
  };
  useEffect(() => void load(), []);

  const act = async (q: AdminQuestion, action: ReviewAction) => {
    let reason: string | undefined;
    if (action === 'reject') {
      reason = window.prompt('Ret gerekçesi (zorunlu):') ?? undefined;
      if (!reason) return;
    } else if (action === 'approve') {
      reason = window.prompt('Onay notu (isteğe bağlı). Kaynağı gerçekten kontrol ettin mi?') ?? undefined;
    }
    try {
      await api('POST', `/admin/questions/${q.id}/${action}`, { reason, expectedRevisionId: q.currentRevision.id });
      setMsg({ kind: 'ok', text: `${actionLabel[action]}: tamam` });
      await load();
    } catch (e) {
      setMsg({ kind: 'error', text: errText(e) });
    }
  };

  const bulkApprovePublish = async () => {
    if (!window.confirm(`${selected.size} soruyu incelemeye gönder → onayla → yayınla. Bu bir TEST onayıdır; gerçek editoryal inceleme yerine geçmez. Devam?`)) return;
    for (const id of selected) {
      const q = items.find((x) => x.id === id);
      if (!q) continue;
      try {
        let status = q.status;
        if (status === 'archived') { await api('POST', `/admin/questions/${id}/reopen`, {}); status = 'draft'; }
        if (status === 'draft' || status === 'rejected') { await api('POST', `/admin/questions/${id}/submit_review`, {}); status = 'review'; }
        if (status === 'review') { await api('POST', `/admin/questions/${id}/approve`, { reason: 'TEST ONAYI — toplu işlem, insan incelemesi değildir' }); status = 'approved'; }
        if (status === 'approved') await api('POST', `/admin/questions/${id}/publish`, {});
      } catch (e) {
        setMsg({ kind: 'error', text: errText(e) });
      }
    }
    setSelected(new Set());
    await load();
  };

  const shown = items.filter((q) => filter === 'all' || q.status === filter);
  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2>Sorular <span className="muted">({items.length})</span></h2>
        <div className="row">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 'auto' }}>
            {['all', 'draft', 'review', 'approved', 'published', 'rejected', 'archived'].map((s) => <option key={s} value={s}>{s === 'all' ? 'Tümü' : s}</option>)}
          </select>
          <button className="primary" onClick={() => setEditing('new')}>Yeni soru</button>
          <button disabled={selected.size === 0} onClick={bulkApprovePublish} data-testid="bulk-publish">Seçilileri test-onayla + yayınla ({selected.size})</button>
        </div>
      </div>
      <p className="warnbox">Ödüllü sorularda insan onayı zorunludur. Seed soruları “örnek test içeriği”dir; kaynakları editör tarafından doğrulanmamıştır. Düzenleme yapınca önceki onay geçersiz olur.</p>
      {msg ? <p className={msg.kind}>{msg.text}</p> : null}
      {editing ? <QuestionForm topics={topics} initial={editing === 'new' ? null : editing} onDone={async () => { setEditing(null); await load(); }} onCancel={() => setEditing(null)} /> : null}
      {shown.map((q) => (
        <div className="card" key={q.id} data-testid={`question-${q.id}`}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div className="row">
              <input type="checkbox" style={{ width: 'auto' }} checked={selected.has(q.id)} onChange={(e) => { const n = new Set(selected); e.target.checked ? n.add(q.id) : n.delete(q.id); setSelected(n); }} />
              <span className={`badge ${q.status}`}>{q.status}</span>
              <span className="muted">{q.topic.name} · v{q.currentRevision.version} · {q.currentRevision.productionMethod}{q.isSeedSample ? ' · örnek test içeriği' : ''}</span>
            </div>
            <div className="row">
              <button onClick={() => setEditing(q)}>Düzenle</button>
              {actionsFor(q.status).map((a) => <button key={a} className={a === 'approve' || a === 'publish' ? 'primary' : a === 'reject' ? 'danger' : ''} onClick={() => act(q, a)}>{actionLabel[a]}</button>)}
            </div>
          </div>
          <p><strong>{q.currentRevision.prompt}</strong></p>
          <ul style={{ margin: '4px 0' }}>
            {q.currentRevision.options.map((o) => <li key={o.id} style={{ color: o.isCorrect ? 'var(--ok)' : undefined }}>{o.label}{o.isCorrect ? ' ✓' : ''}</li>)}
          </ul>
          <p className="muted">Açıklama: {q.currentRevision.explanation}</p>
          <p className="muted">Kaynak: {q.currentRevision.sourceUrl ? <a href={q.currentRevision.sourceUrl} target="_blank" rel="noreferrer">{q.currentRevision.sourceTitle ?? q.currentRevision.sourceUrl}</a> : '—'} · {q.currentRevision.sourceVerified ? 'doğrulandı' : 'doğrulanmadı'} · {q.currentRevision.language}
            {q.reviewedAt ? ` · inceleme: ${new Date(q.reviewedAt).toLocaleString('tr-TR')}${q.reviewNote ? ` (${q.reviewNote})` : ''}` : ''}</p>
        </div>
      ))}
    </div>
  );
}

function QuestionForm({ topics, initial, onDone, onCancel }: { topics: Topic[]; initial: AdminQuestion | null; onDone: () => Promise<void>; onCancel: () => void }) {
  const [f, setF] = useState<AdminQuestionInput>(() => ({
    topicId: initial?.topic.id ?? topics[0]?.id ?? '',
    prompt: initial?.currentRevision.prompt ?? '',
    explanation: initial?.currentRevision.explanation ?? '',
    options: initial?.currentRevision.options.map((o) => ({ label: o.label, isCorrect: o.isCorrect })) ?? [0, 1, 2, 3].map(() => ({ label: '', isCorrect: false })),
    sourceUrl: initial?.currentRevision.sourceUrl ?? null,
    sourceTitle: initial?.currentRevision.sourceTitle ?? null,
    sourceVerified: initial?.currentRevision.sourceVerified ?? false,
    language: initial?.currentRevision.language ?? 'tr',
    productionMethod: initial ? (initial.currentRevision.productionMethod === 'seed_sample' ? 'human' : initial.currentRevision.productionMethod) : 'human',
    relatedContentItemId: initial?.relatedContentItemId ?? null,
    reason: '',
  }));
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      const body = { ...f, sourceUrl: f.sourceUrl || null, sourceTitle: f.sourceTitle || null, relatedContentItemId: f.relatedContentItemId || null, reason: f.reason || undefined };
      if (initial) await api('PATCH', `/admin/questions/${initial.id}`, body);
      else await api('POST', '/admin/questions', body);
      await onDone();
    } catch (ex) {
      setErr(errText(ex));
    }
  };
  return (
    <form className="card" onSubmit={submit}>
      <h3>{initial ? `Soruyu düzenle (yeni revizyon v${initial.currentRevision.version + 1}; onay sıfırlanır)` : 'Yeni soru'}</h3>
      <div className="grid">
        <div>
          <label>Konu</label>
          <select value={f.topicId} onChange={(e) => setF({ ...f, topicId: e.target.value })}>{topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        </div>
        <div>
          <label>Üretim yöntemi</label>
          <select value={f.productionMethod} onChange={(e) => setF({ ...f, productionMethod: e.target.value as AdminQuestionInput['productionMethod'] })}>
            {['human', 'ai_assisted', 'ai_generated'].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <label>Soru metni</label>
      <textarea value={f.prompt} onChange={(e) => setF({ ...f, prompt: e.target.value })} required />
      <label>Seçenekler (tam olarak bir doğru)</label>
      {f.options.map((o, i) => (
        <div className="row" key={i}>
          <input type="radio" name="correct" style={{ width: 'auto' }} checked={o.isCorrect} onChange={() => setF({ ...f, options: f.options.map((x, j) => ({ ...x, isCorrect: j === i })) })} />
          <input value={o.label} onChange={(e) => setF({ ...f, options: f.options.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} placeholder={`Seçenek ${i + 1}`} required />
        </div>
      ))}
      <label>Açıklama (reveal sonrası gösterilir)</label>
      <textarea value={f.explanation} onChange={(e) => setF({ ...f, explanation: e.target.value })} required />
      <div className="grid">
        <div><label>Kaynak URL</label><input value={f.sourceUrl ?? ''} onChange={(e) => setF({ ...f, sourceUrl: e.target.value })} placeholder="https://" /></div>
        <div><label>Kaynak başlığı</label><input value={f.sourceTitle ?? ''} onChange={(e) => setF({ ...f, sourceTitle: e.target.value })} /></div>
      </div>
      <div className="row">
        <input type="checkbox" style={{ width: 'auto' }} checked={f.sourceVerified} onChange={(e) => setF({ ...f, sourceVerified: e.target.checked })} />
        <span>Kaynağı bizzat kontrol ettim (doğrulandı etiketi)</span>
      </div>
      <label>İlgili içerik id (isteğe bağlı)</label>
      <input value={f.relatedContentItemId ?? ''} onChange={(e) => setF({ ...f, relatedContentItemId: e.target.value })} placeholder="uuid" />
      <label>Değişiklik gerekçesi (denetim kaydı)</label>
      <input value={f.reason ?? ''} onChange={(e) => setF({ ...f, reason: e.target.value })} />
      {err ? <p className="error">{err}</p> : null}
      <p className="row"><button className="primary">Kaydet</button><button type="button" onClick={onCancel}>Vazgeç</button></p>
    </form>
  );
}
