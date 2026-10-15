import { describe, expect, it } from 'vitest';
import { rankParticipants } from './results.service.js';

const row = (username: string, totalPoints: number, last: number | null) => ({
  participantId: username,
  userId: username,
  username,
  correctCount: 0,
  totalPoints,
  answeredCount: 0,
  lastAnswerAt: last == null ? null : new Date(last),
});

describe('rankParticipants', () => {
  it('equal points share the rank; the next rank skips (1,1,3)', () => {
    const ranked = rankParticipants([row('a', 150, 10), row('b', 150, 5), row('c', 90, 1)]);
    expect(ranked.map((r) => [r.username, r.rank])).toEqual([
      ['b', 1],
      ['a', 1],
      ['c', 3],
    ]);
  });
  it('orders ties for display by earlier last answer, then username — without changing rank', () => {
    const ranked = rankParticipants([row('zed', 100, 50), row('amy', 100, 50), row('bob', 100, null)]);
    expect(ranked.map((r) => r.username)).toEqual(['amy', 'zed', 'bob']);
    expect(ranked.every((r) => r.rank === 1)).toBe(true);
  });
});
