import { createHash, randomBytes, randomUUID } from 'node:crypto';

export const newId = (): string => randomUUID();

export function newParticipationToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Deterministic Fisher–Yates shuffle seeded from a string (stable per participant+question). */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const out = items.slice();
  let h = Number.parseInt(createHash('sha256').update(seed).digest('hex').slice(0, 8), 16) || 1;
  const next = () => {
    // xorshift32
    h ^= h << 13;
    h >>>= 0;
    h ^= h >>> 17;
    h ^= h << 5;
    h >>>= 0;
    return h / 0x1_0000_0000;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}
