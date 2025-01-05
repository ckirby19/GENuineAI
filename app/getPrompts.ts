import { downloadData } from 'aws-amplify/storage';
import { numberOfStoredPrompts } from './model';

export async function getPrompts(numPrompts: number) {
    try {
      const prompts = [];
      for (let i = 0; i < numPrompts; i++) {
        const randomNum = Math.floor(Math.random() * numberOfStoredPrompts);
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