import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDB = new DynamoDB.DocumentClient();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { gameId } = event.pathParameters || {};

    if (!gameId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing gameId parameter' })
      };
    }

    const result = await dynamoDB.get({
      TableName: process.env.TABLE_NAME!,
      Key: { gameId }
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item || {})
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};