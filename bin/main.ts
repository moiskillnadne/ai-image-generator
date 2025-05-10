import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/stacks/auth-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { QueueStack } from '../lib/stacks/queue-stack';
import { ApiStack } from '../lib/stacks/api-stack';
import { StorageStack } from '../lib/stacks/storage-stack';

const app = new cdk.App();

const authStack = new AuthStack(app, 'AuthStack');

const dbStack = new DatabaseStack(app, 'DatabaseStack');

const queueStack = new QueueStack(app, 'QueueStack', {
  userProfiles: dbStack.userProfiles,
});

const storageStack = new StorageStack(app, 'StorageStack', {
  queue: queueStack.taskQueue,
  userProfiles: dbStack.userProfiles,
});

new ApiStack(app, 'ApiStack', {
  userPool: authStack.userPool,
  userPoolClient: authStack.userPoolClient,
  table: dbStack.tasksTable,
  queue: queueStack.taskQueue,
  bucket: storageStack.bucket,
  userProfiles: dbStack.userProfiles,
});