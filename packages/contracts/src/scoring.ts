/**
 * Pure scoring rule shared for display purposes only. The SERVER is the only authority that
 * applies it; clients may use it to render "what-if" hints but never to report a score.
 *
 * M0_DENEY_AYARI: correct answer => round(base + bonusMax * (1 - elapsedMs/durationMs)), clamped
 * to [base, base+bonusMax]; wrong / missing / invalid => 0.
 */
export interface ScoringParams {
  base: number;
  speedBonusMax: number;
}

export const M0_SCORING: ScoringParams = { base: 60, speedBonusMax: 40 };

export function computePoints(
  isCorrect: boolean,
  elapsedMs: number,
  durationMs: number,
  params: ScoringParams = M0_SCORING,
): number {
  if (!isCorrect) return 0;
  if (!Number.isFinite(elapsedMs) || !Number.isFinite(durationMs) || durationMs <= 0) return 0;
  if (elapsedMs < 0 || elapsedMs >= durationMs) return 0;
  const raw = params.base + params.speedBonusMax * (1 - elapsedMs / durationMs);
  const rounded = Math.round(raw);
  return Math.max(params.base, Math.min(params.base + params.speedBonusMax, rounded));
}
