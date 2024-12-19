export const LOBBY_STATUSES = {
    WAITING: 'WAITING',
    STARTED: 'STARTED',
    COMPLETED: 'COMPLETED'
  } as const;
  
  // Create a type from the values
  export type LobbyStatus = typeof LOBBY_STATUSES[keyof typeof LOBBY_STATUSES];
  
  export const ROUND_STATUSES = {
    WAITING: 'WAITING',
    STARTED: 'STARTED',
    ANSWERING: 'ANSWERING',
    COMPLETED: 'COMPLETED'
  } as const;
  
  export type RoundStatus = typeof ROUND_STATUSES[keyof typeof ROUND_STATUSES];