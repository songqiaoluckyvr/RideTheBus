import { motion, AnimatePresence } from 'framer-motion'
import type { RoundRecord } from '../lib/engine'

interface Props {
  history: RoundRecord[]
}

export function HistoryLog({ history }: Props) {
  if (history.length === 0) return null

  return (
    <div className="w-full max-w-xs">
      <h3 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2 text-center">Round History</h3>
      <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {history.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs border ${
                r.payout > 0
                  ? 'bg-green-900/20 border-green-700/30 text-green-300'
                  : 'bg-red-900/20 border-red-700/30 text-red-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{r.payout > 0 ? '✅' : '💥'}</span>
                <span>Bet ${r.bet} · {r.stagesCleared} stage{r.stagesCleared !== 1 ? 's' : ''}</span>
                {r.cashedOut && <span className="text-gold/70">(cashed out)</span>}
              </div>
              <span className="font-bold">
                {r.payout > 0 ? `+$${(r.payout - r.bet).toLocaleString()}` : `-$${r.bet}`}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
