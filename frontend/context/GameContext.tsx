// src/frontend/context/GameContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { GameState } from '../../shared/types/game.types';
import { GameWebSocketMessage, WebSocketResponse, WebSocketMessageType } from '../../shared/types/websocket.types';
import { useWebSocket } from './WebSocketContext';
export type { GameState };

interface GameContextType {
  gameState: GameState | null;
  isLoading: boolean;
  createGame: () => Promise<string>;
  joinGame: (gameCode: string) => Promise<void>;
  leaveGame: (gameId: string) => Promise<void>;
  submitAnswer: (gameId: string, content: string | ImageData) => Promise<void>;
  error: Error | null;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { socket, isConnected } = useWebSocket();
  
  const withRetry = <T,>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T> => {
    return new Promise((resolve, reject) => {
      const attempt = async (retryCount: number) => {
        try {
          const result = await operation();
          resolve(result);
        } catch (err) {
          if (retryCount < maxRetries) {
            console.warn(`Retry ${retryCount + 1}/${maxRetries}`);
            setTimeout(() => attempt(retryCount + 1), 1000 * Math.pow(2, retryCount));
          } else {
            reject(err);
          }
        }
      };
      attempt(0);
    });
  };

  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
      )
    ]);
  };

  // Handle socket connection status changes
  useEffect(() => {
    setError(null);
    setGameState(null);
  }, [isConnected]);

  useEffect(() => {
    if (!socket) return;

    const validateSocketConnection = () => {
      if (!socket || !isConnected || !socket.connected) {
        const error = new Error('Socket connection not established');
        setError(error);
        throw error;
      }
      return true;
    };

    const validateGameState = (state: unknown): state is GameState => {
      if (!state || typeof state !== 'object') return false;
      const gs = state as Partial<GameState>;
      return Boolean(
        gs.gameId && 
        typeof gs.gameId === 'string' &&
        gs.status &&
        gs.players &&
        Array.isArray(gs.players) &&
        typeof gs.currentRound === 'number' &&
        gs.gameType !== undefined
      );
    };

    const ensureValidConnection = (operation: () => Promise<any>) => {
      return async () => {
        validateSocketConnection();
        return operation();
      };
    };

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 1000; // 1 second
    let pingTimeout: NodeJS.Timeout;

    const resetConnection = () => {
      reconnectAttempts = 0;
      setError(null);
      startPingMonitor();
    };

    const startPingMonitor = () => {
      if (pingTimeout) clearTimeout(pingTimeout);
      
      const ping = () => {
        let pingRetries = 0;
        const maxPingRetries = 3;
        
        const attemptPing = () => {
          socket.emit('ping', undefined, (err: Error | null) => {
            if (err && pingRetries < maxPingRetries) {
              console.warn(`Ping retry ${pingRetries + 1}/${maxPingRetries}`);
              pingRetries++;
              setTimeout(attemptPing, 1000);
            } else if (err) {
              handleError(new Error('Failed to ping server'));
            }
          });
        };
        
        attemptPing();
      };

      pingTimeout = setTimeout(ping, 5000);
    };

    const handleGameUpdate = (message: GameWebSocketMessage) => {
      try {
        if (!message || typeof message !== 'object') {
          throw new Error('Invalid message format');
        }

        let retries = 0;
        const maxRetries = 3;
        const validateAndUpdateGameState = (retry = 0) => {
          try {
            if (message.type === WebSocketMessageType.GAME_UPDATE && message.data) {
              const newGameState = message.data as GameState;
              if (!newGameState.gameId || typeof newGameState.gameId !== 'string') {
                throw new Error('Invalid game state received - missing gameId');
              }
              if (!newGameState.status || !newGameState.players) {
                throw new Error('Incomplete game state received - missing status or players');
              }
              if (newGameState.gameType === undefined) {
                throw new Error('Invalid game state - missing gameType');
              }
              // Validate other required fields
              if (!Array.isArray(newGameState.players)) {
                throw new Error('Invalid game state - players must be an array');
              }
              if (typeof newGameState.currentRound !== 'number') {
                throw new Error('Invalid game state - missing or invalid currentRound');
              }
              setGameState(newGameState);
              setError(null);
            }
          } catch (err) {
            if (retry < maxRetries) {
              console.warn(`Retry ${retry + 1}/${maxRetries} for game state validation`);
              setTimeout(() => validateAndUpdateGameState(retry + 1), 1000);
            } else {
              throw err;
            }
          }
        };
        
        validateAndUpdateGameState();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error processing game update');
        console.error('Game update error:', error);
        setError(error);
      }
    };

    const handleError = (err: Error) => {
      console.error('Socket error:', err);
      setError(err);
      if (pingTimeout) clearTimeout(pingTimeout);
    };

    const handleDisconnect = (reason: string) => {
      console.log('Socket disconnected:', reason);
      if (pingTimeout) clearTimeout(pingTimeout);
      if (reason === 'io server disconnect' || reason === 'transport close') {
        // Attempt to reconnect with exponential backoff
        const attemptReconnect = () => {
          if (reconnectAttempts < maxReconnectAttempts) {
            setTimeout(() => {
              console.log(`Attempting to reconnect (${reconnectAttempts + 1}/${maxReconnectAttempts})...`);
              socket.connect();
              reconnectAttempts++;
            }, reconnectDelay * Math.pow(2, reconnectAttempts));
          } else {
            setError(new Error('Failed to reconnect after maximum attempts'));
          }
        };
        attemptReconnect();
      }
    };

    socket.on('connect', resetConnection);
    socket.on('pong', startPingMonitor);
    socket.on('gameUpdate', handleGameUpdate);
    socket.on('error', handleError);
    socket.on('disconnect', handleDisconnect);

    return () => {
      if (pingTimeout) clearTimeout(pingTimeout);
      if (socket) {
        socket.off('connect', resetConnection);
        socket.off('pong', startPingMonitor);
        socket.off('gameUpdate', handleGameUpdate);
        socket.off('error', handleError);
        socket.off('disconnect', handleDisconnect);
        if (gameState?.gameId) {
          socket.emit('leaveGame', { 
            type: WebSocketMessageType.LEAVE_GAME, 
            gameId: gameState.gameId 
          });
        }
      }
      setGameState(null);
      setError(null);
      setIsLoading(false);
    };
  }, [socket]);

  const createGame = async (): Promise<string> => {
    setIsLoading(true);
    try {
      return await withRetry(() => ensureValidConnection(async () => withTimeout(new Promise<string>((resolve, reject) => {
        if (!socket || !isConnected) {
          reject(new Error('Socket connection not established'));
          return;
        }

        socket.emit('createGame', 
          { type: WebSocketMessageType.CREATE_GAME }, 
          (response: WebSocketResponse) => {
            if (response.error) {
              const error = new Error(response.error);
              setError(error);
              reject(error);
            } else {
              if (response.data?.gameId) {
                setError(null);
                resolve(response.data.gameId);
              } else {
                const error = new Error('No game ID received from server');
                setError(error);
                reject(error);
              }
            }
          });
      }));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create game');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const joinGame = async (gameCode: string): Promise<void> => {
    setIsLoading(true);
    try {
      return await withRetry(() => ensureValidConnection(async () => withTimeout(new Promise<void>((resolve, reject) => {
        if (!socket || !isConnected) {
          reject(new Error('Socket connection not established'));
          return;
        }

        socket.emit('joinGame', 
          { type: WebSocketMessageType.JOIN_GAME, gameId: gameCode },
          (response: WebSocketResponse) => {
            if (response.error) {
              const error = new Error(response.error);
              setError(error);
              reject(error);
            } else {
              if (response.data?.gameState) {
                const newGameState = response.data.gameState;
                if (!validateGameState(newGameState)) {
                  throw new Error('Invalid game state received from server');
                }
                setGameState(newGameState);
                setError(null);
              }
              resolve();
            }
          });
      }));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to join game');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const leaveGame = async (gameId: string): Promise<void> => {
    setIsLoading(true);
    try {
      return await withRetry(() => ensureValidConnection(async () => withTimeout(new Promise<void>((resolve, reject) => {
        if (!socket || !isConnected) {
          reject(new Error('Socket connection not established'));
          return;
        }

        socket.emit('leaveGame', 
          { type: WebSocketMessageType.LEAVE_GAME, gameId },
          (response: WebSocketResponse) => {
            if (response.error) {
              setError(new Error(response.error));
              reject(new Error(response.error));
            } else {
              setGameState(null);
              setError(null);
              resolve();
            }
          });
      }));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to leave game');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async (gameId: string, content: string | ImageData): Promise<void> => {
    setIsLoading(true);
    try {
      if (!gameState) {
        throw new Error('Cannot submit answer - no active game');
      }

      const serializeImageData = (imageData: ImageData): string => {
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL();
      };

      await withRetry(() => ensureValidConnection(async () => withTimeout(new Promise<void>((resolve, reject) => {
        if (!socket || !isConnected) {
          reject(new Error('Socket connection not established'));
          return;
        }

        socket.emit('submitAnswer', 
          { 
            type: WebSocketMessageType.SUBMIT_ANSWER, 
            gameId, 
            content: content instanceof ImageData 
              ? { type: 'drawing', data: serializeImageData(content) } 
              : { type: 'text', data: content }
          }, 
          (response: WebSocketResponse) => {
            if (response.error) {
              const error = new Error(response.error);
              setError(error);
              reject(error);
            } else {
              setError(null);
              resolve();
            }
          });
      }));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to submit answer');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GameContext.Provider value={{ 
      gameState, 
      createGame, 
      joinGame, 
      leaveGame,
      submitAnswer, 
      error,
      isLoading 
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};