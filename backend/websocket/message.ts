import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const dynamoDB = new DynamoDB.DocumentClient();
const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

export const handler: APIGatewayProxyHandler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const message = JSON.parse(event.body || '{}');
  
  try {
    // Handle game logic here
    const gameState = await processGameState(message);
    
    // Use Bedrock for AI responses if needed
    if (message.requiresAI) {
      const aiResponse = await getAIResponse(message.prompt);
      // Process AI response
    }

    return { statusCode: 200, body: JSON.stringify(gameState) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: 'Error processing message' };
  }
};

async function getAIResponse(prompt: string) {
  const params = {
    modelId: 'anthropic.claude-v2',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
      max_tokens_to_sample: 300,
      temperature: 0.5,
    }),
  };

  try {
    const command = new InvokeModelCommand(params);
    const response = await bedrock.send(command);
    return JSON.parse(new TextDecoder().decode(response.body));
  } catch (error) {
    console.error('Error calling Bedrock:', error);
    throw error;
  }
}