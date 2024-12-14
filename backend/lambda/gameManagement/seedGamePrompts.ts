import { GamePromptModel, GamePrompt } from '../../models/GamePrompt';
import { GameType } from '../../../shared/types/game.types';
import { v4 as uuidv4 } from 'uuid';

const drawingPrompts = [
    "A penguin having a beach party",
    "Superhero having a bad hair day",
    "Pizza delivering alien",
    "Dancing vegetables",
    "Robot learning to ride a bicycle",
    "Time-traveling dinosaur"
];

const sentencePrompts = [
    "If life gives you lemons, make _____",
    "Never bring a _____ to a pillow fight",
    "The early bird catches the _____",
    "A watched _____ never boils",
    "Don't count your _____ before they hatch",
    "Actions speak louder than _____"
];

export const handler = async (): Promise<void> => {
    const promptModel = new GamePromptModel();

    // Seed drawing prompts
    for (const prompt of drawingPrompts) {
        const gamePrompt: GamePrompt = {
            id: uuidv4(),
            gameType: GameType.DRAWING,
            prompt,
            isSystemGenerated: false
        };
        await promptModel.createPrompt(gamePrompt);
    }

    // Seed sentence prompts
    for (const prompt of sentencePrompts) {
        const gamePrompt: GamePrompt = {
            id: uuidv4(),
            gameType: GameType.SENTENCE,
            prompt,
            isSystemGenerated: false
        };
        await promptModel.createPrompt(gamePrompt);
    }
};