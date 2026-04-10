import { create } from 'zustand'
import type { GamePhase } from '../lib/engine'
import type { Stage } from '../lib/stages'
import type { Card } from '../lib/deck'

// ─── Types mirroring server (deck stripped) ───────────────────────────────────

export interface TournamentPlayer {
  id: string
  name: string
  balance: number
  isHost: boolean
  alive: boolean
  ready: boolean
  buyIn: number
}

export interface PlayerRoundStateClient {
  playerId: string
  status: 'betting' | 'playing' | 'done'
  outcome: 'skipped' | 'bust' | 'cashed_out' | 'complete' | null
  bet: number
  revealedCards: Card[]
  currentStage: Stage
  gamePhase: GamePhase
  roundPayout: number
  lockedMultipliers: Partial<Record<Stage, number>>
}

export interface LeaderboardEntry {
  playerId: string
  name: string
  balance: number
  roundDelta: number
}

export interface TournamentConfig {
  totalRounds: number
  buyIn: number
  prizePool: number
  prizeMultiplier: number
}

export interface SanitizedRoom {
  code: string
  mode: string
  players: TournamentPlayer[]
  state: 'waiting' | 'playing' | 'finished'
}

// Per-player status visible to everyone (for sidebars etc.)
export interface PeerStatus {
  playerId: string
  name: string
  balance: number
  roundStatus: 'betting' | 'playing' | 'done'
  outcome: PlayerRoundStateClient['outcome']
}

export type TournamentPhase = 'idle' | 'multiplier_reveal' | 'betting' | 'playing' | 'leaderboard' | 'finished'
export type LobbyPhase = 'setup' | 'waiting'

interface TournamentStore {
  // Lobby
  lobbyPhase: LobbyPhase
  room: SanitizedRoom | null
  roomError: string | null

  // Tournament meta
  config: TournamentConfig | null
  roundNumber: number
  totalRounds: number

  // In-game
  tournamentPhase: TournamentPhase
  myRoundState: PlayerRoundStateClient | null
  peerStatuses: PeerStatus[]
  leaderboard: LeaderboardEntry[]
  isFinalRound: boolean
  autoAdvanceMs: number

  // End
  winnerId: string | null
  winnerName: string | null
  prize: number

  // Setters (called by useSocket listeners)
  setLobbyPhase: (phase: LobbyPhase) => void
  setRoom: (room: SanitizedRoom) => void
  setRoomError: (err: string | null) => void
  setTournamentPhase: (phase: TournamentPhase) => void
  setMyRoundState: (state: PlayerRoundStateClient) => void
  setPeerStatuses: (statuses: PeerStatus[]) => void
  updatePeerStatus: (update: Partial<PeerStatus> & { playerId: string }) => void
  setLeaderboard: (entries: LeaderboardEntry[], isFinal?: boolean, autoAdvanceMs?: number) => void
  setRoundNumber: (n: number) => void
  setConfig: (config: TournamentConfig) => void
  setWinner: (id: string, name: string, prize: number) => void
  reset: () => void
}

const initialState = {
  lobbyPhase: 'setup' as LobbyPhase,
  room: null,
  roomError: null,
  config: null,
  roundNumber: 0,
  totalRounds: 5,
  tournamentPhase: 'idle' as TournamentPhase,
  myRoundState: null,
  peerStatuses: [],
  leaderboard: [],
  isFinalRound: false,
  autoAdvanceMs: 5000,
  winnerId: null,
  winnerName: null,
  prize: 0,
}

export const useTournamentStore = create<TournamentStore>((set) => ({
  ...initialState,

  setLobbyPhase: (lobbyPhase) => set({ lobbyPhase }),
  setRoom: (room) => set({ room }),
  setRoomError: (roomError) => set({ roomError }),
  setTournamentPhase: (tournamentPhase) => set({ tournamentPhase }),
  setMyRoundState: (myRoundState) => set({ myRoundState }),
  setPeerStatuses: (peerStatuses) => set({ peerStatuses }),
  updatePeerStatus: (update) =>
    set((s) => ({
      peerStatuses: s.peerStatuses.map((p) =>
        p.playerId === update.playerId ? { ...p, ...update } : p,
      ),
    })),
  setLeaderboard: (leaderboard, isFinal = false, autoAdvanceMs = 5000) => set({ leaderboard, isFinalRound: isFinal, autoAdvanceMs }),
  setRoundNumber: (roundNumber) => set({ roundNumber }),
  setConfig: (config) => set({ config, totalRounds: config.totalRounds }),
  setWinner: (winnerId, winnerName, prize) => set({ winnerId, winnerName, prize }),
  reset: () => set(initialState),
}))
