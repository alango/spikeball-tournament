import { useState } from 'react';
import { Button, Input, Card } from '../ui';
import useTournamentStore from '../../stores/tournamentStore';
import type { TournamentConfig } from '../../types';
import { calculateGroups } from '../../algorithms/groupCalculation';

export function TournamentSetup() {
  const { createTournament, currentTournament } = useTournamentStore();
  const [step, setStep] = useState<'tournament' | 'players'>(
    currentTournament && !currentTournament.isStarted ? 'players' : 'tournament'
  );
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {currentTournament && !currentTournament.isStarted 
            ? `Setup: ${currentTournament.name}` 
            : 'Create Tournament'
          }
        </h1>
        <p className="text-gray-600">
          {currentTournament && !currentTournament.isStarted
            ? 'Add players to your tournament'
            : 'Set up a new Spikeball Swiss Individual tournament'
          }
        </p>
      </div>

      {step === 'tournament' ? (
        <TournamentForm 
          onComplete={() => setStep('players')} 
          onCreateTournament={createTournament}
        />
      ) : (
        <PlayerRegistration />
      )}
    </div>
  );
}

interface TournamentFormProps {
  onComplete: () => void;
  onCreateTournament: (config: {
    name: string;
    description?: string;
    configuration: TournamentConfig;
  }) => void;
}

function TournamentForm({ onComplete, onCreateTournament }: TournamentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    bonusPointsEnabled: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Tournament name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Tournament name must be 100 characters or less';
    }
    
    if (formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const tournamentConfig: TournamentConfig = {
      maxPlayers: 30,
      scoringSystem: formData.bonusPointsEnabled ? 'win-loss-bonus' : 'win-loss',
      bonusPointsEnabled: formData.bonusPointsEnabled,
    };

    onCreateTournament({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      configuration: tournamentConfig,
    });

    onComplete();
  };

  return (
    <Card title="Tournament Details">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Tournament Name *"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          error={errors.name}
          placeholder="Enter tournament name"
          maxLength={100}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Optional tournament description"
            maxLength={500}
            rows={3}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formData.description.length}/500 characters
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Scoring System</h3>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="scoring"
                checked={!formData.bonusPointsEnabled}
                onChange={() => setFormData(prev => ({ ...prev, bonusPointsEnabled: false }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-900">
                <strong>Win/Loss Only</strong> - 3 points for win, 0 for loss
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="scoring"
                checked={formData.bonusPointsEnabled}
                onChange={() => setFormData(prev => ({ ...prev, bonusPointsEnabled: true }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-900">
                <strong>Win/Loss + Bonus Points</strong> - 3 points for win, 0 for loss, plus fractional bonus based on points scored
              </span>
            </label>
          </div>
          
          {formData.bonusPointsEnabled && (
            <div className="mt-2 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Bonus Points Example:</strong> If you lose 15-21, you get 15/(15+21) = 0.42 bonus points
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit">
            Next: Add Players
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PlayerRegistration() {
  const { currentTournament, addPlayer, removePlayer, resetTournament } = useTournamentStore();
  const [playerForm, setPlayerForm] = useState({
    name: '',
    initialSkillRating: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const players = currentTournament ? Object.values(currentTournament.players) : [];
  const playerCount = players.length;

  const validatePlayerForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!playerForm.name.trim()) {
      newErrors.name = 'Player name is required';
    } else if (playerForm.name.length > 50) {
      newErrors.name = 'Player name must be 50 characters or less';
    } else if (players.some(p => p.name.toLowerCase() === playerForm.name.trim().toLowerCase())) {
      newErrors.name = 'Player name must be unique';
    }

    if (playerForm.initialSkillRating && 
        (!Number.isInteger(Number(playerForm.initialSkillRating)) || 
         Number(playerForm.initialSkillRating) < 1 || 
         Number(playerForm.initialSkillRating) > 5)) {
      newErrors.initialSkillRating = 'Skill rating must be between 1 and 5';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePlayerForm()) {
      return;
    }

    if (playerCount >= 30) {
      setErrors({ name: 'Maximum 30 players allowed' });
      return;
    }

    addPlayer({
      name: playerForm.name.trim(),
      initialSkillRating: playerForm.initialSkillRating ? Number(playerForm.initialSkillRating) : undefined,
      currentScore: 0,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      previousTeammates: [],
      previousOpponents: [],
      byeHistory: [],
    });

    setPlayerForm({ name: '', initialSkillRating: '' });
    setErrors({});
  };

  const handleRemovePlayer = (playerId: string) => {
    removePlayer(playerId);
  };

  const canStartTournament = playerCount >= 8 && playerCount <= 30;

  const handleResetTournament = () => {
    if (confirm('Are you sure you want to start over? This will delete the current tournament.')) {
      resetTournament();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleResetTournament}
        >
          Start Over
        </Button>
      </div>
      
      <Card title="Add Players">
        <form onSubmit={handleAddPlayer} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Player Name *"
              value={playerForm.name}
              onChange={(e) => setPlayerForm(prev => ({ ...prev, name: e.target.value }))}
              error={errors.name}
              placeholder="Enter player name"
              maxLength={50}
            />
            
            <Input
              label="Initial Skill Rating (1-5)"
              type="number"
              min="1"
              max="5"
              value={playerForm.initialSkillRating}
              onChange={(e) => setPlayerForm(prev => ({ ...prev, initialSkillRating: e.target.value }))}
              error={errors.initialSkillRating}
              placeholder="Optional"
              helpText="Used for first-round seeding"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Players: {playerCount}/30 (minimum 8 to start)
            </span>
            <Button type="submit" disabled={playerCount >= 30}>
              Add Player
            </Button>
          </div>
        </form>
      </Card>

      {players.length > 0 && (
        <Card title="Tournament Roster">
          <div className="space-y-3">
            {players.map((player) => (
              <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-gray-900">{player.name}</span>
                  {player.initialSkillRating && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Skill: {player.initialSkillRating}
                    </span>
                  )}
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleRemovePlayer(player.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            {canStartTournament && (
              <GroupConfigurationPreview playerCount={playerCount} />
            )}
            
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-sm text-gray-600">
                  {canStartTournament 
                    ? 'Ready to start tournament!' 
                    : `Need ${8 - playerCount} more players to start (minimum 8)`
                  }
                </p>
              </div>
              <StartTournamentButton 
                disabled={!canStartTournament}
                playerCount={playerCount}
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

interface StartTournamentButtonProps {
  disabled: boolean;
  playerCount: number;
}

function StartTournamentButton({ disabled }: StartTournamentButtonProps) {
  const { startTournament } = useTournamentStore();
  
  const handleStartTournament = () => {
    if (!disabled) {
      startTournament();
    }
  };

  return (
    <Button
      onClick={handleStartTournament}
      disabled={disabled}
      size="lg"
    >
      Start Tournament
    </Button>
  );
}

interface GroupConfigurationPreviewProps {
  playerCount: number;
}

function GroupConfigurationPreview({ playerCount }: GroupConfigurationPreviewProps) {
  const groupConfig = calculateGroups(playerCount, true);
  
  return (
    <div className="bg-blue-50 rounded-lg p-4 mb-4">
      <h4 className="font-medium text-blue-900 mb-2">Tournament Configuration</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-blue-700 font-medium">Total Players:</span>
          <span className="block text-blue-900">{groupConfig.totalPlayers}</span>
        </div>
        <div>
          <span className="text-blue-700 font-medium">Active Players:</span>
          <span className="block text-blue-900">{groupConfig.activePlayersPerRound}</span>
        </div>
        <div>
          <span className="text-blue-700 font-medium">Byes per Round:</span>
          <span className="block text-blue-900">{groupConfig.byes}</span>
        </div>
        <div>
          <span className="text-blue-700 font-medium">Total Groups:</span>
          <span className="block text-blue-900">{groupConfig.totalGroups}</span>
        </div>
      </div>
      
      {(groupConfig.groupsOf8 > 0 || groupConfig.groupsOf12 > 0) && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <span className="text-blue-700 font-medium text-sm">Group Sizes:</span>
          <div className="flex space-x-4 mt-1">
            {groupConfig.groupsOf8 > 0 && (
              <span className="text-sm text-blue-900">
                {groupConfig.groupsOf8} × 8-player groups
              </span>
            )}
            {groupConfig.groupsOf12 > 0 && (
              <span className="text-sm text-blue-900">
                {groupConfig.groupsOf12} × 12-player groups
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}