# **Spikeball Swiss Individual Tournament Generator**
## **Functional Specification v1.0**

---

## **1. Product Overview**

### **Purpose**
A web application for organizing and managing Spikeball Swiss Individual tournaments, where players change partners each round while maintaining individual rankings throughout the event.

This is intended for a small audience, so simplicity is more important than being fully-featured.

### **Target Users**
This website is only intended for use by tournament organisers to create and manage tournaments, generate rounds and input scores.

### **Key Value Proposition**
- Automated fair pairing generation using Swiss system principles
- Individual player tracking across changing partnerships
- Real-time leaderboard updates and tournament management

---

## **2. Core Features**

### **2.1 Tournament Management**

#### **2.1.1 Tournament Creation**
**Functionality**: Create new tournament with configuration options
- **Tournament Name**: Text field (max 100 characters)
- **Player Limit**: Supports between 8 and 30 players
- **Scoring System**: 
  - Win/Loss (3 points for win, 0 for loss)
  - Optional bonus point (percentage of points won that match)
- **Tournament Mode**: Swiss Individual
- **Description**: Optional text area (max 500 characters)

#### **2.1.2 Player Registration**
**Functionality**: Add players to tournament roster
- **Player Name**: Text field (max 50 characters)
- **Initial Skill Rating**: Optional 1-5 scale for first-round seeding

**Business Rules**:
- Player names must be unique within tournament
- Cannot add players after first round begins
- Cannot start tournament until a supported number of players are added

### **2.2 Leaderboard System**

#### **2.2.1 Player Statistics Tracking**
**Data Maintained Per Player**:
- **Current Score**: Total points accumulated
- **Games Played**: Number of matches completed
- **Win/Loss Record**: Detailed breakdown
- **Previous Teammates**: Ordered list of previous teammates
- **Previous Opponents**: Ordered list of previous opponents
- **Bye History**: Rounds where player sat out
- **Performance Metrics**: 
  - Points per game average
  - Win percentage
  - Strength of schedule (average opponent rating)

#### **2.2.2 Leaderboard Display**
**Ranking Criteria** (in order):
1. Total points
3. Strength of schedule

### **2.3 Round Generation**

#### **2.3.1 Pairing Algorithm**
See `pairing_algorithm.md`.

#### **2.3.2 Round Generation UI**
**Pre-Generation Review**:
- Show current standings
- Display algorithm recommendations
- Highlight any repeat partnerships
- Allow manual adjustments if needed

**Generation Results**:
- Display all matches for the round
- One-click publish to make round official

### **2.4 Score Management**

#### **2.4.1 Score Entry Interface**
**Match Results Input**:
- **Game Score**: Enter the full score for the game

**Validation Rules**:
- Scores must be numeric and within reasonable bounds
- Cannot enter partial results (all matches in round must be complete)
- Confirmation required before finalizing round

---

## **3. User Workflows**

### **3.1 Tournament Setup Flow**
```
1. Organizer creates new tournament
2. Configure tournament settings
3. Add players (manual entry or CSV import)
4. Review player list and settings
5. Generate Round 1
6. Publish round and begin tournament
```

### **3.2 Round Execution Flow**
```
1. View current round matches
2. Players compete in assigned matches
3. Organizer enters match results
4. System validates and calculates new standings
5. Generate next round (or declare tournament complete)
```

---

### **4. Screen Layout**

There is only a single screen layout, with multiple columns:
- Leaderboard
- Previous rounds - collapsible section where results from the previous rounds can be viewed
- Current round - games in the current round where scores can be entered


