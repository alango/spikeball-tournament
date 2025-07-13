import useTournamentStore from './stores/tournamentStore';
import { TournamentSetup } from './components/tournament/TournamentSetup';

function App() {
  const { currentTournament } = useTournamentStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Spikeball Tournament
            </h1>
            {currentTournament && (
              <div className="text-sm text-gray-600">
                {currentTournament.name}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTournament?.isStarted ? (
          <TournamentDashboard />
        ) : (
          <TournamentSetup />
        )}
      </main>
    </div>
  );
}

// Placeholder components - will be implemented in later phases

function TournamentDashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
        <p className="text-gray-600">
          Leaderboard will be implemented in Phase 4
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Previous Rounds</h2>
        <p className="text-gray-600">
          Previous rounds will be implemented in Phase 6
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Current Round</h2>
        <p className="text-gray-600">
          Current round will be implemented in Phase 4
        </p>
      </div>
    </div>
  );
}

export default App;
