import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { AuthTriggersConstruct } from '../constructs/auth/auth-triggers';

export class AuthStack extends Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const authTriggers = new AuthTriggersConstruct(this, 'AuthTriggers');

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      signInAliases: { email: true },
      lambdaTriggers: {
        defineAuthChallenge: authTriggers.defineAuthChallenge,
        createAuthChallenge: authTriggers.createAuthChallenge,
        verifyAuthChallengeResponse: authTriggers.verifyAuthChallengeResponse,
        preSignUp: authTriggers.preSignUp,
      },
      autoVerify: { email: true },
      userVerification: {
        emailSubject: 'Your login code',
        emailBody: 'Your verification code is {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
    });

    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      authFlows: {
        custom: true,
      },
      generateSecret: false,
    });
  }
}