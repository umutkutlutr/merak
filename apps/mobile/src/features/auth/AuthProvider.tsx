import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { Profile } from '@merak/contracts';
import { auth, type Session } from '@/lib/auth';
import { api } from '@/lib/api';
import { syncClock } from '@/lib/clock';

interface AuthState {
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  refreshProfile(): Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const refreshProfile = useCallback(async () => {
    try {
      const me = await api<{ profile: Profile }>('GET', '/me');
      setProfile(me.profile);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const token = session?.access_token;
  useEffect(() => {
    if (token) {
      void refreshProfile();
      void syncClock();
    } else setProfile(null);
  }, [token, refreshProfile]);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      session,
      profile,
      async signIn(email, password) {
        const { error } = await auth.signInWithPassword({ email, password });
        if (error) throw new Error(mapAuthError(error.message));
      },
      async signUp(email, password) {
        const { data, error } = await auth.signUp({ email, password });
        if (error) throw new Error(mapAuthError(error.message));
        if (!data.session) {
          const r = await auth.signInWithPassword({ email, password });
          if (r.error) throw new Error('Kayıt alındı; e-posta doğrulaması gerekiyor olabilir. Giriş yapmayı dene.');
        }
      },
      async signOut() {
        await auth.signOut();
        setProfile(null);
      },
      refreshProfile,
    }),
    [ready, session, profile, refreshProfile],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function mapAuthError(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'E-posta veya şifre hatalı.';
  if (/already registered|already been registered/i.test(msg)) return 'Bu e-posta zaten kayıtlı. Giriş yapmayı dene.';
  if (/password/i.test(msg)) return 'Şifre en az 8 karakter olmalı.';
  if (/fetch|network/i.test(msg)) return 'Kimlik sunucusuna ulaşılamadı. Yerel stack çalışıyor mu?';
  return msg;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}
