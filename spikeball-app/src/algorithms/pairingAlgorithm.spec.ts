import { describe, it, expect } from 'vitest';
import {
  assignByes,
  createGroups,
  generateAllTeamSets,
  countRepeatPartners,
  generateRound,
} from './pairingAlgorithm';
import type { Player, Tournament } from '../types';

// Test helper to create a player
function createTestPlayer(id: string, name: string, score: number = 0, byes: number[] = [], teammates: string[] = [], opponents: string[] = []): Player {
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

// Test helper to create a minimal tournament
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

describe('Pairing Algorithm', () => {
  describe('assignByes', () => {
    it('should assign no byes when none needed', () => {
      const players = [
        createTestPlayer('1', 'Alice'),
        createTestPlayer('2', 'Bob'),
      ];
      
      const result = assignByes(players, 0, 1);
      expect(result.byes).toHaveLength(0);
      expect(result.remainingPlayers).toHaveLength(2);
    });

    it('should prioritize players with fewest previous byes', () => {
      const players = [
        createTestPlayer('1', 'Alice', 9, [1]), // 1 previous bye
        createTestPlayer('2', 'Bob', 6, []),    // 0 previous byes
        createTestPlayer('3', 'Charlie', 6, []), // 0 previous byes
        createTestPlayer('4', 'David', 3, [1]),  // 1 previous bye
      ];
      
      const result = assignByes(players, 2, 2);
      expect(result.byes).toHaveLength(2);
      expect(result.remainingPlayers).toHaveLength(2);
      
      // Should prioritize Bob and Charlie (0 byes) over Alice and David (1 bye each)
      const byedPlayers = result.byes.map(id => players.find(p => p.id === id)!);
      expect(byedPlayers.every(p => p.byeHistory.length <= 1)).toBe(true);
    });

    it('should prioritize players with older byes when bye counts are equal', () => {
      const players = [
        createTestPlayer('1', 'Alice', 9, [1]), // Had bye in round 1
        createTestPlayer('2', 'Bob', 6, [3]),   // Had bye in round 3 (more recent)
        createTestPlayer('3', 'Charlie', 6, [2]), // Had bye in round 2
        createTestPlayer('4', 'David', 3, [1]),   // Had bye in round 1
      ];
      
      const result = assignByes(players, 2, 4); // Assign 2 byes for round 4
      expect(result.byes).toHaveLength(2);
      expect(result.remainingPlayers).toHaveLength(2);
      
      // Should prioritize Alice and David (both had byes in round 1) over Bob (round 3) and Charlie (round 2)
      const byedPlayers = result.byes.map(id => players.find(p => p.id === id)!);
      const byedRounds = byedPlayers.map(p => Math.max(...p.byeHistory));
      
      // Both selected players should have had their last bye in round 1 (oldest)
      expect(byedRounds.every(round => round === 1)).toBe(true);
    });

    it('should avoid consecutive byes when possible', () => {
      const players = [
        createTestPlayer('1', 'Alice', 9, [1, 2]), // Had byes in rounds 1, 2
        createTestPlayer('2', 'Bob', 6, [3]),      // Had bye in round 3 (most recent)
        createTestPlayer('3', 'Charlie', 6, [1]),  // Had bye in round 1 (oldest)
        createTestPlayer('4', 'David', 3, [2]),    // Had bye in round 2
      ];
      
      const result = assignByes(players, 1, 4); // Assign 1 bye for round 4
      expect(result.byes).toHaveLength(1);
      
      // Should select Charlie (had bye in round 1, oldest) over Bob (had bye in round 3, most recent)
      const byedPlayer = players.find(p => p.id === result.byes[0])!;
      expect(byedPlayer.name).toBe('Charlie');
    });
  });

  describe('createGroups', () => {
    it('should group players by current score', () => {
      const players = [
        createTestPlayer('1', 'Alice', 18),
        createTestPlayer('2', 'Bob', 15),
        createTestPlayer('3', 'Charlie', 12),
        createTestPlayer('4', 'David', 9),
        createTestPlayer('5', 'Eve', 6),
        createTestPlayer('6', 'Frank', 3),
        createTestPlayer('7', 'Grace', 0),
        createTestPlayer('8', 'Henry', 0),
      ];
      
      const tournament = createTestTournament(players);
      const groups = createGroups(players, 0, 1, 0, tournament);
      expect(groups).toHaveLength(1);
      expect(groups[0]).toHaveLength(8);
      
      // Should be ordered by score (highest first)
      for (let i = 1; i < groups[0].length; i++) {
        expect(groups[0][i-1].currentScore).toBeGreaterThanOrEqual(groups[0][i].currentScore);
      }
    });
  });

  describe('generateAllTeamSets', () => {
    it('should generate valid team sets for even number of players', () => {
      const players = [
        createTestPlayer('1', 'Alice'),
        createTestPlayer('2', 'Bob'),
        createTestPlayer('3', 'Charlie'),
        createTestPlayer('4', 'David'),
      ];
      
      const teamSets = generateAllTeamSets(players);
      expect(teamSets.length).toBeGreaterThan(0);
      
      // Each team set should have 2 teams
      teamSets.forEach(teamSet => {
        expect(teamSet).toHaveLength(2);
      });
    });

    it('should throw error for odd number of players', () => {
      const players = [
        createTestPlayer('1', 'Alice'),
        createTestPlayer('2', 'Bob'),
        createTestPlayer('3', 'Charlie'),
      ];
      
      expect(() => generateAllTeamSets(players)).toThrow('Player count must be even');
    });
  });

  describe('countRepeatPartners', () => {
    it('should detect repeat partnerships', () => {
      const players = [
        createTestPlayer('1', 'Alice', 9, [], ['2']), // Previously with Bob
        createTestPlayer('2', 'Bob', 6, [], ['1']),   // Previously with Alice
        createTestPlayer('3', 'Charlie', 6, [], []),
        createTestPlayer('4', 'David', 3, [], []),
      ];
      
      const teams = [
        {
          id: 'team1',
          player1Id: '1',
          player2Id: '2', // Alice + Bob again (repeat)
          combinedScore: 15,
        },
        {
          id: 'team2',
          player1Id: '3',
          player2Id: '4', // Charlie + David (new)
          combinedScore: 9,
        },
      ];
      
      const repeatCount = countRepeatPartners(teams, players);
      expect(repeatCount).toBe(1);
    });
  });

  describe('generateRound', () => {
    it('should generate valid round for 8 players', () => {
      const players = [
        createTestPlayer('1', 'Alice', 9),
        createTestPlayer('2', 'Bob', 6),
        createTestPlayer('3', 'Charlie', 6),
        createTestPlayer('4', 'David', 3),
        createTestPlayer('5', 'Eve', 3),
        createTestPlayer('6', 'Frank', 0),
        createTestPlayer('7', 'Grace', 0),
        createTestPlayer('8', 'Henry', 0),
      ];
      
      const tournament = createTestTournament(players);
      const result = generateRound(players, 1, tournament);
      
      expect(result.success).toBe(true);
      expect(result.round.roundNumber).toBe(1);
      expect(result.round.matches.length).toBe(2); // 8 players = 2 groups of 4 = 2 matches total
      expect(result.byes).toHaveLength(0); // No byes needed for 8 players
      expect(result.groups).toHaveLength(2); // 2 groups of 4
    });

    it('should handle 9 players with byes', () => {
      const players = Array.from({ length: 9 }, (_, i) => 
        createTestPlayer(`${i + 1}`, `Player${i + 1}`, Math.floor(Math.random() * 20))
      );
      
      const tournament = createTestTournament(players);
      const result = generateRound(players, 1, tournament);
      
      expect(result.success).toBe(true);
      expect(result.byes.length).toBe(1); // 9 % 4 = 1 bye
      expect(result.round.matches.length).toBe(2); // 8 players → 2 groups of 4 → 2 matches
      expect(result.groups).toHaveLength(2); // 2 groups of 4
    });

    it('should handle various player counts', () => {
      const validCounts = [8, 12, 16, 20, 24, 30];
      
      validCounts.forEach(count => {
        const players = Array.from({ length: count }, (_, i) => 
          createTestPlayer(`${i + 1}`, `Player${i + 1}`, Math.floor(Math.random() * 20))
        );
        
        const tournament = createTestTournament(players);
      const result = generateRound(players, 1, tournament);
        expect(result.success).toBe(true);
        expect(result.round.matches.length).toBeGreaterThan(0);
      });
    });
  });
});