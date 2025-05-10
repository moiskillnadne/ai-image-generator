import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ImageBucket } from '../constructs/storage/image-bucket';
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { FROM_EMAIL, TO_EMAIL } from '../shared/constants';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

interface StorageStackProps extends StackProps {
  queue: sqs.Queue;
  userProfiles: dynamodb.Table;
}

export class StorageStack extends Stack {
  public readonly bucket: Bucket;
  public readonly s3ToQueueFn: lambda.Function;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const imageBucket = new ImageBucket(this, 'ImageBucket');

    this.bucket = imageBucket.bucket;

   this.s3ToQueueFn = new lambda.Function(this, 'S3ToQueueHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 's3-to-queue.handler',
      code: lambda.Code.fromAsset('../dist/lambda'),
      environment: {
        QUEUE_URL: props.queue.queueUrl,
        NOTIFY_EMAIL: TO_EMAIL,
        SENDER_EMAIL: FROM_EMAIL,
        USER_TABLE_NAME: props.userProfiles.tableName,
      },
      functionName: 'S3ToQueueHandler',
      timeout: Duration.seconds(30),
    });

    this.s3ToQueueFn.addToRolePolicy(new PolicyStatement({
      actions: ['ses:SendEmail'],
      resources: ['*'],
    }));

    props.userProfiles.grantReadData(this.s3ToQueueFn);
    props.queue.grantSendMessages(this.s3ToQueueFn);

    this.bucket.addEventNotification(
      EventType.OBJECT_CREATED_PUT,
      new s3n.LambdaDestination(this.s3ToQueueFn)
    );
  }
}