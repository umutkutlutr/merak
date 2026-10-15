import { useEffect, useState } from 'react';
import type { AdminQuestion, AdminSession } from '@merak/contracts';
import { api, approvalKindLabel, errText } from '../lib/api';

export function SessionsPage({ isAdmin }: { isAdmin: boolean }) {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [title, setTitle] = useState('Ödülsüz test oturumu');
  const [startAt, setStartAt] = useState(() => toLocalInput(new Date(Date.now() + 3 * 60_000)));
  const [questionSec, setQuestionSec] = useState(12);
  const [revealSec, setRevealSec] = useState(6);
  const [lobbySec, setLobbySec] = useState(60);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [detail, setDetail] = useState<AdminSession | null>(null);

  const load = async () => {
    try {
      const q = await api<{ items: AdminQuestion[] }>('GET', '/admin/questions');
      setQuestions(q.items.filter((x) => x.status === 'published'));
      if (isAdmin) setSessions((await api<{ items: AdminSession[] }>('GET', '/admin/sessions')).items);
    } catch (e) {
      setMsg({ kind: 'error', text: errText(e) });
    }
  };
  useEffect(() => void load(), [isAdmin]);
  useEffect(() => {
    if (!isAdmin) return;
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (!isAdmin) return <p className="warnbox">Oturum planlama yalnızca admin rolü için. Editörler soru ve içerik inceleyebilir.</p>;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      const isDefault = questionSec === 12 && revealSec === 6 && lobbySec === 60;
      await api('POST', '/admin/sessions', {
        title,
        scheduledStartAt: new Date(startAt).toISOString(),
        questionIds: picked,
        rulesOverride: isDefault ? undefined : { questionDurationMs: questionSec * 1000, revealDurationMs: revealSec * 1000, lobbyLeadMs: lobbySec * 1000 },
      });
      setPicked([]);
      setMsg({ kind: 'ok', text: 'Oturum planlandı. Soruların onaylı revizyonları sabitlendi.' });
      await load();
    } catch (ex) {
      setMsg({ kind: 'error', text: errText(ex) });
    }
  };
  const cancel = async (s: AdminSession) => {
    const reason = window.prompt('İptal gerekçesi (kullanıcıya gösterilir):');
    if (!reason) return;
    try {
      await api('POST', `/admin/sessions/${s.id}/cancel`, { reason });
      await load();
    } catch (ex) {
      setMsg({ kind: 'error', text: errText(ex) });
    }
  };
  return (
    <div>
      <h2>Test oturumları</h2>
      <p className="warnbox">M0: yalnızca ödülsüz yerel test. Oturum, seçilen soruların o anki onaylı revizyonunu sabitler; sonradan düzenleme canlı soruyu değiştirmez, zamanlayıcı lobi öncesi yeniden doğrular.</p>
      {msg ? <p className={msg.kind}>{msg.text}</p> : null}
      <form className="card" onSubmit={create}>
        <h3>Yeni oturum planla</h3>
        <div className="grid">
          <div><label>Başlık</label><input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
          <div><label>Başlangıç (yerel saat)</label><input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required /></div>
          <div><label>Soru süresi (sn) — varsayılan 12</label><input type="number" min={1} max={60} value={questionSec} onChange={(e) => setQuestionSec(Number(e.target.value))} /></div>
          <div><label>Reveal süresi (sn) — varsayılan 6</label><input type="number" min={1} max={30} value={revealSec} onChange={(e) => setRevealSec(Number(e.target.value))} /></div>
          <div><label>Lobi açılış öncesi (sn) — varsayılan 60</label><input type="number" min={0} max={600} value={lobbySec} onChange={(e) => setLobbySec(Number(e.target.value))} /></div>
        </div>
        <label>Sorular (sırayla tam 5 yayınlanmış soru seç) — seçili: {picked.length}/5</label>
        {questions.length === 0 ? <p className="muted">Havuzda yayınlanmış soru yok. Önce Sorular sekmesinden onayla + yayınla.</p> : null}
        {questions.map((q) => {
          const idx = picked.indexOf(q.id);
          return (
            <div className="row" key={q.id}>
              <input type="checkbox" style={{ width: 'auto' }} checked={idx >= 0} onChange={(e) => setPicked(e.target.checked ? [...picked, q.id].slice(0, 5) : picked.filter((x) => x !== q.id))} />
              <span>{idx >= 0 ? `${idx + 1}. ` : ''}{q.currentRevision.prompt} <span className="muted">({q.topic.name}, v{q.currentRevision.version})</span></span>
            </div>
          );
        })}
        <p><button className="live" disabled={picked.length !== 5} data-testid="session-create">Planla</button></p>
      </form>
      {sessions.map((s) => (
        <div className="card" key={s.id}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div className="row">
              <span className={`badge ${s.status}`}>{s.status}</span>
              <strong>{s.title}</strong>
              <span className="muted">{new Date(s.scheduledStartAt).toLocaleString('tr-TR')} · {s.participantCount} katılımcı · {s.answerCount} cevap · v{s.stateVersion} · {s.rules.rulesVersion}</span>
            </div>
            <div className="row">
              <button onClick={() => setDetail(detail?.id === s.id ? null : s)}>Detay</button>
              {['scheduled', 'lobby', 'live'].includes(s.status) ? <button className="danger" onClick={() => cancel(s)}>İptal et</button> : null}
            </div>
          </div>
          {s.cancelledReason ? <p className="error">İptal: {s.cancelledReason}</p> : null}
          {detail?.id === s.id ? (
            <table>
              <thead><tr><th>#</th><th>Soru</th><th>Rev.</th><th>Durum</th><th>Açılış</th><th>Kapanış</th><th>Revizyon geçerli mi?</th><th>Onay</th></tr></thead>
              <tbody>
                {s.questions.map((q) => (
                  <tr key={q.sessionQuestionId}>
                    <td>{q.position}</td><td>{q.prompt}</td><td>v{q.revisionVersion}</td><td>{q.status}</td>
                    <td className="muted">{q.opensAt ? new Date(q.opensAt).toLocaleTimeString('tr-TR') : '—'}</td>
                    <td className="muted">{q.closesAt ? new Date(q.closesAt).toLocaleTimeString('tr-TR') : '—'}</td>
                    <td className={q.revisionStillValid ? 'ok' : 'error'}>{q.revisionStillValid ? 'evet' : 'HAYIR — oturum başlatılmaz'}</td>
                    <td className={q.approvalKind === 'automated_test' ? 'error' : 'muted'}>{approvalKindLabel(q.approvalKind)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
