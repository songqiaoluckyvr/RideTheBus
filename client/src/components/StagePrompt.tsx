import { useState } from 'react'
import { motion } from 'framer-motion'
import { audioManager } from '../lib/audioManager'
import type { Stage, AnyGuess, Stage5Guess } from '../lib/stages'
import { STAGE_INFO } from '../lib/stages'
import type { Suit, Value } from '../lib/deck'

interface Props {
  stage: Stage
  onGuess: (guess: AnyGuess) => void
  disabled?: boolean
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
const VALUES: Value[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const SUIT_SYMBOL: Record<Suit, string> = {
  hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠',
}
const SUIT_COLOR: Record<Suit, string> = {
  hearts: 'text-red-400', diamonds: 'text-red-400',
  clubs: 'text-white', spades: 'text-white',
}

function Btn({ label, onClick, disabled, color = 'default', className = '' }: {
  label: string; onClick: () => void; disabled?: boolean
  color?: 'red' | 'black' | 'default' | Suit
  className?: string
}) {
  const colors: Record<string, string> = {
    default: 'bg-felt-light hover:bg-felt border-gold/30 hover:border-gold/60 text-white',
    red: 'bg-red-900/60 hover:bg-red-800/80 border-red-500/40 hover:border-red-400 text-red-200',
    black: 'bg-gray-800/60 hover:bg-gray-700/80 border-gray-500/40 hover:border-gray-300 text-gray-200',
    hearts: 'bg-red-900/40 hover:bg-red-800/60 border-red-400/40 text-red-300',
    diamonds: 'bg-red-900/40 hover:bg-red-800/60 border-red-400/40 text-red-300',
    clubs: 'bg-gray-800/40 hover:bg-gray-700/60 border-gray-400/40 text-gray-200',
    spades: 'bg-gray-800/40 hover:bg-gray-700/60 border-gray-400/40 text-gray-200',
  }
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      onMouseEnter={() => audioManager.play('mouse-over-2')}
      onClick={() => { audioManager.play('soft-click'); onClick() }}
      disabled={disabled}
      className={`px-4 py-3 rounded-xl border font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${colors[color] ?? colors.default} ${className}`}
    >
      {label}
    </motion.button>
  )
}

export function StagePrompt({ stage, onGuess, disabled }: Props) {
  const info = STAGE_INFO[stage - 1]
  const [selectedValue, setSelectedValue] = useState<Value | null>(null)
  const [selectedSuit, setSelectedSuit] = useState<Suit | null>(null)

  return (
    <motion.div
      key={stage}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="text-center">
        <h2 className="text-2xl font-display font-bold text-gold">{info.label}</h2>
        <p className="text-white/60 text-sm mt-1">{info.description}</p>
      </div>

      {stage === 1 && (
        <div className="flex gap-2 md:gap-4 w-full max-w-xs">
          <Btn label="🔴 Red" color="red" onClick={() => onGuess('red')} disabled={disabled} className="flex-1" />
          <Btn label="⚫ Black" color="black" onClick={() => onGuess('black')} disabled={disabled} className="flex-1" />
        </div>
      )}

      {stage === 2 && (
        <div className="flex gap-2 md:gap-4 w-full max-w-xs">
          <Btn label="⬆ Higher" onClick={() => onGuess('higher')} disabled={disabled} className="flex-1" />
          <Btn label="⬇ Lower" onClick={() => onGuess('lower')} disabled={disabled} className="flex-1" />
        </div>
      )}

      {stage === 3 && (
        <div className="flex gap-2 md:gap-4 w-full max-w-xs">
          <Btn label="↔ Inside" onClick={() => onGuess('inside')} disabled={disabled} className="flex-1" />
          <Btn label="↕ Outside" onClick={() => onGuess('outside')} disabled={disabled} className="flex-1" />
        </div>
      )}

      {stage === 4 && (
        <div className="grid grid-cols-4 gap-2 w-full max-w-xs md:max-w-sm">
          {SUITS.map((suit) => (
            <motion.button
              key={suit}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onMouseEnter={() => audioManager.play('mouse-over-2')}
              onClick={() => { audioManager.play('soft-click'); onGuess(suit) }}
              disabled={disabled}
              className={`aspect-square rounded-xl border font-bold text-3xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                suit === 'hearts' || suit === 'diamonds'
                  ? 'bg-red-900/40 hover:bg-red-800/60 border-red-400/40 text-red-300'
                  : 'bg-gray-800/40 hover:bg-gray-700/60 border-gray-400/40 text-gray-200'
              }`}
            >
              {SUIT_SYMBOL[suit]}
            </motion.button>
          ))}
        </div>
      )}

      {stage === 5 && (
        <div className="flex flex-col items-center gap-3 w-full max-w-xl">
          {/* Value selector */}
          <div className="flex flex-col items-center gap-1.5">
            {[['A','2','3','4','5','6','7'], ['8','9','10','J','Q','K']].map((row, rowIdx) => (
              <div key={rowIdx} className="flex gap-1 md:gap-2">
                {row.map((v) => (
                  <motion.button
                    key={v}
                    whileTap={{ scale: 0.93 }}
                    onMouseEnter={() => audioManager.play('mouse-over-2')}
                    onClick={() => { audioManager.play('soft-click'); setSelectedValue(v as Value) }}
                    className={`w-9 md:w-11 h-8 md:h-9 rounded-lg border font-bold text-xs md:text-sm transition-colors ${
                      selectedValue === v
                        ? 'bg-gold text-black border-gold'
                        : 'bg-felt-light border-white/20 text-white hover:border-gold/50'
                    }`}
                  >
                    {v}
                  </motion.button>
                ))}
              </div>
            ))}
          </div>
          {/* Suit selector */}
          <div className="flex gap-2">
            {SUITS.map((suit) => (
              <motion.button
                key={suit}
                whileTap={{ scale: 0.93 }}
                onMouseEnter={() => audioManager.play('mouse-over-2')}
                onClick={() => { audioManager.play('soft-click'); setSelectedSuit(suit) }}
                className={`w-11 h-9 rounded-xl border font-bold text-lg transition-colors ${
                  selectedSuit === suit
                    ? 'bg-gold text-black border-gold'
                    : `bg-felt-light border-white/20 ${SUIT_COLOR[suit]} hover:border-gold/50`
                }`}
              >
                {SUIT_SYMBOL[suit]}
              </motion.button>
            ))}
          </div>
          {/* Confirm */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onMouseEnter={() => audioManager.play('mouse-over-2')}
            disabled={!selectedValue || !selectedSuit || disabled}
            onClick={() => {
              if (selectedValue && selectedSuit) {
                audioManager.play('soft-click')
                onGuess({ value: selectedValue, suit: selectedSuit } as Stage5Guess)
              }
            }}
            className="px-8 py-3 rounded-xl bg-gold text-black font-bold disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Confirm — {selectedValue ?? '?'} of {selectedSuit ? SUIT_SYMBOL[selectedSuit] : '?'}
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}
