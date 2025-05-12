import { Construct } from 'constructs';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Duration } from 'aws-cdk-lib';

export class TaskQueue extends Construct {
  public readonly queue: Queue;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.queue = new Queue(this, 'TaskQueue', {
      visibilityTimeout: Duration.seconds(300),
      retentionPeriod: Duration.days(4),
      queueName: 'image-generation-queue-v2',
    });
  }
}