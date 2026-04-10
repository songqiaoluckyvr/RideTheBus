import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { uiImageUrl } from '../../lib/cardAssets'

interface Props {
  multiplier: number
  prizePool: number
  onDone: () => void
}

// Spin schedule: each entry is [displayedValue, delayBeforeNext ms]
function buildSpinSequence(finalMultiplier: number): number[] {
  const nums: number[] = []
  // Fast spin — cycles 1→4 several times
  for (let i = 0; i < 12; i++) nums.push((i % 4) + 1)
  // Slow down — last few ticks approach the answer
  for (let i = 0; i < 4; i++) {
    const val = ((nums[nums.length - 1] % 4) + 1)
    nums.push(val)
  }
  // Force the final values to land on the multiplier after slowing
  nums.push(finalMultiplier)
  return nums
}

const DELAYS = [
  60, 60, 60, 60, 60, 60,  // fast
  80, 80, 80,               // medium
  130, 160, 200,            // slowing
  300, 420, 600,            // crawl
  0,                        // final reveal (instant, handled separately)
]

export function MultiplierReveal({ multiplier, prizePool, onDone }: Props) {
  const [displayNum, setDisplayNum] = useState(1)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const sequence = buildSpinSequence(multiplier)
    let step = 0

    function tick() {
      if (step >= sequence.length) return
      setDisplayNum(sequence[step])

      if (step === sequence.length - 1) {
        // Final number landed
        setTimeout(() => setRevealed(true), 300)
        setTimeout(onDone, 2800)
        return
      }

      const delay = DELAYS[step] ?? DELAYS[DELAYS.length - 2]
      step++
      setTimeout(tick, delay)
    }

    const startDelay = setTimeout(tick, 400)
    return () => clearTimeout(startDelay)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 relative overflow-hidden">
      <img src={uiImageUrl('background')} alt="" aria-hidden className="fixed inset-0 w-full h-full object-cover -z-10" />
      <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl -z-[1] pointer-events-none">
        <img src={uiImageUrl('table-felt')} alt="" aria-hidden className="w-full h-full object-cover opacity-95" />
      </div>

      {/* Background pulse rings */}
      {revealed && (
        <>
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.5, opacity: 0.6 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 1.2, delay: i * 0.15, ease: 'easeOut' }}
              className="absolute w-48 h-48 rounded-full border-2 border-gold/40 pointer-events-none"
            />
          ))}
        </>
      )}

      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-white/50 text-sm uppercase tracking-widest"
      >
        Prize pool multiplier
      </motion.p>

      {/* The spinning number */}
      <div className="relative flex items-center justify-center w-48 h-48">
        {/* Ring */}
        <motion.div
          animate={revealed ? { borderColor: 'rgba(212,175,55,0.8)', scale: 1.05 } : { borderColor: 'rgba(255,255,255,0.15)' }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 rounded-full border-4"
        />

        <AnimatePresence mode="popLayout">
          <motion.span
            key={displayNum}
            initial={{ y: 40, opacity: 0, scale: 0.7 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -40, opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.08 }}
            className={`font-display font-black text-8xl select-none ${
              revealed ? 'text-gold' : 'text-white/80'
            }`}
          >
            {displayNum}
          </motion.span>
        </AnimatePresence>
      </div>

      <motion.p
        animate={revealed ? { opacity: 1, scale: 1 } : { opacity: 0.3, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="text-white font-semibold text-lg"
      >
        ×{multiplier} multiplier
      </motion.p>

      {/* Prize pool reveal */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 14 }}
            className="text-center"
          >
            <p className="text-white/40 text-sm mb-1">Total prize pool</p>
            <p className="font-display text-gold font-black text-4xl">
              ${prizePool.toLocaleString()}
            </p>
            <p className="text-white/30 text-xs mt-2">Winner takes all 🏆</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
