import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
    name: 'gameStorage',
    access: (allow) => ({
        'prompts/*': [
          allow.guest.to(['read'])
        ]
    })
  });