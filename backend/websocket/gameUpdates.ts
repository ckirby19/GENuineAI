  // src/backend/websocket/gameUpdates.ts
  import { ApiGatewayManagementApi, DynamoDB } from 'aws-sdk';
  import { WebSocketMessage, WebSocketMessageType } from '../../shared/types/messages';
  /* eslint-disable  @typescript-eslint/no-non-null-assertion */

  export class GameWebSocket {
    private readonly api: ApiGatewayManagementApi;
    private readonly dynamodb: DynamoDB.DocumentClient;
    private readonly connectionsTable: string;
  
    constructor(endpoint: string) {
      this.api = new ApiGatewayManagementApi({ endpoint });
      this.dynamodb = new DynamoDB.DocumentClient();
      this.connectionsTable = process.env.CONNECTIONS_TABLE!;
    }
  
    async broadcastToGame(gameId: string, message: GameUpdate): Promise<void> {
        const connections = await this.dynamodb.query({
          TableName: this.connectionsTable,
          IndexName: 'game_id-index',
          KeyConditionExpression: 'gameId = :gameId',
          ExpressionAttributeValues: {
            ':gameId': gameId
          }
        }).promise();
    }
  
    async sendToPlayer(connectionId: string, message: WebSocketMessage): Promise<void> {
      // Implementation for sending to specific player
    }
    async broadcastToGame(gameId: string, message: GameUpdate): Promise<void> {
        const connections = await this.dynamodb.query({
          TableName: this.connectionsTable,
          IndexName: 'game_id-index',
          KeyConditionExpression: 'gameId = :gameId',
          ExpressionAttributeValues: {
            ':gameId': gameId
          }
        }).promise();
    
        const postToConnection = async (connectionId: string) => {
          try {
            await this.api.postToConnection({
              ConnectionId: connectionId,
              Data: JSON.stringify(message)
            }).promise();
          } catch (err) {
            if (err.statusCode === 410) {
              // Remove stale connections
              await this.dynamodb.delete({
                TableName: this.connectionsTable,
                Key: { connectionId }
              }).promise();
            }
          }
        };
    
        await Promise.all(
          connections.Items!.map(connection => 
            postToConnection(connection.connectionId)
          )
        );
      }
  }