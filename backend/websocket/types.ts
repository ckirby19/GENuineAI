export interface GameState {
  gameId: string;
  players: Player[];
  currentTurn: string;
  status: GameStatus;
  lastUpdated: number;
}

export interface Player {
  id: string;
  name: string;
  connectionId: string;
  score: number;
}

export enum GameStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED'
}

export interface GameMessage {
  action: string;
  gameId?: string;
  playerId?: string;
  data?: any;
  requiresAI?: boolean;
  prompt?: string;
}

export interface WSResponse {
  statusCode: number;
  body: string;
}