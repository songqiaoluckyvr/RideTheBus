import { motion } from 'framer-motion'
import type { Card as CardType } from '../lib/deck'
import { cardImageUrl, uiImageUrl } from '../lib/cardAssets'

interface Props {
  card?: CardType
  revealed?: boolean
  size?: 'sm' | 'md' | 'lg'
  /** shake animation on loss */
  shake?: boolean
  /** pulse glow when this is the next card to be guessed */
  active?: boolean
}

const SIZE = {
  sm: 'w-12 md:w-16 aspect-[3/4]',
  md: 'w-14 md:w-24 aspect-[3/4]',
  lg: 'w-20 md:w-32 aspect-[3/4]',
}


export function Card({ card, revealed = false, size = 'md', shake = false, active = false }: Props) {
  const sizeClass = SIZE[size]

  return (
    <motion.div
      className={`relative ${sizeClass} perspective-1000 rounded-xl ${active ? 'ring-2 ring-gold/70 shadow-[0_0_12px_2px_rgba(212,175,55,0.4)]' : ''}`}
      animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : active ? { scale: [1, 1.03, 1] } : {}}
      transition={shake ? { duration: 0.4 } : active ? { repeat: Infinity, duration: 1.2 } : {}}
    >
      <motion.div
        className="w-full h-full preserve-3d relative"
        animate={{ rotateY: revealed ? 0 : 180 }}
        initial={{ rotateY: 180 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {/* Card face */}
        <div className="absolute inset-0 backface-hidden rounded-xl border-2 border-card-border bg-card-bg shadow-xl overflow-hidden">
          {card && (
            <img
              src={cardImageUrl(card.suit, card.value)}
              alt={`${card.value} of ${card.suit}`}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Card back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl overflow-hidden shadow-xl">
          <img
            src={`${import.meta.env.BASE_URL}card-back.png`}
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
      className={`${SIZE[size]} rounded-xl overflow-hidden ${active ? 'ring-2 ring-gold/80' : 'opacity-40'}`}
      animate={active ? { scale: [1, 1.03, 1] } : {}}
      transition={{ repeat: Infinity, duration: 1.2 }}
    >
      <img
        src={uiImageUrl('card-slot')}
        alt="empty card slot"
        className="w-full h-full object-cover"
      />
    </motion.div>
  )
}
