import { GameType } from "../../shared/types/game.types";
import { Player } from "../../shared/types/player.types";

// src/frontend/types/game.types.ts
export interface LobbyState {
    gameCode: string;
    players: Player[];
    isHost: boolean;
    gameType: GameType;
}
  