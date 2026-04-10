import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import type { GameMode } from '../store/gameStore'
import { DEV_MODE_ENABLED } from '../config'
import { uiImageUrl } from '../lib/cardAssets'
import { ScrollingBackground } from '../components/ScrollingBackground'
import { audioManager } from '../lib/audioManager'

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
  const balance = useGameStore((s) => s.balance)
  const resetBalance = useGameStore((s) => s.resetBalance)
  const devMode = useGameStore((s) => s.devMode)
  const setDevMode = useGameStore((s) => s.setDevMode)
  const navigate = useNavigate()
  const [muted, setMuted] = useState(audioManager.muted)

  const toggleMute = () => {
    const next = !muted
    audioManager.setMuted(next)
    setMuted(next)
    // Profite de la gesture utilisateur pour démarrer la musique si elle n'a pas encore démarré
    if (!next) audioManager.startBgMusic(2)
  }

  useEffect(() => {
    const startOnInteraction = () => {
      audioManager.startBgMusic(2)
      document.removeEventListener('click', startOnInteraction)
      document.removeEventListener('keydown', startOnInteraction)
    }
    // Try immediately (works if user already interacted before this page)
    audioManager.startBgMusic(2)
    // Fallback: start on first interaction (browser autoplay policy)
    document.addEventListener('click', startOnInteraction)
    document.addEventListener('keydown', startOnInteraction)
    return () => {
      document.removeEventListener('click', startOnInteraction)
      document.removeEventListener('keydown', startOnInteraction)
    }
  }, [])

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
    <div className="min-h-screen flex flex-col items-center justify-start px-4 relative">
      {/* Background art */}
      <ScrollingBackground />

      {/* Table felt — scoped to the content column */}
      <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg -z-[1] pointer-events-none">
        <img src={uiImageUrl('table-felt')} alt="" aria-hidden className="w-full h-full object-fill opacity-95" />
      </div>
      {/* Content column */}
      <div className="w-full max-w-lg min-h-screen flex flex-col items-center gap-4 pt-10 pb-8">

        {/* Top bar with buttons */}
        <div className="w-full flex items-center justify-between px-4">
          <div className="flex gap-2">
            <button
              onClick={() => { if (window.confirm('Reset balance to $1,000?')) resetBalance() }}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors"
              title="Reset balance"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
              </svg>
            </button>
            <button
              onClick={toggleMute}
              className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${muted ? 'bg-white/5 border-white/10 text-white/30' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
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

          {DEV_MODE_ENABLED ? (
            <button
              onClick={() => setDevMode(!devMode)}
              className={`px-3 py-1.5 text-xs rounded-lg border font-mono transition-colors ${
                devMode
                  ? 'border-yellow-500/60 bg-yellow-500/10 text-yellow-400'
                  : 'border-white/10 bg-white/5 text-white/20 hover:text-white/40'
              }`}
            >
              DEV {devMode ? 'ON' : 'OFF'}
            </button>
          ) : <div />}
        </div>

      {/* Title + subtitle + card suits */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center gap-1"
      >
        <img src={uiImageUrl('title')} alt="Ride the Bus" className="w-72 md:w-96 mx-auto" />
        <p className="text-white/40 text-sm tracking-widest uppercase">Are you luckier than the casino?</p>
        <div className="flex gap-2">
          {['♥', '♦', '♣', '♠'].map((s) => (
            <span key={s} className={`text-2xl ${s === '♥' || s === '♦' ? 'text-red-400' : 'text-white/70'}`}>{s}</span>
          ))}
        </div>
      </motion.div>

      {/* Balance */}
      <div className="text-center mb-2">
        <p className="text-white/40 text-xs uppercase tracking-widest">Your Balance</p>
        <p className="text-gold font-display font-bold text-2xl">${balance.toLocaleString()}</p>
      </div>

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

      </div>
    </div>
  )
}
