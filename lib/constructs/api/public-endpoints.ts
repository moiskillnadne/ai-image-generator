import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { SRC } from '../../utils/paths';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Duration } from 'aws-cdk-lib';

interface PublicApiProps {
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
  userProfiles: dynamodb.Table;
}

export class PublicApiConstruct extends Construct {
  public readonly helloWorldFn: NodejsFunction;
  public readonly startLoginFn: NodejsFunction;
  public readonly confirmLoginFn: NodejsFunction;

  constructor(scope: Construct, id: string, props: PublicApiProps) {
    super(scope, id);

    this.helloWorldFn = new NodejsFunction(this, 'HelloWorldFunction', {
      runtime: Runtime.NODEJS_20_X,
      entry: SRC('functions', 'public', 'hello-world.ts'),
      handler: 'handler',
      memorySize: 128,
      timeout: Duration.seconds(2),
    });

    this.startLoginFn = new NodejsFunction(this, 'StartLoginFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: SRC('functions', 'public', 'start-login.ts'),
      handler: 'handler',
      environment: {
        USER_POOL_ID: props.userPool.userPoolId,
        CLIENT_ID: props.userPoolClient.userPoolClientId,
      },
      memorySize: 128,
      timeout: Duration.seconds(8),
    });

    ['AdminInitiateAuth', 'AdminCreateUser', 'AdminGetUser'].forEach(action => {
      this.startLoginFn.addToRolePolicy(new PolicyStatement({
        actions: [`cognito-idp:${action}`],
        resources: [props.userPool.userPoolArn],
      }));
    });

    this.confirmLoginFn = new NodejsFunction(this, 'ConfirmLoginFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: SRC('functions', 'public', 'confirm-login.ts'),
      handler: 'handler',
      environment: {
        CLIENT_ID: props.userPoolClient.userPoolClientId,
        USER_POOL_ID: props.userPool.userPoolId,
        USER_TABLE_NAME: props.userProfiles.tableName,
      },
      memorySize: 128,
      timeout: Duration.seconds(8),
    });

    props.userProfiles.grantWriteData(this.confirmLoginFn);

    ['AdminGetUser', 'AdminRespondToAuthChallenge'].forEach(action => {
      this.confirmLoginFn.addToRolePolicy(new PolicyStatement({
        actions: [`cognito-idp:${action}`],
        resources: [props.userPool.userPoolArn],
      }));
    });
  }
}