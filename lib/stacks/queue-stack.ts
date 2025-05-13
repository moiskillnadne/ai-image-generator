import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { TaskQueue } from '../constructs/queue/task-queue';
import { QueueHandlers } from '../constructs/queue/handlers';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { SRC } from '../utils/paths';
import { FROM_EMAIL, TO_EMAIL } from '../shared/constants';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { ImageBucket } from '../constructs/storage/image-bucket';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';

interface QueueAndStorageStackProps extends StackProps {
  userProfiles: Table;
  tasksTable: Table;
}

export class QueueAndStorageStack extends Stack {
  public readonly taskQueue: Queue;

  public readonly bucket: Bucket;

  public readonly queueConsumerFn: NodejsFunction;
  public readonly s3ToQueueFn: NodejsFunction;

  constructor(scope: Construct, id: string, props: QueueAndStorageStackProps) {
    super(scope, id, props);

    const taskQueueConstruct = new TaskQueue(this, 'TaskQueueConstruct');
    this.taskQueue = taskQueueConstruct.queue;

    const bucketConstruct = new ImageBucket(this, 'ImageBucket')
    this.bucket = bucketConstruct.bucket;

    const consumer = new QueueHandlers(this, 'QueueConsumerHandler', {
      queue: this.taskQueue,
      userProfiles: props.userProfiles,
    });

    this.queueConsumerFn = consumer.queueConsumerFn;

    this.s3ToQueueFn = new NodejsFunction(this, 'S3ToQueueHandler', {
      runtime: Runtime.NODEJS_20_X,
      entry: SRC('lambda', 's3-to-queue.ts'),
      handler: 'handler',
      memorySize: 128,
      environment: {
        QUEUE_URL: this.taskQueue.queueUrl,
        NOTIFY_EMAIL: TO_EMAIL,
        SENDER_EMAIL: FROM_EMAIL,
        USER_TABLE_NAME: props.userProfiles.tableName,
        TASK_TABLE_NAME: props.tasksTable.tableName,
      },
      timeout: Duration.seconds(30),
    });

    this.bucket.grantRead(this.s3ToQueueFn);

    this.bucket.grantRead(this.queueConsumerFn)
    this.bucket.grantWrite(this.queueConsumerFn)

    this.s3ToQueueFn.addToRolePolicy(new PolicyStatement({
      actions: ['ses:SendEmail'],
      resources: ['*'],
    }));

    this.taskQueue.grantSendMessages(this.s3ToQueueFn);
    
    props.tasksTable.grantWriteData(this.s3ToQueueFn);
    props.userProfiles.grantReadData(this.s3ToQueueFn);

    this.bucket.addEventNotification(
      EventType.OBJECT_CREATED_PUT,
      new LambdaDestination(this.s3ToQueueFn)
    );
  }
}