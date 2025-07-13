import { Button, Card } from '../ui';
import useTournamentStore from '../../stores/tournamentStore';

export function CurrentRound() {
  const { currentTournament, getCurrentRoundMatches } = useTournamentStore();

  if (!currentTournament) {
    return null;
  }

  const currentMatches = getCurrentRoundMatches();
  const hasCurrentRound = currentMatches.length > 0;

  if (!hasCurrentRound) {
    return <RoundGenerator />;
  }

  return (
    <Card title={`Round ${currentTournament.currentRound}`}>
      <div className="space-y-4">
        {currentMatches.map((match, index) => (
          <MatchDisplay key={match.id} match={match} matchNumber={index + 1} />
        ))}
        
        {/* Show byes if any */}
        <ByeDisplay />
      </div>
    </Card>
  );
}

function RoundGenerator() {
  const { currentTournament, generateRound } = useTournamentStore();

  if (!currentTournament) return null;

  const playerCount = Object.keys(currentTournament.players).length;
  const canGenerateRound = playerCount >= 8;

  const handleGenerateRound = () => {
    generateRound();
  };

  return (
    <Card title={`Generate Round ${currentTournament.currentRound}`}>
      <div className="text-center py-6">
        {canGenerateRound ? (
          <>
            <p className="text-gray-600 mb-4">
              Ready to generate round {currentTournament.currentRound} with {playerCount} players.
            </p>
            <Button onClick={handleGenerateRound} size="lg">
              Generate Round {currentTournament.currentRound}
            </Button>
          </>
        ) : (
          <div className="text-gray-500">
            <p className="mb-2">Need at least 8 players to generate a round</p>
            <p className="text-sm">Current players: {playerCount}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

interface MatchDisplayProps {
  match: any; // We'll define proper types later
  matchNumber: number;
}

function MatchDisplay({ match, matchNumber }: MatchDisplayProps) {
  const { currentTournament } = useTournamentStore();

  if (!currentTournament) return null;

  // For now, we'll show placeholder team info since we need to reconstruct teams from match data
  // This will be fully implemented in Phase 5 with proper team/player resolution
  
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">
          Match {matchNumber}
        </div>
        <div className="text-xs text-gray-500">
          {match.isCompleted ? '✅ Complete' : '⏳ Pending'}
        </div>
      </div>
      
      <div className="mt-2 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-900">
            Team 1: {match.team1Id}
          </div>
          {match.team1Score !== undefined && (
            <div className="text-sm font-medium">{match.team1Score}</div>
          )}
        </div>
        
        <div className="text-center text-xs text-gray-400">vs</div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-900">
            Team 2: {match.team2Id}
          </div>
          {match.team2Score !== undefined && (
            <div className="text-sm font-medium">{match.team2Score}</div>
          )}
        </div>
      </div>
      
      {!match.isCompleted && (
        <div className="mt-3 pt-3 border-t">
          <div className="text-xs text-gray-500 text-center">
            Score entry will be available in Phase 5
          </div>
        </div>
      )}
    </div>
  );
}

function ByeDisplay() {
  const { currentTournament } = useTournamentStore();

  if (!currentTournament) return null;

  // Get byes for current round
  const currentRound = currentTournament.rounds.find(
    round => round.roundNumber === currentTournament.currentRound
  );

  if (!currentRound || currentRound.byes.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="text-sm font-medium text-gray-700 mb-2">
        Players with Byes ({currentRound.byes.length})
      </div>
      <div className="space-y-1">
        {currentRound.byes.map(playerId => {
          const player = currentTournament.players[playerId];
          return (
            <div key={playerId} className="text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded">
              {player?.name || playerId}
            </div>
          );
        })}
      </div>
    </div>
  );
}