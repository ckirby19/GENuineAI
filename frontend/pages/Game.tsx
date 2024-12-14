// src/frontend/pages/Game.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { AnswerInput } from '../components/AnswerInput';
import { GameType } from '../../shared/types/game.types';
import { useGameContext } from '../context/GameContext';
  
  export const Game = () => {
    const { gameId } = useParams();
    const { gameState, submitAnswer } = useGameContext();
    const [prompt, setPrompt] = useState('');
  
    useEffect(() => {
      // Subscribe to game updates
      // Handle round changes
    }, [gameId]);
  
    const handleSubmission = (content: string) => {
      submitAnswer(gameId!, content);
    };
  
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2>{prompt}</h2>
        </div>
        
        {gameState?.gameType === GameType.DRAWING ? (
          <DrawingCanvas onSubmit={handleSubmission} />
        ) : (
          <AnswerInput onSubmit={handleSubmission} />
        )}
      </div>
    );
  };