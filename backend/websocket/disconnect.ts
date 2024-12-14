import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDB = new DynamoDB.DocumentClient();

export const handler: APIGatewayProxyHandler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  
  try {
    await dynamoDB.delete({
      TableName: process.env.TABLE_NAME ?? "Table Name",
      Key: { connectionId },
    }).promise();

    return { statusCode: 200, body: 'Disconnected' };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: 'Failed to disconnect' };
  }
};