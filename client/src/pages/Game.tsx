import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { CardRow } from '../components/CardRow'
import { StagePrompt } from '../components/StagePrompt'
import { BettingPanel } from '../components/BettingPanel'
import { HistoryLog } from '../components/HistoryLog'
import { AchievementToast } from '../components/AchievementToast'
import type { AnyGuess } from '../lib/stages'
import { STAGE_MULTIPLIERS } from '../lib/payouts'

export function Game() {
  const {
    phase, currentStage, bet, balance, revealedCards, lastResult, roundPayout, history,
    name,
    placeBet, makeGuess, continuePlaying, cashOut, newRound,
  } = useGameStore()

  const [showFlash, setShowFlash] = useState<'win' | 'loss' | null>(null)
  const [showAchievement, setShowAchievement] = useState(false)
  const [shake, setShake] = useState(false)

  // React to result changes
  useEffect(() => {
    if (lastResult === 'win') {
      setShowFlash('win')
      setTimeout(() => setShowFlash(null), 600)
      // Achievement for stage 4 clear (entering stage 5) and stage 5 clear
      if ((phase === 'cashout' && currentStage === 5) || phase === 'complete') {
        setShowAchievement(true)
      }
    }
    if (phase === 'bust') {
      setShowFlash('loss')
      setShake(true)
      setTimeout(() => setShowFlash(null), 600)
      setTimeout(() => setShake(false), 500)
    }
  }, [lastResult, phase, currentStage])

  const handleGuess = useCallback((guess: AnyGuess) => {
    makeGuess(guess)
  }, [makeGuess])

  const stageForPrompt = phase === 'stage' ? currentStage : null

  return (
    <div className="min-h-screen flex flex-col items-center justify-between py-6 px-4 relative overflow-hidden">
      {/* Win/loss flash overlay */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            key={showFlash}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`fixed inset-0 pointer-events-none z-40 ${
              showFlash === 'win' ? 'bg-green-400' : 'bg-red-600'
            }`}
          />
        )}
      </AnimatePresence>

      {/* Achievement toast */}
      <AchievementToast
        show={showAchievement}
        stage={phase === 'complete' ? 5 : currentStage - 1}
        payout={roundPayout}
        onDone={() => setShowAchievement(false)}
      />

      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-gold text-xl">Ride the Bus</h1>
          <p className="text-white/40 text-xs">Welcome, {name || 'Player'}</p>
        </div>
        <div className="text-right">
          <p className="text-white/40 text-xs">Balance</p>
          <p className="text-gold font-bold">${balance.toLocaleString()}</p>
        </div>
      </div>

      {/* Stage multiplier bar */}
      <div className="w-full max-w-2xl flex justify-center gap-1 mt-2">
        {([1, 2, 3, 4, 5] as const).map((s) => {
          const done = revealedCards.length >= s
          const active = currentStage === s && (phase === 'stage' || phase === 'cashout')
          return (
            <div
              key={s}
              className={`flex-1 rounded py-1 text-center text-xs font-bold border transition-all ${
                done && lastResult === 'win' && phase !== 'bust'
                  ? 'bg-green-900/40 border-green-600/50 text-green-300'
                  : active
                  ? 'bg-gold/20 border-gold/60 text-gold'
                  : done && phase === 'bust' && revealedCards.length === s
                  ? 'bg-red-900/40 border-red-600/50 text-red-400'
                  : 'bg-white/5 border-white/10 text-white/30'
              }`}
            >
              {STAGE_MULTIPLIERS[s]}x
            </div>
          )
        })}
      </div>

      {/* Cards */}
      <div className="flex-1 flex items-center justify-center w-full py-6">
        <CardRow
          revealedCards={revealedCards}
          currentStage={currentStage}
          phase={phase}
          shake={shake}
        />
      </div>

      {/* Stage prompt */}
      <div className="w-full max-w-2xl flex flex-col items-center gap-6 pb-4">
        <AnimatePresence mode="wait">
          {stageForPrompt !== null && (
            <motion.div
              key={`prompt-${stageForPrompt}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <StagePrompt
                stage={stageForPrompt}
                onGuess={handleGuess}
                disabled={phase !== 'stage'}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <BettingPanel
          balance={balance}
          currentBet={bet}
          phase={phase}
          currentStage={currentStage}
          roundPayout={roundPayout}
          onPlaceBet={placeBet}
          onCashOut={cashOut}
          onContinue={continuePlaying}
          onNewRound={newRound}
        />

        {/* History */}
        <HistoryLog history={history} />
      </div>
    </div>
  )
}
