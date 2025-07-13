This is the algorithm for taking a leaderboard of 8-30 players and producing the pairings for the next round.

## Grouping ##
Separate players into groups. Groups can contain either 8 or 12 players.

At the start of the tournament, group sizes are calculated by the following algorithm:
```python
def calculate_groups(n_players, prefer_larger_groups=True):
    # Step 1: Calculate byes needed to make divisible by 4
    byes = (4 - (n_players % 4)) % 4
    active_players = n_players - byes
    target = active_players // 4  # This will always be an integer
    
    # Step 2: Find valid combinations of 8 and 12-player groups
    # Solve: 2A + 3B = target
    valid_solutions = []
    
    max_groups_of_12 = target // 3
    for groups_of_12 in range(max_groups_of_12 + 1):
        remainder = target - (3 * groups_of_12)
        if remainder >= 0 and remainder % 2 == 0:
            groups_of_8 = remainder // 2
            valid_solutions.append((groups_of_8, groups_of_12))
    
    # Step 3: Choose preferred solution
    if prefer_larger_groups:
        # Maximize 12-player groups
        best_solution = max(valid_solutions, key=lambda x: x[1])
    else:
        # Maximize 8-player groups (better for algorithm performance)
        best_solution = max(valid_solutions, key=lambda x: x[0])
    
    groups_of_8, groups_of_12 = best_solution
    
    return {
        'total_players': n_players,
        'byes': byes,
        'active_players': active_players,
        'groups_of_8': groups_of_8,
        'groups_of_12': groups_of_12,
        'total_groups': groups_of_8 + groups_of_12
    }
```

Each round, groups are assigned as follows:
1. Bye assignment - Assign the necessary number of byes to players with the fewest byes so far (breaking ties randomly)
2. Create groups - Using the fixed calculated group sizes (determined once at tournament start and kept constant throughout), separate the remaining field into the groups for that round. To do this, take the first group size and take that number of the highest ranked players. Continue until all groups have been created.
3. For each group, create match-ups with the "Creating Pairs" algorithm.

**Creating Pairs**
For each group of 8 or 12 players:
1. Generate all possible sets of teams.
2. Choose the 1 that has the fewest number of repeat partners.
    a. If there are ties, for each set find the minimum and maximum team scores (sum of both players' scores) in each potential set. Choose the set with the smallest difference between the max and min team scores.
3. With the 4 or 6 teams in the set, now generate all possible sets of matches.
4. Choose the set of matches that minmises the total number of repeat opponents.
    a. Break ties by choosing the set of matches that minimises total score difference between opponents.

