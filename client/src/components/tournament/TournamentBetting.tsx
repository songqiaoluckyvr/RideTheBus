import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlayerStatusList } from './PlayerStatusList'
import type { LeaderboardEntry, PeerStatus, TournamentConfig } from '../../store/tournamentStore'

const BET_TIMER_SECONDS = 20

interface Props {
  myId: string
  myBalance: number
  roundNumber: number
  config: TournamentConfig
  leaderboard: LeaderboardEntry[]
  peers: PeerStatus[]
  mode?: string
  onBet: (amount: number) => void
  hasPlacedBet: boolean
}

export function TournamentBetting({
  myId,
  myBalance,
  roundNumber,
  config,
  leaderboard,
  peers,
  mode = 'tournament',
  onBet,
  hasPlacedBet,
}: Props) {
  const isBR = mode === 'battle-royale'
  const maxBet = Math.min(myBalance, config.buyIn)
  const [sliderValue, setSliderValue] = useState(Math.floor(maxBet * 0.25))
  const [timeLeft, setTimeLeft] = useState(BET_TIMER_SECONDS)
  const timedOut = useRef(false)

  // Countdown — only while bet not placed
  useEffect(() => {
    if (hasPlacedBet) return
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          if (!timedOut.current) {
            timedOut.current = true
            onBet(isBR ? Math.floor(maxBet * 0.5) : 0)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [hasPlacedBet, onBet])

  // Keep slider in range if effective max changes
  useEffect(() => {
    setSliderValue((prev) => Math.min(prev, maxBet))
  }, [maxBet])

  // Auto-skip when balance is 0
  useEffect(() => {
    if (myBalance === 0 && !hasPlacedBet) {
      onBet(0)
    }
  }, [myBalance, hasPlacedBet, onBet])

  const pct = timeLeft / BET_TIMER_SECONDS
  const isRed = pct <= 0.25
  const isYellow = !isRed && pct <= 0.5

  const handleBet = (amount: number) => {
    if (amount >= 0 && amount <= myBalance) {
      onBet(amount)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start gap-5 px-4 py-8">
      {/* Header */}
      <div className="w-full max-w-md text-center">
        <h2 className="font-display text-gold text-2xl font-bold">
          Round {roundNumber}{config.totalRounds > 0 ? ` of ${config.totalRounds}` : ''}
        </h2>
        <p className="text-white/40 text-sm mt-1">
          Prize pool: <span className="text-gold font-semibold">${config.prizePool.toLocaleString()}</span>
          <span className="text-white/25 ml-1">({config.prizeMultiplier}× multiplier)</span>
        </p>
      </div>

      {/* Bet timer */}
      <AnimatePresence>
        {!hasPlacedBet && (
          <motion.div
            key="bet-timer"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md"
          >
            <div className="flex justify-between text-xs mb-1 px-0.5">
              <span className="text-white/40 uppercase tracking-widest">Place your bet</span>
              <span className={`font-bold tabular-nums ${isRed ? 'text-red-400' : isYellow ? 'text-yellow-400' : 'text-white/60'}`}>
                {timeLeft}s
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${isRed ? 'bg-red-500' : isYellow ? 'bg-yellow-400' : 'bg-green-500'}`}
                style={{ width: `${pct * 100}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Standings */}
      <div className="w-full max-w-md">
        <p className="text-white/30 text-xs uppercase tracking-widest mb-2">Standings</p>
        {leaderboard.map((entry, i) => (
          <div
            key={entry.playerId}
            className={`flex items-center justify-between py-2 border-b border-white/5 last:border-0 ${
              entry.playerId === myId ? 'text-gold' : 'text-white/60'
            }`}
          >
            <span className="text-white/30 w-5 text-sm">#{i + 1}</span>
            <span className="flex-1 font-semibold text-sm ml-2">
              {entry.playerId === myId ? 'You' : entry.name}
            </span>
            <span className="font-bold text-sm">${entry.balance.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Bet UI */}
      <AnimatePresence mode="wait">
        {!hasPlacedBet ? (
          <motion.div
            key="betting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md flex flex-col gap-4"
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
                max={maxBet}
                step={Math.max(1, Math.floor(maxBet / 100))}
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="w-full accent-yellow-400 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-white/25">
                <span>$1</span>
                <span>${maxBet.toLocaleString()}</span>
              </div>
            </div>

            {/* Quick % buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[0.1, 0.25, 0.5, 1].map((frac) => {
                const amount = Math.floor(maxBet * frac)
                const label = frac === 1 ? 'All In' : `${frac * 100}%`
                return (
                  <motion.button
                    key={frac}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setSliderValue(amount)}
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

            {/* Confirm + skip */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleBet(sliderValue)}
                className={`py-3 rounded-xl bg-gold text-black font-bold text-base ${isBR ? 'w-full' : 'flex-1'}`}
              >
                Bet ${sliderValue.toLocaleString()}
              </motion.button>
              {!isBR && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleBet(0)}
                  className="px-5 py-3 rounded-xl border border-white/15 text-white/40 text-sm hover:border-white/30 transition-colors"
                >
                  Skip
                </motion.button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-md text-center py-4"
          >
            <p className="text-white/40 text-sm">Bet placed — waiting for others…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Other players */}
      <div className="w-full max-w-md">
        <p className="text-white/30 text-xs uppercase tracking-widest mb-2">Players</p>
        <PlayerStatusList peers={peers} myId={myId} />
      </div>
    </div>
  )
}
