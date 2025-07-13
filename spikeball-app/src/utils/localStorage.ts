import type { Tournament } from '../types';

const STORAGE_KEY = 'spikeball-tournament-state';

export interface StorageState {
  currentTournament: Tournament | null;
}

export const saveToLocalStorage = (state: StorageState): void => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
};

export const loadFromLocalStorage = (): StorageState | null => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return null;
    }
    const parsed = JSON.parse(serializedState);
    
    // Validate the loaded state structure
    if (isValidStorageState(parsed)) {
      return parsed;
    } else {
      console.warn('Invalid state structure in localStorage, returning null');
      return null;
    }
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
    return null;
  }
};

export const clearLocalStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
};

export const isValidStorageState = (state: unknown): state is StorageState => {
  if (!state || typeof state !== 'object') {
    return false;
  }

  const stateObj = state as Record<string, unknown>;
  
  // Check if currentTournament is either null or a valid tournament object
  if (stateObj.currentTournament !== null && !isValidTournament(stateObj.currentTournament)) {
    return false;
  }

  return true;
};

const isValidTournament = (tournament: unknown): tournament is Tournament => {
  if (!tournament || typeof tournament !== 'object') {
    return false;
  }

  const t = tournament as Record<string, unknown>;
  
  return (
    typeof t.id === 'string' &&
    typeof t.name === 'string' &&
    typeof t.players === 'object' &&
    Array.isArray(t.rounds) &&
    typeof t.currentRound === 'number' &&
    typeof t.isStarted === 'boolean' &&
    typeof t.isCompleted === 'boolean' &&
    typeof t.configuration === 'object' &&
    typeof t.groupConfiguration === 'object'
  );
};

export const exportTournamentData = (tournament: Tournament): string => {
  return JSON.stringify(tournament, null, 2);
};

export const importTournamentData = (jsonString: string): Tournament | null => {
  try {
    const parsed = JSON.parse(jsonString);
    if (isValidTournament(parsed)) {
      return parsed;
    } else {
      throw new Error('Invalid tournament data structure');
    }
  } catch (error) {
    console.error('Failed to import tournament data:', error);
    return null;
  }
};