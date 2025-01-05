export const GAME_STATUSES = {
    WAITING: 'WAITING', // Before host hits start, waiting for players to join
    STARTED: 'STARTED', // After host hits start
    COMPLETED: 'COMPLETED' // Once all rounds are finished
  } as const;
  
// Create a type from the values
export type GameStatus = typeof GAME_STATUSES[keyof typeof GAME_STATUSES];
  
export const ROUND_STATUSES = {
  ANSWERING: 'ANSWERING', // Waiting for everyone to answer
  VOTING: 'VOTING', // Waiting for everyone to vote for the answer they think is AI
  SCORING: 'SCORING' // Revealing who picked correctly and who had their answers chosen
} as const;
  
export type RoundStatus = typeof ROUND_STATUSES[keyof typeof ROUND_STATUSES];

export const numberOfRounds = 5;
export const numberOfStoredPrompts = 402;

export const scoreIncrementVoter = 100;
export const scoreIncrementAnswerCreator = 50;
export const scoreIncrementAI = 50;
