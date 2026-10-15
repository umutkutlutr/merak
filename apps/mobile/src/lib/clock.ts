import { api } from './api';

/** Display-only clock offset (serverTime − deviceTime). The server never trusts device time. */
let offsetMs = 0;
let synced = false;

export async function syncClock(): Promise<number> {
  const started = Date.now();
  try {
    const r = await api<{ serverTimeMs: number }>('GET', '/time');
    const rtt = Date.now() - started;
    offsetMs = r.serverTimeMs + rtt / 2 - Date.now();
    synced = true;
  } catch {
    /* keep previous offset */
  }
  return offsetMs;
}

export const serverNow = () => Date.now() + offsetMs;
export const isClockSynced = () => synced;
