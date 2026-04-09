import { createShuffledDeck } from './deck'
import type { Card } from './deck'
import type { Stage, AnyGuess, GuessResult } from './stages'
import { evaluateGuess } from './stages'
import { calculatePayout, degradedMultiplier, STAGE_MULTIPLIERS } from './payouts'

export type GamePhase =
  | 'idle'       // waiting for bet
  | 'stage'      // waiting for guess
  | 'revealing'  // card revealed, showing result briefly
  | 'cashout'    // won, deciding: continue or cash out
  | 'bust'       // lost
  | 'complete'   // won all 5 stages

export interface GameState {
  phase: GamePhase
  currentStage: Stage
  bet: number
  balance: number
  deck: Card[]
  revealedCards: Card[]    // cards drawn so far this round
  lastResult: GuessResult | null
  roundPayout: number
  /** Effective (possibly degraded) multiplier locked in at the moment each stage was cleared */
  lockedMultipliers: Partial<Record<Stage, number>>
  history: RoundRecord[]
}

export interface RoundRecord {
  bet: number
  stagesCleared: number
  payout: number
  cashedOut: boolean
}

const DEFAULT_BALANCE = 1000

export function createInitialState(): GameState {
  return {
    phase: 'idle',
    currentStage: 1,
    bet: 0,
    balance: DEFAULT_BALANCE,
    deck: [],
    revealedCards: [],
    lastResult: null,
    roundPayout: 0,
    lockedMultipliers: {},
    history: [],
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export function placeBet(state: GameState, amount: number): GameState {
  if (state.phase !== 'idle') return state
  if (amount <= 0 || amount > state.balance) return state

  const deck = createShuffledDeck()
  return {
    ...state,
    phase: 'stage',
    currentStage: 1,
    bet: amount,
    deck,
    revealedCards: [],
    lastResult: null,
    roundPayout: 0,
    lockedMultipliers: {},
  }
}

/** multiplierFactor: degradation factor at the moment of guess (1 = full, 0.5 = half profit) */
export function makeGuess(state: GameState, guess: AnyGuess, multiplierFactor = 1): GameState {
  if (state.phase !== 'stage') return state

  const { currentStage, deck, revealedCards, bet } = state
  const cardIndex = currentStage - 1
  const newCard = deck[cardIndex]
  const newRevealed = [...revealedCards, newCard]

  const result = evaluateGuess(currentStage, guess, newRevealed)

  if (result === 'loss') {
    const record: RoundRecord = {
      bet,
      stagesCleared: currentStage - 1,
      payout: 0,
      cashedOut: false,
    }
    return {
      ...state,
      phase: 'bust',
      revealedCards: newRevealed,
      lastResult: 'loss',
      balance: state.balance - bet,
      roundPayout: 0,
      history: [record, ...state.history].slice(0, 20),
    }
  }

  // Win
  const nextStage = (currentStage + 1) as Stage
  const isFinalStage = currentStage === 5

  const effectiveMult = degradedMultiplier(STAGE_MULTIPLIERS[currentStage as Stage], multiplierFactor)
  const updatedLockedMultipliers = { ...state.lockedMultipliers, [currentStage]: effectiveMult }

  if (isFinalStage) {
    const payout = calculatePayout(bet, 5, multiplierFactor)
    const record: RoundRecord = {
      bet,
      stagesCleared: 5,
      payout,
      cashedOut: false,
    }
    return {
      ...state,
      phase: 'complete',
      revealedCards: newRevealed,
      lastResult: 'win',
      balance: state.balance - bet + payout,
      roundPayout: payout,
      lockedMultipliers: updatedLockedMultipliers,
      history: [record, ...state.history].slice(0, 20),
    }
  }

  return {
    ...state,
    phase: 'cashout',
    currentStage: nextStage,
    revealedCards: newRevealed,
    lastResult: 'win',
    roundPayout: calculatePayout(bet, currentStage, multiplierFactor),
    lockedMultipliers: updatedLockedMultipliers,
  }
}

export function continuePlaying(state: GameState): GameState {
  if (state.phase !== 'cashout') return state
  return { ...state, phase: 'stage', lastResult: null }
}

/** Payout is already locked in roundPayout (degraded at time of guess) */
export function cashOut(state: GameState): GameState {
  if (state.phase !== 'cashout') return state

  const payout = state.roundPayout
  const record: RoundRecord = {
    bet: state.bet,
    stagesCleared: state.currentStage - 1,
    payout,
    cashedOut: true,
  }
  return {
    ...state,
    phase: 'idle',
    balance: state.balance - state.bet + payout,
    roundPayout: payout,
    history: [record, ...state.history].slice(0, 20),
    revealedCards: state.revealedCards,
  }
}

/**
 * Timer expired — bust the player regardless of phase (stage or cashout).
 * Draws the next card if in stage phase for visual feedback.
 */
export function forfeit(state: GameState): GameState {
  if (state.phase !== 'stage' && state.phase !== 'cashout') return state

  const { bet, currentStage, revealedCards } = state
  const stagesCleared = state.phase === 'cashout' ? currentStage - 1 : currentStage - 1
  const newRevealed = state.phase === 'stage'
    ? [...revealedCards, state.deck[currentStage - 1]]
    : revealedCards

  const record: RoundRecord = {
    bet,
    stagesCleared,
    payout: 0,
    cashedOut: false,
  }
  return {
    ...state,
    phase: 'bust',
    revealedCards: newRevealed,
    lastResult: 'loss',
    balance: state.balance - bet,
    roundPayout: 0,
    history: [record, ...state.history].slice(0, 20),
  }
}

export function newRound(state: GameState): GameState {
  return {
    ...state,
    phase: 'idle',
    currentStage: 1,
    lockedMultipliers: {},
    bet: 0,
    deck: [],
    revealedCards: [],
    lastResult: null,
    roundPayout: 0,
  }
}
