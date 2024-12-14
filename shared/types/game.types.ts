import { Player } from "./player.types";
import { Round } from "./round.types";

export enum GameType {
    DRAWING = 'drawing',
    SENTENCE = 'sentence'
}
  
export enum GameStatus {
    WAITING = 'waiting',
    IN_PROGRESS = 'in_progress',
    FINISHED = 'finished'
}
  
export interface GameState {
    gameId: string;
    hostId: string;
    gameType: GameType;
    players: Player[];
    maxPlayers: number;
    status: GameStatus;
    currentRound: number;
    rounds: Round[];
}