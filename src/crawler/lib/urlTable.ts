import type { AttributeValueMap } from '@abacus/aws-utils';
import type { HttpUrlString } from '@abacus/common';
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
  ScanCommand,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';
import { dynamoDBPaginatedRequest, toAttributeValue } from '@abacus/aws-utils';

const client = new DynamoDBClient();

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
      },
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

export async function getBatchOfUnvisitedUrls(
  context: CrawlContext,
  remainingUrls: number
): Promise<AttributeValueMap[]> {
  const pageSize = Math.min(context.maxConcurrentUrls, remainingUrls);
  return await dynamoDBPaginatedRequest(
    client,
    ScanCommand,
    {
      TableName: context.urlTableName,
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': toAttributeValue(null),
      },
      ConsistentRead: true,
      Limit: Math.min(50, pageSize),
    },
    pageSize
  );
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
  await client.send(new DeleteItemCommand({
    TableName: urlTableName,
    Key: {
      status: { N: `${priorStatus}` },
      url: { S: String(url) },
    },
  }));

  await client.send(new PutItemCommand({
    TableName: urlTableName,
    Item: {
      status: { N: `${newStatus}` },
      url: { S: String(url) },
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
