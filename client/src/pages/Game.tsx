import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { CardRow } from '../components/CardRow'
import { StagePrompt } from '../components/StagePrompt'
import { BettingPanel } from '../components/BettingPanel'
import { HistoryLog } from '../components/HistoryLog'
import { AchievementToast } from '../components/AchievementToast'
import type { AnyGuess } from '../lib/stages'
import { STAGE_MULTIPLIERS, degradedMultiplier } from '../lib/payouts'
import type { Stage } from '../lib/stages'
import { DEV_MODE_ENABLED } from '../config'
import { Card } from '../components/Card'

// ─── Timer configuration per mode ────────────────────────────────────────────
// Global timer for the entire round — does NOT reset between stages.
// Change seconds independently per mode without side effects.
const TIMER_CONFIG = {
  tournament:      { seconds: 30, type: 'bust'      as const },
  'battle-royale': { seconds: 30, type: 'degrading' as const }, // configurable per room in the future
  'casino-hard':   { seconds: 30, type: 'degrading' as const }, // separate from battle-royale
} as const

type TimerType = 'bust' | 'degrading'

/** Seconds at the start of each stage where the timer is frozen (reaction buffer). */
const STAGE_GRACE_MS = 2000

/**
 * Degradation starts after DEGRADE_AFTER_SECONDS have elapsed from full timer.
 * factor 1.0 → full multiplier | factor 0.5 → profit halved (at 1 s remaining).
 */
const DEGRADE_AFTER_SECONDS = 0

function computeFactor(timeLeft: number, timerSeconds: number, type: TimerType): number {
  if (type !== 'degrading') return 1
  const degradeFrom = timerSeconds - DEGRADE_AFTER_SECONDS
  if (timeLeft >= degradeFrom) return 1.0
  if (timeLeft <= 0) return 0.5
  return 1.0 - ((degradeFrom - timeLeft) / (degradeFrom - 1)) * 0.5
}

export function Game() {
  const {
    phase, currentStage, bet, balance, revealedCards, lastResult, roundPayout, history,
    name, mode, lockedMultipliers, deck, devMode,
    placeBet, makeGuess, continuePlaying, cashOut, newRound, restartSession, forfeit,
  } = useGameStore()

  const navigate = useNavigate()
  const [showFlash, setShowFlash] = useState<'win' | 'loss' | null>(null)
  const [showAchievement, setShowAchievement] = useState(false)
  const [shake, setShake] = useState(false)

  // Timer state
  const timerConfig = TIMER_CONFIG[mode as keyof typeof TIMER_CONFIG]
  const timerEnabled = !!timerConfig
  const timerSeconds = timerConfig?.seconds ?? 30
  const timerType: TimerType = timerConfig?.type ?? 'bust'
  const [timeLeft, setTimeLeft] = useState(timerSeconds)
  const [graceActive, setGraceActive] = useState(false)

  // Degradation factor (recomputed on every render — timeLeft changes every second)
  const factor = computeFactor(timeLeft, timerSeconds, timerType)

  // ── Flash / shake on result ─────────────────────────────────────────────────
  useEffect(() => {
    if (lastResult === 'win') {
      setShowFlash('win')
      setTimeout(() => setShowFlash(null), 600)
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

  // ── Reset global timer only at the start of a new round (stage 1) ──────────
  useEffect(() => {
    if (!timerEnabled || phase !== 'stage' || currentStage !== 1) return
    setTimeLeft(timerSeconds)
  }, [phase, currentStage, timerEnabled, timerSeconds])

  // ── Per-stage grace: freeze timer for STAGE_GRACE_MS on each stage entry ───
  useEffect(() => {
    if (!timerEnabled || phase !== 'stage') return
    setGraceActive(true)
    const timeout = setTimeout(() => setGraceActive(false), STAGE_GRACE_MS)
    return () => { clearTimeout(timeout); setGraceActive(false) }
  }, [phase, timerEnabled])

  // ── Countdown — runs only during stage phase, after grace ──────────────────
  useEffect(() => {
    if (!timerEnabled || phase !== 'stage' || graceActive) return
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [phase, timerEnabled, graceActive])

  // ── Bust on expiry ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerEnabled || timeLeft > 0) return
    if (phase === 'stage') forfeit()
  }, [timeLeft]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Color thresholds (percentage-based, works for any timer length) ─────────
  const pct = timeLeft / timerSeconds  // 1.0 → 0.0
  const isRed    = pct <= 0.2
  const isYellow = !isRed && pct <= 0.5

  const stageForPrompt = phase === 'stage' ? currentStage : null

  return (
    <div className="min-h-screen flex flex-col items-center justify-between py-6 px-4 relative overflow-hidden">

      {/* Home button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-50 w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        title="Back to Title"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white/70">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h4a1 1 0 001-1v-3h2v3a1 1 0 001 1h4a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      </button>

      {/* Dev panel — next card preview */}
      {DEV_MODE_ENABLED && devMode && phase === 'stage' && deck[currentStage - 1] && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-30">
          <span className="text-yellow-400 text-xs font-mono uppercase tracking-widest">Next card</span>
          <Card card={deck[currentStage - 1]} revealed size="md" />
        </div>
      )}

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

      {/* Timer bar — only during stage phase */}
      <AnimatePresence>
        {timerEnabled && phase === 'stage' && (
          <motion.div
            key="timer"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-2xl"
          >
            <div className="flex justify-between text-xs mb-1 px-0.5">
              <span className={`uppercase tracking-widest ${graceActive ? 'text-blue-400 animate-pulse' : 'text-white/40'}`}>
                {graceActive
                  ? 'Get ready…'
                  : timerType === 'degrading' && factor < 1
                    ? `Multiplier ${(factor * 100).toFixed(0)}%`
                    : 'Time'}
              </span>
              <span className={`font-bold tabular-nums ${isRed ? 'text-red-400' : isYellow ? 'text-yellow-400' : 'text-white/60'}`}>
                {timeLeft}s
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${graceActive ? 'animate-pulse bg-blue-400' : `transition-all duration-1000 ease-linear ${isRed ? 'bg-red-500' : isYellow ? 'bg-yellow-400' : 'bg-green-500'}`}`}
                style={{ width: `${(timeLeft / timerSeconds) * 100}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage multiplier bar */}
      <div className="w-full max-w-2xl flex justify-center gap-1 mt-2">
        {([1, 2, 3, 4, 5] as const).map((s) => {
          const done = revealedCards.length >= s
          const active = currentStage === s && (phase === 'stage' || phase === 'cashout')
          // Locked (already cleared): show value at time of win
          // Unlocked (current + future): show live degraded value from global timer
          const locked = lockedMultipliers[s as Stage]
          const rawMult = locked !== undefined
            ? locked
            : timerType === 'degrading'
              ? degradedMultiplier(STAGE_MULTIPLIERS[s as Stage], factor)
              : STAGE_MULTIPLIERS[s as Stage]
          const displayMult = Number.isInteger(rawMult) ? rawMult : rawMult.toFixed(1)
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
              x{displayMult}
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
                onGuess={(guess: AnyGuess) => makeGuess(guess, factor)}
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
          onContinue={() => { continuePlaying(); setShowAchievement(false) }}
          onNewRound={newRound}
          onBackToTitle={() => navigate('/')}
          onRestart={restartSession}
        />

        {/* History */}
        <HistoryLog history={history} />
      </div>
    </div>
  )
}
