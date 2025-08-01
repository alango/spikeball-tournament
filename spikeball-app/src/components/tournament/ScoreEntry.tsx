import { useState } from 'react';
import { Button, Input } from '../ui';
import useTournamentStore from '../../stores/tournamentStore';
import type { Match } from '../../types';

interface ScoreEntryProps {
  match: Match;
  matchNumber: number;
}

export function ScoreEntry({ match, matchNumber }: ScoreEntryProps) {
  const { currentTournament, updateMatchScore } = useTournamentStore();
  const [team1Score, setTeam1Score] = useState(match.team1Score?.toString() || '');
  const [team2Score, setTeam2Score] = useState(match.team2Score?.toString() || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  if (!currentTournament) return null;

  // Get player names for teams
  const getTeamPlayers = (teamId: string) => {
    // Team ID format is "team-{player1Id}-{player2Id}" where player IDs are UUIDs
    // UUIDs contain hyphens, so we need to parse carefully
    // Format: team-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
    
    if (!teamId.startsWith('team-')) {
      return { player1: null, player2: null };
    }
    
    // Remove "team-" prefix
    const withoutPrefix = teamId.substring(5);
    
    // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 characters including hyphens)
    // So the first UUID ends at position 36, then we have another hyphen, then the second UUID
    const firstUuidEnd = 36;
    
    if (withoutPrefix.length < firstUuidEnd + 1 + 36) {
      return { player1: null, player2: null };
    }
    
    const player1Id = withoutPrefix.substring(0, firstUuidEnd);
    const player2Id = withoutPrefix.substring(firstUuidEnd + 1); // +1 to skip the separating hyphen
    
    const player1 = currentTournament.players[player1Id];
    const player2 = currentTournament.players[player2Id];
    
    return { player1, player2 };
  };

  const team1Players = getTeamPlayers(match.team1Id);
  const team2Players = getTeamPlayers(match.team2Id);

  const handleScoreChange = (team: 'team1' | 'team2', value: string) => {
    // Only allow numeric input
    if (value === '' || /^\d+$/.test(value)) {
      if (team === 'team1') {
        setTeam1Score(value);
      } else {
        setTeam2Score(value);
      }
    }
  };

  const validateScores = (): string | null => {
    const score1 = parseInt(team1Score);
    const score2 = parseInt(team2Score);

    if (isNaN(score1) || isNaN(score2)) {
      return 'Both scores must be valid numbers';
    }

    if (score1 < 0 || score2 < 0) {
      return 'Scores cannot be negative';
    }

    if (score1 > 50 || score2 > 50) {
      return 'Scores seem unreasonably high (max 50)';
    }

    if (score1 === score2) {
      return 'Spikeball matches cannot end in a tie';
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateScores();
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const score1 = parseInt(team1Score);
      const score2 = parseInt(team2Score);
      
      await updateMatchScore(match.id, score1, score2);
      setIsEditing(false); // Exit edit mode after successful update
    } catch (error) {
      console.error('Error updating match score:', error);
      alert('Failed to update match score. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    // Reset to current match scores when entering edit mode
    setTeam1Score(match.team1Score?.toString() || '');
    setTeam2Score(match.team2Score?.toString() || '');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset to current match scores when canceling
    setTeam1Score(match.team1Score?.toString() || '');
    setTeam2Score(match.team2Score?.toString() || '');
  };

  const canSubmit = team1Score !== '' && team2Score !== '' && !isSubmitting && (!match.isCompleted || isEditing);

  // Calculate points preview for bonus system
  const calculatePointsPreview = (team1Score: number, team2Score: number) => {
    if (!currentTournament.configuration.bonusPointsEnabled) {
      const team1Won = team1Score > team2Score;
      return {
        team1Points: team1Won ? 3 : 0,
        team2Points: team1Won ? 0 : 3
      };
    }
    
    const team1Won = team1Score > team2Score;
    const team1BasePoints = team1Won ? 3 : 0;
    const team2BasePoints = team1Won ? 0 : 3;
    
    const totalGameScore = team1Score + team2Score;
    if (totalGameScore > 0) {
      const team1Percentage = team1Score / totalGameScore;
      const team2Percentage = team2Score / totalGameScore;
      
      // 1 total bonus point distributed by percentage
      const team1BonusPoints = team1Percentage * 1;
      const team2BonusPoints = team2Percentage * 1;
      
      return {
        team1Points: team1BasePoints + team1BonusPoints,
        team2Points: team2BasePoints + team2BonusPoints
      };
    } else {
      return {
        team1Points: team1BasePoints,
        team2Points: team2BasePoints
      };
    }
  };

  const showPointsPreview = team1Score !== '' && team2Score !== '' && currentTournament.configuration.bonusPointsEnabled;
  let pointsPreview = null;
  
  if (showPointsPreview) {
    const score1 = parseInt(team1Score);
    const score2 = parseInt(team2Score);
    if (!isNaN(score1) && !isNaN(score2) && score1 !== score2) {
      pointsPreview = calculatePointsPreview(score1, score2);
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-700">
          Match {matchNumber}
        </div>
        <div className="text-xs text-gray-500">
          {match.isCompleted ? '✅ Complete' : '⏳ Pending'}
        </div>
      </div>
      
      {/* Team 1 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">
              {team1Players.player1?.name || 'Unknown'} & {team1Players.player2?.name || 'Unknown'}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-20">
              <Input
                type="text"
                value={team1Score}
                onChange={(e) => handleScoreChange('team1', e.target.value)}
                placeholder="0"
                className="text-center"
                disabled={match.isCompleted && !isEditing}
                maxLength={2}
              />
            </div>
            {pointsPreview && (
              <div className="text-xs text-blue-600 font-medium">
                {pointsPreview.team1Points.toFixed(1)}pts
              </div>
            )}
          </div>
        </div>
        
        <div className="text-center text-xs text-gray-400">vs</div>
        
        {/* Team 2 */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">
              {team2Players.player1?.name || 'Unknown'} & {team2Players.player2?.name || 'Unknown'}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-20">
              <Input
                type="text"
                value={team2Score}
                onChange={(e) => handleScoreChange('team2', e.target.value)}
                placeholder="0"
                className="text-center"
                disabled={match.isCompleted && !isEditing}
                maxLength={2}
              />
            </div>
            {pointsPreview && (
              <div className="text-xs text-blue-600 font-medium">
                {pointsPreview.team2Points.toFixed(1)}pts
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Submit Button - for new matches or during editing */}
      {(!match.isCompleted || isEditing) && (
        <div className="mt-4 pt-3 border-t">
          <div className="flex space-x-2">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              size="sm"
              className="flex-1"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Score' : 'Save Score'}
            </Button>
            {isEditing && (
              <Button
                onClick={handleCancelEdit}
                disabled={isSubmitting}
                size="sm"
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Edit Button for Completed Matches */}
      {match.isCompleted && !isEditing && (
        <div className="mt-3 pt-2 border-t text-center">
          <Button
            onClick={handleEdit}
            size="sm"
            variant="secondary"
          >
            Edit Score
          </Button>
        </div>
      )}
    </div>
  );
}