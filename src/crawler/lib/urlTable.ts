import type { UrlString } from '../../core/types';
import type { CrawlContext } from '../types';

import {
  BatchWriteItemCommand,
  BillingMode,
  CreateTableCommand,
  DeleteItemCommand,
  DeleteTableCommand,
  DynamoDBClient,
  KeyType,
  PutItemCommand,
  ScalarAttributeType,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient();

export const enum UrlStatus {
  PENDING,
  VISITED,
  ERROR,
}

export async function createUrlTable(tableName: string): Promise<void> {
  await client.send(new CreateTableCommand({
    TableName: tableName,
    AttributeDefinitions: [
      {
        AttributeName: 'url',
        AttributeType: ScalarAttributeType.S,
      },
      {
        AttributeName: 'status',
        AttributeType: ScalarAttributeType.N,
      },
    ],
    KeySchema: [
      {
        AttributeName: 'url',
        KeyType: KeyType.HASH,
      },
      {
        AttributeName: 'status',
        KeyType: KeyType.RANGE,
      }
    ],
    BillingMode: BillingMode.PAY_PER_REQUEST,
  }));

  await waitUntilTableExists({ client, maxWaitTime: 20, minDelay: 10 }, { TableName: tableName });
}

export async function deleteUrlTable(context: CrawlContext): Promise<void> {
  await client.send(new DeleteTableCommand({
    TableName: context.urlTableName,
  }));
}

export async function markUrlAsVisited(url: URL | UrlString, urlTableName: string): Promise<void> {
  url = String(url) as UrlString;

  // Write an entry saying the url has been visited
  await client.send(new PutItemCommand({
    Item: {
      status: { N: `${UrlStatus.VISITED}` },
      url: { S: url },
      visitedAt: { N: `${Date.now()}` },
    },
    TableName: urlTableName,
  }));

  // Delete the entry that says it's not visited
  await client.send(new DeleteItemCommand({
    Key: {
      status: { N: `${UrlStatus.PENDING}` },
      url: { S: url },
    },
    TableName: urlTableName,
  }));
}

export async function storeUrls(urls: readonly UrlString[], urlTableName: string): Promise<void> {
  await client.send(new BatchWriteItemCommand({
    RequestItems: {
      [urlTableName]: urls.map((url) => ({
        PutRequest: {
          Item: {
            url: { S: url },
            status: { N: `${UrlStatus.PENDING}` },
          },
        },
      })),
    },
  }));
}
