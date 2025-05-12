import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { SRC } from '../../utils/paths';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Duration } from 'aws-cdk-lib';

interface PrivateApiProps {
  bucket: s3.Bucket;
  userProfiles: dynamodb.Table;
}

export class PrivateApiConstruct extends Construct {
  public readonly generateUploadLinkFn: NodejsFunction;

  constructor(scope: Construct, id: string, props: PrivateApiProps) {
    super(scope, id);

    this.generateUploadLinkFn = new NodejsFunction(this, 'GenerateUploadLinkFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: SRC('functions', 'private', 'generate-upload-link.ts'),
      handler: 'handler',
      environment: {
        BUCKET_NAME: props.bucket.bucketName,
        USER_TABLE_NAME: props.userProfiles.tableName,
      },
      memorySize: 128,
      timeout: Duration.seconds(5),
    });

    props.bucket.grantPut(this.generateUploadLinkFn);
    props.userProfiles.grantWriteData(this.generateUploadLinkFn);
  }
}