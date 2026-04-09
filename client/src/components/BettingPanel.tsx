import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { calculatePayout } from '../lib/payouts'
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
  onPlaceBet: (amount: number) => void
  onCashOut: () => void
  onContinue: () => void
  onNewRound: () => void
  onBackToTitle: () => void
  onRestart: () => void
}

const QUICK_BETS = [10, 25, 50, 100, 250]

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
}: Props) {
  const [betInput, setBetInput] = useState('')

  const handleBet = (amount: number) => {
    if (amount > 0 && amount <= balance) {
      onPlaceBet(amount)
      setBetInput('')
    }
  }

  // roundPayout is already locked in with the degradation factor from the moment of guess
  const cashoutValue = phase === 'cashout' ? roundPayout : 0
  // Next stage always starts with a fresh timer (factor=1)
  const nextValue = phase === 'cashout' ? calculatePayout(currentBet, currentStage) : 0
  const isDegraded = cashoutValue > 0 && cashoutValue < calculatePayout(currentBet, (currentStage - 1) as Stage)

  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      {/* Balance */}
      <div className="flex items-center justify-between bg-black/30 rounded-xl px-5 py-3 border border-gold/20">
        <span className="text-white/60 text-sm">Balance</span>
        <motion.span
          key={balance}
          initial={{ scale: 1.15, color: '#f0d060' }}
          animate={{ scale: 1, color: '#ffffff' }}
          className="text-xl font-bold font-display"
        >
          ${balance.toLocaleString()}
        </motion.span>
      </div>

      {/* Betting phase */}
      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div
            key="bet"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-3"
          >
            <p className="text-white/60 text-sm text-center">Place your bet to start</p>
            {/* Quick bets */}
            <div className="flex gap-2 flex-wrap justify-center">
              {QUICK_BETS.filter((b) => b <= balance).map((b) => (
                <motion.button
                  key={b}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleBet(b)}
                  className="px-4 py-2 rounded-lg bg-felt-light border border-gold/30 text-gold font-semibold text-sm hover:border-gold/70 transition-colors"
                >
                  ${b}
                </motion.button>
              ))}
            </div>
            {/* Custom input */}
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={balance}
                placeholder="Custom amount"
                value={betInput}
                onChange={(e) => setBetInput(e.target.value)}
                className="flex-1 bg-black/30 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:border-gold/60 focus:outline-none"
              />
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleBet(Number(betInput))}
                disabled={!betInput || Number(betInput) <= 0 || Number(betInput) > balance}
                className="px-5 py-2 bg-gold text-black font-bold rounded-xl disabled:opacity-30"
              >
                Bet
              </motion.button>
            </div>
            {/* All-in */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleBet(balance)}
              className="py-2 rounded-xl border border-red-500/40 text-red-400 text-sm font-semibold hover:bg-red-900/20 transition-colors"
            >
              ALL IN — ${balance.toLocaleString()}
            </motion.button>
          </motion.div>
        )}

        {phase === 'stage' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-white/50 text-sm py-2"
          >
            Bet: <span className="text-gold font-bold">${currentBet}</span> · Stage {currentStage}/5
          </motion.div>
        )}

        {phase === 'cashout' && (
          <motion.div
            key="cashout"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
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
                Next stage: <span className="text-white/60">${nextValue.toLocaleString()}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onCashOut}
                className="flex-1 py-3 rounded-xl bg-gold text-black font-bold text-sm animate-pulse"
              >
                Cash Out 💰
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onContinue}
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3"
          >
            {phase === 'bust' ? (
              <div className="text-center">
                <p className="text-red-400 text-lg font-bold">Bust! 💥</p>
                <p className="text-white/50 text-sm">You lost ${currentBet}</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gold text-xl font-display font-bold">You rode the bus! 🏆</p>
                <p className="text-gold/80 text-lg">+${(roundPayout - currentBet).toLocaleString()} profit</p>
              </div>
            )}
            <div className="flex gap-3 w-full">
              {balance > 0 ? (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onNewRound}
                  className="flex-1 py-3 rounded-xl bg-felt-light border border-gold/40 text-white font-bold hover:border-gold/80 transition-colors"
                >
                  Continue to Play
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onRestart}
                  className="flex-1 py-3 rounded-xl bg-gold text-black font-bold hover:opacity-90 transition-opacity"
                >
                  Restart the Game
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={onBackToTitle}
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
