import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Tournament,
  Player,
  Match,
  TournamentConfig,
  PlayerStats,
  CustomGroupConfiguration,
} from '../types';
import { calculateGroups } from '../algorithms/groupCalculation';
import { generateRound } from '../algorithms/pairingAlgorithm';

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
  updateCustomGroupConfig: (config: CustomGroupConfiguration) => void;
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

      updateCustomGroupConfig: (config) => {
        const state = get();
        if (!state.currentTournament || state.currentTournament.isStarted) {
          return;
        }

        set({
          currentTournament: {
            ...state.currentTournament,
            customGroupConfig: config,
          },
        });
      },

      startTournament: () => {
        const state = get();
        if (!state.currentTournament) return;

        const playerCount = Object.keys(state.currentTournament.players).length;
        const customConfig = state.currentTournament.customGroupConfig;
        const groupConfig = customConfig?.useCustomGroups
          ? calculateGroups(playerCount, true, customConfig.groupsOf4, customConfig.groupsOf8, customConfig.groupsOf12)
          : calculateGroups(playerCount, false);

        set({
          currentTournament: {
            ...state.currentTournament,
            isStarted: true,
            currentRound: 1,
            groupConfiguration: groupConfig,
          },
        });
      },

      generateRound: () => {
        const state = get();
        if (!state.currentTournament || !state.currentTournament.isStarted) {
          return;
        }

        const players = Object.values(state.currentTournament.players);
        const roundNumber = state.currentTournament.currentRound;
        
        const result = generateRound(players, roundNumber, state.currentTournament);
        
        if (result.success) {
          set({
            currentTournament: {
              ...state.currentTournament,
              rounds: [...state.currentTournament.rounds, result.round],
            },
          });
        } else {
          console.error('Failed to generate round:', result.errors);
        }
      },

      updateMatchScore: (matchId, team1Score, team2Score) => {
        const state = get();
        if (!state.currentTournament) return;

        // Find the match in the current round
        const currentRound = state.currentTournament.rounds.find(
          round => round.roundNumber === state.currentTournament!.currentRound
        );
        
        if (!currentRound) {
          console.error('Current round not found');
          return;
        }

        const matchIndex = currentRound.matches.findIndex(match => match.id === matchId);
        if (matchIndex === -1) {
          console.error('Match not found');
          return;
        }

        const match = currentRound.matches[matchIndex];

        // Update match scores
        const updatedMatch = {
          ...match,
          team1Score,
          team2Score,
          isCompleted: true,
        };

        // Update the tournament state - only update match data, not player stats
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

        if (!currentRound) {
          console.error('Current round not found');
          return;
        }

        // Check if all matches are completed
        const allMatchesCompleted = currentRound.matches.every(match => match.isCompleted);
        if (!allMatchesCompleted) {
          console.error('Cannot complete round: not all matches are finished');
          return;
        }

        // Calculate all stats from completed matches in this round
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

        // Helper function to calculate points for a match
        const calculateMatchPoints = (team1Score: number, team2Score: number, team1Won: boolean) => {
          if (state.currentTournament!.configuration.scoringSystem === 'win-loss') {
            return {
              team1Points: team1Won ? 3 : 0,
              team2Points: team1Won ? 0 : 3
            };
          } else if (state.currentTournament!.configuration.bonusPointsEnabled) {
            const team1BasePoints = team1Won ? 3 : 0;
            const team2BasePoints = team1Won ? 0 : 3;
            
            const totalGameScore = team1Score + team2Score;
            if (totalGameScore > 0) {
              const team1Percentage = team1Score / totalGameScore;
              const team2Percentage = team2Score / totalGameScore;
              
              const team1BonusPoints = team1Percentage * 1;
              const team2BonusPoints = team2Percentage * 1;
              
              return {
                team1Points: team1BasePoints + team1BonusPoints,
                team2Points: team2BasePoints + team2BonusPoints
              };
            } else {
              return {
                team1Points: team1BasePoints,
                team2Points: team2BasePoints
              };
            }
          } else {
            return {
              team1Points: team1Won ? 3 : 0,
              team2Points: team1Won ? 0 : 3
            };
          }
        };

        // Process all completed matches in this round
        currentRound.matches.forEach(match => {
          if (!match.isCompleted || match.team1Score === undefined || match.team2Score === undefined) {
            return;
          }

          const team1Won = match.team1Score > match.team2Score;
          const matchPoints = calculateMatchPoints(match.team1Score, match.team2Score, team1Won);
          
          const team1Players = parseTeamId(match.team1Id);
          const team2Players = parseTeamId(match.team2Id);

          // Update team 1 players
          [team1Players.player1Id, team1Players.player2Id].forEach(playerId => {
            if (playerId && updatedPlayers[playerId]) {
              updatedPlayers[playerId] = {
                ...updatedPlayers[playerId],
                currentScore: updatedPlayers[playerId].currentScore + matchPoints.team1Points,
                gamesPlayed: updatedPlayers[playerId].gamesPlayed + 1,
                wins: updatedPlayers[playerId].wins + (team1Won ? 1 : 0),
                losses: updatedPlayers[playerId].losses + (team1Won ? 0 : 1),
                previousOpponents: [...updatedPlayers[playerId].previousOpponents, team2Players.player1Id, team2Players.player2Id].filter(id => id),
                previousTeammates: [...updatedPlayers[playerId].previousTeammates, playerId === team1Players.player1Id ? team1Players.player2Id : team1Players.player1Id].filter(id => id && id !== playerId)
              };
            }
          });

          // Update team 2 players
          [team2Players.player1Id, team2Players.player2Id].forEach(playerId => {
            if (playerId && updatedPlayers[playerId]) {
              updatedPlayers[playerId] = {
                ...updatedPlayers[playerId],
                currentScore: updatedPlayers[playerId].currentScore + matchPoints.team2Points,
                gamesPlayed: updatedPlayers[playerId].gamesPlayed + 1,
                wins: updatedPlayers[playerId].wins + (team1Won ? 0 : 1),
                losses: updatedPlayers[playerId].losses + (team1Won ? 1 : 0),
                previousOpponents: [...updatedPlayers[playerId].previousOpponents, team1Players.player1Id, team1Players.player2Id].filter(id => id),
                previousTeammates: [...updatedPlayers[playerId].previousTeammates, playerId === team2Players.player1Id ? team2Players.player2Id : team2Players.player1Id].filter(id => id && id !== playerId)
              };
            }
          });
        });

        // Update player bye histories for this completed round and award bye points
        currentRound.byes.forEach(playerId => {
          if (updatedPlayers[playerId]) {
            updatedPlayers[playerId] = {
              ...updatedPlayers[playerId],
              byeHistory: [...updatedPlayers[playerId].byeHistory, currentRound.roundNumber],
              currentScore: updatedPlayers[playerId].currentScore + state.currentTournament!.configuration.byePoints
            };
          }
        });

        // Mark the round as completed
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
            // Keep the original behavior - advance to next round when completed
            currentRound: state.currentTournament.currentRound + 1,
          },
        });
      },

      resetTournament: () => {
        set({ currentTournament: null });
      },

      // Computed values
      getLeaderboard: () => {
        const state = get();
        if (!state.currentTournament) return [];

        const players = Object.values(state.currentTournament.players);
        
        // Helper function to calculate strength of schedule
        const calculateStrengthOfSchedule = (player: Player) => {
          const completedRounds = state.currentTournament!.rounds.filter(round => round.isCompleted);
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
            const opponent = state.currentTournament!.players[opponentId];
            return opponent ? opponent.currentScore : 0;
          });
          
          return opponentScores.reduce((sum, score) => sum + score, 0) / opponentScores.length;
        };
        
        return players.sort((a, b) => {
          // Primary sort: Total points (descending)
          if (a.currentScore !== b.currentScore) {
            return b.currentScore - a.currentScore;
          }
          // Secondary sort: Strength of schedule (descending)
          const aStrengthOfSchedule = calculateStrengthOfSchedule(a);
          const bStrengthOfSchedule = calculateStrengthOfSchedule(b);
          if (aStrengthOfSchedule !== bStrengthOfSchedule) {
            return bStrengthOfSchedule - aStrengthOfSchedule;
          }
          // Final sort: Alphabetical by name
          return a.name.localeCompare(b.name);
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
      partialize: (state) => ({ 
        currentTournament: state.currentTournament || undefined 
      }),
      migrate: (persistedState: unknown) => {
        // Add byePoints field for existing tournaments (defaults to 3)
        const state = persistedState as { currentTournament?: Tournament };
        if (state.currentTournament && 
            state.currentTournament.configuration &&
            !('byePoints' in state.currentTournament.configuration)) {
          (state.currentTournament.configuration as TournamentConfig).byePoints = 3;
        }
        return state;
      },
      version: 1,
    }
  )
);

export default useTournamentStore;