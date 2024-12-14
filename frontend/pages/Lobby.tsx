import React, { useEffect, useState } from 'react';
// import { get } from '@aws-amplify/api';
// import io from 'socket.io-client';
import { useWebSocket } from '../context/WebSocketContext';
import { useNavigate } from 'react-router-dom';

export const Lobby = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<string[]>([]);
  const socket = useWebSocket();

  useEffect(() => {
    if (socket) {
      socket.socket?.on('playerJoined', (player: string) => {
        setPlayers(current => [...current, player]);
      });

      socket.socket?.on('playerLeft', (player: string) => {
        setPlayers(current => current.filter(p => p !== player));
      });

      return () => {
        socket.socket?.off('playerJoined');
        socket.socket?.off('playerLeft');
      };
    }
  }, [socket]);

  const startGame = () => {
    if (socket.socket) {
      socket.socket.emit('startGame');
      navigate('/game');
    }
  };

  return (
    <div className="lobby-container">
      <h1>Game Lobby</h1>
      <div className="players-list">
        <h2>Current Players</h2>
        <ul>
          {players.map((player, index) => (
            <li key={index}>{player}</li>
          ))}
        </ul>
      </div>
      <button 
        onClick={startGame}
        disabled={players.length < 2}
      >
        Start Game
      </button>
    </div>
  );
};