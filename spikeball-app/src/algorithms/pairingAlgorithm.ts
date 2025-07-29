import type { Player, Team, Match, Round, Tournament } from '../types';
import { calculateGroups } from './groupCalculation';

export interface TeamGenerationResult {
  teams: Team[];
  repeatPartnerCount: number;
  maxTeamScore: number;
  minTeamScore: number;
  scoreDifference: number;
}

export interface MatchGenerationResult {
  matches: Match[];
  repeatOpponentCount: number;
  totalScoreDifference: number;
}

export interface PairingResult {
  round: Round;
  byes: string[];
  groups: Player[][];
  success: boolean;
  errors?: string[];
}

// Bye assignment algorithm - assign byes to players with fewest byes and oldest bye history
export function assignByes(players: Player[], byeCount: number, currentRound: number): { byes: string[], remainingPlayers: Player[] } {
  if (byeCount === 0) {
    return { byes: [], remainingPlayers: players };
  }

  // Future enhancement: Could use currentRound for minimum gap enforcement
  // e.g., if (currentRound - aLastBye < MIN_GAP) { /* penalty */ }
  void currentRound; // Suppress TypeScript unused variable warning

  // Sort players by bye count (ascending), then by recency of last bye (ascending), then randomly
  const playersByByes = [...players].sort((a, b) => {
    // Primary: Total bye count (ascending)
    if (a.byeHistory.length !== b.byeHistory.length) {
      return a.byeHistory.length - b.byeHistory.length;
    }
    
    // Secondary: Most recent bye round (ascending - earlier byes prioritized)
    const aLastBye = a.byeHistory.length > 0 ? Math.max(...a.byeHistory) : -1;
    const bLastBye = b.byeHistory.length > 0 ? Math.max(...b.byeHistory) : -1;
    
    if (aLastBye !== bLastBye) {
      return aLastBye - bLastBye;
    }
    
    // Tertiary: Random tiebreaker
    return Math.random() - 0.5;
  });

  const byes = playersByByes.slice(0, byeCount).map(p => p.id);
  const remainingPlayers = playersByByes.slice(byeCount);

  return { byes, remainingPlayers };
}

// Helper function to calculate strength of schedule for a player
function calculateStrengthOfSchedule(player: Player, tournament: Tournament): number {
  const completedRounds = tournament.rounds.filter(round => round.isCompleted);
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
    const opponent = tournament.players[opponentId];
    return opponent ? opponent.currentScore : 0;
  });
  
  return opponentScores.reduce((sum, score) => sum + score, 0) / opponentScores.length;
}

// Create groups from remaining players based on current ranking
export function createGroups(players: Player[], groupsOf4: number, groupsOf8: number, groupsOf12: number, tournament: Tournament): Player[][] {
  // Sort players by current ranking (total score descending, then strength of schedule descending)
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.currentScore !== b.currentScore) {
      return b.currentScore - a.currentScore;
    }
    // Secondary sort: Strength of schedule (descending)
    const aStrengthOfSchedule = calculateStrengthOfSchedule(a, tournament);
    const bStrengthOfSchedule = calculateStrengthOfSchedule(b, tournament);
    if (aStrengthOfSchedule !== bStrengthOfSchedule) {
      return bStrengthOfSchedule - aStrengthOfSchedule;
    }
    // Final sort: Alphabetical by name
    return a.name.localeCompare(b.name);
  });

  const groups: Player[][] = [];
  let playerIndex = 0;

  // Create 4-player groups first
  for (let i = 0; i < groupsOf4; i++) {
    groups.push(sortedPlayers.slice(playerIndex, playerIndex + 4));
    playerIndex += 4;
  }

  // Create 8-player groups
  for (let i = 0; i < groupsOf8; i++) {
    groups.push(sortedPlayers.slice(playerIndex, playerIndex + 8));
    playerIndex += 8;
  }

  // Create 12-player groups
  for (let i = 0; i < groupsOf12; i++) {
    groups.push(sortedPlayers.slice(playerIndex, playerIndex + 12));
    playerIndex += 12;
  }

  return groups;
}

// Generate all possible team combinations for a group
export function generateAllTeamSets(players: Player[]): Team[][] {
  const playerCount = players.length;
  // const teamCount = playerCount / 2;
  
  if (playerCount % 2 !== 0) {
    throw new Error('Player count must be even to form teams');
  }

  const allTeamSets: Team[][] = [];
  
  function generateTeamSetsRecursive(remainingPlayers: Player[], currentTeams: Team[], startIndex: number) {
    if (remainingPlayers.length === 0) {
      allTeamSets.push([...currentTeams]);
      return;
    }

    if (remainingPlayers.length < 2) {
      return; // Can't form a team with less than 2 players
    }

    const firstPlayer = remainingPlayers[0];
    
    // Pair first player with each subsequent player
    for (let i = 1; i < remainingPlayers.length; i++) {
      const secondPlayer = remainingPlayers[i];
      const newTeam: Team = {
        id: `team-${firstPlayer.id}-${secondPlayer.id}`,
        player1Id: firstPlayer.id,
        player2Id: secondPlayer.id,
        combinedScore: firstPlayer.currentScore + secondPlayer.currentScore,
      };

      const newRemainingPlayers = remainingPlayers.filter((_, index) => index !== 0 && index !== i);
      generateTeamSetsRecursive(newRemainingPlayers, [...currentTeams, newTeam], startIndex);
    }
  }

  generateTeamSetsRecursive(players, [], 0);
  return allTeamSets;
}

// Count repeat partners in a team set
export function countRepeatPartners(teams: Team[], players: Player[]): number {
  let repeatCount = 0;
  
  for (const team of teams) {
    const player1 = players.find(p => p.id === team.player1Id);
    const player2 = players.find(p => p.id === team.player2Id);
    
    if (player1 && player2) {
      if (player1.previousTeammates.includes(team.player2Id) || 
          player2.previousTeammates.includes(team.player1Id)) {
        repeatCount++;
      }
    }
  }
  
  return repeatCount;
}

// Find the best team set (minimize repeat partners, then minimize score difference)
export function findBestTeamSet(teamSets: Team[][], players: Player[]): TeamGenerationResult {
  let bestTeamSet: Team[] = teamSets[0];
  let bestRepeatCount = Infinity;
  let bestScoreDifference = Infinity;

  for (const teamSet of teamSets) {
    const repeatCount = countRepeatPartners(teamSet, players);
    
    if (repeatCount < bestRepeatCount) {
      bestTeamSet = teamSet;
      bestRepeatCount = repeatCount;
      bestScoreDifference = calculateScoreDifference(teamSet);
    } else if (repeatCount === bestRepeatCount) {
      const scoreDifference = calculateScoreDifference(teamSet);
      if (scoreDifference < bestScoreDifference) {
        bestTeamSet = teamSet;
        bestScoreDifference = scoreDifference;
      }
    }
  }

  const maxScore = Math.max(...bestTeamSet.map(t => t.combinedScore));
  const minScore = Math.min(...bestTeamSet.map(t => t.combinedScore));

  return {
    teams: bestTeamSet,
    repeatPartnerCount: bestRepeatCount,
    maxTeamScore: maxScore,
    minTeamScore: minScore,
    scoreDifference: maxScore - minScore,
  };
}

// Calculate score difference for a team set
function calculateScoreDifference(teams: Team[]): number {
  const scores = teams.map(t => t.combinedScore);
  return Math.max(...scores) - Math.min(...scores);
}

// Generate all possible match sets from teams
export function generateAllMatchSets(teams: Team[], roundNumber: number): Match[][] {
  const teamCount = teams.length;
  // const matchCount = teamCount / 2;
  
  if (teamCount % 2 !== 0) {
    throw new Error('Team count must be even to form matches');
  }

  const allMatchSets: Match[][] = [];
  
  function generateMatchSetsRecursive(remainingTeams: Team[], currentMatches: Match[]) {
    if (remainingTeams.length === 0) {
      allMatchSets.push([...currentMatches]);
      return;
    }

    if (remainingTeams.length < 2) {
      return; // Can't form a match with less than 2 teams
    }

    const firstTeam = remainingTeams[0];
    
    // Match first team with each subsequent team
    for (let i = 1; i < remainingTeams.length; i++) {
      const secondTeam = remainingTeams[i];
      const newMatch: Match = {
        id: `match-${firstTeam.id}-${secondTeam.id}`,
        roundNumber,
        team1Id: firstTeam.id,
        team2Id: secondTeam.id,
        isCompleted: false,
      };

      const newRemainingTeams = remainingTeams.filter((_, index) => index !== 0 && index !== i);
      generateMatchSetsRecursive(newRemainingTeams, [...currentMatches, newMatch]);
    }
  }

  generateMatchSetsRecursive(teams, []);
  return allMatchSets;
}

// Count repeat opponents in a match set
export function countRepeatOpponents(matches: Match[], teams: Team[], players: Player[]): number {
  let repeatCount = 0;
  
  for (const match of matches) {
    const team1 = teams.find(t => t.id === match.team1Id);
    const team2 = teams.find(t => t.id === match.team2Id);
    
    if (team1 && team2) {
      const team1Players = [team1.player1Id, team1.player2Id];
      const team2Players = [team2.player1Id, team2.player2Id];
      
      // Check if any player from team1 has previously played against any player from team2
      for (const p1Id of team1Players) {
        const player1 = players.find(p => p.id === p1Id);
        if (player1) {
          for (const p2Id of team2Players) {
            if (player1.previousOpponents.includes(p2Id)) {
              repeatCount++;
            }
          }
        }
      }
    }
  }
  
  return repeatCount;
}

// Calculate total score difference for all matches in a set
export function calculateMatchSetScoreDifference(matches: Match[], teams: Team[]): number {
  let totalDifference = 0;
  
  for (const match of matches) {
    const team1 = teams.find(t => t.id === match.team1Id);
    const team2 = teams.find(t => t.id === match.team2Id);
    
    if (team1 && team2) {
      totalDifference += Math.abs(team1.combinedScore - team2.combinedScore);
    }
  }
  
  return totalDifference;
}

// Find the best match set (minimize repeat opponents, then minimize score difference)
export function findBestMatchSet(matchSets: Match[][], teams: Team[], players: Player[]): MatchGenerationResult {
  let bestMatchSet: Match[] = matchSets[0];
  let bestRepeatCount = Infinity;
  let bestScoreDifference = Infinity;

  for (const matchSet of matchSets) {
    const repeatCount = countRepeatOpponents(matchSet, teams, players);
    
    if (repeatCount < bestRepeatCount) {
      bestMatchSet = matchSet;
      bestRepeatCount = repeatCount;
      bestScoreDifference = calculateMatchSetScoreDifference(matchSet, teams);
    } else if (repeatCount === bestRepeatCount) {
      const scoreDifference = calculateMatchSetScoreDifference(matchSet, teams);
      if (scoreDifference < bestScoreDifference) {
        bestMatchSet = matchSet;
        bestScoreDifference = scoreDifference;
      }
    }
  }

  return {
    matches: bestMatchSet,
    repeatOpponentCount: bestRepeatCount,
    totalScoreDifference: bestScoreDifference,
  };
}

// Main pairing algorithm - generate a complete round
export function generateRound(players: Player[], roundNumber: number, tournament: Tournament): PairingResult {
  try {
    const playerCount = players.length;
    const groupConfig = calculateGroups(playerCount);
    
    // Step 1: Assign byes
    const { byes, remainingPlayers } = assignByes(players, groupConfig.byes, roundNumber);
    
    // Step 2: Create groups
    const groups = createGroups(remainingPlayers, groupConfig.groupsOf4, groupConfig.groupsOf8, groupConfig.groupsOf12, tournament);
    
    // Step 3: Generate matches for each group
    const allMatches: Match[] = [];
    
    for (const group of groups) {
      // Generate all possible team sets
      const teamSets = generateAllTeamSets(group);
      
      if (teamSets.length === 0) {
        throw new Error(`No valid team sets for group of ${group.length} players`);
      }
      
      // Find best team set
      const bestTeamResult = findBestTeamSet(teamSets, group);
      
      // Generate all possible match sets from the best teams
      const matchSets = generateAllMatchSets(bestTeamResult.teams, roundNumber);
      
      if (matchSets.length === 0) {
        throw new Error(`No valid match sets for ${bestTeamResult.teams.length} teams`);
      }
      
      // Find best match set
      const bestMatchResult = findBestMatchSet(matchSets, bestTeamResult.teams, group);
      
      allMatches.push(...bestMatchResult.matches);
    }
    
    const round: Round = {
      roundNumber,
      matches: allMatches,
      byes,
      isCompleted: false,
    };
    
    return {
      round,
      byes,
      groups,
      success: true,
    };
    
  } catch (error) {
    return {
      round: {
        roundNumber,
        matches: [],
        byes: [],
        isCompleted: false,
      },
      byes: [],
      groups: [],
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}