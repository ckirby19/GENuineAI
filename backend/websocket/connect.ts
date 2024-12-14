import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDB = new DynamoDB.DocumentClient();

export const handler: APIGatewayProxyHandler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  
  try {
    await dynamoDB.put({
      TableName: process.env.TABLE_NAME ?? "Table Name",
      Item: {
        connectionId,
        timestamp: Date.now(),
      },
    }).promise();

    return { statusCode: 200, body: 'Connected' };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: 'Failed to connect' };
  }
};