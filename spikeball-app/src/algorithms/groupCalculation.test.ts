import { describe, it, expect } from 'vitest';
import { calculateGroups, validatePlayerCount, validateCustomGroups } from './groupCalculation';

describe('Group Calculation Algorithm', () => {
  describe('calculateGroups', () => {
    it('should calculate correct groups for 8 players', () => {
      const result = calculateGroups(8, false); // default algorithm uses 4-player groups
      expect(result.totalPlayers).toBe(8);
      expect(result.byes).toBe(0);
      expect(result.activePlayersPerRound).toBe(8);
      expect(result.groupsOf4).toBe(2); // 8 players = 2 groups of 4
      expect(result.groupsOf8).toBe(0);
      expect(result.groupsOf12).toBe(0);
      expect(result.totalGroups).toBe(2);
    });

    it('should calculate correct groups for 12 players', () => {
      const result = calculateGroups(12, false); // default algorithm uses 4-player groups
      expect(result.totalPlayers).toBe(12);
      expect(result.byes).toBe(0);
      expect(result.activePlayersPerRound).toBe(12);
      expect(result.groupsOf4).toBe(3); // 12 players = 3 groups of 4
      expect(result.groupsOf8).toBe(0);
      expect(result.groupsOf12).toBe(0);
      expect(result.totalGroups).toBe(3);
    });

    it('should calculate correct groups for 9 players (requires 1 bye)', () => {
      const result = calculateGroups(9, false); // default algorithm uses 4-player groups
      expect(result.totalPlayers).toBe(9);
      expect(result.byes).toBe(1); // 9 % 4 = 1
      expect(result.activePlayersPerRound).toBe(8);
      expect(result.groupsOf4).toBe(2); // 8 active players = 2 groups of 4
      expect(result.groupsOf8).toBe(0);
      expect(result.groupsOf12).toBe(0);
      expect(result.totalGroups).toBe(2);
    });

    it('should calculate correct groups for 16 players', () => {
      const result = calculateGroups(16, false); // default algorithm uses 4-player groups
      expect(result.totalPlayers).toBe(16);
      expect(result.byes).toBe(0);
      expect(result.activePlayersPerRound).toBe(16);
      expect(result.groupsOf4).toBe(4); // 16 players = 4 groups of 4
      expect(result.groupsOf8).toBe(0);
      expect(result.groupsOf12).toBe(0);
      expect(result.totalGroups).toBe(4);
    });

    it('should calculate correct groups for 30 players', () => {
      const result = calculateGroups(30, false); // default algorithm uses 4-player groups
      expect(result.totalPlayers).toBe(30);
      expect(result.byes).toBe(2); // 30 % 4 = 2
      expect(result.activePlayersPerRound).toBe(28);
      expect(result.groupsOf4).toBe(7); // 28 active players = 7 groups of 4
      expect(result.groupsOf8).toBe(0);
      expect(result.groupsOf12).toBe(0);
      expect(result.totalGroups).toBe(7);
    });

    it('should calculate correct groups for 40 players', () => {
      const result = calculateGroups(40, false); // default algorithm uses 4-player groups
      expect(result.totalPlayers).toBe(40);
      expect(result.byes).toBe(0); // 40 % 4 = 0
      expect(result.activePlayersPerRound).toBe(40);
      expect(result.groupsOf4).toBe(10); // 40 active players = 10 groups of 4
      expect(result.groupsOf8).toBe(0);
      expect(result.groupsOf12).toBe(0);
      expect(result.totalGroups).toBe(10);
    });

    it('should preserve total players in groups plus byes', () => {
      const testCases = [8, 9, 10, 11, 12, 16, 20, 24, 30, 40];
      
      testCases.forEach(playerCount => {
        const result = calculateGroups(playerCount, false); // test default 4-player algorithm
        const totalGroupPlayers = (result.groupsOf4 * 4) + (result.groupsOf8 * 8) + (result.groupsOf12 * 12);
        const expectedActive = result.totalPlayers - result.byes;
        
        if (result.totalGroups > 0) {
          expect(totalGroupPlayers).toBe(expectedActive);
        }
      });
    });

    it('should support custom group configurations', () => {
      // Test custom configuration: 1 group of 4, 1 group of 8 = 12 players
      const result = calculateGroups(12, true, 1, 1, 0);
      expect(result.totalPlayers).toBe(12);
      expect(result.byes).toBe(0);
      expect(result.activePlayersPerRound).toBe(12);
      expect(result.groupsOf4).toBe(1);
      expect(result.groupsOf8).toBe(1);
      expect(result.groupsOf12).toBe(0);
      expect(result.totalGroups).toBe(2);
    });

    it('should handle custom groups with byes', () => {
      // Test custom configuration that requires byes: 2 groups of 8 for 17 players
      const result = calculateGroups(17, true, 0, 2, 0);
      expect(result.totalPlayers).toBe(17);
      expect(result.byes).toBe(1); // 17 - 16 = 1 bye needed
      expect(result.activePlayersPerRound).toBe(16);
      expect(result.groupsOf4).toBe(0);
      expect(result.groupsOf8).toBe(2);
      expect(result.groupsOf12).toBe(0);
      expect(result.totalGroups).toBe(2);
    });
  });

  describe('validatePlayerCount', () => {
    it('should validate correct player counts', () => {
      expect(validatePlayerCount(8).isValid).toBe(true);
      expect(validatePlayerCount(16).isValid).toBe(true);
      expect(validatePlayerCount(40).isValid).toBe(true);
    });

    it('should reject too few players', () => {
      const result = validatePlayerCount(7);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 8 players');
    });

    it('should reject too many players', () => {
      const result = validatePlayerCount(41);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Maximum 40 players');
    });
  });

  describe('validateCustomGroups', () => {
    it('should validate correct custom group configurations', () => {
      // 12 players with 1 group of 4 and 1 group of 8
      const result = validateCustomGroups(12, 1, 1, 0);
      expect(result.isValid).toBe(true);
    });

    it('should reject custom groups that exceed player count', () => {
      // 10 players but asking for 3 groups of 4 (12 players)
      const result = validateCustomGroups(10, 3, 0, 0);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Total active players (12) cannot exceed total players (10)');
    });

    it('should reject custom groups that are less than player count', () => {
      // 12 players but only 1 group of 4 (4 players)
      const result = validateCustomGroups(12, 1, 0, 0);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Too many byes. Total active players must be at least');
    });

    it('should handle groups with byes correctly', () => {
      // 17 players with 2 groups of 8 (16 players, 1 bye)
      const result = validateCustomGroups(17, 0, 2, 0);
      expect(result.isValid).toBe(true);
    });
  });
});