export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type Value = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'
export type Color = 'red' | 'black'

export interface Card {
  suit: Suit
  value: Value
  numericValue: number // A=1, 2-10=face, J=11, Q=12, K=13
  color: Color
}

const VALUES: Value[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
const RED_SUITS: Suit[] = ['hearts', 'diamonds']

function numericValue(v: Value): number {
  if (v === 'A') return 1
  if (v === 'J') return 11
  if (v === 'Q') return 12
  if (v === 'K') return 13
  return parseInt(v)
}

export function createDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({
        suit,
        value,
        numericValue: numericValue(value),
        color: RED_SUITS.includes(suit) ? 'red' : 'black',
      })
    }
  }
  return deck
}

/** Fisher-Yates shuffle — returns a new array */
export function shuffle(deck: Card[]): Card[] {
  const d = [...deck]
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[d[i], d[j]] = [d[j], d[i]]
  }
  return d
}

export function createShuffledDeck(): Card[] {
  return shuffle(createDeck())
}
