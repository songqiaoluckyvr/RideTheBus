import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { createRoom, joinRoom, removePlayer, getRoom, cleanupRooms } from './GameRoom'

const app = express()
app.use(cors())
app.use(express.json())

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] },
})

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }))

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id} connected`)

  // Create a new room
  socket.on('create_room', ({ name, mode }: { name: string; mode: 'tournament' | 'battle-royale' }) => {
    const room = createRoom(socket.id, name, mode)
    socket.join(room.code)
    socket.emit('room_joined', room)
    console.log(`Room ${room.code} created by ${name}`)
  })

  // Join an existing room
  socket.on('join_room', ({ code, name }: { code: string; name: string }) => {
    const room = joinRoom(code.toUpperCase(), socket.id, name)
    if (!room) {
      socket.emit('room_error', { message: 'Room not found or full' })
      return
    }
    socket.join(room.code)
    socket.emit('room_joined', room)
    io.to(room.code).emit('room_update', room)
    console.log(`${name} joined room ${room.code}`)
  })

  // Host starts the game
  socket.on('start_game', ({ code }: { code: string }) => {
    const room = getRoom(code)
    if (!room) return
    const player = room.players.find((p) => p.id === socket.id)
    if (!player?.isHost) return
    room.state = 'playing'
    io.to(room.code).emit('game_started', room)
    // TODO: initialize server-side game engine and deal first card
  })

  // Player makes a guess
  socket.on('make_guess', ({ code, guess }: { code: string; guess: unknown }) => {
    // TODO: server-side game engine evaluation
    console.log(`Guess in room ${code}:`, guess)
  })

  // Player cashes out
  socket.on('cash_out', ({ code }: { code: string }) => {
    // TODO: server-side cashout handling
    console.log(`Cashout in room ${code} by ${socket.id}`)
  })

  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id} disconnected`)
    // Find and clean up any rooms this player was in
    // (simple O(n) scan fine for jam-scale)
  })
})

// Cleanup stale rooms every 30 minutes
setInterval(cleanupRooms, 30 * 60 * 1000)

const PORT = process.env.PORT ?? 3001
httpServer.listen(PORT, () => {
  console.log(`🚌 Ride the Bus server running on port ${PORT}`)
})
