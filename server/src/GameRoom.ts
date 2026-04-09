// Server-side room management (Phase 2)
// Stub with full structure ready for multiplayer implementation

export type RoomMode = 'tournament' | 'battle-royale'

export interface Player {
  id: string      // socket id
  name: string
  balance: number
  isHost: boolean
  alive: boolean  // for battle-royale
}

export interface GameRoom {
  code: string
  mode: RoomMode
  players: Player[]
  state: 'waiting' | 'playing' | 'finished'
  createdAt: number
}

const rooms = new Map<string, GameRoom>()

function generateCode(): string {
  return Math.random().toString(36).substring(2, 7).toUpperCase()
}

export function createRoom(hostId: string, hostName: string, mode: RoomMode): GameRoom {
  const code = generateCode()
  const room: GameRoom = {
    code,
    mode,
    players: [{ id: hostId, name: hostName, balance: 1000, isHost: true, alive: true }],
    state: 'waiting',
    createdAt: Date.now(),
  }
  rooms.set(code, room)
  return room
}

export function joinRoom(code: string, playerId: string, playerName: string): GameRoom | null {
  const room = rooms.get(code)
  if (!room || room.state !== 'waiting' || room.players.length >= 4) return null
  room.players.push({ id: playerId, name: playerName, balance: 1000, isHost: false, alive: true })
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
  // Promote next player to host if host left
  if (!room.players.some((p) => p.isHost)) {
    room.players[0].isHost = true
  }
  return room
}

export function getRoom(code: string): GameRoom | undefined {
  return rooms.get(code)
}

// Clean up stale rooms older than 2 hours
export function cleanupRooms() {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000
  for (const [code, room] of rooms.entries()) {
    if (room.createdAt < cutoff) rooms.delete(code)
  }
}
