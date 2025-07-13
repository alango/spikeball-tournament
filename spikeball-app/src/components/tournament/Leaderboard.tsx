import { useMemo } from 'react';
import { Card } from '../ui';
import useTournamentStore from '../../stores/tournamentStore';
import type { Player } from '../../types';

export function Leaderboard() {
  const { currentTournament } = useTournamentStore();

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

  if (!currentTournament) {
    return null;
  }

  return (
    <Card title="Leaderboard">
      <div className="space-y-3">
        {sortedPlayers.map((player, index) => (
          <PlayerRow 
            key={player.id} 
            player={player} 
            rank={index + 1}
            isTopThree={index < 3}
          />
        ))}
      </div>
    </Card>
  );
}

interface PlayerRowProps {
  player: Player;
  rank: number;
  isTopThree: boolean;
}

function PlayerRow({ player, rank, isTopThree }: PlayerRowProps) {
  const winPercentage = player.gamesPlayed > 0 ? (player.wins / player.gamesPlayed * 100) : 0;
  const pointsPerGame = player.gamesPlayed > 0 ? (player.currentScore / player.gamesPlayed) : 0;

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank.toString();
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${
      isTopThree ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-gray-50'
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          isTopThree ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-600'
        } font-semibold text-sm`}>
          {getRankBadge(rank)}
        </div>
        
        <div>
          <div className="font-medium text-gray-900">{player.name}</div>
          <div className="text-xs text-gray-500">
            {player.wins}W-{player.losses}L
            {player.gamesPlayed > 0 && (
              <span className="ml-2">
                {winPercentage.toFixed(0)}% win rate
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-lg font-semibold text-gray-900">
          {player.currentScore}
        </div>
        <div className="text-xs text-gray-500">
          {player.gamesPlayed > 0 ? `${pointsPerGame.toFixed(1)} ppg` : 'No games'}
        </div>
      </div>
    </div>
  );
}