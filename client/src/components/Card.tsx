import { motion, AnimatePresence } from 'framer-motion'
import type { Card as CardType } from '../lib/deck'

interface Props {
  card?: CardType
  revealed?: boolean
  size?: 'sm' | 'md' | 'lg'
  /** shake animation on loss */
  shake?: boolean
}

const SUIT_SYMBOL: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
}

const SIZE = {
  sm: 'w-14 h-20 text-xs',
  md: 'w-20 h-28 text-sm',
  lg: 'w-28 h-40 text-base',
}

const CORNER_SIZE = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

export function Card({ card, revealed = false, size = 'md', shake = false }: Props) {
  const sizeClass = SIZE[size]
  const cornerClass = CORNER_SIZE[size]
  const isRed = card?.color === 'red'

  return (
    <motion.div
      className={`relative ${sizeClass} perspective-1000`}
      animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : {}}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="w-full h-full preserve-3d relative"
        animate={{ rotateY: revealed ? 0 : 180 }}
        initial={{ rotateY: 180 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {/* Card face */}
        <div className="absolute inset-0 backface-hidden rounded-xl border-2 border-card-border bg-card-bg shadow-xl flex flex-col justify-between p-1.5">
          {card && (
            <>
              <div className={`${cornerClass} font-bold leading-none ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
                <div>{card.value}</div>
                <div>{SUIT_SYMBOL[card.suit]}</div>
              </div>
              <div className={`text-center font-bold ${isRed ? 'text-red-600' : 'text-gray-900'}`}
                style={{ fontSize: size === 'lg' ? '2rem' : size === 'md' ? '1.5rem' : '1rem' }}>
                {SUIT_SYMBOL[card.suit]}
              </div>
              <div className={`${cornerClass} font-bold leading-none text-right rotate-180 ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
                <div>{card.value}</div>
                <div>{SUIT_SYMBOL[card.suit]}</div>
              </div>
            </>
          )}
        </div>

        {/* Card back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl border-2 border-gold/60 bg-felt shadow-xl overflow-hidden">
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-[85%] h-[85%] border-2 border-gold/40 rounded-lg flex items-center justify-center">
              <span className="text-gold/60 font-display font-bold" style={{ fontSize: size === 'lg' ? '1.5rem' : '1rem' }}>
                🦉
              </span>
            </div>
          </div>
          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #d4af37 0px, #d4af37 1px, transparent 1px, transparent 8px)',
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}

/** A placeholder facedown card with optional pulse (next to be drawn) */
export function CardSlot({ active = false, size = 'md' }: { active?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <motion.div
      className={`${SIZE[size]} rounded-xl border-2 ${active ? 'border-gold/80 bg-felt-light' : 'border-white/10 bg-white/5'}`}
      animate={active ? { scale: [1, 1.03, 1] } : {}}
      transition={{ repeat: Infinity, duration: 1.2 }}
    />
  )
}
