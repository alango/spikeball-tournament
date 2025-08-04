import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import type { Tournament, Player, TournamentConfig } from '../types';

// Create a test version of the store without persistence
interface TestTournamentStore {
  currentTournament: Tournament | null;
  createTournament: (config: {
    name: string;
    description?: string;
    configuration: TournamentConfig;
  }) => void;
  addPlayer: (player: Omit<Player, 'id'>) => void;
  deactivatePlayer: (playerId: string) => void;
  reactivatePlayer: (playerId: string) => void;
  completeRound: () => void;
  updateMatchScore: (matchId: string, team1Score: number, team2Score: number) => void;
}


// Mock store implementation for testing
const createTestStore = () => create<TestTournamentStore>((set, get) => ({
  currentTournament: null,

  createTournament: (config) => {
    const newTournament: Tournament = {
      id: crypto.randomUUID(),
      name: config.name,
      description: config.description,
      players: {},
      rounds: [],
      currentRound: 0,
      isStarted: false,
      isCompleted: false,
      configuration: config.configuration,
      groupConfiguration: {
        totalPlayers: 0,
        byes: 0,
        activePlayersPerRound: 0,
        groupsOf4: 0,
        groupsOf8: 0,
        groupsOf12: 0,
        totalGroups: 0,
      },
      customGroupConfig: undefined,
    };
    set({ currentTournament: newTournament });
  },

  addPlayer: (playerData) => {
    const state = get();
    if (!state.currentTournament || state.currentTournament.isStarted) {
      return;
    }

    const newPlayer: Player = {
      ...playerData,
      id: crypto.randomUUID(),
      currentScore: 0,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      previousTeammates: [],
      previousOpponents: [],
      byeHistory: [],
      isActive: true,
    };

    set({
      currentTournament: {
        ...state.currentTournament,
        players: {
          ...state.currentTournament.players,
          [newPlayer.id]: newPlayer,
        },
      },
    });
  },

  deactivatePlayer: (playerId) => {
    const state = get();
    if (!state.currentTournament) return;

    const player = state.currentTournament.players[playerId];
    if (!player) return;

    const updatedPlayers = { ...state.currentTournament.players };
    updatedPlayers[playerId] = {
      ...player,
      isActive: false,
      removedInRound: state.currentTournament.currentRound,
    };

    set({
      currentTournament: {
        ...state.currentTournament,
        players: updatedPlayers,
      },
    });
  },

  reactivatePlayer: (playerId) => {
    const state = get();
    if (!state.currentTournament) return;

    const player = state.currentTournament.players[playerId];
    if (!player) return;

    const updatedPlayers = { ...state.currentTournament.players };
    updatedPlayers[playerId] = {
      ...player,
      isActive: true,
      removedInRound: undefined,
    };

    set({
      currentTournament: {
        ...state.currentTournament,
        players: updatedPlayers,
      },
    });
  },

  updateMatchScore: (matchId, team1Score, team2Score) => {
    const state = get();
    if (!state.currentTournament) return;

    const currentRound = state.currentTournament.rounds.find(
      round => round.roundNumber === state.currentTournament!.currentRound
    );
    
    if (!currentRound) return;

    const matchIndex = currentRound.matches.findIndex(match => match.id === matchId);
    if (matchIndex === -1) return;

    const match = currentRound.matches[matchIndex];
    const updatedMatch = {
      ...match,
      team1Score,
      team2Score,
      isCompleted: true,
    };

    const updatedRounds = [...state.currentTournament.rounds];
    updatedRounds[updatedRounds.length - 1] = {
      ...currentRound,
      matches: [
        ...currentRound.matches.slice(0, matchIndex),
        updatedMatch,
        ...currentRound.matches.slice(matchIndex + 1),
      ],
    };

    set({
      currentTournament: {
        ...state.currentTournament,
        rounds: updatedRounds,
      },
    });
  },

  completeRound: () => {
    const state = get();
    if (!state.currentTournament) return;

    const currentRound = state.currentTournament.rounds.find(
      round => round.roundNumber === state.currentTournament!.currentRound
    );

    if (!currentRound) return;

    const allMatchesCompleted = currentRound.matches.every(match => match.isCompleted);
    if (!allMatchesCompleted) return;

    const updatedPlayers = { ...state.currentTournament.players };
    
    // Helper function to parse team IDs
    const parseTeamId = (teamId: string) => {
      if (!teamId.startsWith('team-')) return { player1Id: '', player2Id: '' };
      
      const withoutPrefix = teamId.substring(5);
      const firstUuidEnd = 36;
      
      if (withoutPrefix.length < firstUuidEnd + 1 + 36) {
        return { player1Id: '', player2Id: '' };
      }
      
      return {
        player1Id: withoutPrefix.substring(0, firstUuidEnd),
        player2Id: withoutPrefix.substring(firstUuidEnd + 1)
      };
    };

    // Process completed matches (only award points to active players)
    currentRound.matches.forEach(match => {
      if (!match.isCompleted || match.team1Score === undefined || match.team2Score === undefined) {
        return;
      }

      const team1Won = match.team1Score > match.team2Score;
      const team1Points = team1Won ? 3 : 0;
      const team2Points = team1Won ? 0 : 3;
      
      const team1Players = parseTeamId(match.team1Id);
      const team2Players = parseTeamId(match.team2Id);

      // Update team 1 players (award points regardless of current active status since they're in the match)
      [team1Players.player1Id, team1Players.player2Id].forEach(playerId => {
        if (playerId && updatedPlayers[playerId]) {
          updatedPlayers[playerId] = {
            ...updatedPlayers[playerId],
            currentScore: updatedPlayers[playerId].currentScore + team1Points,
            gamesPlayed: updatedPlayers[playerId].gamesPlayed + 1,
            wins: updatedPlayers[playerId].wins + (team1Won ? 1 : 0),
            losses: updatedPlayers[playerId].losses + (team1Won ? 0 : 1),
          };
        }
      });

      // Update team 2 players (award points regardless of current active status since they're in the match)
      [team2Players.player1Id, team2Players.player2Id].forEach(playerId => {
        if (playerId && updatedPlayers[playerId]) {
          updatedPlayers[playerId] = {
            ...updatedPlayers[playerId],
            currentScore: updatedPlayers[playerId].currentScore + team2Points,
            gamesPlayed: updatedPlayers[playerId].gamesPlayed + 1,
            wins: updatedPlayers[playerId].wins + (team1Won ? 0 : 1),
            losses: updatedPlayers[playerId].losses + (team1Won ? 1 : 0),
          };
        }
      });
    });

    // Update bye histories and award bye points (only to active players)
    currentRound.byes.forEach(playerId => {
      if (updatedPlayers[playerId]) {
        updatedPlayers[playerId] = {
          ...updatedPlayers[playerId],
          byeHistory: [...updatedPlayers[playerId].byeHistory, currentRound.roundNumber],
          currentScore: updatedPlayers[playerId].isActive 
            ? updatedPlayers[playerId].currentScore + state.currentTournament!.configuration.byePoints
            : updatedPlayers[playerId].currentScore
        };
      }
    });

    const updatedRounds = state.currentTournament.rounds.map(round =>
      round.roundNumber === state.currentTournament!.currentRound
        ? { ...round, isCompleted: true }
        : round
    );

    set({
      currentTournament: {
        ...state.currentTournament,
        players: updatedPlayers,
        rounds: updatedRounds,
        currentRound: state.currentTournament.currentRound + 1,
      },
    });
  },
}));

describe('Tournament Store - Player Management', () => {
  let useTestStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    useTestStore = createTestStore();
  });

  describe('deactivatePlayer', () => {
    it('should mark a player as inactive', () => {
      const store = useTestStore.getState();
      
      // Create tournament and add player
      store.createTournament({
        name: 'Test Tournament',
        configuration: {
          maxPlayers: 30,
          scoringSystem: 'win-loss',
          bonusPointsEnabled: false,
          byePoints: 3,
        },
      });

      store.addPlayer({
        name: 'Alice',
        currentScore: 9,
        gamesPlayed: 3,
        wins: 3,
        losses: 0,
        previousTeammates: [],
        previousOpponents: [],
        byeHistory: [],
        isActive: true,
      });

      const tournament = useTestStore.getState().currentTournament!;
      const playerId = Object.keys(tournament.players)[0];
      const player = tournament.players[playerId];

      expect(player.isActive).toBe(true);
      expect(player.removedInRound).toBeUndefined();

      // Set current round to simulate tournament in progress
      tournament.currentRound = 2;

      // Deactivate player
      store.deactivatePlayer(playerId);

      const updatedTournament = useTestStore.getState().currentTournament!;
      const updatedPlayer = updatedTournament.players[playerId];

      expect(updatedPlayer.isActive).toBe(false);
      expect(updatedPlayer.removedInRound).toBe(2);
    });

    it('should not deactivate non-existent player', () => {
      const store = useTestStore.getState();
      
      store.createTournament({
        name: 'Test Tournament',
        configuration: {
          maxPlayers: 30,
          scoringSystem: 'win-loss',
          bonusPointsEnabled: false,
          byePoints: 3,
        },
      });

      const initialTournament = useTestStore.getState().currentTournament!;
      
      // Try to deactivate non-existent player
      store.deactivatePlayer('non-existent-id');

      const finalTournament = useTestStore.getState().currentTournament!;
      expect(finalTournament).toEqual(initialTournament);
    });
  });

  describe('reactivatePlayer', () => {
    it('should reactivate an inactive player', () => {
      const store = useTestStore.getState();
      
      store.createTournament({
        name: 'Test Tournament',
        configuration: {
          maxPlayers: 30,
          scoringSystem: 'win-loss',
          bonusPointsEnabled: false,
          byePoints: 3,
        },
      });

      store.addPlayer({
        name: 'Alice',
        currentScore: 9,
        gamesPlayed: 3,
        wins: 3,
        losses: 0,
        previousTeammates: [],
        previousOpponents: [],
        byeHistory: [],
        isActive: true,
      });

      const tournament = useTestStore.getState().currentTournament!;
      const playerId = Object.keys(tournament.players)[0];

      // Deactivate then reactivate
      store.deactivatePlayer(playerId);
      store.reactivatePlayer(playerId);

      const updatedTournament = useTestStore.getState().currentTournament!;
      const updatedPlayer = updatedTournament.players[playerId];

      expect(updatedPlayer.isActive).toBe(true);
      expect(updatedPlayer.removedInRound).toBeUndefined();
    });
  });

  describe('completeRound with inactive players', () => {
    it('should not award points to inactive players', () => {
      const store = useTestStore.getState();
      
      store.createTournament({
        name: 'Test Tournament',
        configuration: {
          maxPlayers: 30,
          scoringSystem: 'win-loss',
          bonusPointsEnabled: false,
          byePoints: 3,
        },
      });

      // Add players
      store.addPlayer({
        name: 'Alice',
        currentScore: 6,
        gamesPlayed: 2,
        wins: 2,
        losses: 0,
        previousTeammates: [],
        previousOpponents: [],
        byeHistory: [],
        isActive: true,
      });

      store.addPlayer({
        name: 'Bob',
        currentScore: 3,
        gamesPlayed: 1,
        wins: 1,
        losses: 0,
        previousTeammates: [],
        previousOpponents: [],
        byeHistory: [],
        isActive: true,
      });

      let tournament = useTestStore.getState().currentTournament!;
      const playerIds = Object.keys(tournament.players);
      const bobId = playerIds[1];

      // Mark one player as inactive
      store.deactivatePlayer(bobId);

      // Get updated tournament state after deactivation
      tournament = useTestStore.getState().currentTournament!;

      // Create a mock round with a bye for the inactive player
      // Update the tournament state with the mock round
      useTestStore.setState({
        currentTournament: {
          ...tournament,
          currentRound: 1,
          rounds: [{
            roundNumber: 1,
            matches: [],
            byes: [bobId], // Inactive player gets a bye
            isCompleted: false,
          }],
        }
      });

      tournament = useTestStore.getState().currentTournament!;
      const bobScoreBefore = tournament.players[bobId].currentScore;
      
      // Complete the round
      store.completeRound();

      const updatedTournament = useTestStore.getState().currentTournament!;
      const bobScoreAfter = updatedTournament.players[bobId].currentScore;

      // Bob should not receive bye points because he's inactive
      expect(bobScoreAfter).toBe(bobScoreBefore);
      expect(updatedTournament.players[bobId].byeHistory).toContain(1); // Still tracks bye history
    });

    it('should award match points to players marked inactive during the round', () => {
      const store = useTestStore.getState();
      
      store.createTournament({
        name: 'Test Tournament',
        configuration: {
          maxPlayers: 30,
          scoringSystem: 'win-loss',
          bonusPointsEnabled: false,
          byePoints: 3,
        },
      });

      // Add players
      store.addPlayer({
        name: 'Alice',
        currentScore: 6,
        gamesPlayed: 2,
        wins: 2,
        losses: 0,
        previousTeammates: [],
        previousOpponents: [],
        byeHistory: [],
        isActive: true,
      });

      store.addPlayer({
        name: 'Bob',
        currentScore: 3,
        gamesPlayed: 1,
        wins: 1,
        losses: 0,
        previousTeammates: [],
        previousOpponents: [],
        byeHistory: [],
        isActive: true,
      });

      let tournament = useTestStore.getState().currentTournament!;
      const playerIds = Object.keys(tournament.players);
      const aliceId = playerIds[0];
      const bobId = playerIds[1];

      // Create a mock round with a match between Alice and Bob
      // Alice and Bob form a team that wins against an imaginary opponent
      const mockTeamId = `team-${aliceId}-${bobId}`;
      const mockOpponentTeamId = 'team-opponent1-opponent2';

      useTestStore.setState({
        currentTournament: {
          ...tournament,
          currentRound: 1,
          rounds: [{
            roundNumber: 1,
            matches: [{
              id: 'match-1',
              roundNumber: 1,
              team1Id: mockTeamId,
              team2Id: mockOpponentTeamId,
              team1Score: 21,
              team2Score: 15,
              isCompleted: true,
            }],
            byes: [],
            isCompleted: false,
          }],
        }
      });

      tournament = useTestStore.getState().currentTournament!;
      const aliceScoreBefore = tournament.players[aliceId].currentScore;
      const bobScoreBefore = tournament.players[bobId].currentScore;

      // Mark Bob inactive DURING the round (but he's already in a match)
      store.deactivatePlayer(bobId);

      // Complete the round
      store.completeRound();

      const updatedTournament = useTestStore.getState().currentTournament!;
      const aliceScoreAfter = updatedTournament.players[aliceId].currentScore;
      const bobScoreAfter = updatedTournament.players[bobId].currentScore;

      // Both Alice and Bob should receive match points (3 points for winning)
      // even though Bob was marked inactive during the round
      expect(aliceScoreAfter).toBe(aliceScoreBefore + 3);
      expect(bobScoreAfter).toBe(bobScoreBefore + 3); // Bob should still get points from the match

      // Both should have their games played incremented
      expect(updatedTournament.players[aliceId].gamesPlayed).toBe(tournament.players[aliceId].gamesPlayed + 1);
      expect(updatedTournament.players[bobId].gamesPlayed).toBe(tournament.players[bobId].gamesPlayed + 1);

      // Both should have their wins incremented
      expect(updatedTournament.players[aliceId].wins).toBe(tournament.players[aliceId].wins + 1);
      expect(updatedTournament.players[bobId].wins).toBe(tournament.players[bobId].wins + 1);
    });
  });
});