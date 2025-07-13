import { describe, it, expect } from 'vitest';
import { calculateGroups, validatePlayerCount } from './groupCalculation';

describe('Group Calculation Algorithm', () => {
  describe('calculateGroups', () => {
    it('should calculate correct groups for 8 players', () => {
      const result = calculateGroups(8, true);
      expect(result.totalPlayers).toBe(8);
      expect(result.byes).toBe(0);
      expect(result.activePlayersPerRound).toBe(8);
      expect(result.groupsOf8).toBe(1);
      expect(result.groupsOf12).toBe(0);
      expect(result.totalGroups).toBe(1);
    });

    it('should calculate correct groups for 12 players', () => {
      const result = calculateGroups(12, true);
      expect(result.totalPlayers).toBe(12);
      expect(result.byes).toBe(0);
      expect(result.activePlayersPerRound).toBe(12);
      expect(result.groupsOf8).toBe(0);
      expect(result.groupsOf12).toBe(1);
      expect(result.totalGroups).toBe(1);
    });

    it('should calculate correct groups for 9 players (requires 3 byes)', () => {
      const result = calculateGroups(9, true);
      expect(result.totalPlayers).toBe(9);
      expect(result.byes).toBe(3);
      expect(result.activePlayersPerRound).toBe(6);
      expect(result.groupsOf8).toBe(0);
      expect(result.groupsOf12).toBe(0);
      // With 6 active players, no valid groups of 8 or 12
    });

    it('should calculate correct groups for 16 players', () => {
      const result = calculateGroups(16, true);
      expect(result.totalPlayers).toBe(16);
      expect(result.byes).toBe(0);
      expect(result.activePlayersPerRound).toBe(16);
      expect(result.groupsOf8).toBe(2);
      expect(result.groupsOf12).toBe(0);
      expect(result.totalGroups).toBe(2);
    });

    it('should calculate correct groups for 30 players', () => {
      const result = calculateGroups(30, true);
      expect(result.totalPlayers).toBe(30);
      expect(result.byes).toBe(2);
      expect(result.activePlayersPerRound).toBe(28);
      // 28 active players / 4 = 7 target, so 2A + 3B = 7
      // With prefer_larger_groups=true, should maximize B
      // Solutions: A=2,B=1 or A=0,B=2 (impossible) -> A=2,B=1
      expect(result.groupsOf8).toBe(2);
      expect(result.groupsOf12).toBe(1);
      expect(result.totalGroups).toBe(3);
    });

    it('should preserve total players in groups plus byes', () => {
      const testCases = [8, 9, 10, 11, 12, 16, 20, 24, 30];
      
      testCases.forEach(playerCount => {
        const result = calculateGroups(playerCount, true);
        const totalGroupPlayers = (result.groupsOf8 * 8) + (result.groupsOf12 * 12);
        const expectedActive = result.totalPlayers - result.byes;
        
        if (result.totalGroups > 0) {
          expect(totalGroupPlayers).toBe(expectedActive);
        }
      });
    });
  });

  describe('validatePlayerCount', () => {
    it('should validate correct player counts', () => {
      expect(validatePlayerCount(8).isValid).toBe(true);
      expect(validatePlayerCount(16).isValid).toBe(true);
      expect(validatePlayerCount(30).isValid).toBe(true);
    });

    it('should reject too few players', () => {
      const result = validatePlayerCount(7);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 8 players');
    });

    it('should reject too many players', () => {
      const result = validatePlayerCount(31);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Maximum 30 players');
    });
  });
});