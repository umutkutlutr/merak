import { useEffect, useState } from 'react';
import type { AdminAuditEntry } from '@merak/contracts';
import { api, errText } from '../lib/api';

export function AuditPage() {
  const [items, setItems] = useState<AdminAuditEntry[]>([]);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    api<{ items: AdminAuditEntry[] }>('GET', '/admin/audit?limit=200').then((r) => setItems(r.items)).catch((e) => setErr(errText(e)));
  }, []);
  return (
    <div className="card">
      <h2>Denetim kaydı</h2>
      <p className="muted">Önemli yönetim işlemlerinin aktörü, zamanı ve gerekçesi. Aktörü boş olan satırlar sistem (zamanlayıcı/seed) işlemleridir.</p>
      {err ? <p className="error">{err}</p> : null}
      <table>
        <thead><tr><th>Zaman</th><th>Aktör</th><th>İşlem</th><th>Hedef</th><th>Gerekçe</th><th>Detay</th></tr></thead>
        <tbody>
          {items.map((a) => (
            <tr key={a.id}>
              <td>{new Date(a.createdAt).toLocaleString('tr-TR')}</td>
              <td>{a.actorUsername ?? <span className="muted">sistem</span>}</td>
              <td>{a.action}</td>
              <td className="muted">{a.targetType} {a.targetId?.slice(0, 8)}</td>
              <td>{a.reason}</td>
              <td className="muted">{a.metadata ? JSON.stringify(a.metadata).slice(0, 120) : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
