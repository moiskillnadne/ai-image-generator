import { Construct } from 'constructs';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

interface PrivateApiProps {
  bucket: s3.Bucket;
  userProfiles: dynamodb.Table;
}

export class PrivateApiConstruct extends Construct {
  public readonly generateUploadLinkFn: Function;

  constructor(scope: Construct, id: string, props: PrivateApiProps) {
    super(scope, id);

    this.generateUploadLinkFn = new Function(this, 'GenerateUploadLinkFn', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'generate-upload-link.handler',
      code: Code.fromAsset('../dist/functions/private'),
      environment: {
        BUCKET_NAME: props.bucket.bucketName,
        USER_TABLE_NAME: props.userProfiles.tableName,
      },
    });

    props.bucket.grantPut(this.generateUploadLinkFn);
    props.userProfiles.grantWriteData(this.generateUploadLinkFn);
  }
}