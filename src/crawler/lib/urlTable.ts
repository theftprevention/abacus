import type { UrlString } from '../../core/types';
import type { CrawlContext } from '../types';

import { BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { DynamoDB } from 'aws-sdk';

const ddbService = new DynamoDB();
const ddbDocumentClient = new DynamoDB.DocumentClient();

export const enum UrlStatus {
  PENDING,
  VISITED,
  ERROR,
}

export async function createUrlTable(tableName: string): Promise<void> {
  await ddbService.createTable({
    TableName: tableName,
    AttributeDefinitions: [
      {
        AttributeName: 'url',
        AttributeType: 'S',
      },
      {
        AttributeName: 'status',
        AttributeType: 'N',
      },
    ],
    KeySchema: [
      {
        AttributeName: 'url',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'status',
        KeyType: 'RANGE',
      }
    ],
    BillingMode: BillingMode.PAY_PER_REQUEST,
  }).promise();

  await ddbService.waitFor('tableExists', { TableName: tableName }).promise();
}

export async function deleteUrlTable(context: CrawlContext): Promise<void> {
  await ddbService.deleteTable({
    TableName: context.urlTableName,
  }).promise();
}

export async function markUrlAsVisited(url: URL | UrlString, urlTableName: string): Promise<void> {
  url = String(url) as UrlString;

  // Write an entry saying the url has been visited
  await ddbDocumentClient.put({
    TableName: urlTableName,
    Item: {
      status: UrlStatus.VISITED,
      url,
      visitedAt: new Date().getTime(),
    },
  }).promise();

  // Delete the entry that says it's not visited
  await ddbDocumentClient.delete({
    TableName: urlTableName,
    Key: {
      status: UrlStatus.PENDING,
      url,
    },
  }).promise();
}
