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
  sm: 'w-16 h-24',
  md: 'w-24 h-32',
  lg: 'w-32 h-44',
}

const CENTER_VALUE_SIZE = {
  sm: 'text-3xl',
  md: 'text-4xl',
  lg: 'text-6xl',
}

const CORNER_SUIT_SIZE = {
  sm: 'text-2xl',   // center is text-3xl
  md: 'text-3xl',   // center is text-4xl
  lg: 'text-5xl',   // center is text-6xl
}

export function Card({ card, revealed = false, size = 'md', shake = false }: Props) {
  const sizeClass = SIZE[size]
  const centerClass = CENTER_VALUE_SIZE[size]
  const cornerSuitClass = CORNER_SUIT_SIZE[size]
  const isRed = card?.color === 'red'
  const color = isRed ? 'text-red-600' : 'text-gray-900'

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
        <div className="absolute inset-0 backface-hidden rounded-xl border-2 border-card-border bg-card-bg shadow-xl">
          {card && (
            <>
              {/* Top-left: suit symbol */}
              <div className={`absolute top-1.5 left-1.5 ${cornerSuitClass} font-bold leading-none ${color}`}>
                {SUIT_SYMBOL[card.suit]}
              </div>

              {/* Center: large value */}
              <div className={`absolute inset-0 flex items-center justify-center ${centerClass} font-bold ${color}`}>
                {card.value}
              </div>

              {/* Bottom-right: suit symbol */}
              <div className={`absolute bottom-1.5 right-1.5 ${cornerSuitClass} font-bold leading-none ${color}`}>
                {SUIT_SYMBOL[card.suit]}
              </div>
            </>
          )}
        </div>

        {/* Card back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl overflow-hidden shadow-xl">
          <img
            src="/card-back.png"
            alt="card back"
            className="w-full h-full object-cover"
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
