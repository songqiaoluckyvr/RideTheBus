import { create } from 'zustand'
import type { GameState } from '../lib/engine'
import {
  createInitialState,
  placeBet,
  makeGuess,
  continuePlaying,
  cashOut,
  newRound,
  forfeit,
} from '../lib/engine'
import type { AnyGuess } from '../lib/stages'

export type GameMode = 'casino' | 'casino-hard' | 'tournament' | 'battle-royale'

interface PlayerMeta {
  name: string
  mode: GameMode
  roomCode: string | null
  isHost: boolean
  devMode: boolean
}

interface Store extends GameState, PlayerMeta {
  // Player setup
  setPlayerName: (name: string) => void
  setMode: (mode: GameMode) => void
  setRoomCode: (code: string | null) => void
  setIsHost: (v: boolean) => void
  setDevMode: (v: boolean) => void

  // Game actions
  placeBet: (amount: number) => void
  makeGuess: (guess: AnyGuess, factor?: number) => void
  continuePlaying: () => void
  cashOut: () => void
  newRound: () => void
  forfeit: () => void

  // Reset everything (new session)
  reset: () => void
  // Reset game state only, keep player name/mode
  restartSession: () => void
}

export const useGameStore = create<Store>((set) => ({
  // Initial game state
  ...createInitialState(),

  // Player meta
  name: '',
  mode: 'casino',
  roomCode: null,
  isHost: false,
  devMode: false,

  setPlayerName: (name) => set({ name }),
  setMode: (mode) => set({ mode }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setIsHost: (isHost) => set({ isHost }),
  setDevMode: (devMode) => set({ devMode }),

  placeBet: (amount) => set((s) => placeBet(s, amount)),
  makeGuess: (guess, factor = 1) => set((s) => makeGuess(s, guess, factor)),
  continuePlaying: () => set((s) => continuePlaying(s)),
  cashOut: () => set((s) => cashOut(s)),
  newRound: () => set((s) => newRound(s)),
  forfeit: () => set((s) => forfeit(s)),

  reset: () => set((s) => ({ ...createInitialState(), name: '', mode: 'casino', roomCode: null, isHost: false, devMode: s.devMode })),
  restartSession: () => set((s) => ({ ...createInitialState(), name: s.name, mode: s.mode, roomCode: s.roomCode, isHost: s.isHost, devMode: s.devMode })),
})
)
