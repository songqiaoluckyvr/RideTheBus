import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

// Placeholder — wired up in multiplayer phase
export function Lobby() {
  const navigate = useNavigate()
  const { name, mode } = useGameStore()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <h1 className="font-display text-gold text-3xl font-bold">Lobby</h1>
      <p className="text-white/50">Multiplayer coming soon, {name}!</p>
      <p className="text-white/30 text-sm">Mode: {mode}</p>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/')}
        className="px-6 py-3 rounded-xl border border-white/20 text-white"
      >
        ← Back
      </motion.button>
    </div>
  )
}
