# Design Document: Spikeball Tournament Generator

## Technology Stack

### Core Technologies
- **Frontend Framework**: React 18+ with TypeScript
- **Build Tool**: Vite (fast development server, optimized production builds)
- **Styling**: Tailwind CSS (utility-first, responsive design)
- **State Management**: Zustand (lightweight, TypeScript-friendly)
- **Persistence**: localStorage with automatic serialization/deserialization
- **Package Manager**: npm

### Development Tools
- **TypeScript**: Strict mode for type safety
- **ESLint + Prettier**: Code quality and formatting
- **React DevTools**: Development debugging

## Architecture Overview

### Client-Only Architecture
The application runs entirely in the browser with no backend dependencies:

```
┌─────────────────────────────────────┐
│             Browser                 │
│  ┌─────────────────────────────────┐│
│  │         React App               ││
│  │  ┌─────────────────────────────┐││
│  │  │     Components Layer       │││
│  │  │  - TournamentManager       │││
│  │  │  - Leaderboard             │││
│  │  │  - RoundGenerator          │││
│  │  │  - ScoreEntry              │││
│  │  └─────────────────────────────┘││
│  │  ┌─────────────────────────────┐││
│  │  │     Business Logic Layer   │││
│  │  │  - PairingAlgorithm        │││
│  │  │  - ScoreCalculator         │││
│  │  │  - TournamentValidator     │││
│  │  └─────────────────────────────┘││
│  │  ┌─────────────────────────────┐││
│  │  │     State Management       │││
│  │  │  - Zustand Store           │││
│  │  │  - Type Definitions        │││
│  │  └─────────────────────────────┘││
│  │  ┌─────────────────────────────┐││
│  │  │     Persistence Layer      │││
│  │  │  - localStorage Interface  │││
│  │  │  - State Serialization     │││
│  │  └─────────────────────────────┘││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

## Data Models

### Core Types
```typescript
interface Player {
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

interface Team {
  id: string;
  player1Id: string;
  player2Id: string;
  combinedScore: number;
}

interface Match {
  id: string;
  roundNumber: number;
  team1Id: string;
  team2Id: string;
  team1Score?: number;
  team2Score?: number;
  isCompleted: boolean;
}

interface Round {
  roundNumber: number;
  matches: Match[];
  byes: string[]; // Player IDs
  isCompleted: boolean;
}

interface Tournament {
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
}

interface TournamentConfig {
  maxPlayers: number;
  scoringSystem: 'win-loss' | 'win-loss-bonus';
  bonusPointsEnabled: boolean;
}

interface GroupConfiguration {
  totalPlayers: number;
  byes: number;
  activePlayersPerRound: number;
  groupsOf8: number;
  groupsOf12: number;
  totalGroups: number;
}
```

## Component Architecture

### Layout Structure
```
App
├── TournamentSetup (conditional)
│   ├── TournamentForm
│   └── PlayerRegistration
└── TournamentDashboard (conditional)
    ├── Leaderboard
    ├── PreviousRounds (collapsible)
    │   └── RoundSummary[]
    └── CurrentRound
        ├── RoundGenerator (if not generated)
        └── ScoreEntry (if generated)
```

### Component Responsibilities

#### TournamentSetup
- Tournament creation form
- Player registration
- Input validation
- Tournament initialization

#### Leaderboard
- Real-time ranking display
- Player statistics
- Sortable columns
- Responsive design for mobile

#### RoundGenerator
- Group calculation visualization
- Pairing preview
- Manual adjustment interface
- Round publication

#### ScoreEntry
- Match score input
- Real-time validation
- Round completion confirmation

#### PreviousRounds
- Collapsible round history
- Match results display
- Historical statistics

## State Management

### Zustand Store Structure
```typescript
interface TournamentStore {
  // State
  currentTournament: Tournament | null;
  
  // Actions
  createTournament: (config: TournamentConfig) => void;
  addPlayer: (player: Omit<Player, 'id'>) => void;
  removePlayer: (playerId: string) => void;
  startTournament: () => void;
  generateRound: () => void;
  updateMatchScore: (matchId: string, team1Score: number, team2Score: number) => void;
  completeRound: () => void;
  resetTournament: () => void;
  
  // Computed values
  getLeaderboard: () => Player[];
  getCurrentRoundMatches: () => Match[];
  getPlayerStats: (playerId: string) => PlayerStats;
}
```

### Persistence Strategy
- **Storage**: localStorage with JSON serialization
- **Key**: `spikeball-tournament-state`
- **Auto-save**: On every state mutation
- **Recovery**: Automatic on app initialization
- **Reset**: Creating new tournament clears all previous state

## Business Logic Implementation

### Pairing Algorithm
Located in `src/algorithms/pairingAlgorithm.ts`:
- Group calculation function (from spec)
- Team generation with conflict minimization
- Match creation with opponent history tracking
- Comprehensive TypeScript types for all intermediate steps

### Score Calculation
Located in `src/utils/scoreCalculator.ts`:
- Win/loss point allocation (3/0)
- Bonus point calculation (percentage-based)
- Strength of schedule calculation
- Leaderboard ranking logic

### Validation Layer
Located in `src/utils/validators.ts`:
- Tournament setup validation
- Score input validation
- Business rule enforcement
- Error message generation

## UI/UX Design Principles

### Responsive Design
- **Desktop**: Three-column layout (Leaderboard | Previous Rounds | Current Round)
- **Tablet**: Collapsible columns with tabs
- **Mobile**: Single-column stack with navigation

### User Experience
- **Progressive Disclosure**: Show complexity only when needed
- **Immediate Feedback**: Real-time validation and updates
- **Error Prevention**: Input constraints and confirmation dialogs
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation

### Visual Design
- **Clean Interface**: Minimal, tournament-focused design
- **Clear Hierarchy**: Typography scale for information importance
- **Status Indicators**: Visual cues for match completion, player status
- **Responsive Tables**: Horizontal scrolling on mobile

## Performance Considerations

### Algorithm Optimization
- Memoization for expensive pairing calculations
- Incremental updates rather than full recalculation
- Efficient data structures for conflict checking

### React Optimization
- Component memoization with React.memo
- useMemo for expensive computations
- useCallback for stable function references
- Virtualization for large player lists (if needed)

### Bundle Optimization
- Code splitting by route/feature
- Tree shaking for unused utilities
- Optimized production builds with Vite

## Development Workflow

### Project Structure
```
src/
├── components/          # React components
│   ├── tournament/      # Tournament-specific components
│   ├── ui/             # Reusable UI components
│   └── common/         # Shared components
├── algorithms/         # Pairing and scoring logic
├── stores/            # Zustand state management
├── types/             # TypeScript type definitions
├── utils/             # Helper functions and validators
├── hooks/             # Custom React hooks
└── styles/            # Global styles and Tailwind config
```

### Testing Strategy
- **Unit Tests**: Algorithm logic, utilities, and pure functions
- **Component Tests**: React Testing Library for UI components
- **Integration Tests**: Full user workflows
- **Type Safety**: Comprehensive TypeScript coverage

### Build and Deployment
- **Development**: Vite dev server with hot reload
- **Production**: Static build deployable to any web server
- **Distribution**: Single HTML file with bundled assets
- **Hosting**: Compatible with GitHub Pages, Netlify, Vercel
