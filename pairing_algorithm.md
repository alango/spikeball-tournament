This is the algorithm for taking a leaderboard of 8-30 players and producing the pairings for the next round.

## Grouping ##
Separate players into groups. Groups can contain 4, 8, or 12 players.

**Default Algorithm:** By default, the tournament uses 4-player groups only for simplicity and optimal pairing.

**Advanced Configuration:** Tournament organizers can optionally configure custom group sizes mixing 4, 8, and 12 player groups.

At the start of the tournament, calculate the group configuration. For the default algorithm, this simply divides players into groups of 4. For custom configurations, calculate the number of each group size that the total player pool can be subdivided into (e.g., 20 players -> 5 groups of 4, or custom: 1 group of 4 + 2 groups of 8). This is done by the following algorithms:
### Default Algorithm (4-player groups only):
```python
def calculate_groups_default(n_players):
    # Calculate byes needed to bring players down to a multiple of 4
    byes = n_players % 4
    active_players = n_players - byes
    groups_of_4 = active_players // 4
    
    return {
        'total_players': n_players,
        'byes': byes,
        'active_players': active_players,
        'groups_of_4': groups_of_4,
        'groups_of_8': 0,
        'groups_of_12': 0,
        'total_groups': groups_of_4
    }
```

### Custom Algorithm (mixed group sizes):
```python
def calculate_groups_custom(n_players, groups_of_4, groups_of_8, groups_of_12):
    # Calculate active players needed for custom configuration
    active_players_needed = (groups_of_4 * 4) + (groups_of_8 * 8) + (groups_of_12 * 12)
    byes = n_players - active_players_needed
    
    # Validate configuration
    if byes < 0:
        raise ValueError("Not enough players for requested group configuration")
    if byes > 3:
        raise ValueError("Too many byes - maximum 3 allowed")
    
    return {
        'total_players': n_players,
        'byes': byes,
        'active_players': active_players_needed,
        'groups_of_4': groups_of_4,
        'groups_of_8': groups_of_8,
        'groups_of_12': groups_of_12,
        'total_groups': groups_of_4 + groups_of_8 + groups_of_12
    }
```

Each round, groups are assigned as follows:
1. **Bye assignment** - Assign the necessary number of byes to players with the fewest byes so far (breaking ties randomly)
2. **Create groups** - Using the fixed calculated group sizes (determined once at tournament start and kept constant throughout), separate the remaining field into the groups for that round. Players are ranked by:
   - Primary: Total points (descending)
   - Secondary: Strength of schedule (descending) 
   - Tertiary: Alphabetical by name
   
   Groups are filled in order: 4-player groups first, then 8-player groups, then 12-player groups, taking the highest ranked players for each group.
3. For each group, create match-ups with the "Creating Teams and Matches" algorithm.

## Creating Teams and Matches ##
For each group of 4, 8, or 12 players:
1. **Generate all possible sets of teams** - Each team contains exactly 2 players.
2. **Choose the team set** with the fewest number of repeat partners (players who have been teammates before).
    a. If there are ties, choose the set with the smallest difference between the highest and lowest team scores (sum of both players' scores).
3. **Generate all possible sets of matches** - With the 2, 4, or 6 teams in the chosen set, create all possible match pairings.
4. **Choose the match set** that minimizes the total number of repeat opponents (players who have faced each other before).
    a. Break ties by choosing the set with the smallest total score difference between opposing teams.

## Group Size Strategy ##
- **4-player groups**: Create 1 match per group (2 teams of 2 players each)
- **8-player groups**: Create 2 matches per group (4 teams of 2 players each) 
- **12-player groups**: Create 3 matches per group (6 teams of 2 players each)

The algorithm prioritizes avoiding repeat partnerships first, then avoiding repeat opponents, then balancing competitive fairness through score differences.

