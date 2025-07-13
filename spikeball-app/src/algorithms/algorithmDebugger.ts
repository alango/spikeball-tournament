import type { Player } from '../types';
import { generateRound } from './pairingAlgorithm';

export interface AlgorithmDebugInfo {
  playerCount: number;
  groupConfiguration: {
    byes: number;
    groupsOf8: number;
    groupsOf12: number;
    totalGroups: number;
  };
  byeAssignments: {
    playerId: string;
    playerName: string;
    previousByes: number;
  }[];
  groups: {
    groupIndex: number;
    players: {
      playerId: string;
      playerName: string;
      currentScore: number;
      rank: number;
    }[];
  }[];
  matches: {
    matchId: string;
    team1: {
      player1: string;
      player2: string;
      combinedScore: number;
      hadPartnership: boolean;
    };
    team2: {
      player1: string;
      player2: string;
      combinedScore: number;
      hadPartnership: boolean;
    };
    scoreGap: number;
    hasRepeatOpponents: boolean;
  }[];
  stats: {
    totalRepeatPartnerships: number;
    totalRepeatOpponents: number;
    averageScoreGap: number;
    maxScoreGap: number;
  };
}

export function debugRoundGeneration(players: Player[], roundNumber: number): AlgorithmDebugInfo {
  const result = generateRound(players, roundNumber);
  
  if (!result.success) {
    throw new Error(`Round generation failed: ${result.errors?.join(', ')}`);
  }

  const playerMap = new Map(players.map(p => [p.id, p]));
  
  // Build debug info
  const debugInfo: AlgorithmDebugInfo = {
    playerCount: players.length,
    groupConfiguration: {
      byes: result.byes.length,
      groupsOf8: result.groups.filter(g => g.length === 8).length,
      groupsOf12: result.groups.filter(g => g.length === 12).length,
      totalGroups: result.groups.length,
    },
    byeAssignments: result.byes.map(playerId => {
      const player = playerMap.get(playerId)!;
      return {
        playerId,
        playerName: player.name,
        previousByes: player.byeHistory.length,
      };
    }),
    groups: result.groups.map((group, index) => ({
      groupIndex: index + 1,
      players: group.map((player, rank) => ({
        playerId: player.id,
        playerName: player.name,
        currentScore: player.currentScore,
        rank: rank + 1,
      })),
    })),
    matches: [],
    stats: {
      totalRepeatPartnerships: 0,
      totalRepeatOpponents: 0,
      averageScoreGap: 0,
      maxScoreGap: 0,
    },
  };

  // Analyze matches
  let totalScoreGap = 0;
  let maxScoreGap = 0;
  const totalRepeatPartnerships = 0;
  const totalRepeatOpponents = 0;

  for (const match of result.round.matches) {
    // This is a simplified analysis - in reality, we'd need to reconstruct teams from match data
    // For now, we'll create placeholder analysis
    const matchDebug = {
      matchId: match.id,
      team1: {
        player1: 'Player1',
        player2: 'Player2',
        combinedScore: 0,
        hadPartnership: false,
      },
      team2: {
        player1: 'Player3',
        player2: 'Player4',
        combinedScore: 0,
        hadPartnership: false,
      },
      scoreGap: 0,
      hasRepeatOpponents: false,
    };

    debugInfo.matches.push(matchDebug);
    totalScoreGap += matchDebug.scoreGap;
    maxScoreGap = Math.max(maxScoreGap, matchDebug.scoreGap);
  }

  debugInfo.stats = {
    totalRepeatPartnerships,
    totalRepeatOpponents,
    averageScoreGap: debugInfo.matches.length > 0 ? totalScoreGap / debugInfo.matches.length : 0,
    maxScoreGap,
  };

  return debugInfo;
}

export function printDebugInfo(debugInfo: AlgorithmDebugInfo): void {
  console.log('=== ALGORITHM DEBUG INFO ===');
  console.log(`Player Count: ${debugInfo.playerCount}`);
  
  console.log('\nGroup Configuration:');
  console.log(`  Byes: ${debugInfo.groupConfiguration.byes}`);
  console.log(`  Groups of 8: ${debugInfo.groupConfiguration.groupsOf8}`);
  console.log(`  Groups of 12: ${debugInfo.groupConfiguration.groupsOf12}`);
  console.log(`  Total Groups: ${debugInfo.groupConfiguration.totalGroups}`);

  if (debugInfo.byeAssignments.length > 0) {
    console.log('\nBye Assignments:');
    debugInfo.byeAssignments.forEach(bye => {
      console.log(`  ${bye.playerName} (${bye.previousByes} previous byes)`);
    });
  }

  console.log('\nGroups:');
  debugInfo.groups.forEach(group => {
    console.log(`  Group ${group.groupIndex}:`);
    group.players.forEach(player => {
      console.log(`    ${player.rank}. ${player.playerName} (${player.currentScore} pts)`);
    });
  });

  console.log('\nMatches:');
  debugInfo.matches.forEach((match, i) => {
    console.log(`  Match ${i + 1}: ${match.team1.player1}+${match.team1.player2} vs ${match.team2.player1}+${match.team2.player2}`);
    console.log(`    Score gap: ${match.scoreGap}, Repeat opponents: ${match.hasRepeatOpponents}`);
  });

  console.log('\nStatistics:');
  console.log(`  Total repeat partnerships: ${debugInfo.stats.totalRepeatPartnerships}`);
  console.log(`  Total repeat opponents: ${debugInfo.stats.totalRepeatOpponents}`);
  console.log(`  Average score gap: ${debugInfo.stats.averageScoreGap.toFixed(2)}`);
  console.log(`  Max score gap: ${debugInfo.stats.maxScoreGap}`);
}

export function validateRoundResult(players: Player[], result: { success: boolean; byes: string[]; groups: Player[][]; round: { matches: unknown[] }; errors?: string[] }): string[] {
  const errors: string[] = [];

  if (!result.success) {
    errors.push('Round generation failed');
    return errors;
  }

  const totalPlayers = players.length;
  const activePlayers = totalPlayers - result.byes.length;
  const totalPlayersInGroups = result.groups.reduce((sum: number, group: Player[]) => sum + group.length, 0);

  // Validate player counts
  if (activePlayers !== totalPlayersInGroups) {
    errors.push(`Player count mismatch: ${activePlayers} active players, ${totalPlayersInGroups} in groups`);
  }

  // Validate group sizes
  for (const group of result.groups) {
    if (group.length !== 8 && group.length !== 12) {
      errors.push(`Invalid group size: ${group.length} (must be 8 or 12)`);
    }
  }

  // Validate match counts
  const expectedMatches = result.groups.reduce((sum: number, group: Player[]) => sum + (group.length / 4), 0);
  if (result.round.matches.length !== expectedMatches) {
    errors.push(`Match count mismatch: expected ${expectedMatches}, got ${result.round.matches.length}`);
  }

  return errors;
}