import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fetchAuthSession } from '@aws-amplify/auth';
import { DynamoDB } from 'aws-sdk';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const dynamoDB = new DynamoDB.DocumentClient();

// WebSocket authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      throw new Error('Authentication token missing');
    }

    // Verify the token with Cognito
    await fetchAuthSession();
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('joinGame', async (gameId, playerId) => {
    try {
      await dynamoDB.put({
        TableName: process.env.TABLE_NAME ?? "Table Name",
        Item: {
          gameId,
          playerId,
          connectionId: socket.id,
          timestamp: Date.now()
        }
      }).promise();

      socket.join(gameId);
      io.to(gameId).emit('playerJoined', playerId);
    } catch (error) {
      console.error('Error joining game:', error);
    }
  });

  socket.on('startGame', async (gameId) => {
    try {
      const game = await dynamoDB.get({
        TableName: process.env.TABLE_NAME ?? "Table Name",
        Key: { gameId }
      }).promise();

      if (game.Item) {
        io.to(gameId).emit('gameStarted', game.Item);
      }
    } catch (error) {
      console.error('Error starting game:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});