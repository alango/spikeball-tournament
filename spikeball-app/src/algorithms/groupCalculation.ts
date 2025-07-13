
export interface GroupCalculationResult {
  totalPlayers: number;
  byes: number;
  activePlayersPerRound: number;
  groupsOf8: number;
  groupsOf12: number;
  totalGroups: number;
}

export function calculateGroups(
  nPlayers: number, 
  preferLargerGroups: boolean = true
): GroupCalculationResult {
  // Step 1: Calculate byes needed to make divisible by 4
  const byes = (4 - (nPlayers % 4)) % 4;
  const activePlayersPerRound = nPlayers - byes;
  const target = activePlayersPerRound / 4; // This will always be an integer

  // Step 2: Find valid combinations of 8 and 12-player groups
  // Solve: 2A + 3B = target (where A = groups of 8, B = groups of 12)
  const validSolutions: Array<[number, number]> = [];

  const maxGroupsOf12 = Math.floor(target / 3);
  for (let groupsOf12 = 0; groupsOf12 <= maxGroupsOf12; groupsOf12++) {
    const remainder = target - (3 * groupsOf12);
    if (remainder >= 0 && remainder % 2 === 0) {
      const groupsOf8 = remainder / 2;
      validSolutions.push([groupsOf8, groupsOf12]);
    }
  }

  // Step 3: Choose preferred solution
  let bestSolution: [number, number];
  if (preferLargerGroups) {
    // Maximize 12-player groups
    bestSolution = validSolutions.reduce((best, current) => 
      current[1] > best[1] ? current : best
    );
  } else {
    // Maximize 8-player groups (better for algorithm performance)
    bestSolution = validSolutions.reduce((best, current) => 
      current[0] > best[0] ? current : best
    );
  }

  const [groupsOf8, groupsOf12] = bestSolution;

  return {
    totalPlayers: nPlayers,
    byes,
    activePlayersPerRound,
    groupsOf8,
    groupsOf12,
    totalGroups: groupsOf8 + groupsOf12,
  };
}

export function validatePlayerCount(playerCount: number): { 
  isValid: boolean; 
  error?: string; 
} {
  if (playerCount < 8) {
    return { 
      isValid: false, 
      error: `Need at least 8 players (currently have ${playerCount})` 
    };
  }
  
  if (playerCount > 30) {
    return { 
      isValid: false, 
      error: `Maximum 30 players allowed (currently have ${playerCount})` 
    };
  }

  return { isValid: true };
}