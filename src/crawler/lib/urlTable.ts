import type { HttpUrlString } from '../../core/types';
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
        AttributeName: 'status',
        AttributeType: ScalarAttributeType.N,
      },
      {
        AttributeName: 'url',
        AttributeType: ScalarAttributeType.S,
      },
    ],
    KeySchema: [
      {
        AttributeName: 'status',
        KeyType: KeyType.HASH,
      },
      {
        AttributeName: 'url',
        KeyType: KeyType.RANGE,
      }
    ],
    BillingMode: BillingMode.PAY_PER_REQUEST,
  }));

  await waitUntilTableExists({ client, maxWaitTime: 30, minDelay: 20 }, { TableName: tableName });
}

export async function deleteUrlTable(context: CrawlContext): Promise<void> {
  await client.send(new DeleteTableCommand({
    TableName: context.urlTableName,
  }));
}

export async function markUrlAsVisited(url: URL | HttpUrlString, urlTableName: string): Promise<void> {
  url = String(url) as HttpUrlString;

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

export async function storeUrls(urls: readonly HttpUrlString[], urlTableName: string): Promise<void> {
  let batch: HttpUrlString[];
  let batchSize: number;
  let index = 0;
  const promises: Promise<any>[] = [];
  while ((batchSize = (batch = urls.slice(index, index + 25)).length)) {
    index += batchSize;
    promises.push(
      client.send(new BatchWriteItemCommand({
        RequestItems: {
          [urlTableName]: batch.map((url) => ({
            PutRequest: {
              Item: {
                url: { S: url },
                status: { N: `${UrlStatus.PENDING}` },
              },
            },
          })),
        },
      }))
    );
  }
  await Promise.all(promises);
}
