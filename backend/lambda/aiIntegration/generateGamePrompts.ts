// src/backend/lambda/aiIntegration/generateGamePrompts.ts
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { GameType } from '../../../shared/types/game.types';
import { v4 as uuidv4 } from 'uuid';
import { GamePrompt, GamePromptModel } from '../../models/GamePrompt';

export class GamePromptGenerator {
    private readonly bedrockClient: BedrockRuntimeClient;
    private readonly gamePromptModel: GamePromptModel;

    constructor() {
        this.bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });
        this.gamePromptModel = new GamePromptModel();
    }

    async generatePrompts(gameType: GameType, count: number): Promise<GamePrompt[]> {
        const prompt = gameType === GameType.SENTENCE
            ? "Generate a fill-in-the-blank sentence game prompt. Format: 'sentence with _____ for blank'"
            : "Generate a creative drawing prompt that would be fun to draw in a party game";

        const prompts: GamePrompt[] = [];

        for (let i = 0; i < count; i++) {
            const params = {
                modelId: "anthropic.claude-v2",
                contentType: "application/json",
                accept: "application/json",
                body: JSON.stringify({
                    prompt: `\n\nHuman: ${prompt}\n\nAssistant: Let me generate a creative prompt for you.`,
                    max_tokens_to_sample: 100,
                    temperature: 0.9,
                }),
            };

            const command = new InvokeModelCommand(params);
            const response = await this.bedrockClient.send(command);
            const result = JSON.parse(new TextDecoder().decode(response.body));
            
            const generatedPrompt: GamePrompt = {
                id: uuidv4(),
                gameType,
                prompt: result.completion.trim(),
                isSystemGenerated: true
            };

            prompts.push(generatedPrompt);
        }

        return prompts;
    }
}