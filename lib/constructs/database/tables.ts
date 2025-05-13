import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Table, AttributeType, BillingMode, ProjectionType } from 'aws-cdk-lib/aws-dynamodb';

export class UserProfilesTable extends Construct {
  public readonly table: Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // {
    //   pk: "user${userId}",
    //   createdAt: string,
    //   email: string
    // }

    this.table = new Table(this, 'UserProfiles', {
      tableName: 'UserProfiles',
      partitionKey: { name: 'pk', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}

export class TasksTable extends Construct {
  public readonly table: Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);


    // {
    //   taskId: string,
    //   createdAt: string,
    //   userId: string,
    //   type: string,
    //   status: string, IN_PROGRESS, COMPLETED, FAILED
    //   bucket: string,
    //   key: string,
    
    // }

    this.table = new Table(this, 'TasksTable', {
      tableName: 'Tasks',
      partitionKey: { name: 'taskId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Add the GSI on userId
    this.table.addGlobalSecondaryIndex({
      indexName: 'TaskUserIdCreatedAtIndex',
      partitionKey: { name: 'userId', type: AttributeType.STRING },
      sortKey: { name: 'createdAt', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });
  }
}