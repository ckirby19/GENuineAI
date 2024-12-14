  // src/backend/models/types/round.types.ts
export interface Round {
  roundNumber: number;
  prompt: string;
  submissions: Submission[];
  aiSubmission: Submission;
  votes: Vote[];
  revealed: boolean;
}

export interface Submission {
  playerId: string;
  content: string; // URL for drawings, text for sentences
  timestamp: number;
}
  
export interface Vote {
  playerId: string;
  votedForId: string;
}