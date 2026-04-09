import type { Card, Color, Suit } from './deck'

export type Stage = 1 | 2 | 3 | 4 | 5

// --- Guess types per stage ---
export type Stage1Guess = Color               // 'red' | 'black'
export type Stage2Guess = 'higher' | 'lower'
export type Stage3Guess = 'inside' | 'outside'
export type Stage4Guess = Suit
export type Stage5Guess = { value: string; suit: Suit }

export type AnyGuess = Stage1Guess | Stage2Guess | Stage3Guess | Stage4Guess | Stage5Guess

export type GuessResult = 'win' | 'loss'

export interface StageInfo {
  stage: Stage
  label: string
  description: string
}

export const STAGE_INFO: StageInfo[] = [
  { stage: 1, label: 'Red or Black?', description: 'Guess the color of the next card.' },
  { stage: 2, label: 'Higher or Lower?', description: 'Will the next card be higher or lower? Ties lose.' },
  { stage: 3, label: 'Inside or Outside?', description: 'Will the next card fall inside or outside the first two? Ties lose.' },
  { stage: 4, label: 'Pick a Suit', description: 'Guess the suit of the next card.' },
  { stage: 5, label: 'Exact Card', description: 'Name the exact card. Value + Suit.' },
]

export function evaluateGuess(stage: Stage, guess: AnyGuess, cards: Card[]): GuessResult {
  switch (stage) {
    case 1: {
      const card = cards[0]
      return card.color === (guess as Stage1Guess) ? 'win' : 'loss'
    }
    case 2: {
      const prev = cards[0]
      const curr = cards[1]
      if (curr.numericValue === prev.numericValue) return 'loss' // tie = loss
      const isHigher = curr.numericValue > prev.numericValue
      return (guess === 'higher') === isHigher ? 'win' : 'loss'
    }
    case 3: {
      const low = Math.min(cards[0].numericValue, cards[1].numericValue)
      const high = Math.max(cards[0].numericValue, cards[1].numericValue)
      const curr = cards[2].numericValue
      if (curr === low || curr === high) return 'loss' // tie = loss
      const isInside = curr > low && curr < high
      return (guess === 'inside') === isInside ? 'win' : 'loss'
    }
    case 4: {
      const card = cards[3]
      return card.suit === (guess as Stage4Guess) ? 'win' : 'loss'
    }
    case 5: {
      const card = cards[4]
      const g = guess as Stage5Guess
      return card.value === g.value && card.suit === g.suit ? 'win' : 'loss'
    }
  }
}
