import type { QuizSessionStatus, SessionQuestionStatus } from '@merak/contracts';

/** Explicit, persisted state machines. Transitions elsewhere must appear here. */
export const SESSION_TRANSITIONS: Record<QuizSessionStatus, QuizSessionStatus[]> = {
  draft: ['scheduled', 'cancelled'],
  scheduled: ['lobby', 'cancelled'],
  lobby: ['live', 'cancelled'],
  live: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export const QUESTION_TRANSITIONS: Record<SessionQuestionStatus, SessionQuestionStatus[]> = {
  pending: ['open'],
  open: ['closed'],
  closed: ['revealed'],
  revealed: [],
};

export const TERMINAL_SESSION_STATES: QuizSessionStatus[] = ['completed', 'cancelled'];

export function canSessionTransition(from: QuizSessionStatus, to: QuizSessionStatus): boolean {
  return SESSION_TRANSITIONS[from].includes(to);
}

export function canQuestionTransition(from: SessionQuestionStatus, to: SessionQuestionStatus): boolean {
  return QUESTION_TRANSITIONS[from].includes(to);
}

export function isJoinable(status: QuizSessionStatus): boolean {
  return status === 'scheduled' || status === 'lobby' || status === 'live';
}

/**
 * Late-join rule (M0_DENEY_AYARI): a participant may answer questions that open AFTER they joined.
 * Joining while question N is open or revealed makes N+1 the first eligible question.
 */
export function eligibleFromPosition(
  sessionStatus: QuizSessionStatus,
  currentQuestionPosition: number | null,
): number {
  if (sessionStatus !== 'live' || currentQuestionPosition == null) return 1;
  return currentQuestionPosition + 1;
}

/** Answer window: opensAt <= receivedAt < closesAt. */
export function answerWindow(
  receivedAtMs: number,
  opensAtMs: number,
  closesAtMs: number,
): 'before_open' | 'open' | 'closed' {
  if (receivedAtMs < opensAtMs) return 'before_open';
  if (receivedAtMs >= closesAtMs) return 'closed';
  return 'open';
}
