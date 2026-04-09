import { create } from 'zustand'
import type { GameState } from '../lib/engine'
import {
  createInitialState,
  placeBet,
  makeGuess,
  continuePlaying,
  cashOut,
  newRound,
} from '../lib/engine'
import type { AnyGuess } from '../lib/stages'

export type GameMode = 'casino' | 'tournament' | 'battle-royale'

interface PlayerMeta {
  name: string
  mode: GameMode
  roomCode: string | null
  isHost: boolean
}

interface Store extends GameState, PlayerMeta {
  // Player setup
  setPlayerName: (name: string) => void
  setMode: (mode: GameMode) => void
  setRoomCode: (code: string | null) => void
  setIsHost: (v: boolean) => void

  // Game actions
  placeBet: (amount: number) => void
  makeGuess: (guess: AnyGuess) => void
  continuePlaying: () => void
  cashOut: () => void
  newRound: () => void

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

  setPlayerName: (name) => set({ name }),
  setMode: (mode) => set({ mode }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setIsHost: (isHost) => set({ isHost }),

  placeBet: (amount) => set((s) => placeBet(s, amount)),
  makeGuess: (guess) => set((s) => makeGuess(s, guess)),
  continuePlaying: () => set((s) => continuePlaying(s)),
  cashOut: () => set((s) => cashOut(s)),
  newRound: () => set((s) => newRound(s)),

  reset: () => set({ ...createInitialState(), name: '', mode: 'casino', roomCode: null, isHost: false }),
  restartSession: () => set((s) => ({ ...createInitialState(), name: s.name, mode: s.mode, roomCode: s.roomCode, isHost: s.isHost })),
})
)
