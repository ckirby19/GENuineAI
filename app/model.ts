export const GAME_STATUSES = {
    WAITING: 'WAITING', // Before host hits start, waiting for players to join
    STARTED: 'STARTED', // After host hits start
    COMPLETED: 'COMPLETED' // Once all rounds are finished
  } as const;
  
export type GameStatus = typeof GAME_STATUSES[keyof typeof GAME_STATUSES];

export const GAME_TYPE = {
  SINGLE_PLAYER: 'SINGLE_PLAYER',
  MULTI_PLAYER: 'MULTIPLAYER'
} as const;

export type GameType = typeof GAME_TYPE[keyof typeof GAME_TYPE];
  
export const ROUND_STATUSES = {
  ANSWERING: 'ANSWERING', // Waiting for everyone to answer
  VOTING: 'VOTING', // Waiting for everyone to vote for the answer they think is AI
  SCORING: 'SCORING' // Revealing who picked correctly and who had their answers chosen
} as const;
  
export type RoundStatus = typeof ROUND_STATUSES[keyof typeof ROUND_STATUSES];

export const numberOfRounds = 3;
export const numberOfStoredPrompts = 402;

export const scoreIncrementVoter = 100;
export const scoreIncrementAnswerCreator = 50;
export const scoreIncrementAI = 50;

export const singlePlayerModels = [
  "mistral.mistral-7b-instruct-v0:2",
  "amazon.titan-text-express-v1",
  "anthropic.claude-3-haiku-20240307-v1:0"
]

export const multiPlayerModels = [
  "mistral.mistral-7b-instruct-v0:2"
]
