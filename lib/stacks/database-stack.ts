import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { TasksTable, UserProfilesTable } from '../constructs/database/tables';
import { Table } from 'aws-cdk-lib/aws-dynamodb';

export class DatabaseStack extends Stack {
  public readonly tasksTable: Table;
  public readonly userProfiles: Table;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const userProfiles = new UserProfilesTable(this, 'UserProfilesTable');
    const tasksTable = new TasksTable(this, 'TasksTable');

    this.userProfiles = userProfiles.table;
    this.tasksTable = tasksTable.table;
  }
}