import { generateRound } from './pairingAlgorithm';
import type { Player, Tournament } from '../types';

// Create test players
function createTestPlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i + 1}`,
    name: `Player ${i + 1}`,
    currentScore: Math.floor(Math.random() * 20) * 3, // Random score 0-60
    gamesPlayed: Math.floor(Math.random() * 5),
    wins: Math.floor(Math.random() * 3),
    losses: Math.floor(Math.random() * 3),
    previousTeammates: [],
    previousOpponents: [],
    byeHistory: Math.random() > 0.7 ? [1] : [], // 30% chance of having a bye
    initialSkillRating: Math.floor(Math.random() * 5) + 1,
  }));
}

// Create test tournament
function createTestTournament(players: Player[]): Tournament {
  const playersRecord: Record<string, Player> = {};
  players.forEach(player => {
    playersRecord[player.id] = player;
  });
  
  return {
    id: 'test-tournament',
    name: 'Test Tournament',
    players: playersRecord,
    rounds: [],
    currentRound: 1,
    isStarted: true,
    isCompleted: false,
    configuration: {
      maxPlayers: 30,
      scoringSystem: 'win-loss',
      bonusPointsEnabled: false,
      byePoints: 3,
    },
    groupConfiguration: {
      totalPlayers: players.length,
      byes: 0,
      activePlayersPerRound: players.length,
      groupsOf4: 0,
      groupsOf8: 0,
      groupsOf12: 0,
      totalGroups: 0,
    },
  };
}

// Performance test function
function performanceTest(playerCount: number, iterations: number = 10): void {
  console.log(`\n=== Performance Test: ${playerCount} players, ${iterations} iterations ===`);
  
  const players = createTestPlayers(playerCount);
  const tournament = createTestTournament(players);
  const times: number[] = [];
  let successCount = 0;
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    const result = generateRound(players, i + 1, tournament);
    const endTime = performance.now();
    
    const executionTime = endTime - startTime;
    times.push(executionTime);
    
    if (result.success) {
      successCount++;
    } else {
      console.log(`  Iteration ${i + 1} failed:`, result.errors);
    }
  }
  
  const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  console.log(`Results:`);
  console.log(`  Success rate: ${successCount}/${iterations} (${(successCount/iterations*100).toFixed(1)}%)`);
  console.log(`  Average time: ${avgTime.toFixed(2)}ms`);
  console.log(`  Min time: ${minTime.toFixed(2)}ms`);
  console.log(`  Max time: ${maxTime.toFixed(2)}ms`);
  
  if (successCount > 0) {
    const lastSuccessfulResult = generateRound(players, 1, tournament);
    if (lastSuccessfulResult.success) {
      console.log(`  Sample result: ${lastSuccessfulResult.round.matches.length} matches, ${lastSuccessfulResult.byes.length} byes`);
    }
  }
}

// Run performance tests
console.log('=== ALGORITHM PERFORMANCE TESTS ===');

// Test various player counts
const testCounts = [8, 12, 16, 20, 24, 30];
testCounts.forEach(count => {
  performanceTest(count, 5);
});

// Stress test with maximum players
console.log('\n=== STRESS TEST ===');
performanceTest(30, 20);

export {};