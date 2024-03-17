import type { HttpUrlString } from '../../core/types';
import type { CrawlContext } from '../types';

import {
  BatchWriteItemCommand,
  BillingMode,
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
  KeyType,
  ScalarAttributeType,
  UpdateItemCommand,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient();

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

export async function markUrlAsVisited(
  url: URL | HttpUrlString,
  priorStatus: number,
  urlTableName: string
) {
  return setUrlStatus(url, priorStatus, 200, urlTableName);
}

export async function setUrlStatus(
  url: URL | HttpUrlString,
  priorStatus: number,
  newStatus: number,
  urlTableName: string
): Promise<void> {
  await client.send(new UpdateItemCommand({
    TableName: urlTableName,
    Key: {
      status: { N: `${priorStatus}` },
      url: { S: String(url) },
    },
    UpdateExpression: 'SET #status = :status',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':status': { N: `${newStatus}` },
    },
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
                status: { N: '0' },
                url: { S: url },
              },
            },
          })),
        },
      }))
    );
  }
  await Promise.all(promises);
}
