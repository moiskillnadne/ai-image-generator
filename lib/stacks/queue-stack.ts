import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { TaskQueue } from '../constructs/queue/task-queue';
import { QueueHandlers } from '../constructs/queue/handlers';
import { Queue } from 'aws-cdk-lib/aws-sqs';

interface QueueStackProps extends StackProps {
  userProfiles: Table;
}

export class QueueStack extends Stack {
  public readonly taskQueue: Queue;
  public readonly queueConsumerFn: Function;

  constructor(scope: Construct, id: string, props: QueueStackProps) {
    super(scope, id, props);

    const taskQueueConstruct = new TaskQueue(this, 'TaskQueueConstruct');
    this.taskQueue = taskQueueConstruct.queue;

    const consumer = new QueueHandlers(this, 'QueueConsumerHandler', {
      queue: this.taskQueue,
      userProfiles: props.userProfiles,
    });

    this.queueConsumerFn = consumer.queueConsumerFn;
  }
}