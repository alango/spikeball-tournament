export interface Player {
  id: string;
  name: string;
  currentScore: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  previousTeammates: string[]; // Player IDs in chronological order
  previousOpponents: string[]; // Player IDs in chronological order
  byeHistory: number[]; // Round numbers where player had bye
  initialSkillRating?: number; // 1-5 scale for initial seeding
}

export interface Team {
  id: string;
  player1Id: string;
  player2Id: string;
  combinedScore: number;
}

export interface Match {
  id: string;
  roundNumber: number;
  team1Id: string;
  team2Id: string;
  team1Score?: number;
  team2Score?: number;
  isCompleted: boolean;
}

export interface Round {
  roundNumber: number;
  matches: Match[];
  byes: string[]; // Player IDs
  isCompleted: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  players: Record<string, Player>;
  rounds: Round[];
  currentRound: number;
  isStarted: boolean;
  isCompleted: boolean;
  configuration: TournamentConfig;
  groupConfiguration: GroupConfiguration;
  customGroupConfig?: CustomGroupConfiguration;
}

export interface TournamentConfig {
  maxPlayers: number;
  scoringSystem: 'win-loss' | 'win-loss-bonus';
  bonusPointsEnabled: boolean;
  byePoints: number;
}

export interface GroupConfiguration {
  totalPlayers: number;
  byes: number;
  activePlayersPerRound: number;
  groupsOf4: number;
  groupsOf8: number;
  groupsOf12: number;
  totalGroups: number;
}

export interface CustomGroupConfiguration {
  useCustomGroups: boolean;
  groupsOf4: number;
  groupsOf8: number;
  groupsOf12: number;
}

export interface PlayerStats {
  currentScore: number;
  gamesPlayed: number;
  winPercentage: number;
  pointsPerGame: number;
  strengthOfSchedule: number;
  rank: number;
}

export interface TeamGenerationResult {
  teams: Team[];
  conflicts: number;
  maxTeamScore: number;
  minTeamScore: number;
  scoreDifference: number;
}

export interface MatchGenerationResult {
  matches: Match[];
  repeatOpponents: number;
  totalScoreDifference: number;
}

export interface PairingAlgorithmResult {
  groups: Player[][];
  byes: string[];
  rounds: Round;
  success: boolean;
  errors?: string[];
}