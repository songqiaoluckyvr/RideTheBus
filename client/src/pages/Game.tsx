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
import { STAGE_MULTIPLIERS, HARD_STAGE_MULTIPLIERS, degradedMultiplier } from '../lib/payouts'
import type { Stage } from '../lib/stages'
import { DEV_MODE_ENABLED } from '../config'
import { Card } from '../components/Card'
import { uiImageUrl } from '../lib/cardAssets'
import { ScrollingBackground } from '../components/ScrollingBackground'
import { audioManager } from '../lib/audioManager'

// ─── Timer configuration per mode ────────────────────────────────────────────
// Global timer for the entire round — does NOT reset between stages.
// Change seconds independently per mode without side effects.
// ─── Timer configuration per mode ────────────────────────────────────────────
// minFactor: floor of degradation (1.0 = no degradation, 0.0 = full loss of profit)
const TIMER_CONFIG = {
  tournament:      { seconds: 30, type: 'bust'      as const, minFactor: 0.5 },
  'battle-royale': { seconds: 30, type: 'degrading' as const, minFactor: 0.5 },
  'casino-hard':   { seconds: 45, type: 'degrading' as const, minFactor: 0.26 },
} as const

type TimerType = 'bust' | 'degrading'

/** Grace period at game start only (not between stages). */
const STAGE_GRACE_MS = 1000

/**
 * Degradation starts immediately (DEGRADE_AFTER_SECONDS = 0).
 * factor 1.0 → full multiplier | factor minFactor → profit reduced at 1s remaining.
 */
const DEGRADE_AFTER_SECONDS = 0

function computeFactor(timeLeft: number, timerSeconds: number, type: TimerType, minFactor = 0.5): number {
  if (type !== 'degrading') return 1
  const degradeFrom = timerSeconds - DEGRADE_AFTER_SECONDS
  if (timeLeft >= degradeFrom) return 1.0
  if (timeLeft <= 0) return minFactor
  return 1.0 - ((degradeFrom - timeLeft) / (degradeFrom - 1)) * (1.0 - minFactor)
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
  const [muted, setMuted] = useState(audioManager.muted)

  const toggleMute = () => {
    const next = !muted
    audioManager.setMuted(next)
    setMuted(next)
  }

  // Timer state
  const isHardMode = mode === 'casino-hard'
  const stageMultipliers = isHardMode ? HARD_STAGE_MULTIPLIERS : STAGE_MULTIPLIERS

  const timerConfig = TIMER_CONFIG[mode as keyof typeof TIMER_CONFIG]
  const timerEnabled = !!timerConfig
  const timerSeconds = timerConfig?.seconds ?? 30
  const timerType: TimerType = timerConfig?.type ?? 'bust'
  const timerMinFactor: number = timerConfig?.minFactor ?? 0.5
  const [timeLeft, setTimeLeft] = useState<number>(timerSeconds)
  const [graceActive, setGraceActive] = useState(false)

  // Degradation factor (recomputed on every render — timeLeft changes every second)
  const factor = computeFactor(timeLeft, timerSeconds, timerType, timerMinFactor)

  // ── Background music: start on mount, stop on unmount ──────────────────────
  useEffect(() => {
    audioManager.startBgMusic(1)
    return () => audioManager.stopBgMusic()
  }, [])

  // ── Deck shuffle sound on new round start ───────────────────────────────────
  useEffect(() => {
    if (phase === 'stage' && currentStage === 1) {
      audioManager.play('deck-shuffle')
    }
  }, [phase, currentStage])

  // ── Card deal sound whenever a new card is revealed ─────────────────────────
  useEffect(() => {
    if (revealedCards.length > 0) {
      audioManager.play('card-deal')
    }
  }, [revealedCards.length])

  // ── Flash / shake on result ─────────────────────────────────────────────────
  useEffect(() => {
    if (lastResult === 'win') {
      setShowFlash('win')
      audioManager.play('win')
      setTimeout(() => setShowFlash(null), 600)
      if ((phase === 'cashout' && currentStage === 5) || phase === 'complete') {
        setShowAchievement(true)
      }
    }
    if (phase === 'bust') {
      setShowFlash('loss')
      audioManager.play('lose')
      setShake(true)
      setTimeout(() => setShowFlash(null), 600)
      setTimeout(() => setShake(false), 500)
    }
  }, [lastResult, phase, currentStage])

  // ── Reset global timer on idle (new round) or at the start of stage 1 ───────
  useEffect(() => {
    if (!timerEnabled) return
    if (phase === 'idle' || (phase === 'stage' && currentStage === 1)) {
      setTimeLeft(timerSeconds)
    }
  }, [phase, currentStage, timerEnabled, timerSeconds])

  // ── Grace period at game start only (stage 1 entry) ────────────────────────
  useEffect(() => {
    if (!timerEnabled || phase !== 'stage' || currentStage !== 1) return
    setGraceActive(true)
    const timeout = setTimeout(() => setGraceActive(false), STAGE_GRACE_MS)
    return () => { clearTimeout(timeout); setGraceActive(false) }
  }, [phase, currentStage, timerEnabled])

  // ── Countdown — runs during stage and cashout phases, after grace ───────────
  useEffect(() => {
    if (!timerEnabled || (phase !== 'stage' && phase !== 'cashout') || graceActive) return
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
    <div className="min-h-screen flex flex-col items-center justify-between pt-10 pb-10 px-4 relative overflow-hidden">

      {/* Background art */}
      <ScrollingBackground />

      {/* Table felt — scoped to the play area column */}
      <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl -z-[1] pointer-events-none">
        <img src={uiImageUrl('table-felt')} alt="" aria-hidden className="w-full h-full object-fill opacity-95" />
      </div>

      {/* Dev panel — next card preview */}
      {DEV_MODE_ENABLED && devMode && phase === 'stage' && deck[currentStage - 1] && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-30">
          <span className="text-yellow-400 text-xs font-mono uppercase tracking-widest">Next card</span>
          <Card card={deck[currentStage - 1]} revealed size="md" />
        </div>
      )}

      {/* Win/loss flash overlay (quick color pulse) */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            key={showFlash}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`fixed inset-0 pointer-events-none z-40 ${
              showFlash === 'win' ? 'bg-green-400' : 'bg-red-600'
            }`}
          />
        )}
      </AnimatePresence>

      {/* Win screen image overlay */}
      <AnimatePresence>
        {phase === 'complete' && (
          <motion.div
            key="win-screen"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-30"
          >
            <div className="absolute bg-black/70 rounded-xl w-full max-w-[800px] h-[300px] -translate-y-[3.5vh]" />
            <img src={uiImageUrl('win-screen')} alt="You win!" className="relative w-[90vw] max-w-4xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game over screen image overlay */}
      <AnimatePresence>
        {phase === 'bust' && (
          <motion.div
            key="gameover-screen"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-30"
          >
            <div className="absolute bg-black/70 rounded-xl w-full max-w-[800px] h-[300px] -translate-y-[3.5vh]" />
            <img src={uiImageUrl('gameover-screen')} alt="Game over" className="relative w-[90vw] max-w-4xl" />
          </motion.div>
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
      <div className="w-full max-w-2xl grid grid-cols-3 items-center relative z-40">
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors z-50"
            title="Back to Title"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white/70">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h4a1 1 0 001-1v-3h2v3a1 1 0 001 1h4a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </button>
          <button
            onClick={toggleMute}
            className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors z-50 ${muted ? 'bg-white/5 border-white/10 text-white/30' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66A1.5 1.5 0 008.25 15.5V5.251a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.658.121z" />
              </svg>
            )}
          </button>
        </div>
        <img src={uiImageUrl('title')} alt="Ride the Bus" className="h-16 w-auto mx-auto" />
        <div className="text-right">
          <p className="text-white/40 text-xs">Current balance:</p>
          <p className="text-gold font-bold text-xl">${balance.toLocaleString()}</p>
        </div>
      </div>

      {/* Timer bar — stage phase (active) or cashout phase (frozen in blue) */}
      <AnimatePresence>
        {timerEnabled && (phase === 'stage' || phase === 'cashout') && (
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
                className={`h-full rounded-full ${
                  graceActive
                    ? 'animate-pulse bg-blue-400'
                    : `transition-all duration-1000 ease-linear ${isRed ? 'bg-red-500' : isYellow ? 'bg-yellow-400' : 'bg-green-500'}`
                }`}
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
              ? degradedMultiplier(stageMultipliers[s as Stage], factor, isHardMode)
              : stageMultipliers[s as Stage]
          const displayMult = Number.isInteger(rawMult) ? rawMult : (Math.floor(rawMult * 10) / 10).toFixed(1)
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
      <div className="flex-1 flex items-center justify-center w-full py-2">
        <CardRow
          revealedCards={revealedCards}
          currentStage={currentStage}
          phase={phase}
          shake={shake}
        />
      </div>

      {/* Stage prompt + betting panel in a layout-animated container */}
      <div className="w-full max-w-2xl flex flex-col items-center gap-4 pb-4 relative z-40">
        <AnimatePresence>
          {stageForPrompt !== null && (
            <motion.div
              key={`prompt-${stageForPrompt}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0 } }}
              exit={{ opacity: 0, transition: { duration: 0 } }}
            >
              <StagePrompt
                stage={stageForPrompt}
                onGuess={(guess: AnyGuess) => { audioManager.play('menu-select'); makeGuess(guess, factor, stageMultipliers, isHardMode) }}
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
          multiplierFactor={factor}
          isDegradingMode={timerType === 'degrading'}
          stageMultipliers={stageMultipliers}
          fullScale={isHardMode}
          onPlaceBet={(amount) => { audioManager.play('chips-added'); placeBet(amount) }}
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
