import { GameState, GameMessage, GameStatus, Player } from './types';
import { DynamoDB } from 'aws-sdk';
/* eslint-disable  @typescript-eslint/no-non-null-assertion */

const dynamoDB = new DynamoDB.DocumentClient();

export async function processGameState(message: GameMessage): Promise<GameState> {
  const { gameId, playerId, action } = message;
  
  switch (action) {
    case 'JOIN_GAME':
      return handleJoinGame(gameId!, playerId!);
    case 'LEAVE_GAME':
      return handleLeaveGame(gameId!, playerId!);
    case 'START_GAME':
      return handleStartGame(gameId!);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

async function handleJoinGame(gameId: string, playerId: string): Promise<GameState> {
  const player: Player = {
    id: playerId,
    name: `Player ${playerId}`,
    connectionId: '',
    score: 0
  };

  await dynamoDB.put({
    TableName: process.env.TABLE_NAME!,
    Item: {
      gameId,
      playerId,
      ...player
    }
  }).promise();

  const gameState = await getGameState(gameId);
  return gameState;
}

async function handleLeaveGame(gameId: string, playerId: string): Promise<GameState> {
  await dynamoDB.delete({
    TableName: process.env.TABLE_NAME!,
    Key: {
      gameId,
      playerId
    }
  }).promise();

  const gameState = await getGameState(gameId);
  return gameState;
}

async function handleStartGame(gameId: string): Promise<GameState> {
  const gameState = await getGameState(gameId);
  gameState.status = GameStatus.IN_PROGRESS;
  gameState.currentTurn = gameState.players[0].id;
  
  await updateGameState(gameState);
  return gameState;
}

async function getGameState(gameId: string): Promise<GameState> {
  const result = await dynamoDB.query({
    TableName: process.env.TABLE_NAME!,
    KeyConditionExpression: 'gameId = :gameId',
    ExpressionAttributeValues: {
      ':gameId': gameId
    }
  }).promise();

  return {
    gameId,
    players: result.Items as Player[] || [],
    currentTurn: '',
    status: GameStatus.WAITING,
    lastUpdated: Date.now()
  };
}

async function updateGameState(gameState: GameState): Promise<void> {
  await Promise.all(gameState.players.map(player =>
    dynamoDB.update({
      TableName: process.env.TABLE_NAME!,
      Key: {
        gameId: gameState.gameId,
        playerId: player.id
      },
      UpdateExpression: 'SET score = :score',
      ExpressionAttributeValues: {
        ':score': player.score
      }
    }).promise()
  ));
}