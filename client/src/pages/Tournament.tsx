import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { useTournamentStore } from '../store/tournamentStore'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// (useTournamentStore used both as hook and for direct getState access)
import { useSocket } from '../hooks/useSocket'
import { TournamentBetting } from '../components/tournament/TournamentBetting'
import { TournamentRound } from '../components/tournament/TournamentRound'
import { RoundLeaderboard } from '../components/tournament/RoundLeaderboard'
import { FinalResults } from '../components/tournament/FinalResults'
import { MultiplierReveal } from '../components/tournament/MultiplierReveal'
import type { AnyGuess } from '../lib/stages'

export function Tournament() {
  const navigate = useNavigate()
  const socket = useSocket()

  const {
    room,
    config,
    roundNumber,
    totalRounds,
    tournamentPhase,
    myRoundState,
    peerStatuses,
    leaderboard,
    isFinalRound,
    autoAdvanceMs,
    winnerId,
    winnerName,
    prize,
    reset,
  } = useTournamentStore()

  const devMode = useGameStore((s) => s.devMode)

  // Guard: if no room (e.g. direct URL navigation), go back to lobby
  useEffect(() => {
    if (!room) navigate('/lobby')
  }, [room, navigate])

  if (!room || !config) return null

  const myId = socket.myId
  const myPlayer = room.players.find((p) => p.id === myId)
  // Leaderboard balance is kept up-to-date after each round; room.players is not
  const myLeaderboardEntry = leaderboard.find((e) => e.playerId === myId)
  const myBalance = myLeaderboardEntry?.balance ?? myPlayer?.balance ?? 0
  const code = room.code

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleBet = (amount: number) => {
    socket.placeRoundBet(code, amount)
  }

  const handleGuess = (guess: AnyGuess, factor: number) => {
    socket.makeGuess(code, guess, factor)
  }

  const handleCashOut = () => {
    socket.cashOut(code)
  }

  const handleContinue = () => {
    socket.continuePlaying(code)
  }

  const handleForfeit = () => {
    socket.forfeit(code)
  }

  const handlePlayAgain = () => {
    reset()
  }

  // ─── Determine if bet has been placed this round ────────────────────────────
  const hasPlacedBet =
    myRoundState !== null && (myRoundState.status === 'playing' || myRoundState.status === 'done')

  // ─── Render based on phase ──────────────────────────────────────────────────

  if (tournamentPhase === 'multiplier_reveal' && config) {
    return (
      <MultiplierReveal
        multiplier={config.prizeMultiplier}
        prizePool={config.prizePool}
        onDone={() => useTournamentStore.getState().setTournamentPhase('betting')}
      />
    )
  }

  if (tournamentPhase === 'finished') {
    return (
      <FinalResults
        myId={myId}
        winnerId={winnerId}
        winnerName={winnerName}
        prize={prize}
        leaderboard={leaderboard}
        onPlayAgain={handlePlayAgain}
      />
    )
  }

  if (tournamentPhase === 'leaderboard') {
    return (
      <RoundLeaderboard
        roundNumber={roundNumber}
        totalRounds={totalRounds}
        leaderboard={leaderboard}
        myId={myId}
        isFinal={isFinalRound}
        autoAdvanceMs={autoAdvanceMs}
      />
    )
  }

  if (tournamentPhase === 'playing' && myRoundState) {
    return (
      <TournamentRound
        myId={myId}
        roundState={myRoundState}
        config={config}
        roundNumber={roundNumber}
        peers={peerStatuses}
        devMode={devMode}
        onGuess={handleGuess}
        onCashOut={handleCashOut}
        onContinue={handleContinue}
        onForfeit={handleForfeit}
      />
    )
  }

  // Default: betting phase (also shows while waiting for all_bets_placed)
  return (
    <TournamentBetting
      myId={myId}
      myBalance={myBalance}
      roundNumber={roundNumber}
      config={config}
      leaderboard={leaderboard}
      peers={peerStatuses}
      onBet={handleBet}
      hasPlacedBet={hasPlacedBet}
    />
  )
}
