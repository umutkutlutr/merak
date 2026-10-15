import { GoTrueClient } from '@supabase/auth-js';

const url = import.meta.env.VITE_AUTH_URL ?? 'http://localhost:9999';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const auth = new GoTrueClient({
  url,
  headers: anonKey ? { apikey: anonKey, Authorization: `Bearer ${anonKey}` } : {},
  storageKey: 'merak.admin.auth',
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: false,
});

export async function accessToken(): Promise<string | null> {
  const { data } = await auth.getSession();
  return data.session?.access_token ?? null;
}
