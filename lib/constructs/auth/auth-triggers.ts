import { Construct } from 'constructs';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { FROM_EMAIL } from '../../shared/constants';

interface AuthTriggers {
  defineAuthChallenge: Function;
  createAuthChallenge: Function;
  verifyAuthChallengeResponse: Function;
  preSignUp: Function;
}

export class AuthTriggersConstruct extends Construct implements AuthTriggers {
  public readonly defineAuthChallenge: Function;
  public readonly createAuthChallenge: Function;
  public readonly verifyAuthChallengeResponse: Function;
  public readonly preSignUp: Function;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const code = Code.fromAsset('../dist/auth-triggers');

    this.createAuthChallenge = new Function(this, 'CreateAuthChallengeFn', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'create-auth-challenge.handler',
      code,
      environment: { FROM_EMAIL },
    });

    this.createAuthChallenge.addToRolePolicy(new PolicyStatement({
      actions: ['ses:SendEmail'],
      resources: ['*'],
    }));

    this.defineAuthChallenge = new Function(this, 'DefineAuthChallengeFn', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'define-auth-challenge.handler',
      code,
    });

    this.verifyAuthChallengeResponse = new Function(this, 'VerifyAuthChallengeResponseFn', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'verify-auth-challenge.handler',
      code,
    });

    this.preSignUp = new Function(this, 'PreSignUpFn', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'pre-signup.handler',
      code,
    });
  }
}