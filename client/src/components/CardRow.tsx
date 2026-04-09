import { AnimatePresence, motion } from 'framer-motion'
import type { Card as CardType } from '../lib/deck'
import { Card, CardSlot } from './Card'
import type { Stage } from '../lib/stages'

interface Props {
  revealedCards: CardType[]
  currentStage: Stage
  phase: string
  shake?: boolean
}

const STAGE_LABELS = ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Stage 5']

export function CardRow({ revealedCards, currentStage, phase, shake }: Props) {
  const totalSlots = 5

  return (
    <div className="flex gap-3 items-end justify-center">
      {Array.from({ length: totalSlots }).map((_, i) => {
        const stageNum = i + 1
        const card = revealedCards[i]
        const isActive = stageNum === currentStage && (phase === 'stage' || phase === 'cashout')
        const isRevealed = i < revealedCards.length
        const isLostHere = shake && stageNum === currentStage

        return (
          <motion.div
            key={i}
            className="flex flex-col items-center gap-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <span className="text-xs text-white/40">{STAGE_LABELS[i]}</span>
            {isRevealed ? (
              <Card card={card} revealed size="md" shake={isLostHere} />
            ) : (
              <CardSlot active={isActive} size="md" />
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
