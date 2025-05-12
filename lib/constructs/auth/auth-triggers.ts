import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { FROM_EMAIL } from '../../shared/constants';
import { SRC } from '../../utils/paths';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Duration } from 'aws-cdk-lib';

interface AuthTriggers {
  defineAuthChallenge: NodejsFunction;
  createAuthChallenge: NodejsFunction;
  verifyAuthChallengeResponse: NodejsFunction;
  preSignUp: NodejsFunction;
}

export class AuthTriggersConstruct extends Construct implements AuthTriggers {
  public readonly defineAuthChallenge: NodejsFunction;
  public readonly createAuthChallenge: NodejsFunction;
  public readonly verifyAuthChallengeResponse: NodejsFunction;
  public readonly preSignUp: NodejsFunction;

  constructor(scope: Construct, id: string) {
    super(scope, id);


    this.createAuthChallenge = new NodejsFunction(this, 'CreateAuthChallengeFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: SRC('auth-triggers', 'create-auth-challenge.ts'),
      handler: 'handler',
      memorySize: 128,
      timeout: Duration.seconds(5),
      environment: { FROM_EMAIL },
    });

    this.createAuthChallenge.addToRolePolicy(new PolicyStatement({
      actions: ['ses:SendEmail'],
      resources: ['*'],
    }));

    this.defineAuthChallenge = new NodejsFunction(this, 'DefineAuthChallengeFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: SRC('auth-triggers', 'define-auth-challenge.ts'),
      handler: 'handler',
      memorySize: 128,
      timeout: Duration.seconds(5),
    });

    this.verifyAuthChallengeResponse = new NodejsFunction(this, 'VerifyAuthChallengeResponseFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: SRC('auth-triggers', 'verify-auth-challenge.ts'),
      handler: 'handler',
      memorySize: 128,
      timeout: Duration.seconds(5),
    });

    this.preSignUp = new NodejsFunction(this, 'PreSignUpFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: SRC('auth-triggers', 'pre-signup.ts'),
      handler: 'handler',
      memorySize: 128,
      timeout: Duration.seconds(5),
    });
  }
}