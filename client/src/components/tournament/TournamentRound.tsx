import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CardRow } from '../CardRow'
import { StagePrompt } from '../StagePrompt'
import { PlayerStatusList } from './PlayerStatusList'
import type { PlayerRoundStateClient, PeerStatus, TournamentConfig } from '../../store/tournamentStore'
import type { AnyGuess } from '../../lib/stages'
import { STAGE_MULTIPLIERS, degradedMultiplier, calculatePayout } from '../../lib/payouts'
import type { Stage } from '../../lib/stages'
import { DEV_MODE_ENABLED } from '../../config'
import { Card } from '../Card'
import { uiImageUrl } from '../../lib/cardAssets'
import { audioManager } from '../../lib/audioManager'

// ─── Timer configuration per mode ────────────────────────────────────────────
const TIMER_SECONDS = 30
const STAGE_GRACE_MS = 2000

type TimerType = 'bust' | 'degrading'

const ROUND_TIMER_CONFIG: Record<string, { type: TimerType; minFactor: number }> = {
  'tournament':    { type: 'bust',      minFactor: 0.5 },
  'battle-royale': { type: 'degrading', minFactor: 0.5 },
}

function computeFactor(timeLeft: number, type: TimerType, minFactor: number): number {
  if (type !== 'degrading') return 1
  if (timeLeft >= TIMER_SECONDS) return 1.0
  if (timeLeft <= 0) return minFactor
  return 1.0 - ((TIMER_SECONDS - timeLeft) / (TIMER_SECONDS - 1)) * (1.0 - minFactor)
}

interface Props {
  myId: string
  roundState: PlayerRoundStateClient
  config: TournamentConfig
  roundNumber: number
  peers: PeerStatus[]
  mode?: string
  devMode?: boolean
  onGuess: (guess: AnyGuess, factor: number) => void
  onCashOut: () => void
  onContinue: () => void
  onForfeit: () => void
}

export function TournamentRound({
  myId,
  roundState,
  config,
  roundNumber,
  peers,
  mode = 'tournament',
  devMode = false,
  onGuess,
  onCashOut,
  onContinue,
  onForfeit,
}: Props) {
  const { gamePhase, currentStage, revealedCards, bet, roundPayout, lockedMultipliers, devDeck } = roundState

  const timerConfig = ROUND_TIMER_CONFIG[mode] ?? ROUND_TIMER_CONFIG['tournament']
  const isDegrading = timerConfig.type === 'degrading'

  const [showFlash, setShowFlash] = useState<'win' | 'loss' | null>(null)
  const [shake, setShake] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const [graceActive, setGraceActive] = useState(false)
  const [prevPhase, setPrevPhase] = useState(gamePhase)

  const factor = computeFactor(timeLeft, timerConfig.type, timerConfig.minFactor)
  const pct = timeLeft / TIMER_SECONDS
  const isRed = pct <= 0.2
  const isYellow = !isRed && pct <= 0.5

  // Background music
  useEffect(() => {
    audioManager.startBgMusic(2)
    return () => audioManager.stopBgMusic()
  }, [])

  // Deck shuffle on new stage-1 entry
  useEffect(() => {
    if (gamePhase === 'stage' && currentStage === 1) {
      audioManager.play('deck-shuffle')
    }
  }, [gamePhase, currentStage])

  // Card deal sound on each reveal
  useEffect(() => {
    if (revealedCards.length > 0) {
      audioManager.play('card-deal')
    }
  }, [revealedCards.length])

  // Flash on phase transition
  useEffect(() => {
    if (gamePhase === prevPhase) return
    setPrevPhase(gamePhase)

    if (gamePhase === 'cashout') {
      setShowFlash('win')
      audioManager.play('win')
      setTimeout(() => setShowFlash(null), 600)
    } else if (gamePhase === 'bust') {
      setShowFlash('loss')
      audioManager.play('lose')
      setShake(true)
      setTimeout(() => setShowFlash(null), 600)
      setTimeout(() => setShake(false), 500)
    }
  }, [gamePhase, prevPhase])

  // Reset timer when entering a new stage
  useEffect(() => {
    if (gamePhase !== 'stage') return
    setTimeLeft(TIMER_SECONDS)
  }, [gamePhase, currentStage])

  // Grace period at stage entry
  useEffect(() => {
    if (gamePhase !== 'stage') return
    setGraceActive(true)
    const t = setTimeout(() => setGraceActive(false), STAGE_GRACE_MS)
    return () => { clearTimeout(t); setGraceActive(false) }
  }, [gamePhase, currentStage])

  // Countdown
  useEffect(() => {
    if (gamePhase !== 'stage' || graceActive) return
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [gamePhase, graceActive])

  // Bust on expiry
  useEffect(() => {
    if (timeLeft > 0) return
    if (gamePhase === 'stage') onForfeit()
  }, [timeLeft]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cashout phase — show degrading timer too (visual only, factor locked on guess)
  useEffect(() => {
    if (gamePhase !== 'cashout') return
    setTimeLeft(TIMER_SECONDS) // fresh timer for cashout decision
  }, [gamePhase])

  const cashoutValue = roundPayout
  const nextValue = gamePhase === 'cashout' ? calculatePayout(bet, currentStage) : 0

  return (
    <div className="min-h-screen flex flex-col items-center justify-between pt-12 pb-6 px-4 relative overflow-hidden">

      {/* Background art */}
      <img src={uiImageUrl('background')} alt="" aria-hidden className="fixed inset-0 w-full h-full object-cover -z-10" />
      <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl -z-[1] pointer-events-none">
        <img src={uiImageUrl('table-felt')} alt="" aria-hidden className="w-full h-full object-cover opacity-95" />
      </div>

      {/* Win/loss flash */}
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

      {/* Win screen overlay */}
      <AnimatePresence>
        {gamePhase === 'complete' && (
          <motion.img key="win-screen" src={uiImageUrl('win-screen')} alt="You win!"
            initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 w-full h-full object-contain pointer-events-none z-30" />
        )}
      </AnimatePresence>

      {/* Game over screen overlay */}
      <AnimatePresence>
        {gamePhase === 'bust' && (
          <motion.img key="gameover-screen" src={uiImageUrl('gameover-screen')} alt="Game over"
            initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 w-full h-full object-contain pointer-events-none z-30" />
        )}
      </AnimatePresence>

      {/* Dev panel — next card preview */}
      {DEV_MODE_ENABLED && devMode && gamePhase === 'stage' && devDeck && devDeck[currentStage - 1] && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-30">
          <span className="text-yellow-400 text-xs font-mono uppercase tracking-widest">Next card</span>
          <Card card={devDeck[currentStage - 1]} revealed size="md" />
        </div>
      )}

      {/* Header */}
      <div className="w-full max-w-2xl flex items-start justify-between relative">
        <div className="w-24">
          <p className="text-white/40 text-xs">Round {roundNumber}{config.totalRounds > 0 ? ` of ${config.totalRounds}` : ''}</p>
        </div>
        <h1 className="font-display font-bold text-gold text-3xl absolute left-1/2 -translate-x-1/2">
          {mode === 'battle-royale' ? 'Battle Royale' : 'Tournament'}
        </h1>
        <div className="text-right">
          <p className="text-white/40 text-xs">Bet</p>
          <p className="text-gold font-bold text-xl">${bet.toLocaleString()}</p>
        </div>
      </div>

      {/* Timer bar */}
      <AnimatePresence>
        {(gamePhase === 'stage' || gamePhase === 'cashout') && (
          <motion.div
            key="timer"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-2xl"
          >
            <div className="flex justify-between text-xs mb-1 px-0.5">
              <span className={`uppercase tracking-widest ${gamePhase === 'cashout' ? 'text-blue-400' : graceActive ? 'text-blue-400 animate-pulse' : 'text-white/40'}`}>
                {gamePhase === 'cashout'
                  ? 'Paused'
                  : graceActive
                  ? 'Get ready…'
                  : isDegrading && factor < 1
                  ? `Multiplier ${(factor * 100).toFixed(0)}%`
                  : 'Time'}
              </span>
              <span className={`font-bold tabular-nums ${gamePhase === 'cashout' ? 'text-blue-400' : isRed ? 'text-red-400' : isYellow ? 'text-yellow-400' : 'text-white/60'}`}>
                {timeLeft}s
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  gamePhase === 'cashout'
                    ? 'bg-blue-400'
                    : graceActive
                    ? 'animate-pulse bg-blue-400'
                    : `transition-all duration-1000 ease-linear ${isRed ? 'bg-red-500' : isYellow ? 'bg-yellow-400' : 'bg-green-500'}`
                }`}
                style={{ width: `${pct * 100}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage multiplier bar */}
      <div className="w-full max-w-2xl flex justify-center gap-1 mt-2">
        {([1, 2, 3, 4, 5] as const).map((s) => {
          const done = revealedCards.length >= s
          const active = currentStage === s && (gamePhase === 'stage' || gamePhase === 'cashout')
          const locked = lockedMultipliers[s as Stage]
          const rawMult = locked !== undefined
            ? locked
            : isDegrading
              ? degradedMultiplier(STAGE_MULTIPLIERS[s as Stage], factor)
              : STAGE_MULTIPLIERS[s as Stage]
          const displayMult = Number.isInteger(rawMult) ? rawMult : (Math.floor(rawMult * 10) / 10).toFixed(1)
          return (
            <div
              key={s}
              className={`flex-1 rounded py-1 text-center text-xs font-bold border transition-all ${
                done && gamePhase !== 'bust'
                  ? 'bg-green-900/40 border-green-600/50 text-green-300'
                  : active
                  ? 'bg-gold/20 border-gold/60 text-gold'
                  : done && gamePhase === 'bust'
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
      <div className="flex-1 flex items-center justify-center w-full py-4">
        <CardRow
          revealedCards={revealedCards}
          currentStage={currentStage}
          phase={gamePhase as 'stage' | 'cashout' | 'bust' | 'complete' | 'idle'}
          shake={shake}
        />
      </div>

      {/* Stage prompt */}
      <div className="w-full max-w-2xl flex flex-col items-center gap-4">
        <AnimatePresence mode="wait">
          {gamePhase === 'stage' && (
            <motion.div
              key={`prompt-${currentStage}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <StagePrompt
                stage={currentStage}
                onGuess={(guess: AnyGuess) => onGuess(guess, factor)}
                disabled={gamePhase !== 'stage'}
              />
            </motion.div>
          )}

          {gamePhase === 'cashout' && (
            <motion.div
              key="cashout"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md"
            >
              <div className="bg-black/30 rounded-xl border border-gold/30 p-4 text-center mb-3">
                <p className="text-white/50 text-xs mb-1">Cash out now</p>
                <p className="text-2xl font-display font-bold text-gold">
                  ${cashoutValue.toLocaleString()}
                </p>
                <p className="text-white/30 text-xs mt-1">
                  {isDegrading ? 'Next stage (max):' : 'Next stage:'}{' '}
                  <span className="text-white/60">${nextValue.toLocaleString()}</span>
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

          {gamePhase === 'bust' && (
            <motion.div
              key="bust"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <p className="text-red-400 text-lg font-bold">Game Over</p>
              <p className="text-white/40 text-sm">You lost ${bet.toLocaleString()} this round</p>
              <p className="text-white/30 text-sm mt-1">Waiting for other players…</p>
            </motion.div>
          )}

          {gamePhase === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <p className="text-gold text-xl font-display font-bold">You rode the bus! 🏆</p>
              <p className="text-gold/80 text-lg">+${(roundPayout - bet).toLocaleString()} profit</p>
              <p className="text-white/30 text-sm mt-1">Waiting for other players…</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Other players sidebar */}
        <div className="w-full max-w-md">
          <p className="text-white/25 text-xs uppercase tracking-widest mb-2">Other Players</p>
          <PlayerStatusList peers={peers.filter((p) => p.playerId !== myId)} myId={myId} />
        </div>
      </div>
    </div>
  )
}
