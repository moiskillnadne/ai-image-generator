import { Construct } from 'constructs';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Duration } from 'aws-cdk-lib';
import * as path from 'path';
import { FROM_EMAIL, TO_EMAIL } from '../../shared/constants';

interface QueueHandlersProps {
  queue: Queue;
  userProfiles: Table;
}

export class QueueHandlers extends Construct {
  public readonly queueConsumerFn: Function;

  constructor(scope: Construct, id: string, props: QueueHandlersProps) {
    super(scope, id);

    const lambdaCode = Code.fromAsset(path.join(__dirname, '../../../../dist/lambda'));

    this.queueConsumerFn = new Function(this, 'QueueConsumer', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'queue-consumer.handler',
      code: lambdaCode,
      timeout: Duration.minutes(5),
      memorySize: 1024,
      environment: {
        SENDER_EMAIL: FROM_EMAIL,
      },
      functionName: 'QueueConsumer',
    });

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