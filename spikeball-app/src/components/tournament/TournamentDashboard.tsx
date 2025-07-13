import { Card } from '../ui';
import useTournamentStore from '../../stores/tournamentStore';
import { Leaderboard } from './Leaderboard';
import { CurrentRound } from './CurrentRound';

export function TournamentDashboard() {
  const { currentTournament } = useTournamentStore();

  if (!currentTournament) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No tournament found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tournament Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentTournament.name}
            </h1>
            {currentTournament.description && (
              <p className="text-gray-600 mt-1">{currentTournament.description}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Current Round</div>
            <div className="text-2xl font-bold text-blue-600">
              {currentTournament.currentRound}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900">
              {Object.keys(currentTournament.players).length}
            </div>
            <div className="text-sm text-gray-500">Players</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900">
              {currentTournament.rounds.filter(round => round.isCompleted).length}
            </div>
            <div className="text-sm text-gray-500">Rounds Played</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900">
              {currentTournament.groupConfiguration.groupsOf8 + currentTournament.groupConfiguration.groupsOf12}
            </div>
            <div className="text-sm text-gray-500">Groups</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900">
              {currentTournament.groupConfiguration.byes}
            </div>
            <div className="text-sm text-gray-500">Byes per Round</div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard */}
        <div className="lg:col-span-1">
          <Leaderboard />
        </div>

        {/* Previous Rounds - Placeholder for Phase 6 */}
        <div className="lg:col-span-1">
          <Card title="Previous Rounds">
            <div className="text-center text-gray-500 py-8">
              <p>Previous rounds will be displayed here</p>
              <p className="text-sm mt-2">(Phase 6 feature)</p>
            </div>
          </Card>
        </div>

        {/* Current Round */}
        <div className="lg:col-span-1">
          <CurrentRound />
        </div>
      </div>
    </div>
  );
}