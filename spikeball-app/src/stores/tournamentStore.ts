import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Tournament,
  Player,
  Match,
  TournamentConfig,
  PlayerStats,
} from '../types';

interface TournamentStore {
  // State
  currentTournament: Tournament | null;

  // Actions
  createTournament: (config: {
    name: string;
    description?: string;
    configuration: TournamentConfig;
  }) => void;
  addPlayer: (player: Omit<Player, 'id'>) => void;
  removePlayer: (playerId: string) => void;
  startTournament: () => void;
  generateRound: () => void;
  updateMatchScore: (
    matchId: string,
    team1Score: number,
    team2Score: number
  ) => void;
  completeRound: () => void;
  resetTournament: () => void;

  // Computed values
  getLeaderboard: () => Player[];
  getCurrentRoundMatches: () => Match[];
  getPlayerStats: (playerId: string) => PlayerStats | null;
}

const useTournamentStore = create<TournamentStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentTournament: null,

      // Actions
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
            groupsOf8: 0,
            groupsOf12: 0,
            totalGroups: 0,
          },
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

      removePlayer: (playerId) => {
        const state = get();
        if (!state.currentTournament || state.currentTournament.isStarted) {
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [playerId]: _, ...remainingPlayers } =
          state.currentTournament.players;

        set({
          currentTournament: {
            ...state.currentTournament,
            players: remainingPlayers,
          },
        });
      },

      startTournament: () => {
        const state = get();
        if (!state.currentTournament) return;

        // TODO: Calculate group configuration using the algorithm
        // This will be implemented in Phase 3
        set({
          currentTournament: {
            ...state.currentTournament,
            isStarted: true,
            currentRound: 1,
          },
        });
      },

      generateRound: () => {
        // TODO: Implement round generation using pairing algorithm
        // This will be implemented in Phase 3
        console.log('Generate round - to be implemented');
      },

      updateMatchScore: (matchId, team1Score, team2Score) => {
        const state = get();
        if (!state.currentTournament) return;

        // TODO: Implement score update logic
        // This will be implemented in Phase 5
        console.log('Update match score - to be implemented', {
          matchId,
          team1Score,
          team2Score,
        });
      },

      completeRound: () => {
        // TODO: Implement round completion logic
        // This will be implemented in Phase 5
        console.log('Complete round - to be implemented');
      },

      resetTournament: () => {
        set({ currentTournament: null });
      },

      // Computed values
      getLeaderboard: () => {
        const state = get();
        if (!state.currentTournament) return [];

        const players = Object.values(state.currentTournament.players);
        return players.sort((a, b) => {
          // Sort by total points, then by strength of schedule
          if (a.currentScore !== b.currentScore) {
            return b.currentScore - a.currentScore;
          }
          // TODO: Implement strength of schedule calculation
          return 0;
        });
      },

      getCurrentRoundMatches: () => {
        const state = get();
        if (!state.currentTournament || state.currentTournament.currentRound === 0) {
          return [];
        }

        const currentRound = state.currentTournament.rounds.find(
          (round) => round.roundNumber === state.currentTournament!.currentRound
        );
        return currentRound?.matches || [];
      },

      getPlayerStats: (playerId) => {
        const state = get();
        if (!state.currentTournament) return null;

        const player = state.currentTournament.players[playerId];
        if (!player) return null;

        return {
          currentScore: player.currentScore,
          gamesPlayed: player.gamesPlayed,
          winPercentage: player.gamesPlayed > 0 ? player.wins / player.gamesPlayed : 0,
          pointsPerGame: player.gamesPlayed > 0 ? player.currentScore / player.gamesPlayed : 0,
          strengthOfSchedule: 0, // TODO: Calculate strength of schedule
          rank: 0, // TODO: Calculate rank from leaderboard
        };
      },
    }),
    {
      name: 'spikeball-tournament-state',
      partialize: (state) => ({ currentTournament: state.currentTournament }),
    }
  )
);

export default useTournamentStore;