import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { GameType } from "../../../shared/types/game.types";

export class AnswerGenerator {
    private bedrock: BedrockRuntimeClient;
    
    constructor() {
        this.bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
    }

    /**
     * Generates a human-like answer to a game prompt using Amazon Bedrock
     * @param prompt The game prompt to respond to
     * @param gameType The type of game being played
     * @returns Generated answer as a string
     */
    async generateAnswer(prompt: string, gameType: GameType): Promise<string> {
        // Use Claude model for text generation
        const modelId = "anthropic.claude-v2";
        
        // Craft a prompt that encourages casual, imperfect responses
        const systemPrompt = `You are participating in a fun party game. Write a response that sounds 
            completely natural and human-like. Important: Include small imperfections like casual language, 
            occasional typos, or quirky phrasing that makes it feel authentic. The response should be 
            creative but not too polished or perfect. Think like a regular person playing a party game with friends.`;
            
        const userPrompt = `The game prompt is: "${prompt}"
            Write a single response like a typical player would. Keep it brief and conversational. 
            Don't be too clever or perfect - just be natural and fun.`;

        const payload = {
            prompt: `\n\nHuman: ${systemPrompt}\n${userPrompt}\n\nAssistant: Let me write a natural response.`,
            max_tokens: 150,
            temperature: 0.95, // High temperature for more randomness and imperfection
            top_p: 0.99,
            stop_sequences: ["\n\nHuman:"]
        };

        try {
            const command = new InvokeModelCommand({
                modelId,
                body: JSON.stringify(payload)
            });

            const response = await this.bedrock.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            
            // Clean up the response and add occasional typos or casual elements
            let answer = responseBody.completion.trim();
            answer = answer.replace(/^(Here's |Let me |I would |My response |)/i, '');
            
            // Randomly introduce casual elements (about 30% of the time)
            if (Math.random() < 0.3) {
                answer = this.addCasualElement(answer);
            }
            
            return answer;
        } catch (error) {
            console.error('Error generating answer:', error);
            throw new Error('Failed to generate answer');
        }
    }

    /**
     * Adds casual elements to make the response more human-like
     */
    private addCasualElement(text: string): string {
        const casualElements = [
            (t: string) => t.toLowerCase(), // sometimes use all lowercase
            (t: string) => t.replace(/ing/g, "in'"), // casual pronunciation
            (t: string) => t.replace(/g /g, "g! "), // add occasional excitement
            (t: string) => t.replace(/\./g, "..."), // use ellipsis instead of period
            (t: string) => t + " lol", // add casual ending
            (t: string) => t.replace(/are/g, "r"), // use common abbreviations
            (t: string) => t.replace(/to/g, "2"), // occasional number substitution
            (t: string) => t.replace(/for/g, "4"), // more number substitution
        ];

        // Apply 1-2 random casual elements
        const numChanges = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < numChanges; i++) {
            const randomElement = casualElements[Math.floor(Math.random() * casualElements.length)];
            text = randomElement(text);
        }
        
        return text;
    }
}