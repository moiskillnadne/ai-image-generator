import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Duration } from 'aws-cdk-lib';
import { FROM_EMAIL } from '../../shared/constants';
import { SRC } from '../../utils/paths';

interface QueueHandlersProps {
  queue: Queue;
  userProfiles: Table;
}

export class QueueHandlers extends Construct {
  public readonly queueConsumerFn: NodejsFunction;

  constructor(scope: Construct, id: string, props: QueueHandlersProps) {
    super(scope, id);

    const openAISecret = Secret.fromSecretNameV2(
      this,
      'ImportedOpenAISecret',
      'prod/openai-api-key'
    );

    this.queueConsumerFn = new NodejsFunction(this, 'QueueConsumer', {
      runtime: Runtime.NODEJS_20_X,
      entry: SRC('lambda', 'queue-consumer.ts'),
      handler: 'handler',
      bundling: {
        nodeModules: ['openai'],
      },
      environment: {
        SENDER_EMAIL: FROM_EMAIL,
        OPENAI_SECRET_ARN: openAISecret.secretArn
      },
      memorySize: 1024,
      timeout: Duration.minutes(7),
    });

    openAISecret.grantRead(this.queueConsumerFn);

    this.queueConsumerFn.addEventSource(new SqsEventSource(props.queue, {
      batchSize: 5,
      maxBatchingWindow: Duration.seconds(30),
    }));

    this.queueConsumerFn.addToRolePolicy(new PolicyStatement({
      actions: ['ses:SendEmail'],
      resources: ['*'],
    }));
  }
}