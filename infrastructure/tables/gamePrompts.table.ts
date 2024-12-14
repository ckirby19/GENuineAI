import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { Tables } from '../../backend/models/types/table';

export class GamePromptsTable extends Construct {
    public readonly table: dynamodb.Table;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.table = new dynamodb.Table(this, 'GamePrompts', {
            tableName: Tables.GAME_PROMPTS,
            partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        // GSI for gameType to efficiently query prompts by type
        this.table.addGlobalSecondaryIndex({
            indexName: 'GameTypeIndex',
            partitionKey: { name: 'gameType', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'isSystemGenerated', type: dynamodb.AttributeType.BOOLEAN },
            projectionType: dynamodb.ProjectionType.ALL,
        });
    }
}