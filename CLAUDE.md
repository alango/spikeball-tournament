# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- Scoring: Win/Loss (3 points for win, 0 for loss) with optional bonus points

## Data Tracking Per Player

- Current score and games played
- Win/loss record
- Previous teammates and opponents (ordered lists)
- Bye history
- Performance metrics (points per game, win percentage, strength of schedule)

## Ranking Criteria

1. Total points
2. Strength of schedule (average opponent rating)

## Development Notes

This project is in specification phase - no implementation code exists yet. When implementing:
- Focus on simplicity over comprehensive features
- Single-screen design with three main columns
- Web application targeting tournament organizers only
- The pairing algorithm is the core complexity that needs careful implementation