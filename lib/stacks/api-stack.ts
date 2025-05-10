import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { PublicApiConstruct } from '../constructs/api/public-endpoints';
import { PrivateApiConstruct } from '../constructs/api/private-endpoints';

interface ApiStackProps extends StackProps {
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
  table: dynamodb.Table;
  queue: sqs.Queue;
  bucket: s3.Bucket;
  userProfiles: dynamodb.Table;
}

export class ApiStack extends Stack {
  public readonly authorizer: apigateway.CognitoUserPoolsAuthorizer;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const publicApi = new PublicApiConstruct(this, 'PublicApi', {
      userPool: props.userPool,
      userPoolClient: props.userPoolClient,
      userProfiles: props.userProfiles,
    });

    const privateApi = new PrivateApiConstruct(this, 'PrivateApi', {
      bucket: props.bucket,
      userProfiles: props.userProfiles,
    });

    this.authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'UserPoolAuthorizer', {
      cognitoUserPools: [props.userPool],
    });

    const api = new apigateway.RestApi(this, 'ImageApi', {
      restApiName: 'Image Generation Service',
      deployOptions: { stageName: 'v1' },
    });

    api.root.addResource('hello')
      .addMethod('GET', new apigateway.LambdaIntegration(publicApi.helloWorldFn));

    api.root.addResource('start-login')
      .addMethod('POST', new apigateway.LambdaIntegration(publicApi.startLoginFn));

    api.root.addResource('confirm-login')
      .addMethod('POST', new apigateway.LambdaIntegration(publicApi.confirmLoginFn));

    api.root.addResource('generate-upload-link')
      .addMethod('POST', new apigateway.LambdaIntegration(privateApi.generateUploadLinkFn), {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });

    new CfnOutput(this, 'HelloWorldUrl', {
      value: `${api.url}hello`,
      exportName: `${this.stackName}-HelloWorldUrl`,
    });

    new CfnOutput(this, 'StartLoginUrl', {
      value: `${api.url}start-login`,
      exportName: `${this.stackName}-StartLoginUrl`,
    });

    new CfnOutput(this, 'ConfirmLoginUrl', {
      value: `${api.url}confirm-login`,
      exportName: `${this.stackName}-ConfirmLoginUrl`,
    });

    new CfnOutput(this, 'GenerateUploadLinkEndpoint', {
      value: `${api.url}generate-upload-link`,
      exportName: `${this.stackName}-GenerateUploadLinkEndpoint`,
    });
  }
}