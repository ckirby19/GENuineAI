import { GameState } from "./game.types";
/* eslint-disable  @typescript-eslint/no-explicit-any */
export interface WebSocketEvent {
  type: 'connect' | 'disconnect' | 'message';
  payload?: any;
}

export interface GameWebSocketMessage {
  type: 'game_action';
  action: 'join' | 'leave' | 'start' | 'move';
  gameId: string;
  playerId: string;
  data?: any;
}

export interface WebSocketResponse {
  event: string;
  data: GameState;
  error?: string;
}

// src/shared/types/messages.ts
export enum WebSocketMessageType {
  JOIN_GAME = 'joinGame',
  SUBMIT_ANSWER = 'submitAnswer',
  SUBMIT_VOTE = 'submitVote',
  GAME_UPDATE = 'gameUpdate',
  ROUND_START = 'roundStart',
  ROUND_END = 'roundEnd',
  CREATE_GAME = 'createGame',
  GAME_OVER = 'gameOver',
  ERROR = 'error',
  LEAVE_GAME = 'leaveGame'
}

export interface WebSocketMessage<T = any> {
  type: WebSocketMessageType;
  payload: T;
}