import { describe, expect, it } from 'vitest';
import { hashToken, newParticipationToken, seededShuffle } from './ids.js';
import { sanitizeProps } from '../modules/analytics/analytics.service.js';
import { istanbulLocalDate } from './time.js';

describe('seededShuffle', () => {
  const items = ['a', 'b', 'c', 'd'];
  it('is deterministic for the same seed and a permutation of the input', () => {
    const x = seededShuffle(items, 'p1:q1');
    expect(seededShuffle(items, 'p1:q1')).toEqual(x);
    expect([...x].sort()).toEqual(items);
    expect(items).toEqual(['a', 'b', 'c', 'd']); // input untouched
  });
  it('varies across seeds', () => {
    const orders = new Set(Array.from({ length: 30 }, (_, i) => seededShuffle(items, `seed-${i}`).join('')));
    expect(orders.size).toBeGreaterThan(3);
  });
});

describe('participation tokens', () => {
  it('are random, long, and only stored hashed', () => {
    const t1 = newParticipationToken();
    const t2 = newParticipationToken();
    expect(t1).not.toBe(t2);
    expect(t1.length).toBeGreaterThanOrEqual(40);
    expect(hashToken(t1)).toHaveLength(64);
    expect(hashToken(t1)).not.toContain(t1);
  });
});

describe('analytics sanitizeProps', () => {
  it('drops secret-looking keys and e-mail-like values', () => {
    expect(sanitizeProps({ token: 'x', email: 'a@b.c', position: 2, note: 'mail me at a@b.c', ok: true })).toEqual({ position: 2, ok: true });
    expect(sanitizeProps({ correctOptionId: 'x' })).toBeNull();
  });
});

describe('istanbulLocalDate', () => {
  it('rolls the day at 00:00 Europe/Istanbul (UTC+3), not at UTC midnight', () => {
    expect(istanbulLocalDate(Date.parse('2026-10-14T20:59:59Z'))).toBe('2026-10-14');
    expect(istanbulLocalDate(Date.parse('2026-10-14T21:00:00Z'))).toBe('2026-10-15');
  });
});
