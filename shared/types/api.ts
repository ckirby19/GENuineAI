/* eslint-disable  @typescript-eslint/no-explicit-any */

export interface GameApiResponse<T = any> {
  statusCode: number;
  body: T;
  error?: string;
}

export interface WebSocketMessage {
  action: WebSocketAction;
  payload: any;
}

export enum WebSocketAction {
  JOIN_GAME = 'joinGame',
  LEAVE_GAME = 'leaveGame',
  START_GAME = 'startGame',
  MAKE_MOVE = 'makeMove',
  END_GAME = 'endGame'
}

export interface GameState {
  gameId: string;
  status: GameStatus;
  players: Player[];
  currentTurn: string;
  lastUpdate: number;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  isConnected: boolean;
}

export enum GameStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED'
}

export interface GameMove {
  gameId: string;
  playerId: string;
  moveType: string;
  moveData: any;
  timestamp: number;
}