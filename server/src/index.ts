/** Set to false before shipping to production. */
const DEV_MODE_ENABLED = true

import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import {
  createRoom,
  joinRoom,
  removePlayer,
  getRoom,
  findRoomByPlayer,
  cleanupRooms,
  setPlayerReady,
  canStartTournament,
  initTournament,
  startRound,
  placeBet,
  processGuess,
  processCashOut,
  processContinue,
  forfeitPlayer,
  buildLeaderboard,
  finalizeTournament,
  sanitizeRoom,
  areAllDone,
} from './GameRoom'
import type { AnyGuess } from './lib/stages'

const app = express()
const ALLOWED_ORIGINS = [
  /^http:\/\/localhost(:\d+)?$/,
  'https://songqiaoluckyvr.github.io',
]
app.use(cors({ origin: ALLOWED_ORIGINS }))
app.use(express.json())

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'] },
})

app.get('/health', (_req, res) => res.json({ ok: true }))

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id} connected`)

  // ─── Lobby ────────────────────────────────────────────────────────────────

  socket.on('create_room', ({ name, mode, buyIn }: { name: string; mode: 'tournament' | 'battle-royale'; buyIn: number }) => {
    if (!name || !mode || !buyIn) {
      socket.emit('room_error', { message: 'Missing required fields' })
      return
    }
    const room = createRoom(socket.id, name, mode, buyIn)
    socket.join(room.code)
    socket.emit('room_joined', sanitizeRoom(room))
    console.log(`Room ${room.code} created by ${name} (${mode}, buy-in $${buyIn})`)
  })

  socket.on('join_room', ({ code, name }: { code: string; name: string }) => {
    const room = joinRoom(code.toUpperCase(), socket.id, name)
    if (!room) {
      socket.emit('room_error', { message: 'Room not found, full, or already started' })
      return
    }
    socket.join(room.code)
    socket.emit('room_joined', sanitizeRoom(room))
    io.to(room.code).emit('room_update', sanitizeRoom(room))
    console.log(`${name} joined room ${room.code}`)
  })

  socket.on('player_ready', ({ code }: { code: string }) => {
    const room = setPlayerReady(code, socket.id)
    if (!room) return
    io.to(room.code).emit('room_update', sanitizeRoom(room))
  })

  socket.on('start_game', ({ code }: { code: string }) => {
    const room = getRoom(code)
    if (!room) return
    const player = room.players.find((p) => p.id === socket.id)
    if (!player?.isHost) {
      socket.emit('room_error', { message: 'Only the host can start' })
      return
    }
    if (!canStartTournament(room)) {
      socket.emit('room_error', { message: 'Need at least 2 players, all ready' })
      return
    }

    initTournament(room)
    const round = startRound(room)

    // Snapshot balances before round for delta calc
    const prevBalances = Object.fromEntries(room.players.map((p) => [p.id, p.balance]))
    ;(room as any)._prevBalances = prevBalances

    io.to(room.code).emit('game_started', {
      room: sanitizeRoom(room),
      roundNumber: round.roundNumber,
      totalRounds: room.tournament!.config.totalRounds,
      prizePool: room.tournament!.config.prizePool,
      prizeMultiplier: room.tournament!.config.prizeMultiplier,
    })
    io.to(room.code).emit('round_started', {
      roundNumber: round.roundNumber,
      leaderboard: buildLeaderboard(room, prevBalances),
    })
    console.log(`Tournament started in room ${code}`)
  })

  // ─── Tournament gameplay ──────────────────────────────────────────────────

  socket.on('place_round_bet', ({ code, amount }: { code: string; amount: number }) => {
    const room = getRoom(code)
    if (!room) return

    const result = placeBet(room, socket.id, amount)
    if (!result.ok) {
      socket.emit('room_error', { message: result.error })
      return
    }

    const round = room.tournament!.currentRound!
    const ps = round.playerStates[socket.id]

    socket.emit('player_round_update', { ...ps, deck: undefined, devDeck: DEV_MODE_ENABLED ? ps.deck : undefined })
    io.to(code).emit('player_bet_placed', {
      playerId: socket.id,
      amount,
      skipped: result.skipped ?? false,
    })

    if (result.skipped) {
      io.to(code).emit('player_round_done', {
        playerId: socket.id,
        outcome: 'skipped',
        payout: 0,
        newBalance: room.players.find((p) => p.id === socket.id)?.balance,
      })
    }

    // If all players have now bet (all done or playing), transition round phase
    const allBet = Object.values(round.playerStates).every((s) => s.status !== 'betting')
    if (allBet) {
      round.phase = 'playing'
      io.to(code).emit('all_bets_placed')
    }

    // If all players skipped (all done immediately), jump straight to leaderboard
    if (areAllDone(round)) {
      _emitRoundEnd(room, code)
    }
  })

  socket.on('make_guess', ({ code, guess, multiplierFactor }: { code: string; guess: AnyGuess; multiplierFactor: number }) => {
    const room = getRoom(code)
    if (!room) return

    const round = room.tournament?.currentRound
    if (!round) return

    // Capture round payout before guess for stage_result broadcast
    const psBefore = round.playerStates[socket.id]
    const stageBefore = psBefore?.currentStage

    const result = processGuess(room, socket.id, guess, multiplierFactor)
    if (!result.ok) {
      socket.emit('room_error', { message: result.error })
      return
    }

    const ps = round.playerStates[socket.id]
    socket.emit('player_round_update', { ...ps, deck: undefined, devDeck: DEV_MODE_ENABLED ? ps.deck : undefined })

    io.to(code).emit('stage_result', {
      playerId: socket.id,
      stage: stageBefore,
      result: ps.outcome === 'bust' ? 'loss' : 'win',
      revealedCard: ps.revealedCards[ps.revealedCards.length - 1],
      gamePhase: ps.gamePhase,
    })

    if (ps.status === 'done') {
      io.to(code).emit('player_round_done', {
        playerId: socket.id,
        outcome: ps.outcome,
        payout: ps.roundPayout,
        newBalance: room.players.find((p) => p.id === socket.id)?.balance,
      })

      if (result.allDone) {
        _emitRoundEnd(room, code)
      }
    }
  })

  socket.on('cash_out', ({ code }: { code: string }) => {
    const room = getRoom(code)
    if (!room) return

    const result = processCashOut(room, socket.id)
    if (!result.ok) {
      socket.emit('room_error', { message: result.error })
      return
    }

    const round = room.tournament!.currentRound!
    const ps = round.playerStates[socket.id]
    socket.emit('player_round_update', { ...ps, deck: undefined, devDeck: DEV_MODE_ENABLED ? ps.deck : undefined })

    io.to(code).emit('player_round_done', {
      playerId: socket.id,
      outcome: 'cashed_out',
      payout: ps.roundPayout,
      newBalance: room.players.find((p) => p.id === socket.id)?.balance,
    })

    if (result.allDone) {
      _emitRoundEnd(room, code)
    }
  })

  socket.on('continue_playing', ({ code }: { code: string }) => {
    const room = getRoom(code)
    if (!room) return

    const result = processContinue(room, socket.id)
    if (!result.ok) {
      socket.emit('room_error', { message: result.error })
      return
    }

    const ps = room.tournament!.currentRound!.playerStates[socket.id]
    socket.emit('player_round_update', { ...ps, deck: undefined, devDeck: DEV_MODE_ENABLED ? ps.deck : undefined })
  })

  socket.on('player_forfeit', ({ code }: { code: string }) => {
    const room = getRoom(code)
    if (!room) return

    const round = room.tournament?.currentRound
    if (!round) return

    forfeitPlayer(room, socket.id)

    const ps = round.playerStates[socket.id]
    if (ps) {
      socket.emit('player_round_update', { ...ps, deck: undefined, devDeck: DEV_MODE_ENABLED ? ps.deck : undefined })
      io.to(code).emit('player_round_done', {
        playerId: socket.id,
        outcome: 'bust',
        payout: 0,
        newBalance: room.players.find((p) => p.id === socket.id)?.balance,
      })
    }

    if (areAllDone(round)) {
      _emitRoundEnd(room, code)
    }
  })

  // ready_for_next_round removed — server auto-advances after leaderboard delay

  // ─── Disconnect ───────────────────────────────────────────────────────────

  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id} disconnected`)
    const room = findRoomByPlayer(socket.id)
    if (!room) return

    const code = room.code
    const playerName = room.players.find((p) => p.id === socket.id)?.name ?? 'Unknown'

    // If mid-round, forfeit their round so others aren't blocked
    if (room.state === 'playing' && room.tournament?.currentRound) {
      forfeitPlayer(room, socket.id)
      if (areAllDone(room.tournament.currentRound)) {
        room.tournament.currentRound.phase = 'leaderboard'
        _emitRoundEnd(room, code)
      }
    }

    removePlayer(code, socket.id)
    io.to(code).emit('player_disconnected', { playerId: socket.id, name: playerName })

    const updatedRoom = getRoom(code)
    if (updatedRoom) {
      io.to(code).emit('room_update', sanitizeRoom(updatedRoom))
    }
  })
})

// ─── Internal helpers ─────────────────────────────────────────────────────────

const LEADERBOARD_DELAY_MS = 5000

function _emitRoundEnd(room: ReturnType<typeof getRoom> & object, code: string) {
  if (!room || !room.tournament) return
  const prevBalances = (room as any)._prevBalances ?? {}
  const leaderboard = buildLeaderboard(room, prevBalances)
  const _isBR = room.mode === 'battle-royale'
  const _allBroke = room.players.every((p) => p.balance <= 0)
  const _soleSurvivor = room.players.filter((p) => p.balance > 0).length === 1
  const isFinal = _allBroke || _soleSurvivor
    || (!_isBR && room.tournament.roundNumber >= room.tournament.config.totalRounds)

  io.to(code).emit('round_leaderboard', {
    roundNumber: room.tournament.currentRound?.roundNumber,
    leaderboard,
    isFinal,
    autoAdvanceMs: LEADERBOARD_DELAY_MS,
  })

  setTimeout(() => {
    const current = getRoom(code)
    if (!current || !current.tournament) return

    const isBR = current.mode === 'battle-royale'
    const allBroke = current.players.every((p) => p.balance <= 0)
    const soleSurvivor = current.players.filter((p) => p.balance > 0).length === 1
    const tournamentDone = !isBR && current.tournament.roundNumber >= current.tournament.config.totalRounds
    const shouldEnd = allBroke || soleSurvivor || tournamentDone

    if (shouldEnd) {
      finalizeTournament(current)
      const winnerId = current.tournament.winnerId
      io.to(code).emit('tournament_finished', {
        leaderboard: current.tournament.finalLeaderboard,
        winnerId,
        winnerName: winnerId ? current.players.find((p) => p.id === winnerId)?.name ?? null : null,
        prize: winnerId ? current.tournament.config.prizePool : 0,
      })
    } else {
      const prevBals = Object.fromEntries(current.players.map((p) => [p.id, p.balance]))
      ;(current as any)._prevBalances = prevBals
      const round = startRound(current)
      io.to(code).emit('round_started', {
        roundNumber: round.roundNumber,
        leaderboard: buildLeaderboard(current, prevBals),
      })
    }
  }, LEADERBOARD_DELAY_MS)
}

// Cleanup stale rooms every 30 minutes
setInterval(cleanupRooms, 30 * 60 * 1000)

const PORT = process.env.PORT ?? 3001
httpServer.listen(PORT, () => {
  console.log(`🚌 Ride the Bus server running on port ${PORT}`)
})
