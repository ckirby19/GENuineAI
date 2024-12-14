import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as apigatewayv2_integrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as apigatewayv2_authorizers from '@aws-cdk/aws-apigatewayv2-authorizers-alpha';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class GameStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'GameUserPool', {
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
    });

    const userPoolClient = userPool.addClient('GameWebClient', {
      oAuth: {
        flows: {
          implicitCodeGrant: true,
        },
      },
    });

    // DynamoDB table for game state
    const gameTable = new dynamodb.Table(this, 'GameTable', {
      partitionKey: { name: 'gameId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'playerId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda functions for WebSocket API
    const connectHandler = new lambda.Function(this, 'ConnectHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'connect.handler',
      code: lambda.Code.fromAsset('backend/websocket'),
      environment: {
        TABLE_NAME: gameTable.tableName,
      },
    });

    const disconnectHandler = new lambda.Function(this, 'DisconnectHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'disconnect.handler',
      code: lambda.Code.fromAsset('backend/websocket'),
      environment: {
        TABLE_NAME: gameTable.tableName,
      },
    });

    const messageHandler = new lambda.Function(this, 'MessageHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'message.handler',
      code: lambda.Code.fromAsset('backend/websocket'),
      environment: {
        TABLE_NAME: gameTable.tableName,
      },
    });

    // Grant DynamoDB permissions to Lambda functions
    gameTable.grantReadWriteData(connectHandler);
    gameTable.grantReadWriteData(disconnectHandler);
    gameTable.grantReadWriteData(messageHandler);

    // WebSocket API authorizer
    const authorizer = new apigatewayv2_authorizers.WebSocketLambdaAuthorizer(
      'GameAuthorizer',
      connectHandler,
      {
        identitySource: ['route.request.header.Authorization'],
      }
    );

    // WebSocket API
    const webSocketApi = new apigatewayv2.WebSocketApi(this, 'GameWebSocketApi', {
      authorizer,
      connectRouteOptions: { integration: new apigatewayv2_integrations.WebSocketLambdaIntegration('ConnectIntegration', connectHandler) },
      disconnectRouteOptions: { integration: new apigatewayv2_integrations.WebSocketLambdaIntegration('DisconnectIntegration', disconnectHandler) },
      defaultRouteOptions: { integration: new apigatewayv2_integrations.WebSocketLambdaIntegration('MessageIntegration', messageHandler) },
    });

    const webSocketStage = new apigatewayv2.WebSocketStage(this, 'GameStage', {
      webSocketApi,
      stageName: 'prod',
      autoDeploy: true,
    });

    // Bedrock integration
    const bedrockPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['bedrock:InvokeModel'],
      resources: ['*'],
    });

    messageHandler.addToRolePolicy(bedrockPolicy);

    // Output the WebSocket URL
    new cdk.CfnOutput(this, 'WebSocketURL', {
      value: webSocketStage.url,
    });
  }
}
// import * as cdk from 'aws-cdk-lib';
// import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
// import * as lambda from 'aws-cdk-lib/aws-lambda';
// import * as apigateway from 'aws-cdk-lib/aws-apigateway';

// export class GameStack extends cdk.Stack {
//   constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
//     super(scope, id, props);

//     // DynamoDB tables
//     const gamesTable = new dynamodb.Table(this, 'GamesTable', {
//       partitionKey: { name: 'gameId', type: dynamodb.AttributeType.STRING },
//       billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
//     });

//     // WebSocket API
//     const webSocketApi = new apigateway.WebSocketApi(this, 'GameWebSocketApi', {
//       // WebSocket configuration
//     });

//     // Lambda functions
//     const createGameFunction = new lambda.Function(this, 'CreateGameFunction', {
//       // Lambda configuration
//     });
//   }
// }

