import useTournamentStore from './stores/tournamentStore';
import { TournamentSetup } from './components/tournament/TournamentSetup';
import { TournamentDashboard } from './components/tournament/TournamentDashboard';
import { Button } from './components/ui';

function App() {
  const { currentTournament, resetTournament } = useTournamentStore();

  const handleNewTournament = () => {
    if (currentTournament) {
      if (confirm('Are you sure you want to start a new tournament? This will reset all current data.')) {
        resetTournament();
      }
    } else {
      resetTournament();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Spikeball Tournament
            </h1>
            <div className="flex items-center space-x-4">
              {currentTournament && (
                <div className="text-sm text-gray-600">
                  {currentTournament.name}
                </div>
              )}
              <Button 
                onClick={handleNewTournament}
                variant="secondary"
                size="sm"
              >
                New Tournament
              </Button>
            </div>
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
