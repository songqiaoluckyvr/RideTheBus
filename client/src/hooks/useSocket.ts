// Stub — no-op in Phase 1 (casino solo mode)
// Will be wired to Socket.io in multiplayer phase

export function useSocket() {
  return {
    connected: false,
    joinRoom: (_code: string, _name: string) => {},
    createRoom: (_name: string) => {},
    startGame: () => {},
    sendGuess: (_guess: unknown) => {},
    sendBet: (_amount: number) => {},
  }
}
