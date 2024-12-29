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

export const numberOfRounds = 8;

export const samplePrompts = [
  "Never bring a _____ to a pillow fight",
  "The secret ingredient in grandma's cookies is _____",
  "The worst thing to say during a job interview is _____",
  "I knew it was true love when they _____",
  "The most useless superpower would be _____",
  "If I were president, my first action would be to _____",
  "The best way to survive a zombie apocalypse is to _____",
  "The next big trend in fashion will be _____",
  "My autobiography would be titled _____",
  "The worst piece of advice I've ever received was _____",
  "If aliens visited Earth, the first thing they'd do is _____",
  "The most surprising thing you'd find in a time capsule from 2024 would be _____",
  "The real reason dinosaurs went extinct is _____",
  "The next Olympic sport should be _____",
  "If dogs could talk, the first thing they'd say is _____"
];

export const scoreIncrementVoter = 100;
export const scoreIncrementAnswerCreator = 50;
export const scoreIncrementAI = 50;
