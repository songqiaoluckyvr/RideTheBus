import { createShuffledDeck } from './lib/deck'
import type { Card } from './lib/deck'
import type { Stage, AnyGuess } from './lib/stages'
import { evaluateGuess } from './lib/stages'
import { calculatePayout, degradedMultiplier, roundMultiplier, STAGE_MULTIPLIERS } from './lib/payouts'

export type RoomMode = 'tournament' | 'battle-royale'
export type GamePhase = 'idle' | 'stage' | 'cashout' | 'bust' | 'complete'

// ─── Player ──────────────────────────────────────────────────────────────────

export interface Player {
  id: string
  name: string
  balance: number
  isHost: boolean
  alive: boolean
  ready: boolean
  buyIn: number
}

// ─── Tournament types ─────────────────────────────────────────────────────────

export interface TournamentConfig {
  totalRounds: number
  buyIn: number
  prizePool: number
  prizeMultiplier: number
}

export interface PlayerRoundState {
  playerId: string
  status: 'betting' | 'playing' | 'done'
  outcome: 'skipped' | 'bust' | 'cashed_out' | 'complete' | null
  bet: number
  deck: Card[]           // NEVER sent to client
  revealedCards: Card[]
  currentStage: Stage
  gamePhase: GamePhase
  roundPayout: number
  lockedMultipliers: Partial<Record<Stage, number>>
}

export interface TournamentRound {
  roundNumber: number
  phase: 'betting' | 'playing' | 'leaderboard'
  playerStates: Record<string, PlayerRoundState>
  readyForNext: Set<string>
}

export interface LeaderboardEntry {
  playerId: string
  name: string
  balance: number
  roundDelta: number
}

export interface TournamentState {
  config: TournamentConfig
  roundNumber: number
  currentRound: TournamentRound | null
  winnerId: string | null
  finalLeaderboard: LeaderboardEntry[] | null
}

// ─── Room ─────────────────────────────────────────────────────────────────────

export interface GameRoom {
  code: string
  mode: RoomMode
  players: Player[]
  state: 'waiting' | 'playing' | 'finished'
  createdAt: number
  tournament: TournamentState | null
}

// ─── In-memory store ──────────────────────────────────────────────────────────

const rooms = new Map<string, GameRoom>()

function generateCode(): string {
  return Math.random().toString(36).substring(2, 7).toUpperCase()
}

// ─── Basic room management ────────────────────────────────────────────────────

export function createRoom(
  hostId: string,
  hostName: string,
  mode: RoomMode,
  buyIn: number,
): GameRoom {
  const code = generateCode()
  const room: GameRoom = {
    code,
    mode,
    players: [{
      id: hostId,
      name: hostName,
      balance: buyIn,
      isHost: true,
      alive: true,
      ready: false,
      buyIn,
    }],
    state: 'waiting',
    createdAt: Date.now(),
    tournament: null,
  }
  rooms.set(code, room)
  return room
}

export function joinRoom(code: string, playerId: string, playerName: string): GameRoom | null {
  const room = rooms.get(code)
  if (!room || room.state !== 'waiting') return null
  const maxPlayers = room.mode === 'battle-royale' ? 10 : 4
  if (room.players.length >= maxPlayers) return null
  const buyIn = room.players[0].buyIn
  room.players.push({
    id: playerId,
    name: playerName,
    balance: buyIn,
    isHost: false,
    alive: true,
    ready: false,
    buyIn,
  })
  return room
}

export function setPlayerReady(code: string, playerId: string): GameRoom | null {
  const room = rooms.get(code)
  if (!room) return null
  const player = room.players.find((p) => p.id === playerId)
  if (player) player.ready = true
  return room
}

export function removePlayer(code: string, playerId: string): GameRoom | null {
  const room = rooms.get(code)
  if (!room) return null
  room.players = room.players.filter((p) => p.id !== playerId)
  if (room.players.length === 0) {
    rooms.delete(code)
    return null
  }
  if (!room.players.some((p) => p.isHost)) {
    room.players[0].isHost = true
  }
  return room
}

export function getRoom(code: string): GameRoom | undefined {
  return rooms.get(code)
}

export function findRoomByPlayer(playerId: string): GameRoom | undefined {
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.id === playerId)) return room
  }
  return undefined
}

export function cleanupRooms() {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000
  for (const [code, room] of rooms.entries()) {
    if (room.createdAt < cutoff) rooms.delete(code)
  }
}

// ─── Tournament helpers ───────────────────────────────────────────────────────

export function canStartTournament(room: GameRoom): boolean {
  return (
    room.players.length >= 2 &&
    room.players.every((p) => p.ready)
  )
}

export function initTournament(room: GameRoom): void {
  const buyIn = room.players[0].buyIn
  const prizeMultiplier = Math.floor(Math.random() * 4) + 1
  const prizePool = room.players.length * buyIn * prizeMultiplier

  // Reset all player balances to buy-in
  for (const p of room.players) {
    p.balance = p.buyIn
  }

  room.tournament = {
    config: {
      totalRounds: room.mode === 'battle-royale' ? 0 : 5, // 0 = unlimited (BR)
      buyIn,
      prizePool,
      prizeMultiplier,
    },
    roundNumber: 0,
    currentRound: null,
    winnerId: null,
    finalLeaderboard: null,
  }
  room.state = 'playing'
}

export function startRound(room: GameRoom): TournamentRound {
  if (!room.tournament) throw new Error('No tournament state')
  room.tournament.roundNumber += 1

  const playerStates: Record<string, PlayerRoundState> = {}
  for (const p of room.players) {
    playerStates[p.id] = {
      playerId: p.id,
      status: 'betting',
      outcome: null,
      bet: 0,
      deck: [],
      revealedCards: [],
      currentStage: 1,
      gamePhase: 'idle',
      roundPayout: 0,
      lockedMultipliers: {},
    }
  }

  const round: TournamentRound = {
    roundNumber: room.tournament.roundNumber,
    phase: 'betting',
    playerStates,
    readyForNext: new Set(),
  }
  room.tournament.currentRound = round
  return round
}

export function placeBet(
  room: GameRoom,
  playerId: string,
  amount: number,
): { ok: boolean; error?: string; skipped?: boolean } {
  const round = room.tournament?.currentRound
  if (!round || round.phase !== 'betting') return { ok: false, error: 'Not in betting phase' }

  const ps = round.playerStates[playerId]
  if (!ps || ps.status !== 'betting') return { ok: false, error: 'Already bet' }

  const player = room.players.find((p) => p.id === playerId)
  if (!player) return { ok: false, error: 'Player not found' }

  if (amount < 0 || amount > player.balance) return { ok: false, error: 'Invalid bet amount' }

  if (amount === 0) {
    // Skip this round
    ps.bet = 0
    ps.status = 'done'
    ps.outcome = 'skipped'
    ps.gamePhase = 'bust' // terminal phase for UI purposes
    return { ok: true, skipped: true }
  }

  ps.bet = amount
  ps.deck = createShuffledDeck()
  ps.status = 'playing'
  ps.gamePhase = 'stage'
  ps.currentStage = 1
  ps.revealedCards = []
  ps.roundPayout = 0
  ps.lockedMultipliers = {}
  return { ok: true }
}

export function processGuess(
  room: GameRoom,
  playerId: string,
  guess: AnyGuess,
  multiplierFactor: number,
): { ok: boolean; error?: string; allDone?: boolean } {
  const round = room.tournament?.currentRound
  if (!round) return { ok: false, error: 'No active round' }

  const ps = round.playerStates[playerId]
  if (!ps || ps.status !== 'playing' || ps.gamePhase !== 'stage') {
    return { ok: false, error: 'Not in stage phase' }
  }

  const stage = ps.currentStage
  const newCard = ps.deck[stage - 1]
  ps.revealedCards = [...ps.revealedCards, newCard]

  const result = evaluateGuess(stage, guess, ps.revealedCards)

  if (result === 'loss') {
    const player = room.players.find((p) => p.id === playerId)
    if (player) player.balance -= ps.bet
    ps.roundPayout = 0
    ps.outcome = 'bust'
    ps.status = 'done'
    ps.gamePhase = 'bust'
  } else {
    const effectiveMult = roundMultiplier(degradedMultiplier(STAGE_MULTIPLIERS[stage as Stage], multiplierFactor))
    ps.lockedMultipliers = { ...ps.lockedMultipliers, [stage]: effectiveMult }

    const isFinal = stage === 5
    if (isFinal) {
      const payout = calculatePayout(ps.bet, 5, multiplierFactor)
      const player = room.players.find((p) => p.id === playerId)
      if (player) player.balance = player.balance - ps.bet + payout
      ps.roundPayout = payout
      ps.outcome = 'complete'
      ps.status = 'done'
      ps.gamePhase = 'complete'
    } else {
      ps.roundPayout = calculatePayout(ps.bet, stage, multiplierFactor)
      ps.currentStage = (stage + 1) as Stage
      ps.gamePhase = 'cashout'
    }
  }

  const allDone = areAllDone(round)
  if (allDone) round.phase = 'leaderboard'
  return { ok: true, allDone }
}

export function processCashOut(
  room: GameRoom,
  playerId: string,
): { ok: boolean; error?: string; allDone?: boolean } {
  const round = room.tournament?.currentRound
  if (!round) return { ok: false, error: 'No active round' }

  const ps = round.playerStates[playerId]
  if (!ps || ps.status !== 'playing' || ps.gamePhase !== 'cashout') {
    return { ok: false, error: 'Not in cashout phase' }
  }

  const player = room.players.find((p) => p.id === playerId)
  if (player) player.balance = player.balance - ps.bet + ps.roundPayout

  ps.outcome = 'cashed_out'
  ps.status = 'done'
  ps.gamePhase = 'idle'

  const allDone = areAllDone(round)
  if (allDone) round.phase = 'leaderboard'
  return { ok: true, allDone }
}

export function processContinue(
  room: GameRoom,
  playerId: string,
): { ok: boolean; error?: string } {
  const round = room.tournament?.currentRound
  if (!round) return { ok: false, error: 'No active round' }

  const ps = round.playerStates[playerId]
  if (!ps || ps.gamePhase !== 'cashout') return { ok: false, error: 'Not in cashout phase' }

  ps.gamePhase = 'stage'
  return { ok: true }
}

export function markReadyForNext(
  room: GameRoom,
  playerId: string,
): { allReady: boolean } {
  const round = room.tournament?.currentRound
  if (!round) return { allReady: false }
  round.readyForNext.add(playerId)
  const allReady = room.players.every((p) => round.readyForNext.has(p.id))
  return { allReady }
}

export function forfeitPlayer(room: GameRoom, playerId: string): void {
  const round = room.tournament?.currentRound
  if (!round) return
  const ps = round.playerStates[playerId]
  if (!ps || ps.status === 'done') return

  if (ps.status === 'playing' && ps.bet > 0) {
    const player = room.players.find((p) => p.id === playerId)
    if (player) player.balance -= ps.bet
  }

  ps.outcome = 'bust'
  ps.status = 'done'
  ps.gamePhase = 'bust'

  if (areAllDone(round)) round.phase = 'leaderboard'
}

export function areAllDone(round: TournamentRound): boolean {
  return Object.values(round.playerStates).every((ps) => ps.status === 'done')
}

export function buildLeaderboard(room: GameRoom, prevBalances: Record<string, number>): LeaderboardEntry[] {
  return room.players
    .map((p) => ({
      playerId: p.id,
      name: p.name,
      balance: p.balance,
      roundDelta: p.balance - (prevBalances[p.id] ?? p.buyIn),
    }))
    .sort((a, b) => b.balance - a.balance)
}

export function finalizeTournament(room: GameRoom): void {
  if (!room.tournament) return

  const sorted = [...room.players].sort((a, b) => b.balance - a.balance)
  const winner = sorted[0]

  if (winner.balance > 0) {
    // Normal finish — award prize to the leading player
    room.tournament.winnerId = winner.id
    winner.balance += room.tournament.config.prizePool
  } else {
    // Everyone went broke — no winner, prize not awarded
    room.tournament.winnerId = null
  }

  room.tournament.finalLeaderboard = sorted.map((p, i) => ({
    playerId: p.id,
    name: p.name,
    balance: p.balance,
    roundDelta: i === 0 && room.tournament!.winnerId ? room.tournament!.config.prizePool : 0,
  }))

  room.state = 'finished'
}

/** Strip deck from PlayerRoundStates before sending to clients */
export function sanitizeRoom(room: GameRoom): unknown {
  const sanitized = {
    ...room,
    tournament: room.tournament
      ? {
          ...room.tournament,
          currentRound: room.tournament.currentRound
            ? {
                ...room.tournament.currentRound,
                readyForNext: Array.from(room.tournament.currentRound.readyForNext),
                playerStates: Object.fromEntries(
                  Object.entries(room.tournament.currentRound.playerStates).map(([id, ps]) => {
                    const { deck: _deck, ...safe } = ps
                    return [id, safe]
                  }),
                ),
              }
            : null,
        }
      : null,
  }
  return sanitized
}
