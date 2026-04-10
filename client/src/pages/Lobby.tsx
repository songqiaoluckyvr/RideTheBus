import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { useTournamentStore } from '../store/tournamentStore'
import { useSocket } from '../hooks/useSocket'

const BUY_INS = [200, 400, 1000] as const

export function Lobby() {
  const navigate = useNavigate()
  const { name } = useGameStore()
  const { lobbyPhase, room, roomError, tournamentPhase, setLobbyPhase, setRoomError, reset } =
    useTournamentStore()
  const socket = useSocket()

  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [selectedBuyIn, setSelectedBuyIn] = useState<number>(400)
  const [joinCode, setJoinCode] = useState('')

  // Navigate to tournament when game starts
  useEffect(() => {
    if (tournamentPhase === 'betting') {
      navigate('/tournament')
    }
  }, [tournamentPhase, navigate])

  // Clear error after 3s
  useEffect(() => {
    if (!roomError) return
    const t = setTimeout(() => setRoomError(null), 3000)
    return () => clearTimeout(t)
  }, [roomError, setRoomError])

  const handleCreate = () => {
    if (!name) return
    socket.createRoom(name, 'tournament', selectedBuyIn)
  }

  const handleJoin = () => {
    if (!name || !joinCode) return
    socket.joinRoom(joinCode.toUpperCase(), name)
  }

  const handleBack = () => {
    reset()
    navigate('/')
  }

  const myPlayer = room?.players.find((p) => p.id === socket.myId)
  const isHost = myPlayer?.isHost ?? false
  const allReady = room ? room.players.length >= 2 && room.players.every((p) => p.ready) : false
  const isReady = myPlayer?.ready ?? false

  if (lobbyPhase === 'waiting' && room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-gold text-3xl font-bold mb-1">Tournament Lobby</h1>
          <div className="flex items-center gap-2 justify-center">
            <span className="text-white/40 text-sm">Room Code:</span>
            <button
              onClick={() => navigator.clipboard?.writeText(room.code)}
              className="font-mono text-xl font-bold text-gold tracking-widest hover:text-gold/80 transition-colors"
              title="Click to copy"
            >
              {room.code}
            </button>
          </div>
          <p className="text-white/30 text-xs mt-1">
            Buy-in: ${room.players[0]?.buyIn.toLocaleString()} · 5 rounds · Winner takes all
          </p>
        </div>

        {/* Player list */}
        <div className="w-full max-w-sm flex flex-col gap-2">
          {room.players.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between bg-black/30 border border-white/10 rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${p.ready ? 'bg-green-400' : 'bg-white/20'}`} />
                <span className="text-white font-semibold">{p.name}</span>
                {p.isHost && (
                  <span className="text-xs text-gold/60 border border-gold/30 rounded px-1.5 py-0.5">
                    HOST
                  </span>
                )}
              </div>
              <span className={`text-sm font-semibold ${p.ready ? 'text-green-400' : 'text-white/30'}`}>
                {p.ready ? 'Ready' : 'Waiting…'}
              </span>
            </motion.div>
          ))}

          {room.players.length < 4 && (
            <div className="flex items-center justify-center border border-dashed border-white/10 rounded-xl py-3 text-white/20 text-sm">
              Waiting for players ({room.players.length}/4)
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {!isReady && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => socket.setReady(room.code)}
              className="py-3 rounded-xl bg-gold text-black font-bold text-lg"
            >
              I'm Ready ✓
            </motion.button>
          )}

          {isHost && (
            <motion.button
              whileHover={{ scale: allReady ? 1.03 : 1 }}
              whileTap={{ scale: allReady ? 0.97 : 1 }}
              onClick={() => allReady && socket.startGame(room.code)}
              disabled={!allReady}
              className={`py-3 rounded-xl font-bold text-lg transition-all ${
                allReady
                  ? 'bg-green-500 text-black'
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
            >
              {allReady
                ? 'Start Tournament 🚌'
                : `Waiting for all players to ready up (${room.players.filter((p) => p.ready).length}/${room.players.length})`}
            </motion.button>
          )}

          {!isHost && isReady && (
            <p className="text-center text-white/40 text-sm">
              Waiting for the host to start…
            </p>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBack}
            className="py-2 rounded-xl border border-white/15 text-white/40 text-sm"
          >
            Leave Room
          </motion.button>
        </div>

        <AnimatePresence>
          {roomError && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-900/80 border border-red-500/40 text-red-300 px-5 py-3 rounded-xl text-sm"
            >
              {roomError}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Setup phase — create or join
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-8">
      <div className="text-center">
        <h1 className="font-display text-gold text-3xl font-bold mb-1">Tournament</h1>
        <p className="text-white/40 text-sm">Welcome, {name}</p>
      </div>

      {/* Tab toggle */}
      <div className="flex bg-black/30 rounded-xl p-1 gap-1">
        {(['create', 'join'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setRoomError(null) }}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              tab === t ? 'bg-gold text-black' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t === 'create' ? 'Create Room' : 'Join Room'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'create' ? (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-4 w-full max-w-sm"
          >
            <p className="text-white/50 text-sm text-center">Select buy-in tier</p>
            <div className="flex gap-3">
              {BUY_INS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setSelectedBuyIn(amount)}
                  className={`flex-1 py-3 rounded-xl font-bold text-lg border transition-all ${
                    selectedBuyIn === amount
                      ? 'border-gold bg-gold/10 text-gold'
                      : 'border-white/15 text-white/40 hover:border-white/30'
                  }`}
                >
                  ${amount}
                </button>
              ))}
            </div>
            <p className="text-white/30 text-xs text-center">
              Prize pool = total buy-ins × random 1–4×
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCreate}
              disabled={!name}
              className="py-3 rounded-xl bg-gold text-black font-bold text-lg disabled:opacity-30"
            >
              Create Room
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="join"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-4 w-full max-w-sm"
          >
            <p className="text-white/50 text-sm text-center">Enter the room code</p>
            <input
              type="text"
              maxLength={5}
              placeholder="XXXXX"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="text-center font-mono text-2xl tracking-widest bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-gold/60 focus:outline-none uppercase"
            />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleJoin}
              disabled={!name || joinCode.length < 5}
              className="py-3 rounded-xl bg-gold text-black font-bold text-lg disabled:opacity-30"
            >
              Join Room
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleBack}
        className="px-6 py-2 rounded-xl border border-white/15 text-white/40 text-sm"
      >
        ← Back
      </motion.button>

      <AnimatePresence>
        {roomError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-900/80 border border-red-500/40 text-red-300 px-5 py-3 rounded-xl text-sm"
          >
            {roomError}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
