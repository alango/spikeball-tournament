import { useState } from 'react';
import useTournamentStore from '../../stores/tournamentStore';
import { Leaderboard } from './Leaderboard';
import { CurrentRound } from './CurrentRound';
import { PreviousRounds } from './PreviousRounds';

export function TournamentDashboard() {
  const { currentTournament } = useTournamentStore();
  const [isPreviousRoundsCollapsed, setIsPreviousRoundsCollapsed] = useState(true);

  if (!currentTournament) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No tournament found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tournament Header - Single Row */}
      <div className="bg-white rounded-lg shadow-sm px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-lg font-bold text-gray-900">
              {currentTournament.name}
            </h1>
            {currentTournament.description && (
              <span className="text-gray-600 text-sm">
                {currentTournament.description}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-1">
              <span className="text-gray-500">Round</span>
              <span className="font-bold text-blue-600">{currentTournament.currentRound}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-gray-500">Players</span>
              <span className="font-semibold text-gray-900">{Object.keys(currentTournament.players).length}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-gray-500">Completed</span>
              <span className="font-semibold text-gray-900">{currentTournament.rounds.filter(round => round.isCompleted).length}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-gray-500">Byes</span>
              <span className="font-semibold text-gray-900">{currentTournament.groupConfiguration.byes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      {isPreviousRoundsCollapsed ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Collapsed Layout: 2 main columns with sidebar */}
          <div className="lg:col-span-1">
            <Leaderboard />
          </div>
          
          <div className="lg:col-span-1 lg:flex lg:gap-4">
            <CollapsedPreviousRounds onExpand={() => setIsPreviousRoundsCollapsed(false)} />
            <div className="flex-1">
              <CurrentRound />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Expanded Layout: 3 equal columns */}
          <div className="lg:col-span-1">
            <Leaderboard />
          </div>
          
          <div className="lg:col-span-1">
            <PreviousRounds onCollapse={() => setIsPreviousRoundsCollapsed(true)} />
          </div>
          
          <div className="lg:col-span-1">
            <CurrentRound />
          </div>
        </div>
      )}
    </div>
  );
}

interface CollapsedPreviousRoundsProps {
  onExpand: () => void;
}

function CollapsedPreviousRounds({ onExpand }: CollapsedPreviousRoundsProps) {
  const { currentTournament } = useTournamentStore();
  
  if (!currentTournament) return null;
  
  const completedRounds = currentTournament.rounds.filter(round => round.isCompleted);
  
  return (
    <div className="hidden lg:flex lg:flex-col lg:items-center lg:justify-center lg:w-10 lg:bg-gray-50 lg:rounded-lg lg:py-4">
      <button
        onClick={onExpand}
        className="flex flex-col items-center justify-center space-y-3 p-1 hover:bg-gray-100 rounded-md transition-colors group h-full"
        title="Expand Previous Rounds"
      >
        {/* Round count indicator */}
        {completedRounds.length > 0 && (
          <div className="text-xs bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center font-semibold">
            {completedRounds.length}
          </div>
        )}
        
        {/* Rotated "Previous Rounds" text */}
        <div className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transform -rotate-90 whitespace-nowrap origin-center flex-1 flex items-center justify-center">
          Rounds
        </div>
        
        {/* Expand icon */}
        <div className="text-gray-600 group-hover:text-gray-900">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    </div>
  );
}