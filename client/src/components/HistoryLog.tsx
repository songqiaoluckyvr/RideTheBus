import { motion, AnimatePresence } from 'framer-motion'
import type { RoundRecord } from '../lib/engine'

interface Props {
  history: RoundRecord[]
}

export function HistoryLog({ history }: Props) {
  const slots = Array.from({ length: 3 }, (_, i) => history[i] ?? null)

  return (
    <div className="w-full max-w-md">
      <h3 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2 text-center">Last 3 rounds</h3>
      <div className="flex flex-col gap-1.5">
        {slots.map((r, i) => (
          r ? (
            <motion.div
              key={history.length - 1 - i}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs border ${
                r.payout > 0
                  ? 'bg-green-900/20 border-green-700/30 text-green-300'
                  : 'bg-red-900/20 border-red-700/30 text-red-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{r.payout > 0 ? '✅' : '💥'}</span>
                <span>Bet ${r.bet} · {r.stagesCleared} stage{r.stagesCleared !== 1 ? 's' : ''}</span>
                {r.cashedOut && (
                  <span className="text-gold/70">
                    ({['cashed out', r.multiplierPct !== undefined ? `${r.multiplierPct}%` : null].filter(Boolean).join(' - ')})
                  </span>
                )}
                {!r.cashedOut && r.multiplierPct !== undefined && (
                  <span className="text-white/40">({r.multiplierPct}%)</span>
                )}
              </div>
              <span className="font-bold">
                {r.payout > 0 ? `+$${(r.payout - r.bet).toLocaleString()}` : `-$${r.bet}`}
              </span>
            </motion.div>
          ) : (
            <div
              key={`empty-${i}`}
              className="rounded-lg px-3 py-2 text-xs border border-white/5 bg-white/[0.02] h-[34px]"
            />
          )
        ))}
      </div>
    </div>
  )
}
