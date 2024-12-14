// src/backend/lambda/gameManagement/createGameNew.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { Game } from '../../models/Game';
import { GameType } from '../../../shared/types/game.types';
import { GamePromptModel } from '../../models/GamePrompt';
import { GamePromptGenerator } from '../aiIntegration/generateGamePrompts';

const game = new Game();
const promptModel = new GamePromptModel();
const promptGenerator = new GamePromptGenerator();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { hostId, gameType } = JSON.parse(event.body || '{}');

    if (!hostId || !gameType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields' })
      };
    }

    // Get 3 prompts from the database
    const dbPrompts = await promptModel.getRandomPrompts(gameType as GameType, 3);
    
    // Generate 3 prompts using AI
    const aiPrompts = await promptGenerator.generatePrompts(gameType as GameType, 3);
    
    // Combine and shuffle all prompts
    const allPrompts = [...dbPrompts, ...aiPrompts]
      .sort(() => Math.random() - 0.5)
      .map(p => p.prompt);

    const newGame = await game.createGame(hostId, gameType as GameType, allPrompts);

    return {
      statusCode: 200,
      body: JSON.stringify(newGame)
    };
  } catch (error) {
    console.error('Error creating game:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to create game' })
    };
  }
};