import { renderHook, act } from '@testing-library/react';
import { GameProvider, useGameContext } from './GameContext';
import { Socket } from 'socket.io-client';
import { WebSocketMessageType } from '../../shared/types/websocket.types';

// Mock socket.io-client
jest.mock('socket.io-client');

describe('GameContext', () => {
  let mockSocket: jest.Mocked<Socket>;

  beforeEach(() => {
    mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    } as any;
  });

  it('should handle game updates correctly', async () => {
    const { result } = renderHook(() => useGameContext(), {
      wrapper: GameProvider
    });

    const mockGameState = {
      gameId: '123',
      players: [],
      status: 'waiting',
      currentRound: 0
    };

    await act(async () => {
      mockSocket.emit('gameUpdate', {
        type: WebSocketMessageType.GAME_UPDATE,
        data: mockGameState
      });
    });

    expect(result.current.gameState).toEqual(mockGameState);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors correctly', async () => {
    const { result } = renderHook(() => useGameContext(), {
      wrapper: GameProvider
    });

    const errorMessage = 'Test error';

    await act(async () => {
      mockSocket.emit('error', new Error(errorMessage));
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe(errorMessage);
  });
});