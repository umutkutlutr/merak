import { M0_SCORING, type SessionRules } from '@merak/contracts';

/**
 * M0_DENEY_AYARI — experimental rule set. Persisted as a snapshot on every session so that a
 * later change to this file never alters a published/started session.
 */
export const RULES_VERSION_M0 = 'm0-v1';

export const DEFAULT_RULES_M0: SessionRules = {
  rulesVersion: RULES_VERSION_M0,
  timezone: 'Europe/Istanbul',
  questionCount: 5,
  questionDurationMs: 12_000,
  revealDurationMs: 6_000,
  lobbyLeadMs: 60_000,
  points: { base: M0_SCORING.base, speedBonusMax: M0_SCORING.speedBonusMax },
};

export interface RulesOverride {
  questionDurationMs?: number;
  revealDurationMs?: number;
  lobbyLeadMs?: number;
}

/** Test-only overrides are bounded; the rules version records that they were applied. */
export function buildRules(override?: RulesOverride): SessionRules {
  if (!override || Object.keys(override).length === 0) return { ...DEFAULT_RULES_M0 };
  return {
    ...DEFAULT_RULES_M0,
    rulesVersion: `${RULES_VERSION_M0}+test-override`,
    questionDurationMs: override.questionDurationMs ?? DEFAULT_RULES_M0.questionDurationMs,
    revealDurationMs: override.revealDurationMs ?? DEFAULT_RULES_M0.revealDurationMs,
    lobbyLeadMs: override.lobbyLeadMs ?? DEFAULT_RULES_M0.lobbyLeadMs,
  };
}

/** Grace after a missed scheduled start (API was down) before the session is cancelled. */
export const MISSED_START_GRACE_MS = 60_000;
