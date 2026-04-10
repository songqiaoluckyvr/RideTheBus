import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { LeaderboardEntry } from '../../store/tournamentStore'
import { uiImageUrl } from '../../lib/cardAssets'

interface Props {
  myId: string
  winnerId: string | null
  winnerName: string | null
  prize: number
  leaderboard: LeaderboardEntry[]
  onPlayAgain: () => void
}

export function FinalResults({ myId, winnerId, winnerName, prize, leaderboard, onPlayAgain }: Props) {
  const navigate = useNavigate()
  const iWon = myId === winnerId
  const noWinner = winnerId === null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-8 relative overflow-hidden">
      <img src={uiImageUrl('background')} alt="" aria-hidden className="fixed inset-0 w-full h-full object-cover -z-10" />
      <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl -z-[1] pointer-events-none">
        <img src={uiImageUrl('table-felt')} alt="" aria-hidden className="w-full h-full object-cover opacity-95" />
      </div>
      {/* Trophy */}
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        className="text-7xl"
      >
        {noWinner ? '💸' : iWon ? '🏆' : '🎲'}
      </motion.div>

      <div className="text-center">
        {noWinner ? (
          <>
            <h1 className="font-display text-white/60 text-3xl font-bold mb-2">Everyone went broke</h1>
            <p className="text-white/30 text-lg">No winner — the house wins</p>
          </>
        ) : iWon ? (
          <>
            <h1 className="font-display text-gold text-4xl font-bold mb-2">You Won!</h1>
            <p className="text-gold/70 text-xl">+${prize.toLocaleString()} prize</p>
          </>
        ) : (
          <>
            <h1 className="font-display text-white text-3xl font-bold mb-2">
              {winnerName} wins!
            </h1>
            <p className="text-white/40 text-lg">${prize.toLocaleString()} prize pool</p>
          </>
        )}
      </div>

      {/* Final leaderboard */}
      <div className="w-full max-w-sm flex flex-col gap-2">
        {leaderboard.map((entry, i) => {
          const isMe = entry.playerId === myId
          const isWinner = entry.playerId === winnerId
          return (
            <motion.div
              key={entry.playerId}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
                isWinner
                  ? 'bg-gold/15 border-gold/40'
                  : isMe
                  ? 'bg-white/5 border-white/15'
                  : 'bg-black/20 border-white/5'
              }`}
            >
              <span className="text-lg w-8 text-center">
                {entry.balance <= 0 ? '' : i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </span>
              <div className="flex-1">
                <p className={`font-semibold ${isWinner ? 'text-gold' : isMe ? 'text-white' : 'text-white/60'}`}>
                  {isMe ? 'You' : entry.name}
                </p>
              </div>
              <span className={`font-bold ${isWinner ? 'text-gold' : 'text-white/60'}`}>
                ${entry.balance.toLocaleString()}
              </span>
            </motion.div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 w-full max-w-sm">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { onPlayAgain(); navigate('/lobby') }}
          className="flex-1 py-3 rounded-xl bg-gold text-black font-bold"
        >
          Play Again
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { onPlayAgain(); navigate('/') }}
          className="flex-1 py-3 rounded-xl border border-white/20 text-white font-semibold"
        >
          Home
        </motion.button>
      </div>
    </div>
  )
}
