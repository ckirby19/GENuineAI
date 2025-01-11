import { downloadData } from 'aws-amplify/storage';
import { numberOfStoredDrawingPrompts, numberOfStoredTextPrompts } from './model';

export async function getTextPrompts(numPrompts: number) {
    try {
      const prompts = [];
      for (let i = 0; i < numPrompts; i++) {
        const randomNum = Math.floor(Math.random() * numberOfStoredTextPrompts);
        const paddedNum = String(randomNum).padStart(4, '0');
        const prompt = await downloadData({
          path: `prompts/text-game-prompts/${paddedNum}.txt`,
          options: {
            bucket: "gameStorage"
          }
        }).result;

        const text = await prompt.body.text();
        prompts.push(text);
      }
      return prompts;

      } catch (error) {
        console.log('Error : ', error);
      }
}

export async function getDrawingPrompts(numPrompts: number) {
  try {
    const prompts = [];
    for (let i = 0; i < numPrompts; i++) {
      const randomNum = Math.floor(Math.random() * numberOfStoredDrawingPrompts);
      const paddedNum = String(randomNum).padStart(4, '0');
      const prompt = await downloadData({
        path: `prompts/drawing-game-prompts/${paddedNum}.txt`,
        options: {
          bucket: "gameStorage"
        }
      }).result;

      const text = await prompt.body.text();
      prompts.push(text);
    }
    return prompts;

    } catch (error) {
      console.log('Error : ', error);
    }
}