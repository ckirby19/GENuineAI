import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
    name: 'gameStorage',
    access: (allow) => ({
        'prompts/text-game-prompts/*': [
          allow.guest.to(['read'])
        ],
        'prompts/image-game-prompts/*': [
          allow.guest.to(['read'])
        ]
    })
  });