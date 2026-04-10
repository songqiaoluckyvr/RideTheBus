import { motion } from 'framer-motion'
import type { PeerStatus } from '../../store/tournamentStore'

interface Props {
  peers: PeerStatus[]
  myId: string
}

const outcomeLabel: Record<NonNullable<PeerStatus['outcome']>, string> = {
  skipped: 'Skipped',
  bust: 'Bust',
  cashed_out: 'Cashed out',
  complete: 'Rode the bus!',
}

const outcomeColor: Record<NonNullable<PeerStatus['outcome']>, string> = {
  skipped: 'text-white/30',
  bust: 'text-red-400',
  cashed_out: 'text-yellow-400',
  complete: 'text-green-400',
}

export function PlayerStatusList({ peers, myId }: Props) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {peers.map((p) => {
        const isMe = p.playerId === myId
        const statusDot =
          p.roundStatus === 'done'
            ? 'bg-white/30'
            : p.roundStatus === 'playing'
            ? 'bg-blue-400 animate-pulse'
            : 'bg-white/10'

        return (
          <motion.div
            key={p.playerId}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
              isMe ? 'bg-gold/10 border border-gold/20' : 'bg-white/5 border border-white/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${statusDot}`} />
              <span className={`font-semibold ${isMe ? 'text-gold' : 'text-white/70'}`}>
                {isMe ? 'You' : p.name}
              </span>
            </div>
            <div className="text-right">
              {p.outcome ? (
                <span className={`text-xs font-semibold ${outcomeColor[p.outcome]}`}>
                  {outcomeLabel[p.outcome]}
                </span>
              ) : (
                <span className="text-xs text-white/30">
                  {p.roundStatus === 'playing' ? 'Playing…' : 'Betting…'}
                </span>
              )}
              <p className="text-white/40 text-xs">${p.balance.toLocaleString()}</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
