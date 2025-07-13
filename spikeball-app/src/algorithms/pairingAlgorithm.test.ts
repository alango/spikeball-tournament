import {
  assignByes,
  createGroups,
  generateAllTeamSets,
  countRepeatPartners,
  findBestTeamSet,
  generateAllMatchSets,
  generateRound,
} from './pairingAlgorithm';
import type { Player } from '../types';

// Test helper to create a player
function createPlayer(id: string, name: string, score: number = 0, byes: number[] = [], teammates: string[] = [], opponents: string[] = []): Player {
  return {
    id,
    name,
    currentScore: score,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    previousTeammates: teammates,
    previousOpponents: opponents,
    byeHistory: byes,
  };
}

// Test bye assignment
console.log('=== Testing Bye Assignment ===');

const players8 = [
  createPlayer('1', 'Alice', 9, [1]),
  createPlayer('2', 'Bob', 6, []),
  createPlayer('3', 'Charlie', 6, []),
  createPlayer('4', 'David', 3, [1]),
  createPlayer('5', 'Eve', 3, []),
  createPlayer('6', 'Frank', 0, []),
  createPlayer('7', 'Grace', 0, []),
  createPlayer('8', 'Henry', 0, []),
];

console.log('Testing bye assignment with 8 players (need 0 byes):');
const byeResult0 = assignByes(players8, 0);
console.log(`Byes: ${byeResult0.byes.length}, Remaining: ${byeResult0.remainingPlayers.length}`);
console.log('✓ Should be 0 byes, 8 remaining');

console.log('\nTesting bye assignment with 9 players (need 3 byes):');
const players9 = [...players8, createPlayer('9', 'Ivy', 0, [])];
const byeResult3 = assignByes(players9, 3);
console.log(`Byes: ${byeResult3.byes.length}, Remaining: ${byeResult3.remainingPlayers.length}`);
console.log('Bye players should have fewest previous byes:');
byeResult3.byes.forEach(playerId => {
  const player = players9.find(p => p.id === playerId);
  console.log(`  ${player?.name}: ${player?.byeHistory.length} previous byes`);
});
console.log('✓ Should be 3 byes, 6 remaining, prioritizing players with fewest byes');

// Test group creation
console.log('\n=== Testing Group Creation ===');

const players12 = [
  createPlayer('1', 'Alice', 18),
  createPlayer('2', 'Bob', 15),
  createPlayer('3', 'Charlie', 12),
  createPlayer('4', 'David', 12),
  createPlayer('5', 'Eve', 9),
  createPlayer('6', 'Frank', 9),
  createPlayer('7', 'Grace', 6),
  createPlayer('8', 'Henry', 6),
  createPlayer('9', 'Ivy', 3),
  createPlayer('10', 'Jack', 3),
  createPlayer('11', 'Kate', 0),
  createPlayer('12', 'Liam', 0),
];

console.log('Testing group creation (1 group of 12):');
const groups = createGroups(players12, 0, 1);
console.log(`Created ${groups.length} groups`);
console.log(`Group 1 has ${groups[0].length} players`);
console.log('Players by score:');
groups[0].forEach((player, i) => {
  console.log(`  ${i + 1}. ${player.name}: ${player.currentScore} points`);
});
console.log('✓ Should be ordered by score (highest first)');

// Test team generation
console.log('\n=== Testing Team Generation ===');

const group8 = players8;
console.log('Testing team generation for 8 players:');
const teamSets = generateAllTeamSets(group8);
console.log(`Generated ${teamSets.length} possible team sets`);
console.log(`Each set has ${teamSets[0].length} teams`);
console.log('Sample team set:');
teamSets[0].forEach((team, i) => {
  const p1 = group8.find(p => p.id === team.player1Id);
  const p2 = group8.find(p => p.id === team.player2Id);
  console.log(`  Team ${i + 1}: ${p1?.name} + ${p2?.name} (combined: ${team.combinedScore})`);
});

// Test repeat partner counting
console.log('\n=== Testing Repeat Partner Detection ===');

const playersWithHistory = [
  createPlayer('1', 'Alice', 9, [], ['2']),  // Alice previously partnered with Bob
  createPlayer('2', 'Bob', 6, [], ['1']),    // Bob previously partnered with Alice
  createPlayer('3', 'Charlie', 6, [], []),
  createPlayer('4', 'David', 3, [], []),
];

const testTeamSets = generateAllTeamSets(playersWithHistory);
console.log('Testing repeat partner counting:');
testTeamSets.slice(0, 3).forEach((teamSet, i) => {
  const repeatCount = countRepeatPartners(teamSet, playersWithHistory);
  console.log(`Team set ${i + 1}: ${repeatCount} repeat partnerships`);
  teamSet.forEach(team => {
    const p1 = playersWithHistory.find(p => p.id === team.player1Id);
    const p2 = playersWithHistory.find(p => p.id === team.player2Id);
    const isRepeat = p1?.previousTeammates.includes(team.player2Id) || p2?.previousTeammates.includes(team.player1Id);
    console.log(`  ${p1?.name} + ${p2?.name} ${isRepeat ? '(REPEAT)' : ''}`);
  });
});

// Test best team set selection
console.log('\n=== Testing Best Team Set Selection ===');

const bestTeamResult = findBestTeamSet(testTeamSets, playersWithHistory);
console.log(`Best team set has ${bestTeamResult.repeatPartnerCount} repeat partners`);
console.log(`Score difference: ${bestTeamResult.scoreDifference} (${bestTeamResult.minTeamScore} to ${bestTeamResult.maxTeamScore})`);
console.log('Best teams:');
bestTeamResult.teams.forEach(team => {
  const p1 = playersWithHistory.find(p => p.id === team.player1Id);
  const p2 = playersWithHistory.find(p => p.id === team.player2Id);
  console.log(`  ${p1?.name} + ${p2?.name} (${team.combinedScore})`);
});

// Test match generation
console.log('\n=== Testing Match Generation ===');

const matchSets = generateAllMatchSets(bestTeamResult.teams, 1);
console.log(`Generated ${matchSets.length} possible match sets`);
console.log('Sample match set:');
matchSets[0].forEach((match, i) => {
  const team1 = bestTeamResult.teams.find(t => t.id === match.team1Id);
  const team2 = bestTeamResult.teams.find(t => t.id === match.team2Id);
  console.log(`  Match ${i + 1}: Team ${team1?.id} vs Team ${team2?.id}`);
});

// Test full round generation
console.log('\n=== Testing Full Round Generation ===');

const testPlayers = [
  createPlayer('1', 'Alice', 9),
  createPlayer('2', 'Bob', 6),
  createPlayer('3', 'Charlie', 6),
  createPlayer('4', 'David', 3),
  createPlayer('5', 'Eve', 3),
  createPlayer('6', 'Frank', 0),
  createPlayer('7', 'Grace', 0),
  createPlayer('8', 'Henry', 0),
];

console.log('Testing full round generation for 8 players:');
const roundResult = generateRound(testPlayers, 1);

if (roundResult.success) {
  console.log('✓ Round generation successful');
  console.log(`Groups: ${roundResult.groups.length}`);
  console.log(`Matches: ${roundResult.round.matches.length}`);
  console.log(`Byes: ${roundResult.byes.length}`);
  
  console.log('\nGenerated matches:');
  roundResult.round.matches.forEach((match, i) => {
    console.log(`  Match ${i + 1}: ${match.team1Id} vs ${match.team2Id}`);
  });
} else {
  console.log('✗ Round generation failed');
  console.log('Errors:', roundResult.errors);
}

// Test various player counts
console.log('\n=== Testing Various Player Counts ===');

const testCounts = [8, 9, 10, 11, 12, 16, 20, 24, 30];
testCounts.forEach(count => {
  const testPlayersForCount = Array.from({ length: count }, (_, i) => 
    createPlayer(`${i + 1}`, `Player${i + 1}`, Math.floor(Math.random() * 20))
  );
  
  const result = generateRound(testPlayersForCount, 1);
  const status = result.success ? '✓' : '✗';
  console.log(`${status} ${count} players: ${result.success ? `${result.round.matches.length} matches, ${result.byes.length} byes` : result.errors?.[0]}`);
});

console.log('\n=== All Tests Complete ===');

export {};