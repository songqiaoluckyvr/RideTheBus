import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  show: boolean
  stage: number
  payout: number
  onDone: () => void
}

const ACHIEVEMENT_DATA: Record<number, { title: string; subtitle: string; emoji: string }> = {
  4: { title: 'Suit Master', subtitle: 'You cracked the suit!', emoji: '🦉' },
  5: { title: 'Rode the Bus!', subtitle: 'Legendary — all 5 stages!', emoji: '🏆' },
}

export function AchievementToast({ show, stage, payout, onDone }: Props) {
  const data = ACHIEVEMENT_DATA[stage]

  useEffect(() => {
    if (show) {
      const t = setTimeout(onDone, 3500)
      return () => clearTimeout(t)
    }
  }, [show, onDone])

  if (!data) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -60, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-felt-dark border-2 border-gold rounded-2xl px-8 py-5 shadow-2xl text-center min-w-[280px]">
            <motion.div
              initial={{ rotate: -15, scale: 0.5 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.15, type: 'spring' }}
              className="text-5xl mb-2"
            >
              {data.emoji}
            </motion.div>
            <p className="text-gold font-display font-bold text-xl">{data.title}</p>
            <p className="text-white/60 text-sm mt-1">{data.subtitle}</p>
            <p className="text-gold/80 font-bold mt-2">${payout.toLocaleString()} payout</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
