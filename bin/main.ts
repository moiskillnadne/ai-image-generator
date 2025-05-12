import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/stacks/auth-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { QueueAndStorageStack } from '../lib/stacks/queue-stack';
import { ApiStack } from '../lib/stacks/api-stack';

const app = new cdk.App();

const authStack = new AuthStack(app, 'AuthStack');

const dbStack = new DatabaseStack(app, 'DatabaseStack');

const queueAndStorageStack = new QueueAndStorageStack(app, 'QueueAndStorageStack', {
  userProfiles: dbStack.userProfiles,
});

new ApiStack(app, 'ApiStack', {
  userPool: authStack.userPool,
  userPoolClient: authStack.userPoolClient,
  table: dbStack.tasksTable,
  queue: queueAndStorageStack.taskQueue,
  bucket: queueAndStorageStack.bucket,
  userProfiles: dbStack.userProfiles,
});