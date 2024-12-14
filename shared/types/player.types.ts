// src/shared/types/player.types.ts
export interface Player {
    id: string;
    name: string;
    score: number;
    isConnected: boolean;
    connectionId?: string;
}
  