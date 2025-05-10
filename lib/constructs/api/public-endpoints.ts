import { Construct } from 'constructs';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

interface PublicApiProps {
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
  userProfiles: dynamodb.Table;
}

export class PublicApiConstruct extends Construct {
  public readonly helloWorldFn: Function;
  public readonly startLoginFn: Function;
  public readonly confirmLoginFn: Function;

  constructor(scope: Construct, id: string, props: PublicApiProps) {
    super(scope, id);

    const code = Code.fromAsset('../dist/functions/public');

    this.helloWorldFn = new Function(this, 'HelloWorldFunction', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'hello-world.handler',
      code,
      functionName: 'HelloWorldLambda',
      description: 'Simple hello world Lambda',
    });

    this.startLoginFn = new Function(this, 'StartLoginFn', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'start-login.handler',
      code,
      environment: {
        USER_POOL_ID: props.userPool.userPoolId,
        CLIENT_ID: props.userPoolClient.userPoolClientId,
      },
    });

    ['AdminInitiateAuth', 'AdminCreateUser', 'AdminGetUser'].forEach(action => {
      this.startLoginFn.addToRolePolicy(new PolicyStatement({
        actions: [`cognito-idp:${action}`],
        resources: [props.userPool.userPoolArn],
      }));
    });

    this.confirmLoginFn = new Function(this, 'ConfirmLoginFn', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'confirm-login.handler',
      code,
      environment: {
        CLIENT_ID: props.userPoolClient.userPoolClientId,
        USER_POOL_ID: props.userPool.userPoolId,
        USER_TABLE_NAME: props.userProfiles.tableName,
      },
    });

    props.userProfiles.grantWriteData(this.confirmLoginFn);

    ['AdminGetUser', 'RespondToAuthChallenge'].forEach(action => {
      this.confirmLoginFn.addToRolePolicy(new PolicyStatement({
        actions: [`cognito-idp:${action}`],
        resources: [props.userPool.userPoolArn],
      }));
    });
  }
}