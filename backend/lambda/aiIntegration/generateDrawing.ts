import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { GameType } from "../../../shared/types/game.types";

export class DrawingGenerator {
    private bedrock: BedrockRuntimeClient;
    
    constructor() {
        this.bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
    }

    /**
     * Generates a drawing prompt for Stable Diffusion that will create an image
     * that looks like it could have been drawn by a human player
     * @param prompt The game prompt to create a drawing for
     * @param gameType The type of game being played
     * @returns Base64 encoded image data
     */
    async generateDrawing(prompt: string, gameType: GameType): Promise<string> {
        // Use Stable Diffusion model for image generation
        const modelId = "stability.stable-diffusion-xl";
        
        // Add random artistic style variations to make drawings more unique and human-like
        const artisticStyles = [
            "quick sketch with wobbly lines",
            "rough doodle with marker",
            "simple pencil drawing with eraser marks",
            "casual pen drawing with some smudges",
            "messy but cute illustration",
            "childlike drawing with charm",
            "hurried sketch on paper"
        ];
        
        const randomStyle = artisticStyles[Math.floor(Math.random() * artisticStyles.length)];
        
        // Craft a prompt that will generate an image that looks hand-drawn
        const drawingPrompt = `${prompt}, in the style of ${randomStyle}, 
            imperfect proportions, slightly asymmetrical, 
            hand-drawn feeling, casual and spontaneous, 
            white background, ${this.getRandomImperfections()}`;

        const payload = {
            text_prompts: [
                { text: drawingPrompt, weight: 1.0 },
                { text: "perfect, symmetrical, digital art style, professional, polished", weight: -0.5 }
            ],
            cfg_scale: Math.random() * 3 + 6, // Random between 6-9 for variability
            steps: Math.floor(Math.random() * 20) + 40, // Random between 40-60
            seed: Math.floor(Math.random() * 1000000),
            style_preset: "sketch",
            sampler: "DPM++ 2M Karras"
        };

        try {
            const command = new InvokeModelCommand({
                modelId,
                body: JSON.stringify(payload)
            });

            const response = await this.bedrock.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            
            return responseBody.artifacts[0].base64;
        } catch (error) {
            console.error('Error generating drawing:', error);
            throw new Error('Failed to generate drawing');
        }
    }

    /**
     * Adds random imperfections to make the drawing more human-like
     */
    private getRandomImperfections(): string {
        const imperfections = [
            "slightly smudged edges",
            "eraser marks visible",
            "paper texture showing through",
            "uneven line weight",
            "some lines extending past edges",
            "minor coffee stain on corner",
            "slightly crumpled paper texture",
            "faint grid lines visible",
            "pencil marks showing through"
        ];

        // Pick 2-3 random imperfections
        const numImperfections = Math.floor(Math.random() * 2) + 2;
        const selectedImperfections = new Set<string>();
        
        while (selectedImperfections.size < numImperfections) {
            const randomIndex = Math.floor(Math.random() * imperfections.length);
            selectedImperfections.add(imperfections[randomIndex]);
        }

        return Array.from(selectedImperfections).join(", ");
    }
}