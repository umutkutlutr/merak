import { useEffect, useState } from 'react';
import type { Session } from '@supabase/auth-js';
import type { Profile } from '@merak/contracts';
import { auth } from './lib/auth';
import { api, errText } from './lib/api';
import { QuestionsPage } from './pages/Questions';
import { ContentPage } from './pages/Content';
import { SessionsPage } from './pages/Sessions';
import { AuditPage } from './pages/Audit';

type Tab = 'questions' | 'content' | 'sessions' | 'audit';

export function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<Tab>('questions');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    api<{ profile: Profile }>('GET', '/me')
      .then((r) => setProfile(r.profile))
      .catch((e) => setErr(errText(e)));
  }, [session?.access_token]);

  if (session === undefined) return <main>Yükleniyor…</main>;
  if (!session) return <Login />;
  if (profile && profile.role === 'member') {
    return (
      <main className="login card">
        <h2>Yetki yok</h2>
        <p className="muted">Bu hesap ({profile.username}) editör veya admin değil. Rol sunucuda doğrulanır; gizli bir buton yoktur.</p>
        <button onClick={() => void auth.signOut()}>Çıkış</button>
      </main>
    );
  }
  return (
    <>
      <header>
        <h1>Merak Yönetim <span className="muted">M0 · yerel test</span></h1>
        <nav>
          {(['questions', 'content', 'sessions', 'audit'] as Tab[]).map((t) => (
            <a key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)} data-testid={`nav-${t}`}>
              {{ questions: 'Sorular', content: 'İçerik', sessions: 'Oturumlar', audit: 'Denetim' }[t]}
            </a>
          ))}
        </nav>
        <span className="spacer" />
        <span className="muted">{profile ? `${profile.username} · ${profile.role}` : ''}</span>
        <button onClick={() => void auth.signOut()}>Çıkış</button>
      </header>
      <main>
        {err ? <p className="error">{err}</p> : null}
        {tab === 'questions' ? <QuestionsPage /> : null}
        {tab === 'content' ? <ContentPage /> : null}
        {tab === 'sessions' ? <SessionsPage isAdmin={profile?.role === 'admin'} /> : null}
        {tab === 'audit' ? <AuditPage /> : null}
      </main>
    </>
  );
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { error } = await auth.signInWithPassword({ email, password });
    if (error) setErr(error.message);
    setBusy(false);
  };
  return (
    <main className="login">
      <form className="card" onSubmit={submit}>
        <h2>Merak Yönetim</h2>
        <p className="muted">Editör veya admin hesabıyla giriş yap. Yerel seed: editor@merak.local / admin@merak.local</p>
        <label>E-posta</label>
        <input data-testid="admin-email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        <label>Şifre</label>
        <input data-testid="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        {err ? <p className="error">{err}</p> : null}
        <p>
          <button className="primary" disabled={busy} data-testid="admin-submit">Giriş</button>
        </p>
      </form>
    </main>
  );
}
