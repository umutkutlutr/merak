import { GoTrueClient, type Session } from '@supabase/auth-js';
import { config } from './config';
import { sessionStorageAdapter } from './storage';

/**
 * Supabase Auth client. Points at the standalone GoTrue in the local stack or at
 * https://<ref>.supabase.co/auth/v1 in a hosted project — only the URL and anon key change.
 */
export const auth = new GoTrueClient({
  url: config.authUrl,
  headers: config.anonKey ? { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}` } : {},
  storage: sessionStorageAdapter,
  storageKey: 'merak.auth',
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: false,
  flowType: 'implicit',
});

export async function currentAccessToken(): Promise<string | null> {
  const { data } = await auth.getSession();
  return data.session?.access_token ?? null;
}

export type { Session };
