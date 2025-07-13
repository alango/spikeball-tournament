import { Button, Card } from '../ui';
import useTournamentStore from '../../stores/tournamentStore';
import { ScoreEntry } from './ScoreEntry';

export function CurrentRound() {
  const { currentTournament, getCurrentRoundMatches, completeRound } = useTournamentStore();

  if (!currentTournament) {
    return null;
  }

  const currentMatches = getCurrentRoundMatches();
  const hasCurrentRound = currentMatches.length > 0;

  if (!hasCurrentRound) {
    return <RoundGenerator />;
  }

  const allMatchesCompleted = currentMatches.every(match => match.isCompleted);
  const hasMatches = currentMatches.length > 0;

  const handleCompleteRound = () => {
    if (allMatchesCompleted && hasMatches) {
      if (confirm(`Complete Round ${currentTournament.currentRound}? This will advance to the next round.`)) {
        completeRound();
      }
    }
  };

  return (
    <Card title={`Round ${currentTournament.currentRound}`}>
      <div className="space-y-4">
        {currentMatches.map((match, index) => (
          <ScoreEntry key={match.id} match={match} matchNumber={index + 1} />
        ))}
        
        {/* Show byes if any */}
        <ByeDisplay />
        
        {/* Complete Round Button */}
        {hasMatches && (
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {allMatchesCompleted 
                  ? `All ${currentMatches.length} matches completed!` 
                  : `${currentMatches.filter(m => m.isCompleted).length}/${currentMatches.length} matches completed`
                }
              </div>
              <Button 
                onClick={handleCompleteRound}
                disabled={!allMatchesCompleted}
                variant={allMatchesCompleted ? 'primary' : 'secondary'}
              >
                {allMatchesCompleted ? 'Complete Round' : 'Waiting for matches...'}
              </Button>
            </div>
          </div>
        )}
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