// src/backend/models/GameNew.ts
import { DynamoDB } from 'aws-sdk';
import { v4 as uuid } from 'uuid';
import { GameState, GameStatus } from '../../shared/types/game.state';
import { GameType } from '../../shared/types/game.types';
import { Tables } from './types/table';

export class Game {
  private readonly tableName = Tables.GAMES;
  private readonly dynamodb: DynamoDB.DocumentClient;

  constructor() {
    this.dynamodb = new DynamoDB.DocumentClient();
  }

  async createGame(hostId: string, gameType: GameType, prompts: string[]): Promise<GameState> {
    const gameId = uuid();
    const game: GameState = {
      gameId,
      hostId,
      gameType,
      players: [],
      maxPlayers: 8,
      status: GameStatus.WAITING,
      currentRound: 0,
      rounds: [],
      prompts
    };

    await this.dynamodb.put({
      TableName: this.tableName,
      Item: game
    }).promise();

    return game;
  }

  // ... rest of the Game class methods remain unchanged
}