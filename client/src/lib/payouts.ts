import type { Stage } from './stages'

/** Multiplier applied directly to the bet at each stage — default (casino normal) */
export const STAGE_MULTIPLIERS: Record<Stage, number> = {
  1: 1.8,
  2: 3.5,
  3: 9,
  4: 38,
  5: 200,
}

/** Multiplier table for hard mode (independent, can be tuned separately) */
export const HARD_STAGE_MULTIPLIERS: Record<Stage, number> = {
  1: 2.7,
  2: 5.25,
  3: 13.5,
  4: 57,
  5: 300,
}

/**
 * Apply a degradation factor to a multiplier's profit portion.
 * factor 1.0 = full multiplier, 0.5 = profit halved (e.g. x1.8 → x1.4)
 */
export function degradedMultiplier(baseMultiplier: number, factor: number): number {
  return 1 + (baseMultiplier - 1) * factor
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
): number {
  return Math.floor(bet * roundMultiplier(degradedMultiplier(multipliers[stage], factor)))
}

/** What the player stands to win next if they continue */
export function nextPotential(
  bet: number,
  currentStage: Stage,
  factor = 1,
  multipliers: Record<Stage, number> = STAGE_MULTIPLIERS,
): number {
  const next = (currentStage + 1) as Stage
  if (next > 5) return calculatePayout(bet, currentStage, factor, multipliers)
  return calculatePayout(bet, next, factor, multipliers)
}
