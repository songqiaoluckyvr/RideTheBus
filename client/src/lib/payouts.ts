import type { Stage } from './stages'

/** Multiplier applied to the running value at each stage */
export const STAGE_MULTIPLIERS: Record<Stage, number> = {
  1: 1.8,
  2: 3.5,
  3: 9,
  4: 38,
  5: 200,
}

/** Cumulative payout if you win all stages up to and including `stage` */
export function cumulativeMultiplier(stage: Stage): number {
  let m = 1
  for (let s = 1; s <= stage; s++) {
    m *= STAGE_MULTIPLIERS[s as Stage]
  }
  return m
}

/** Payout given an initial bet and the stage you cash out on (1-indexed, already won) */
export function calculatePayout(bet: number, stage: Stage): number {
  return Math.floor(bet * STAGE_MULTIPLIERS[stage])
}

/** What the player stands to win next if they continue */
export function nextPotential(bet: number, currentStage: Stage): number {
  const next = (currentStage + 1) as Stage
  if (next > 5) return calculatePayout(bet, currentStage)
  return calculatePayout(bet, next)
}
