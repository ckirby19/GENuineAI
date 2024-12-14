// src/frontend/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Lobby } from './pages/Lobby';
import { Game } from './pages/Game';
import { GameProvider } from './context/GameContext';
import { WebSocketProvider } from './context/WebSocketContext';

export const App = () => {
  return (
    <BrowserRouter>
      <WebSocketProvider>
        <GameProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lobby/:gameId" element={<Lobby />} />
            <Route path="/game/:gameId" element={<Game />} />
          </Routes>
        </GameProvider>
      </WebSocketProvider>
    </BrowserRouter>
  );
};
