import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { LeaderboardEntry } from '../../store/tournamentStore'
import { uiImageUrl } from '../../lib/cardAssets'

interface Props {
  roundNumber: number
  totalRounds: number
  leaderboard: LeaderboardEntry[]
  myId: string
  isFinal: boolean
  autoAdvanceMs: number
}

export function RoundLeaderboard({ roundNumber, totalRounds, leaderboard, myId, isFinal, autoAdvanceMs }: Props) {
  const [countdown, setCountdown] = useState(Math.round(autoAdvanceMs / 1000))

  useEffect(() => {
    setCountdown(Math.round(autoAdvanceMs / 1000))
    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [roundNumber, autoAdvanceMs])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-8 relative overflow-hidden">
      <img src={uiImageUrl('background')} alt="" aria-hidden className="fixed inset-0 w-full h-full object-cover -z-10" />
      <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl -z-[1] pointer-events-none">
        <img src={uiImageUrl('table-felt')} alt="" aria-hidden className="w-full h-full object-cover opacity-95" />
      </div>
      <div className="text-center">
        <h2 className="font-display text-gold text-3xl font-bold mb-1">
          {isFinal ? 'Final Standings' : `After Round ${roundNumber}`}
        </h2>
        <p className="text-white/40 text-sm">
          {isFinal
            ? 'Revealing results…'
            : `Next round in ${countdown}s`}
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-3">
        {leaderboard.map((entry, i) => {
          const isMe = entry.playerId === myId
          const deltaSign = entry.roundDelta >= 0 ? '+' : ''
          const deltaColor =
            entry.roundDelta > 0
              ? 'text-green-400'
              : entry.roundDelta < 0
              ? 'text-red-400'
              : 'text-white/30'

          return (
            <motion.div
              key={entry.playerId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
                isMe
                  ? 'bg-gold/10 border-gold/30'
                  : i === 0
                  ? 'bg-white/5 border-green-600/30'
                  : 'bg-black/20 border-white/8'
              }`}
            >
              <span className={`text-xl font-bold w-8 text-center ${i === 0 ? 'text-gold' : 'text-white/30'}`}>
                #{i + 1}
              </span>
              <div className="flex-1">
                <p className={`font-semibold ${isMe ? 'text-gold' : 'text-white'}`}>
                  {isMe ? 'You' : entry.name}
                </p>
                <p className={`text-xs font-semibold ${deltaColor}`}>
                  {deltaSign}{entry.roundDelta.toLocaleString()} this round
                </p>
              </div>
              <span className="text-white font-bold">${entry.balance.toLocaleString()}</span>
            </motion.div>
          )
        })}
      </div>

      {/* Countdown bar */}
      {!isFinal && (
        <div className="w-full max-w-sm">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gold/50 rounded-full"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: autoAdvanceMs / 1000, ease: 'linear' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
