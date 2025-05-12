import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface StorageSettingsStackProps extends StackProps {
  bucket: Bucket;
  s3ToQueueFn: NodejsFunction;
}

export class StorageSettingsStack extends Stack {
  constructor(scope: Construct, id: string, props: StorageSettingsStackProps) {
    super(scope, id, props);

    props.bucket.addEventNotification(
      EventType.OBJECT_CREATED_PUT,
      new LambdaDestination(props.s3ToQueueFn)
    );
  }
}