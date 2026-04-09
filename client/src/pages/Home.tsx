import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import type { GameMode } from '../store/gameStore'

const MODES: { id: GameMode; label: string; desc: string; available: boolean }[] = [
  { id: 'casino', label: '🎰 Casino', desc: 'Solo vs the house. Bet, guess, cash out.', available: true },
  { id: 'tournament', label: '🏆 Tournament', desc: 'Buy-in, build chips, highest score wins.', available: false },
  { id: 'battle-royale', label: '💀 Battle Royale', desc: 'Last player standing wins.', available: false },
]

export function Home() {
  const [name, setName] = useState('')
  const [mode, setMode] = useState<GameMode>('casino')
  const setPlayerName = useGameStore((s) => s.setPlayerName)
  const setMode_ = useGameStore((s) => s.setMode)
  const reset = useGameStore((s) => s.reset)
  const navigate = useNavigate()

  const handleStart = () => {
    if (!name.trim()) return
    reset()
    setPlayerName(name.trim())
    setMode_(mode)
    if (mode === 'casino') {
      navigate('/game')
    } else {
      navigate('/lobby')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-8">
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
        <p className="text-white/40 mt-2 text-sm tracking-widest uppercase">Can you go all five?</p>
      </motion.div>

      {/* Card decoration */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
        animate={{ opacity: 1, scale: 1, rotate: -5 }}
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
        {/* Name input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-white/50 text-xs uppercase tracking-widest">Your Name</label>
          <input
            type="text"
            maxLength={20}
            placeholder="Enter your name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            className="bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:border-gold/60 focus:outline-none text-base"
            autoFocus
          />
        </div>

        {/* Mode select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-white/50 text-xs uppercase tracking-widest">Game Mode</label>
          <div className="flex flex-col gap-2">
            {MODES.map((m) => (
              <motion.button
                key={m.id}
                whileHover={m.available ? { scale: 1.02 } : {}}
                whileTap={m.available ? { scale: 0.98 } : {}}
                onClick={() => m.available && setMode(m.id)}
                disabled={!m.available}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                  mode === m.id && m.available
                    ? 'border-gold bg-gold/10 text-white'
                    : m.available
                    ? 'border-white/15 text-white/70 hover:border-white/30'
                    : 'border-white/5 text-white/25 cursor-not-allowed'
                }`}
              >
                <span className="text-lg leading-none mt-0.5">{m.label.split(' ')[0]}</span>
                <div>
                  <p className="font-semibold text-sm">{m.label.slice(m.label.indexOf(' ') + 1)}</p>
                  <p className="text-xs opacity-60 mt-0.5">{m.desc}</p>
                  {!m.available && <p className="text-xs text-gold/40 mt-0.5">Coming soon</p>}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Start button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleStart}
          disabled={!name.trim()}
          className="py-4 rounded-xl bg-gold text-black font-display font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed mt-1"
        >
          Let's Ride →
        </motion.button>
      </motion.div>

      <p className="text-white/20 text-xs">Starting balance: $1,000 · No registration required</p>
    </div>
  )
}
