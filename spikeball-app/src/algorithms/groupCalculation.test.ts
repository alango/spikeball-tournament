import { calculateGroups, validatePlayerCount } from './groupCalculation';

// Test the group calculation algorithm
console.log('Testing group calculation algorithm...');

// Test cases from the specification
const testCases = [8, 9, 10, 11, 12, 16, 20, 24, 30];

testCases.forEach(playerCount => {
  const result = calculateGroups(playerCount, true);
  const validation = validatePlayerCount(playerCount);
  
  console.log(`\n${playerCount} players:`);
  console.log(`  Valid: ${validation.isValid}`);
  if (validation.isValid) {
    console.log(`  Active players: ${result.activePlayersPerRound}`);
    console.log(`  Byes: ${result.byes}`);
    console.log(`  Groups of 8: ${result.groupsOf8}`);
    console.log(`  Groups of 12: ${result.groupsOf12}`);
    console.log(`  Total groups: ${result.totalGroups}`);
    
    // Verify the math
    const totalGroupPlayers = (result.groupsOf8 * 8) + (result.groupsOf12 * 12);
    const expectedActive = result.totalPlayers - result.byes;
    console.log(`  Verification: ${totalGroupPlayers} === ${expectedActive} ? ${totalGroupPlayers === expectedActive}`);
  } else {
    console.log(`  Error: ${validation.error}`);
  }
});

export {};