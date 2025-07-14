import { useMemo, useState } from 'react';
import { Card, Button } from '../ui';
import useTournamentStore from '../../stores/tournamentStore';
import type { Player } from '../../types';

export function Leaderboard() {
  const { currentTournament } = useTournamentStore();
  const [showDetailedStats, setShowDetailedStats] = useState(false);

  const sortedPlayers = useMemo(() => {
    if (!currentTournament) return [];

    const players = Object.values(currentTournament.players);
    
    return players.sort((a, b) => {
      // Primary sort: Total points (descending)
      if (a.currentScore !== b.currentScore) {
        return b.currentScore - a.currentScore;
      }

      // Secondary sort: Win percentage (descending)
      const aWinPct = a.gamesPlayed > 0 ? a.wins / a.gamesPlayed : 0;
      const bWinPct = b.gamesPlayed > 0 ? b.wins / b.gamesPlayed : 0;
      if (aWinPct !== bWinPct) {
        return bWinPct - aWinPct;
      }

      // Tertiary sort: Games played (ascending - fewer games is better with same record)
      if (a.gamesPlayed !== b.gamesPlayed) {
        return a.gamesPlayed - b.gamesPlayed;
      }

      // Final sort: Alphabetical by name
      return a.name.localeCompare(b.name);
    });
  }, [currentTournament]);

  // Calculate strength of schedule for a player
  const calculateStrengthOfSchedule = (player: Player) => {
    // Alternative approach: calculate SOS from completed match history
    if (!currentTournament) return 0;
    
    const completedRounds = currentTournament.rounds.filter(round => round.isCompleted);
    const allOpponents: string[] = [];
    
    // Find all opponents this player has faced in completed matches
    completedRounds.forEach(round => {
      round.matches.forEach(match => {
        if (!match.isCompleted) return;
        
        // Parse team IDs to get player IDs
        const parseTeamId = (teamId: string) => {
          if (!teamId.startsWith('team-')) return [];
          const withoutPrefix = teamId.substring(5);
          const firstUuidEnd = 36;
          if (withoutPrefix.length < firstUuidEnd + 1 + 36) return [];
          return [
            withoutPrefix.substring(0, firstUuidEnd),
            withoutPrefix.substring(firstUuidEnd + 1)
          ];
        };
        
        const team1Players = parseTeamId(match.team1Id);
        const team2Players = parseTeamId(match.team2Id);
        
        // If this player was on team 1, team 2 players are opponents
        if (team1Players.includes(player.id)) {
          allOpponents.push(...team2Players);
        }
        // If this player was on team 2, team 1 players are opponents
        else if (team2Players.includes(player.id)) {
          allOpponents.push(...team1Players);
        }
      });
    });
    
    if (allOpponents.length === 0) return 0;
    
    // Calculate average score of all opponents
    const opponentScores = allOpponents.map(opponentId => {
      const opponent = currentTournament.players[opponentId];
      return opponent ? opponent.currentScore : 0;
    });
    
    return opponentScores.reduce((sum, score) => sum + score, 0) / opponentScores.length;
  };

  // Get teammates for a player from completed matches
  const getPlayerTeammates = (player: Player) => {
    if (!currentTournament) return [];
    
    const completedRounds = currentTournament.rounds.filter(round => round.isCompleted);
    const allTeammates: string[] = [];
    
    completedRounds.forEach(round => {
      round.matches.forEach(match => {
        if (!match.isCompleted) return;
        
        const parseTeamId = (teamId: string) => {
          if (!teamId.startsWith('team-')) return [];
          const withoutPrefix = teamId.substring(5);
          const firstUuidEnd = 36;
          if (withoutPrefix.length < firstUuidEnd + 1 + 36) return [];
          return [
            withoutPrefix.substring(0, firstUuidEnd),
            withoutPrefix.substring(firstUuidEnd + 1)
          ];
        };
        
        const team1Players = parseTeamId(match.team1Id);
        const team2Players = parseTeamId(match.team2Id);
        
        // If this player was on team 1, the other team 1 player is a teammate
        if (team1Players.includes(player.id)) {
          const teammate = team1Players.find(id => id !== player.id);
          if (teammate) allTeammates.push(teammate);
        }
        // If this player was on team 2, the other team 2 player is a teammate
        else if (team2Players.includes(player.id)) {
          const teammate = team2Players.find(id => id !== player.id);
          if (teammate) allTeammates.push(teammate);
        }
      });
    });
    
    return allTeammates;
  };

  // Get opponents for a player from completed matches
  const getPlayerOpponents = (player: Player) => {
    if (!currentTournament) return [];
    
    const completedRounds = currentTournament.rounds.filter(round => round.isCompleted);
    const allOpponents: string[] = [];
    
    completedRounds.forEach(round => {
      round.matches.forEach(match => {
        if (!match.isCompleted) return;
        
        const parseTeamId = (teamId: string) => {
          if (!teamId.startsWith('team-')) return [];
          const withoutPrefix = teamId.substring(5);
          const firstUuidEnd = 36;
          if (withoutPrefix.length < firstUuidEnd + 1 + 36) return [];
          return [
            withoutPrefix.substring(0, firstUuidEnd),
            withoutPrefix.substring(firstUuidEnd + 1)
          ];
        };
        
        const team1Players = parseTeamId(match.team1Id);
        const team2Players = parseTeamId(match.team2Id);
        
        // If this player was on team 1, team 2 players are opponents
        if (team1Players.includes(player.id)) {
          allOpponents.push(...team2Players);
        }
        // If this player was on team 2, team 1 players are opponents
        else if (team2Players.includes(player.id)) {
          allOpponents.push(...team1Players);
        }
      });
    });
    
    return allOpponents;
  };

  if (!currentTournament) {
    return null;
  }

  return (
    <Card title="Leaderboard">
      <div className="space-y-4">
        {/* Toggle button */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {sortedPlayers.length} player{sortedPlayers.length === 1 ? '' : 's'}
          </span>
          <Button
            onClick={() => setShowDetailedStats(!showDetailedStats)}
            size="sm"
            variant="secondary"
          >
            {showDetailedStats ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>

        {/* Leaderboard table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-1 text-sm font-medium text-gray-700">Rank</th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Player</th>
                <th className="text-right py-2 px-2 text-sm font-medium text-gray-700">Points</th>
                {showDetailedStats && (
                  <>
                    <th className="text-center py-2 px-2 text-sm font-medium text-gray-700">Wins</th>
                    <th className="text-center py-2 px-2 text-sm font-medium text-gray-700">Losses</th>
                    <th className="text-center py-2 px-2 text-sm font-medium text-gray-700">Byes</th>
                    <th className="text-right py-2 px-2 text-sm font-medium text-gray-700">SOS</th>
                    <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Teammates</th>
                    <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Opponents</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, index) => (
                <PlayerTableRow
                  key={player.id}
                  player={player}
                  rank={index + 1}
                  isTopThree={index < 3}
                  showDetailedStats={showDetailedStats}
                  strengthOfSchedule={calculateStrengthOfSchedule(player)}
                  teammates={getPlayerTeammates(player)}
                  opponents={getPlayerOpponents(player)}
                  currentTournament={currentTournament}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

interface PlayerTableRowProps {
  player: Player;
  rank: number;
  isTopThree: boolean;
  showDetailedStats: boolean;
  strengthOfSchedule: number;
  teammates: string[];
  opponents: string[];
  currentTournament: any; // Using any for now to avoid circular type issues
}

function PlayerTableRow({ 
  player, 
  rank, 
  isTopThree, 
  showDetailedStats, 
  strengthOfSchedule,
  teammates,
  opponents,
  currentTournament 
}: PlayerTableRowProps) {
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  return (
    <tr className={`border-b border-gray-100 ${
      isTopThree ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'hover:bg-gray-50'
    }`}>
      {/* Rank */}
      <td className="py-3 px-1">
        <div className="flex items-center space-x-1">
          <div className={`text-sm font-bold ${
            isTopThree ? 'text-yellow-700' : 'text-gray-600'
          }`}>
            #{rank}
          </div>
          {isTopThree && (
            <span className="text-lg">
              {getRankBadge(rank)}
            </span>
          )}
        </div>
      </td>

      {/* Player Name */}
      <td className="py-3 px-2">
        <div className="font-medium text-gray-900">
          {player.name}
        </div>
      </td>

      {/* Points */}
      <td className="py-3 px-2 text-right">
        <div className="text-lg font-semibold text-gray-900">
          {currentTournament.configuration.bonusPointsEnabled 
            ? player.currentScore.toFixed(2) 
            : player.currentScore.toString()
          }
        </div>
      </td>

      {/* Detailed Stats */}
      {showDetailedStats && (
        <>
          {/* Wins */}
          <td className="py-3 px-2 text-center">
            <span className="text-sm font-medium text-gray-900">
              {player.wins}
            </span>
          </td>

          {/* Losses */}
          <td className="py-3 px-2 text-center">
            <span className="text-sm font-medium text-gray-900">
              {player.losses}
            </span>
          </td>

          {/* Byes */}
          <td className="py-3 px-2 text-center">
            <span className="text-sm font-medium text-gray-900">
              {player.byeHistory.length}
            </span>
          </td>

          {/* Strength of Schedule */}
          <td className="py-3 px-2 text-right">
            <span className="text-sm font-medium text-gray-900">
              {strengthOfSchedule > 0 ? strengthOfSchedule.toFixed(1) : '-'}
            </span>
          </td>

          {/* Teammates */}
          <td className="py-3 px-2">
            <div className="text-xs text-gray-600 max-w-32">
              {teammates.length > 0 ? (
                <div className="space-y-1">
                  {teammates.map((teammateId, index) => {
                    const teammate = currentTournament.players[teammateId];
                    return (
                      <div key={`${teammateId}-${index}`} className="truncate">
                        {teammate?.name || 'Unknown'}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="text-gray-400">None</span>
              )}
            </div>
          </td>

          {/* Opponents */}
          <td className="py-3 px-2">
            <div className="text-xs text-gray-600 max-w-32">
              {opponents.length > 0 ? (
                <div className="space-y-1">
                  {opponents.map((opponentId, index) => {
                    const opponent = currentTournament.players[opponentId];
                    return (
                      <div key={`${opponentId}-${index}`} className="truncate">
                        {opponent?.name || 'Unknown'}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="text-gray-400">None</span>
              )}
            </div>
          </td>
        </>
      )}
    </tr>
  );
}