// src/backend/models/Game.ts
import { DynamoDB } from 'aws-sdk';
import { GameState, GameType, GameStatus } from '../../shared/types/game.types';
import { v4 as uuid } from 'uuid';
import { Submission } from '../../shared/types/round.types';

export class Game {
  private readonly dynamodb: DynamoDB.DocumentClient;
  private readonly tableName: string;

  constructor() {
    this.dynamodb = new DynamoDB.DocumentClient();
    this.tableName = process.env.GAMES_TABLE ?? "TableName";
  }

  async createGame(hostId: string, gameType: GameType): Promise<GameState> {
    const gameId = uuid();
    const game: GameState = {
      gameId,
      hostId,
      gameType,
      players: [],
      maxPlayers: 8,
      status: GameStatus.WAITING,
      currentRound: 0,
      rounds: []
    };

    await this.dynamodb.put({
      TableName: this.tableName,
      Item: game
    }).promise();

    return game;
  }

  async startRound(gameId: string): Promise<void> {
    await this.dynamodb.update({
      TableName: this.tableName,
      Key: { gameId },
      UpdateExpression: "SET #status = :status, currentRound = currentRound + :inc",
      ExpressionAttributeNames: {
        "#status": "status"
      },
      ExpressionAttributeValues: {
        ":status": GameStatus.IN_PROGRESS,
        ":inc": 1
      }
    }).promise();
  }

  async submitAnswer(gameId: string, submission: Submission): Promise<void> {
    await this.dynamodb.update({
      TableName: this.tableName,
      Key: { gameId },
      UpdateExpression: "SET rounds[0].submissions = list_append(rounds[0].submissions, :submission)",
      ExpressionAttributeValues: {
        ":submission": [submission]
      }
    }).promise();
  }
}