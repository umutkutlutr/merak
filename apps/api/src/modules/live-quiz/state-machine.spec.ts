import { describe, expect, it } from 'vitest';
import { canQuestionTransition, canSessionTransition, isJoinable, SESSION_TRANSITIONS } from './state-machine.js';

describe('session state machine', () => {
  it('allows only the documented transitions', () => {
    expect(canSessionTransition('scheduled', 'lobby')).toBe(true);
    expect(canSessionTransition('lobby', 'live')).toBe(true);
    expect(canSessionTransition('live', 'completed')).toBe(true);
    expect(canSessionTransition('scheduled', 'live')).toBe(false);
    expect(canSessionTransition('live', 'lobby')).toBe(false);
  });
  it('treats completed and cancelled as terminal', () => {
    expect(SESSION_TRANSITIONS.completed).toEqual([]);
    expect(SESSION_TRANSITIONS.cancelled).toEqual([]);
    expect(canSessionTransition('cancelled', 'scheduled')).toBe(false);
  });
  it('can cancel from any non-terminal state', () => {
    for (const s of ['draft', 'scheduled', 'lobby', 'live'] as const) expect(canSessionTransition(s, 'cancelled')).toBe(true);
  });
  it('question: pending -> open -> closed -> revealed only', () => {
    expect(canQuestionTransition('pending', 'open')).toBe(true);
    expect(canQuestionTransition('open', 'closed')).toBe(true);
    expect(canQuestionTransition('closed', 'revealed')).toBe(true);
    expect(canQuestionTransition('pending', 'revealed')).toBe(false);
    expect(canQuestionTransition('revealed', 'open')).toBe(false);
  });
  it('joinable only in scheduled/lobby/live', () => {
    expect(isJoinable('scheduled')).toBe(true);
    expect(isJoinable('live')).toBe(true);
    expect(isJoinable('completed')).toBe(false);
    expect(isJoinable('draft')).toBe(false);
  });
});
