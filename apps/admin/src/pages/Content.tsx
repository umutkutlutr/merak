import { useEffect, useState } from 'react';
import type { AdminContentInput, AdminContentItem, ReviewAction, Topic } from '@merak/contracts';
import { api, errText } from '../lib/api';

const actionsFor = (status: string): ReviewAction[] =>
  ({ draft: ['submit_review', 'archive'], review: ['approve', 'reject'], approved: ['publish', 'reject', 'archive'], published: ['archive'], rejected: ['submit_review', 'reopen'], archived: ['reopen'] })[status] as ReviewAction[] ?? [];
const actionLabel: Record<ReviewAction, string> = { submit_review: 'İncelemeye gönder', approve: 'Onayla', reject: 'Reddet', publish: 'Yayınla', archive: 'Arşivle', reopen: 'Yeniden aç' };

export function ContentPage() {
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [editing, setEditing] = useState<AdminContentItem | 'new' | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const load = async () => {
    try {
      const [c, t] = await Promise.all([api<{ items: AdminContentItem[] }>('GET', '/admin/content'), api<{ items: Topic[] }>('GET', '/admin/topics')]);
      setItems(c.items);
      setTopics(t.items);
    } catch (e) {
      setMsg({ kind: 'error', text: errText(e) });
    }
  };
  useEffect(() => void load(), []);
  const act = async (c: AdminContentItem, action: ReviewAction) => {
    let reason: string | undefined;
    if (action === 'reject') {
      reason = window.prompt('Ret gerekçesi (zorunlu):') ?? undefined;
      if (!reason) return;
    }
    try {
      await api('POST', `/admin/content/${c.id}/${action}`, { reason, expectedRevisionId: c.currentRevision.id });
      await load();
      setMsg({ kind: 'ok', text: `${actionLabel[action]}: tamam` });
    } catch (e) {
      setMsg({ kind: 'error', text: errText(e) });
    }
  };
  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2>İçerik <span className="muted">({items.length})</span></h2>
        <button className="primary" onClick={() => setEditing('new')}>Yeni kart / Radar önerisi</button>
      </div>
      <p className="muted">Kullanıcılar yalnızca yayınlanmış revizyonu görür. Yayındaki bir kartı düzenlersen eski revizyon, yeni revizyon yayınlanana kadar yayında kalır.</p>
      {msg ? <p className={msg.kind}>{msg.text}</p> : null}
      {editing ? <ContentForm topics={topics} initial={editing === 'new' ? null : editing} onDone={async () => { setEditing(null); await load(); }} onCancel={() => setEditing(null)} /> : null}
      {items.map((c) => (
        <div className="card" key={c.id}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div className="row">
              <span className={`badge ${c.status}`}>{c.status}</span>
              <span className="muted">{c.kind === 'radar_pick' ? 'Radar' : 'Kart'} · {c.topic.name} · v{c.currentRevision.version}{c.publishedRevisionId && c.publishedRevisionId !== c.currentRevision.id ? ' (yayında: eski revizyon)' : ''}{c.isSeedSample ? ' · örnek test içeriği' : ''}</span>
            </div>
            <div className="row">
              <button onClick={() => setEditing(c)}>Düzenle</button>
              {actionsFor(c.status).map((a) => <button key={a} className={a === 'approve' || a === 'publish' ? 'primary' : a === 'reject' ? 'danger' : ''} onClick={() => act(c, a)}>{actionLabel[a]}</button>)}
            </div>
          </div>
          <p><strong>{c.currentRevision.title}</strong> <span className="muted">/{c.slug}</span></p>
          <p className="muted">{c.currentRevision.summary}</p>
          <p className="muted">Kaynak: {c.currentRevision.sourceUrl ? <a href={c.currentRevision.sourceUrl} target="_blank" rel="noreferrer">{c.currentRevision.sourceTitle ?? c.currentRevision.sourceUrl}</a> : '—'} · {c.currentRevision.sourceVerified ? 'doğrulandı' : 'doğrulanmadı'} · {c.currentRevision.productionMethod}</p>
        </div>
      ))}
    </div>
  );
}

function ContentForm({ topics, initial, onDone, onCancel }: { topics: Topic[]; initial: AdminContentItem | null; onDone: () => Promise<void>; onCancel: () => void }) {
  const r = initial?.currentRevision;
  const [f, setF] = useState<AdminContentInput>({
    kind: initial?.kind ?? 'card',
    topicId: initial?.topic.id ?? topics[0]?.id ?? '',
    title: r?.title ?? '',
    summary: r?.summary ?? '',
    body: r?.body ?? '',
    readingMinutes: r?.readingMinutes ?? 2,
    mediaType: r?.mediaType ?? null,
    creator: r?.creator ?? null,
    year: r?.year ?? null,
    whyRecommended: r?.whyRecommended ?? null,
    sourceUrl: r?.sourceUrl ?? null,
    sourceTitle: r?.sourceTitle ?? null,
    sourceVerified: r?.sourceVerified ?? false,
    language: r?.language ?? 'tr',
    productionMethod: r ? (r.productionMethod === 'seed_sample' ? 'human' : r.productionMethod) : 'human',
    reason: '',
  });
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      const body = { ...f, sourceUrl: f.sourceUrl || null, sourceTitle: f.sourceTitle || null, creator: f.creator || null, whyRecommended: f.whyRecommended || null, year: f.year || null, mediaType: f.kind === 'radar_pick' ? f.mediaType : null, reason: f.reason || undefined };
      if (initial) await api('PATCH', `/admin/content/${initial.id}`, body);
      else await api('POST', '/admin/content', body);
      await onDone();
    } catch (ex) {
      setErr(errText(ex));
    }
  };
  return (
    <form className="card" onSubmit={submit}>
      <h3>{initial ? 'İçeriği düzenle (yeni revizyon)' : 'Yeni içerik'}</h3>
      <div className="grid">
        <div><label>Tür</label><select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as AdminContentInput['kind'] })}><option value="card">Keşif kartı</option><option value="radar_pick">Kültür Radarı önerisi</option></select></div>
        <div><label>Konu</label><select value={f.topicId} onChange={(e) => setF({ ...f, topicId: e.target.value })}>{topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
      </div>
      <label>Başlık</label><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required />
      <label>Özet</label><input value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} required />
      <label>Metin</label><textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} required style={{ minHeight: 140 }} />
      {f.kind === 'radar_pick' ? (
        <div className="grid">
          <div><label>Medya</label><select value={f.mediaType ?? 'book'} onChange={(e) => setF({ ...f, mediaType: e.target.value as 'book' | 'film' })}><option value="book">Kitap</option><option value="film">Film</option></select></div>
          <div><label>Yazar / Yönetmen</label><input value={f.creator ?? ''} onChange={(e) => setF({ ...f, creator: e.target.value })} /></div>
          <div><label>Yıl</label><input type="number" value={f.year ?? ''} onChange={(e) => setF({ ...f, year: e.target.value ? Number(e.target.value) : null })} /></div>
          <div><label>Neden öneriyoruz</label><input value={f.whyRecommended ?? ''} onChange={(e) => setF({ ...f, whyRecommended: e.target.value })} /></div>
        </div>
      ) : (
        <div><label>Okuma süresi (dk)</label><input type="number" value={f.readingMinutes ?? ''} onChange={(e) => setF({ ...f, readingMinutes: e.target.value ? Number(e.target.value) : null })} /></div>
      )}
      <div className="grid">
        <div><label>Kaynak URL</label><input value={f.sourceUrl ?? ''} onChange={(e) => setF({ ...f, sourceUrl: e.target.value })} placeholder="https://" /></div>
        <div><label>Kaynak başlığı</label><input value={f.sourceTitle ?? ''} onChange={(e) => setF({ ...f, sourceTitle: e.target.value })} /></div>
      </div>
      <div className="row"><input type="checkbox" style={{ width: 'auto' }} checked={f.sourceVerified} onChange={(e) => setF({ ...f, sourceVerified: e.target.checked })} /><span>Kaynağı bizzat kontrol ettim</span></div>
      <label>Değişiklik gerekçesi</label><input value={f.reason ?? ''} onChange={(e) => setF({ ...f, reason: e.target.value })} />
      {err ? <p className="error">{err}</p> : null}
      <p className="row"><button className="primary">Kaydet</button><button type="button" onClick={onCancel}>Vazgeç</button></p>
    </form>
  );
}
