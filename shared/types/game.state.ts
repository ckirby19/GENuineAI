import { GameType } from './game.types';
import { Player } from './player.types';
import { Round } from './round.types';

export interface GameState {
    gameId: string;
    hostId: string;
    gameType: GameType;
    players: Player[];
    maxPlayers: number;
    status: GameStatus;
    currentRound: number;
    rounds: Round[];
    prompts: string[];
}

export enum GameStatus {
    WAITING = 'waiting',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed'
}