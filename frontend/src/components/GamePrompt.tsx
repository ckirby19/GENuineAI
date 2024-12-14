import React from 'react';
import { GameType } from '../../../shared/types/game.types';
import { Box, Typography } from '@mui/material';

interface GamePromptProps {
  prompt: string;
  gameType: GameType;
  round: number;
}

export const GamePrompt: React.FC<GamePromptProps> = ({ prompt, gameType, round }) => {
  return (
    <Box sx={{ textAlign: 'center', my: 4 }}>
      <Typography variant="h6" gutterBottom>
        Round {round + 1}
      </Typography>
      <Typography variant="h4">
        {gameType === GameType.SENTENCE ? (
          <span dangerouslySetInnerHTML={{ 
            __html: prompt.replace('_____', '<span style="color: #1976d2;">_____</span>') 
          }} />
        ) : (
          prompt
        )}
      </Typography>
    </Box>
  );
};