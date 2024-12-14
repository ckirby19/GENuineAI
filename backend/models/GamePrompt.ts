// src/backend/models/GamePrompt.ts
import { GameType } from '../../shared/types/game.types';
import { DynamoDB } from 'aws-sdk';

export interface GamePrompt {
    id: string;
    gameType: GameType;
    prompt: string;
    isSystemGenerated: boolean;
}

export class GamePromptModel {
    private readonly tableName = 'GamePrompts';
    private readonly dynamoDB: DynamoDB.DocumentClient;

    constructor() {
        this.dynamoDB = new DynamoDB.DocumentClient();
    }

    async getRandomPrompts(gameType: GameType, count: number): Promise<GamePrompt[]> {
        // Get prompts from DynamoDB using a random selection
        const params = {
            TableName: this.tableName,
            FilterExpression: 'gameType = :gameType AND isSystemGenerated = :isSystemGenerated',
            ExpressionAttributeValues: {
                ':gameType': gameType,
                ':isSystemGenerated': false
            }
        };

        const result = await this.dynamoDB.scan(params).promise();
        const items = result.Items as GamePrompt[];
        
        // Randomly select the requested number of prompts
        const shuffled = items.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    async createPrompt(prompt: GamePrompt): Promise<void> {
        const params = {
            TableName: this.tableName,
            Item: prompt
        };

        await this.dynamoDB.put(params).promise();
    }
}