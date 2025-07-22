import { useState } from 'react';
import { Card, Button } from '../ui';
import useTournamentStore from '../../stores/tournamentStore';
import type { Round, Match, Tournament, TournamentConfig } from '../../types';

interface PreviousRoundsProps {
  onCollapse?: () => void;
}

export function PreviousRounds({ onCollapse }: PreviousRoundsProps) {
  const { currentTournament } = useTournamentStore();
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());

  if (!currentTournament) {
    return null;
  }

  const completedRounds = currentTournament.rounds.filter(round => round.isCompleted);

  if (completedRounds.length === 0) {
    return (
      <Card>
        <div className="space-y-4">
          {/* Custom header with collapse button */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Previous Rounds</h2>
            {onCollapse && (
              <button
                onClick={onCollapse}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                title="Collapse Previous Rounds"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>
          
          <div className="text-center text-gray-500 py-8">
            <p>No completed rounds yet</p>
            <p className="text-sm mt-2">Complete your first round to see history here</p>
          </div>
        </div>
      </Card>
    );
  }

  const toggleRound = (roundNumber: number) => {
    const newExpanded = new Set(expandedRounds);
    if (newExpanded.has(roundNumber)) {
      newExpanded.delete(roundNumber);
    } else {
      newExpanded.add(roundNumber);
    }
    setExpandedRounds(newExpanded);
  };

  const collapseAll = () => {
    setExpandedRounds(new Set());
  };

  const expandAll = () => {
    setExpandedRounds(new Set(completedRounds.map(round => round.roundNumber)));
  };

  return (
    <Card>
      <div className="space-y-4">
        {/* Custom header with collapse button */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Previous Rounds</h2>
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              title="Collapse Previous Rounds"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Control buttons */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            {completedRounds.length} completed round{completedRounds.length === 1 ? '' : 's'}
          </span>
          <div className="space-x-2">
            <Button onClick={expandAll} size="sm" variant="secondary">
              Expand All
            </Button>
            <Button onClick={collapseAll} size="sm" variant="secondary">
              Collapse All
            </Button>
          </div>
        </div>

        {/* Rounds list */}
        <div className="space-y-3">
          {completedRounds
            .sort((a, b) => b.roundNumber - a.roundNumber) // Most recent first
            .map((round) => (
              <RoundSummary
                key={round.roundNumber}
                round={round}
                isExpanded={expandedRounds.has(round.roundNumber)}
                onToggle={() => toggleRound(round.roundNumber)}
                tournament={currentTournament}
              />
            ))}
        </div>
      </div>
    </Card>
  );
}

interface RoundSummaryProps {
  round: Round;
  isExpanded: boolean;
  onToggle: () => void;
  tournament: Tournament;
}

function RoundSummary({ round, isExpanded, onToggle, tournament }: RoundSummaryProps) {
  const totalMatches = round.matches.length;
  const completedMatches = round.matches.filter(match => match.isCompleted).length;

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Round header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="text-sm font-medium text-gray-900">
            Round {round.roundNumber}
          </div>
          <div className="text-xs text-gray-500">
            {completedMatches}/{totalMatches} matches
          </div>
          {round.byes.length > 0 && (
            <div className="text-xs text-blue-600">
              {round.byes.length} bye{round.byes.length === 1 ? '' : 's'}
            </div>
          )}
        </div>
        <div className="text-gray-400">
          {isExpanded ? '▼' : '▶'}
        </div>
      </button>

      {/* Round details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="space-y-3 mt-3">
            {/* Matches */}
            {round.matches.map((match, index) => (
              <MatchHistory
                key={match.id}
                match={match}
                matchNumber={index + 1}
                tournament={tournament}
              />
            ))}

            {/* Byes */}
            {round.byes.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Players with Byes
                </div>
                <div className="flex flex-wrap gap-2">
                  {round.byes.map(playerId => {
                    const player = tournament.players[playerId];
                    return (
                      <span
                        key={playerId}
                        className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                      >
                        {player?.name || playerId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface MatchHistoryProps {
  match: Match;
  matchNumber: number;
  tournament: Tournament;
}

function MatchHistory({ match, matchNumber, tournament }: MatchHistoryProps) {
  // Parse team IDs to get player names
  const getTeamPlayers = (teamId: string) => {
    if (!teamId.startsWith('team-')) {
      return { player1: null, player2: null };
    }
    
    const withoutPrefix = teamId.substring(5);
    const firstUuidEnd = 36;
    
    if (withoutPrefix.length < firstUuidEnd + 1 + 36) {
      return { player1: null, player2: null };
    }
    
    const player1Id = withoutPrefix.substring(0, firstUuidEnd);
    const player2Id = withoutPrefix.substring(firstUuidEnd + 1);
    
    const player1 = tournament.players[player1Id];
    const player2 = tournament.players[player2Id];
    
    return { player1, player2 };
  };

  const team1Players = getTeamPlayers(match.team1Id);
  const team2Players = getTeamPlayers(match.team2Id);

  const team1Won = match.team1Score !== undefined && match.team2Score !== undefined && 
                   match.team1Score > match.team2Score;
  const team2Won = match.team1Score !== undefined && match.team2Score !== undefined && 
                   match.team2Score > match.team1Score;

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-gray-500 mb-2">
          Match {matchNumber}
        </div>
        <div className="text-xs text-gray-500">
          {match.isCompleted ? '✅ Complete' : '⏳ Pending'}
        </div>
      </div>

      <div className="space-y-2">
        {/* Team 1 */}
        <div className={`flex items-center justify-between p-2 rounded ${
          team1Won ? 'bg-green-100 border border-green-200' : 'bg-white'
        }`}>
          <div className="flex items-center space-x-2">
            {team1Won && <span className="text-green-600 text-sm">🏆</span>}
            <span className="text-sm font-medium text-gray-900">
              {team1Players.player1?.name || 'Unknown'} & {team1Players.player2?.name || 'Unknown'}
            </span>
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {match.team1Score !== undefined ? match.team1Score : '-'}
          </div>
        </div>

        {/* Team 2 */}
        <div className={`flex items-center justify-between p-2 rounded ${
          team2Won ? 'bg-green-100 border border-green-200' : 'bg-white'
        }`}>
          <div className="flex items-center space-x-2">
            {team2Won && <span className="text-green-600 text-sm">🏆</span>}
            <span className="text-sm font-medium text-gray-900">
              {team2Players.player1?.name || 'Unknown'} & {team2Players.player2?.name || 'Unknown'}
            </span>
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {match.team2Score !== undefined ? match.team2Score : '-'}
          </div>
        </div>
      </div>

      {/* Points earned (if bonus points enabled) */}
      {match.isCompleted && tournament.configuration.bonusPointsEnabled && 
       match.team1Score !== undefined && match.team2Score !== undefined && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-600 text-center">
            Points earned: {(() => {
              const points = calculateMatchPoints(match.team1Score, match.team2Score, tournament.configuration);
              return `${points.team1Points.toFixed(1)} - ${points.team2Points.toFixed(1)}`;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to calculate points (same logic as in store)
function calculateMatchPoints(team1Score: number, team2Score: number, config: TournamentConfig) {
  if (config.scoringSystem === 'win-loss') {
    const team1Won = team1Score > team2Score;
    return {
      team1Points: team1Won ? 3 : 0,
      team2Points: team1Won ? 0 : 3
    };
  } else if (config.bonusPointsEnabled) {
    const team1Won = team1Score > team2Score;
    const team1BasePoints = team1Won ? 3 : 0;
    const team2BasePoints = team1Won ? 0 : 3;
    
    const totalGameScore = team1Score + team2Score;
    if (totalGameScore > 0) {
      const team1Percentage = team1Score / totalGameScore;
      const team2Percentage = team2Score / totalGameScore;
      
      // 1 total bonus point distributed by percentage
      const team1BonusPoints = team1Percentage * 1;
      const team2BonusPoints = team2Percentage * 1;
      
      return {
        team1Points: team1BasePoints + team1BonusPoints,
        team2Points: team2BasePoints + team2BonusPoints
      };
    } else {
      return {
        team1Points: team1BasePoints,
        team2Points: team2BasePoints
      };
    }
  } else {
    const team1Won = team1Score > team2Score;
    return {
      team1Points: team1Won ? 3 : 0,
      team2Points: team1Won ? 0 : 3
    };
  }
}