import useTournamentStore from './stores/tournamentStore';
import { TournamentSetup } from './components/tournament/TournamentSetup';
import { TournamentDashboard } from './components/tournament/TournamentDashboard';

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

export default App;
