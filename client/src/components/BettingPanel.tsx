import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { calculatePayout } from '../lib/payouts'
import { audioManager } from '../lib/audioManager'
import type { Stage } from '../lib/stages'
import type { GamePhase } from '../lib/engine'

interface Props {
  balance: number
  currentBet: number
  phase: GamePhase
  currentStage: Stage
  roundPayout: number
  /** Degradation factor from timer (1 = full multiplier, 0.5 = profit halved) */
  multiplierFactor?: number
  /** True for modes where the multiplier degrades over time */
  isDegradingMode?: boolean
  /** Active multiplier table for the current game mode */
  stageMultipliers?: Record<Stage, number>
  /** Hard mode: scale full multiplier (can go below x1) */
  fullScale?: boolean
  onPlaceBet: (amount: number) => void
  onCashOut: () => void
  onContinue: () => void
  onNewRound: () => void
  onBackToTitle: () => void
  onRestart: () => void
}

export function BettingPanel({
  balance,
  currentBet,
  phase,
  currentStage,
  roundPayout,
  onPlaceBet,
  onCashOut,
  onContinue,
  onNewRound,
  onBackToTitle,
  onRestart,
  multiplierFactor = 1,
  isDegradingMode = false,
  stageMultipliers,
  fullScale = false,
}: Props) {
  const [sliderValue, setSliderValue] = useState(() => Math.max(1, Math.floor(balance * 0.25)))

  // Keep slider in range if balance changes between rounds
  useEffect(() => {
    setSliderValue((prev) => Math.min(prev, balance))
  }, [balance])

  const handleBet = (amount: number) => {
    if (amount > 0 && amount <= balance) {
      onPlaceBet(amount)
    }
  }

  // roundPayout is already locked in with the degradation factor from the moment of guess
  const cashoutValue = phase === 'cashout' ? roundPayout : 0
  // Next stage max = current factor (timer is global, doesn't reset between stages)
  const nextValue = phase === 'cashout' ? calculatePayout(currentBet, currentStage, multiplierFactor, stageMultipliers, fullScale) : 0
  const isDegraded = cashoutValue > 0 && cashoutValue < calculatePayout(currentBet, (currentStage - 1) as Stage, 1, stageMultipliers, fullScale)

  return (
    <div className="flex flex-col gap-4 w-full max-w-md">

      {/* Betting phase */}
      <AnimatePresence>
        {phase === 'idle' && (
          <motion.div
            key="bet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0 }}
            className="flex flex-col gap-4"
          >
            {/* Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-sm">Bet amount</span>
                <span className="text-gold font-display font-bold text-2xl">
                  ${sliderValue.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={balance}
                step={Math.max(1, Math.floor(balance / 100))}
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="w-full accent-yellow-400 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-white/25">
                <span>$1</span>
                <span>${balance.toLocaleString()}</span>
              </div>
            </div>

            {/* Quick % buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[0.1, 0.25, 0.5, 1].map((frac) => {
                const amount = Math.max(1, Math.floor(balance * frac))
                const label = frac === 1 ? 'All In' : `${frac * 100}%`
                return (
                  <motion.button
                    key={frac}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onMouseEnter={() => audioManager.play('mouse-over-2')}
                    onClick={() => { audioManager.play('soft-click'); setSliderValue(amount) }}
                    className={`py-2 rounded-lg border text-xs font-semibold transition-colors ${
                      sliderValue === amount
                        ? 'border-gold/70 bg-gold/10 text-gold'
                        : 'border-white/15 text-white/40 hover:border-white/30'
                    }`}
                  >
                    {label}
                  </motion.button>
                )
              })}
            </div>

            {/* Confirm */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onMouseEnter={() => audioManager.play('mouse-over')}
              onClick={() => { audioManager.play('menu-selection-1'); handleBet(sliderValue) }}
              className="py-3 rounded-xl bg-gold text-black font-bold text-base"
            >
              Bet ${sliderValue.toLocaleString()}
            </motion.button>
          </motion.div>
        )}

        {phase === 'stage' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0 }}
            className="text-center text-white/50 text-sm py-2"
          >
            Bet: <span className="text-gold font-bold">${currentBet}</span> · Stage {currentStage}/5
          </motion.div>
        )}

        {phase === 'cashout' && (
          <motion.div
            key="cashout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0 }}
            className="flex flex-col gap-3"
          >
            <div className={`bg-black/30 rounded-xl border p-4 text-center transition-colors ${isDegraded ? 'border-yellow-500/40' : 'border-gold/30'}`}>
              <p className="text-white/50 text-xs mb-1">
                Cash out now{isDegraded && <span className="text-yellow-400 ml-1">({(multiplierFactor * 100).toFixed(0)}%)</span>}
              </p>
              <p className={`text-2xl font-display font-bold transition-colors ${isDegraded ? 'text-yellow-400' : 'text-gold'}`}>
                ${cashoutValue.toLocaleString()}
              </p>
              <p className="text-white/30 text-xs mt-1">
                {isDegradingMode ? 'Next stage (max):' : 'Next stage:'} <span className="text-white/60">${nextValue.toLocaleString()}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onMouseEnter={() => audioManager.play('mouse-over-2')}
                onClick={() => { audioManager.play('soft-click'); onCashOut() }}
                className="flex-1 py-3 rounded-xl bg-gold text-black font-bold text-sm animate-pulse"
              >
                Cash Out 💰
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onMouseEnter={() => audioManager.play('mouse-over-2')}
                onClick={() => { audioManager.play('soft-click'); onContinue() }}
                className="flex-1 py-3 rounded-xl border border-white/30 text-white font-semibold text-sm hover:border-white/60"
              >
                Keep Going →
              </motion.button>
            </div>
          </motion.div>
        )}

        {(phase === 'bust' || phase === 'complete') && (
          <motion.div
            key="end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0 }}
            className="flex flex-col items-center gap-3"
          >
            {phase === 'bust' ? (
              <div className="text-center">
                <p className="text-white/50 text-sm">You lost</p>
                <p className="text-red-400 font-display font-bold text-3xl">-${currentBet.toLocaleString()}</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-white/50 text-sm">Profit</p>
                <p className="text-gold font-display font-bold text-3xl">+${(roundPayout - currentBet).toLocaleString()}</p>
              </div>
            )}
            <div className="flex gap-3 w-full">
              {balance > 0 ? (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onMouseEnter={() => audioManager.play('mouse-over-2')}
                  onClick={() => { audioManager.play('soft-click'); onNewRound() }}
                  className="flex-1 py-3 rounded-xl bg-felt-light border border-gold/40 text-white font-bold hover:border-gold/80 transition-colors"
                >
                  Play Again
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onMouseEnter={() => audioManager.play('mouse-over-2')}
                  onClick={() => { audioManager.play('soft-click'); onRestart() }}
                  className="flex-1 py-3 rounded-xl bg-gold text-black font-bold hover:opacity-90 transition-opacity"
                >
                  Restart the Game
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onMouseEnter={() => audioManager.play('mouse-over-2')}
                onClick={() => { audioManager.play('soft-click'); onBackToTitle() }}
                className="flex-1 py-3 rounded-xl border border-white/20 text-white/60 font-semibold hover:border-white/40 hover:text-white/80 transition-colors"
              >
                ← Back to Title
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
