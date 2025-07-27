
export interface GroupCalculationResult {
  totalPlayers: number;
  byes: number;
  activePlayersPerRound: number;
  groupsOf4: number;
  groupsOf8: number;
  groupsOf12: number;
  totalGroups: number;
}

export function calculateGroups(
  nPlayers: number, 
  useCustomGroups: boolean = false,
  customGroupsOf4: number = 0,
  customGroupsOf8: number = 0,
  customGroupsOf12: number = 0
): GroupCalculationResult {
  if (useCustomGroups) {
    // Use custom group configuration
    const activePlayersPerRound = (customGroupsOf4 * 4) + (customGroupsOf8 * 8) + (customGroupsOf12 * 12);
    const byes = nPlayers - activePlayersPerRound;
    const totalGroups = customGroupsOf4 + customGroupsOf8 + customGroupsOf12;
    
    return {
      totalPlayers: nPlayers,
      byes,
      activePlayersPerRound,
      groupsOf4: customGroupsOf4,
      groupsOf8: customGroupsOf8,
      groupsOf12: customGroupsOf12,
      totalGroups,
    };
  }

  // Default behavior: Use only 4-player groups
  const byes = nPlayers % 4;
  const activePlayersPerRound = nPlayers - byes;
  const groupsOf4 = activePlayersPerRound / 4;

  return {
    totalPlayers: nPlayers,
    byes,
    activePlayersPerRound,
    groupsOf4,
    groupsOf8: 0,
    groupsOf12: 0,
    totalGroups: groupsOf4,
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

export function validateCustomGroups(
  totalPlayers: number,
  groupsOf4: number,
  groupsOf8: number,
  groupsOf12: number
): { isValid: boolean; error?: string; activePlayersPerRound: number } {
  const activePlayersPerRound = (groupsOf4 * 4) + (groupsOf8 * 8) + (groupsOf12 * 12);
  
  if (activePlayersPerRound > totalPlayers) {
    return {
      isValid: false,
      error: `Total active players (${activePlayersPerRound}) cannot exceed total players (${totalPlayers})`,
      activePlayersPerRound
    };
  }
  
  if (activePlayersPerRound < totalPlayers - 3) {
    return {
      isValid: false,
      error: `Too many byes. Total active players must be at least ${totalPlayers - 3}`,
      activePlayersPerRound
    };
  }
  
  return { isValid: true, activePlayersPerRound };
}