import type { Stage } from './stages'

/** Multiplier applied directly to the bet at each stage — default (casino normal) */
export const STAGE_MULTIPLIERS: Record<Stage, number> = {
  1: 1.9,
  2: 2.6,
  3: 4,
  4: 15,
  5: 723,
}

/** Multiplier table for hard mode (independent, can be tuned separately) */
export const HARD_STAGE_MULTIPLIERS: Record<Stage, number> = {
  1: 2.9,
  2: 4.0,
  3: 6.1,
  4: 23,
  5: 1100,
}

/**
 * Apply a degradation factor to a multiplier.
 * Default (fullScale=false): preserves a x1 base — profit portion scales (BR/Tournament).
 * fullScale=true: entire multiplier scales linearly (Hard mode, can go below x1).
 */
export function degradedMultiplier(baseMultiplier: number, factor: number, fullScale = false): number {
  return fullScale ? baseMultiplier * factor : 1 + (baseMultiplier - 1) * factor
}

/**
 * Round a multiplier to 1 decimal place (floor) — same rounding used for display.
 * Ensures payout ≡ displayed multiplier × bet with no precision drift.
 */
export function roundMultiplier(raw: number): number {
  return Math.floor(raw * 10) / 10
}

/** Payout given an initial bet, stage, and optional degradation factor (default 1 = no degradation) */
export function calculatePayout(
  bet: number,
  stage: Stage,
  factor = 1,
  multipliers: Record<Stage, number> = STAGE_MULTIPLIERS,
  fullScale = false,
): number {
  return Math.floor(bet * roundMultiplier(degradedMultiplier(multipliers[stage], factor, fullScale)))
}

/** What the player stands to win next if they continue */
export function nextPotential(
  bet: number,
  currentStage: Stage,
  factor = 1,
  multipliers: Record<Stage, number> = STAGE_MULTIPLIERS,
  fullScale = false,
): number {
  const next = (currentStage + 1) as Stage
  if (next > 5) return calculatePayout(bet, currentStage, factor, multipliers, fullScale)
  return calculatePayout(bet, next, factor, multipliers, fullScale)
}
