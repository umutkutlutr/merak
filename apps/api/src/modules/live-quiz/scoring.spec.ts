import { describe, expect, it } from 'vitest';
import { computePoints } from '@merak/contracts';
import { answerWindow, eligibleFromPosition } from './state-machine.js';

describe('computePoints (M0_DENEY_AYARI: round(60 + 40 × (1 − elapsed/duration)))', () => {
  const D = 12_000;
  it('gives 100 at the instant of opening and 60 just before closing', () => {
    expect(computePoints(true, 0, D)).toBe(100);
    expect(computePoints(true, D - 1, D)).toBe(60);
  });
  it('is linear in between', () => {
    expect(computePoints(true, 6_000, D)).toBe(80);
    expect(computePoints(true, 3_000, D)).toBe(90);
    expect(computePoints(true, 9_000, D)).toBe(70);
  });
  it('wrong, missing, late or invalid answers score 0', () => {
    expect(computePoints(false, 0, D)).toBe(0);
    expect(computePoints(true, D, D)).toBe(0);
    expect(computePoints(true, D + 5, D)).toBe(0);
    expect(computePoints(true, -1, D)).toBe(0);
    expect(computePoints(true, Number.NaN, D)).toBe(0);
    expect(computePoints(true, 10, 0)).toBe(0);
  });
  it('never exceeds [base, base+bonus]', () => {
    for (let e = 0; e < D; e += 97) {
      const p = computePoints(true, e, D);
      expect(p).toBeGreaterThanOrEqual(60);
      expect(p).toBeLessThanOrEqual(100);
    }
  });
});

describe('answerWindow: opensAt <= receivedAt < closesAt', () => {
  const open = 1_000_000;
  const close = open + 12_000;
  it('rejects before opening, accepts at opening', () => {
    expect(answerWindow(open - 1, open, close)).toBe('before_open');
    expect(answerWindow(open, open, close)).toBe('open');
  });
  it('accepts 1 ms before closing and rejects at the closing instant and after', () => {
    expect(answerWindow(close - 1, open, close)).toBe('open');
    expect(answerWindow(close, open, close)).toBe('closed');
    expect(answerWindow(close + 1, open, close)).toBe('closed');
  });
});

describe('eligibleFromPosition (late join)', () => {
  it('is 1 before the session is live', () => {
    expect(eligibleFromPosition('scheduled', null)).toBe(1);
    expect(eligibleFromPosition('lobby', null)).toBe(1);
  });
  it('is the next question when joining while a question is open or revealed', () => {
    expect(eligibleFromPosition('live', 1)).toBe(2);
    expect(eligibleFromPosition('live', 4)).toBe(5);
  });
});
