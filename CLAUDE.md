# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ IMPORTANT: Development Workflow

**ALWAYS follow this workflow before implementing anything:**

1. **Consult the development plan**: Check `development.md` to see current phase and requirements
2. **Review design specifications**: Read `design.md` for architecture and technology decisions  
3. **Check project specifications**: Reference `spec.md` and `pairing_algorithm.md` for business requirements
4. **Verify consistency**: Ensure your implementation aligns with existing code and doesn't conflict with the established architecture
5. **Update documentation**: After completing any development phase, mark it as complete in `development.md` with completion notes

**When completing a development phase:**
- Mark all checklist items as `[x]` completed
- Add `✅ COMPLETED` to the phase title
- Include completion notes with any important details, changes, or deviations from the original plan
- Update `CLAUDE.md` if new patterns or conventions were established

## Project Overview

This is a Spikeball Swiss Individual Tournament Generator - a web application for organizing tournaments where players change partners each round while maintaining individual rankings.

Key characteristics:
- Target audience: Tournament organizers (small audience, simplicity over features)
- Swiss tournament system with individual player tracking
- Supports 8-30 players with automated fair pairing generation
- Single-screen layout with leaderboard, previous rounds, and current round columns

## Core Algorithm

The tournament uses a sophisticated pairing algorithm (detailed in `pairing_algorithm.md`):

1. **Grouping**: Players divided into groups of 8 or 12 based on group calculation algorithm
2. **Bye Assignment**: Players with fewest byes get priority (random tiebreaker)
3. **Team Creation**: Minimize repeat partnerships, then minimize score differences
4. **Match Generation**: Minimize repeat opponents, then minimize total score differences

The grouping algorithm calculates optimal group sizes using the formula `2A + 3B = target` where A = groups of 8, B = groups of 12.

## Business Rules

- Player names must be unique within tournament
- Cannot add players after first round begins
- Cannot start tournament until supported number of players (8-30) are added
- All matches in a round must be completed before generating next round
- Scoring: Win/Loss (3 points for win, 0 for loss) with optional fractional bonus points based on percentage of points won (e.g., losing 15-21 gives 15/(15+21) = 0.42 bonus points)
- Group sizes are calculated once at tournament start and remain fixed throughout

## Data Tracking Per Player

- Current score and games played
- Win/loss record
- Previous teammates and opponents (ordered lists)
- Bye history
- Performance metrics (points per game, win percentage, strength of schedule)

## Ranking Criteria

1. Total points
2. Strength of schedule (average of opponents' current ratings)

## Technology Stack

- **Frontend**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Persistence**: localStorage (client-only, no backend)
- **Architecture**: Single-page application running entirely in browser

## Key Design Decisions

- **Client-Only**: No server required, runs entirely in browser
- **State Persistence**: localStorage with automatic save/restore on refresh
- **Single Tournament**: Creating new tournament erases previous state
- **Responsive Design**: Three-column desktop layout, collapsible mobile design
- **Component Structure**: TournamentSetup → TournamentDashboard with Leaderboard, PreviousRounds, CurrentRound

## Development Notes

- Focus on simplicity over comprehensive features
- The pairing algorithm (`src/algorithms/pairingAlgorithm.ts`) is the core complexity
- Comprehensive TypeScript types for all data models
- Memoization for expensive pairing calculations
- Component memoization with React.memo for performance

## Current Status

**Phase 1: Project Foundation & Basic Setup** ✅ COMPLETED
- Modern development environment with Node.js 20.19.3
- Tailwind CSS 4.0 with simplified setup
- Comprehensive TypeScript interfaces and Zustand store
- Working build and development processes

**Phase 2: Tournament Setup & Player Management** ✅ COMPLETED
- Complete tournament creation and player registration flow
- Group calculation algorithm from specification implemented
- Real-time validation and group configuration preview
- Start Tournament functionality with state management

**Next Phase**: Phase 3 - Core Pairing Algorithm

## Development Commands

```bash
# Ensure correct Node version
nvm use

# Start development server  
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```