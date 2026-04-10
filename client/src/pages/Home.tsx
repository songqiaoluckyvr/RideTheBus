import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import type { GameMode } from '../store/gameStore'
import { DEV_MODE_ENABLED } from '../config'
import { uiImageUrl } from '../lib/cardAssets'

const CASINO_MODES: { id: GameMode; label: string; desc: string }[] = [
  { id: 'casino', label: '🎰 Normal', desc: 'No timer, take your time to win the jackpot!' },
  { id: 'casino-hard', label: '⏱️ Hard', desc: '45sec to win, multipliers degrade, git gud.' },
]

const MULTI_MODES: { id: GameMode; label: string; desc: string }[] = [
  { id: 'tournament', label: '🏆 Tournament', desc: 'Buy-in, build chips, highest score wins.' },
  { id: 'battle-royale', label: '💀 Battle Royale', desc: 'Last player standing wins.' },
]

export function Home() {
  const [mode, setMode] = useState<GameMode>('casino')
  const setMode_ = useGameStore((s) => s.setMode)
  const reset = useGameStore((s) => s.reset)
  const devMode = useGameStore((s) => s.devMode)
  const setDevMode = useGameStore((s) => s.setDevMode)
  const navigate = useNavigate()

  const handleStart = () => {
    reset()
    setMode_(mode)
    if (mode === 'casino' || mode === 'casino-hard') {
      navigate('/game')
    } else {
      navigate('/lobby')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-8 relative">
      {/* Background art */}
      <img
        src={uiImageUrl('background')}
        alt=""
        aria-hidden
        className="fixed inset-0 w-full h-full object-cover -z-10"
      />

      {/* Table felt — scoped to the content column */}
      <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg -z-[1] pointer-events-none">
        <img src={uiImageUrl('table-felt')} alt="" aria-hidden className="w-full h-full object-cover opacity-95" />
      </div>
      {DEV_MODE_ENABLED && (
        <button
          onClick={() => setDevMode(!devMode)}
          className={`absolute top-4 right-4 px-3 py-1.5 text-xs rounded-lg border font-mono transition-colors ${
            devMode
              ? 'border-yellow-500/60 bg-yellow-500/10 text-yellow-400'
              : 'border-white/10 bg-white/5 text-white/20 hover:text-white/40'
          }`}
        >
          DEV {devMode ? 'ON' : 'OFF'}
        </button>
      )}
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center"
      >
        <h1 className="font-display font-black text-gold text-6xl md:text-7xl tracking-tight">
          Ride the Bus
        </h1>
        <p className="text-white/40 mt-2 text-sm tracking-widest uppercase">Are you luckier than the casino?</p>
      </motion.div>

      {/* Card decoration */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex gap-2"
      >
        {['♥', '♦', '♣', '♠'].map((s, i) => (
          <motion.div
            key={s}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className={`text-2xl ${s === '♥' || s === '♦' ? 'text-red-400' : 'text-white/70'}`}
          >
            {s}
          </motion.div>
        ))}
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="w-full max-w-sm flex flex-col gap-4"
      >
        {/* Mode select */}
        <div className="flex flex-col gap-3">
          <label className="text-white/50 text-xs uppercase tracking-widest">Game Mode</label>

          {/* Solo — 2 buttons side by side */}
          <div className="flex flex-col gap-1">
            <p className="text-white/30 text-xs uppercase tracking-widest">Solo</p>
            <div className="flex gap-2">
              {CASINO_MODES.map((m) => (
                <motion.button
                  key={m.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode(m.id)}
                  className={`flex-1 px-3 py-3 rounded-xl border text-left transition-colors ${
                    mode === m.id
                      ? 'border-gold bg-gold/10 text-white'
                      : 'border-white/15 text-white/70 hover:border-white/30'
                  }`}
                >
                  <p className="font-semibold text-sm">{m.label}</p>
                  <p className="text-xs opacity-60 mt-0.5">{m.desc}</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Multiplayer */}
          <div className="flex flex-col gap-1 mt-3">
            <p className="text-white/30 text-xs uppercase tracking-widest">Multiplayer</p>
            <div className="flex flex-col gap-2">
              {MULTI_MODES.map((m) => (
                <motion.button
                  key={m.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode(m.id)}
                  className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                    mode === m.id
                      ? 'border-gold bg-gold/10 text-white'
                      : 'border-white/15 text-white/70 hover:border-white/30'
                  }`}
                >
                  <span className="text-lg leading-none mt-0.5">{m.label.split(' ')[0]}</span>
                  <div>
                    <p className="font-semibold text-sm">{m.label.slice(m.label.indexOf(' ') + 1)}</p>
                    <p className="text-xs opacity-60 mt-0.5">{m.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Start button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleStart}
          className="py-4 rounded-xl bg-gold text-black font-display font-bold text-lg mt-1"
        >
          Let's Ride →
        </motion.button>
      </motion.div>

      <p className="text-white/20 text-xs">Starting balance: $1,000 · No registration required</p>
    </div>
  )
}
