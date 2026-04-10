import { useEffect, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useTournamentStore } from '../store/tournamentStore'
import type { AnyGuess } from '../lib/stages'
import type { SanitizedRoom, PlayerRoundStateClient, PeerStatus } from '../store/tournamentStore'

// In dev: empty string → Vite proxies /socket.io → localhost:3001
// In production: set VITE_SERVER_URL to the deployed backend URL
const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? ''

// Module-level singleton — one connection for the whole app lifetime
let socket: Socket | null = null

function getSocket(): Socket {
  if (!socket) {
    socket = io(SERVER_URL, { autoConnect: false })
  }
  return socket
}

export function useSocket() {
  const store = useTournamentStore()
  const [myId, setMyId] = useState<string>(() => getSocket().id ?? '')

  useEffect(() => {
    const s = getSocket()
    if (!s.connected) s.connect()

    s.on('connect', () => setMyId(s.id ?? ''))
    s.on('disconnect', () => setMyId(''))

    // ─── Server → Client listeners ────────────────────────────────────────

    s.on('room_joined', (room: SanitizedRoom) => {
      store.setRoom(room)
      store.setRoomError(null)
      store.setLobbyPhase('waiting')
    })

    s.on('room_update', (room: SanitizedRoom) => {
      store.setRoom(room)
    })

    s.on('room_error', ({ message }: { message: string }) => {
      store.setRoomError(message)
    })

    s.on('game_started', (data: {
      room: SanitizedRoom
      roundNumber: number
      totalRounds: number
      prizePool: number
      prizeMultiplier: number
    }) => {
      store.setRoom(data.room)
      store.setConfig({
        totalRounds: data.totalRounds,
        buyIn: data.room.players[0]?.buyIn ?? 0,
        prizePool: data.prizePool,
        prizeMultiplier: data.prizeMultiplier,
      })
      store.setTournamentPhase('multiplier_reveal')
    })

    s.on('round_started', (data: { roundNumber: number; leaderboard: typeof store.leaderboard }) => {
      store.setRoundNumber(data.roundNumber)
      store.setLeaderboard(data.leaderboard)
      store.setMyRoundState(null as unknown as PlayerRoundStateClient)
      store.setTournamentPhase('betting')

      // Reset peer statuses
      const room = useTournamentStore.getState().room
      if (room) {
        store.setPeerStatuses(
          room.players.map((p) => ({
            playerId: p.id,
            name: p.name,
            balance: p.balance,
            roundStatus: 'betting',
            outcome: null,
          })),
        )
      }
    })

    s.on('player_round_update', (ps: PlayerRoundStateClient) => {
      store.setMyRoundState(ps)
      if (ps.gamePhase === 'stage' || ps.gamePhase === 'cashout') {
        store.setTournamentPhase('playing')
      }
    })

    s.on('player_bet_placed', (data: { playerId: string; amount: number; skipped: boolean }) => {
      store.updatePeerStatus({
        playerId: data.playerId,
        roundStatus: data.skipped ? 'done' : 'playing',
        outcome: data.skipped ? 'skipped' : null,
      })
    })

    s.on('stage_result', (data: { playerId: string; stage: number; result: string; gamePhase: string }) => {
      store.updatePeerStatus({
        playerId: data.playerId,
        roundStatus: data.gamePhase === 'bust' || data.gamePhase === 'complete' ? 'done' : 'playing',
      })
    })

    s.on('player_round_done', (data: { playerId: string; outcome: PeerStatus['outcome']; payout: number; newBalance: number }) => {
      store.updatePeerStatus({
        playerId: data.playerId,
        roundStatus: 'done',
        outcome: data.outcome,
        balance: data.newBalance,
      })
    })

    s.on('round_leaderboard', (data: { roundNumber: number; leaderboard: typeof store.leaderboard; isFinal: boolean; autoAdvanceMs: number }) => {
      store.setLeaderboard(data.leaderboard, data.isFinal, data.autoAdvanceMs)
      store.setTournamentPhase('leaderboard')
    })

    s.on('tournament_finished', (data: { leaderboard: typeof store.leaderboard; winnerId: string | null; winnerIds: string[]; winnerName: string | null; winnerNames: string[]; prize: number }) => {
      store.setLeaderboard(data.leaderboard, true)
      store.setWinner(data.winnerId, data.winnerIds ?? [], data.winnerName, data.winnerNames ?? [], data.prize)
      store.setTournamentPhase('finished')
    })

    s.on('all_bets_placed', () => {
      // When all players have bet, transition non-skipped players to playing phase
      const state = useTournamentStore.getState()
      const myState = state.myRoundState
      if (myState && myState.status === 'playing') {
        state.setTournamentPhase('playing')
      }
    })

    s.on('player_disconnected', (_data: { playerId: string; name: string }) => {
      // room_update will follow with updated player list
    })

    return () => {
      s.off('room_joined')
      s.off('room_update')
      s.off('room_error')
      s.off('game_started')
      s.off('round_started')
      s.off('player_round_update')
      s.off('player_bet_placed')
      s.off('stage_result')
      s.off('player_round_done')
      s.off('connect')
      s.off('disconnect')
      s.off('all_bets_placed')
      s.off('round_leaderboard')
      s.off('tournament_finished')
      s.off('player_disconnected')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Client → Server actions ──────────────────────────────────────────────

  const createRoom = useCallback((name: string, mode: 'tournament' | 'battle-royale', buyIn: number) => {
    getSocket().emit('create_room', { name, mode, buyIn })
  }, [])

  const joinRoom = useCallback((code: string, name: string) => {
    getSocket().emit('join_room', { code, name })
  }, [])

  const setReady = useCallback((code: string) => {
    getSocket().emit('player_ready', { code })
  }, [])

  const startGame = useCallback((code: string) => {
    getSocket().emit('start_game', { code })
  }, [])

  const placeRoundBet = useCallback((code: string, amount: number) => {
    getSocket().emit('place_round_bet', { code, amount })
  }, [])

  const makeGuess = useCallback((code: string, guess: AnyGuess, multiplierFactor: number) => {
    getSocket().emit('make_guess', { code, guess, multiplierFactor })
  }, [])

  const cashOut = useCallback((code: string) => {
    getSocket().emit('cash_out', { code })
  }, [])

  const continuePlaying = useCallback((code: string) => {
    getSocket().emit('continue_playing', { code })
  }, [])

  const forfeit = useCallback((code: string) => {
    getSocket().emit('player_forfeit', { code })
  }, [])

    return {
    connected: socket?.connected ?? false,
    myId,
    createRoom,
    joinRoom,
    setReady,
    startGame,
    placeRoundBet,
    makeGuess,
    cashOut,
    continuePlaying,
    forfeit,
  }
}
