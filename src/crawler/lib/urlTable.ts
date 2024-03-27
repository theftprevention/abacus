import type { HttpResponseStatusCode, HttpUrlString } from '@abacus/common';
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
import {
  dynamoDBPaginatedRequest,
  parseAttributeValueMap,
  toAttributeValueMap,
} from '@abacus/aws-utils';

export interface UrlEntry {
  attempts: number;
  history: UrlHistoryEntry[] | null;
  status: HttpResponseStatusCode | null;
  url: HttpUrlString;
}

export interface UrlHistoryEntry {
  message: string;
  timestamp: number;
}

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
        AttributeName: 'attempts',
        AttributeType: ScalarAttributeType.N,
      },
    ],
    KeySchema: [
      {
        AttributeName: 'url',
        KeyType: KeyType.HASH,
      },
      {
        AttributeName: 'attempts',
        KeyType: KeyType.RANGE,
      },
    ],
    BillingMode: BillingMode.PAY_PER_REQUEST,
  }));

  await waitUntilTableExists({ client, maxWaitTime: 30, minDelay: 20 }, { TableName: tableName });
}

function deleteUrlRecord(url: HttpUrlString, attempts: number, urlTableName: string) {
  return client.send(new DeleteItemCommand({
    TableName: urlTableName,
    Key: toAttributeValueMap({ url, attempts }),
  }));
}

export async function deleteUrlTable(context: CrawlContext): Promise<void> {
  await client.send(new DeleteTableCommand({
    TableName: context.urlTableName,
  }));
}

export async function getBatchOfUnvisitedUrls(
  context: CrawlContext,
  remainingUrls: number
): Promise<UrlEntry[]> {
  const pageSize = Math.min(context.maxConcurrentUrls, remainingUrls);
  const items = await dynamoDBPaginatedRequest(
    client,
    ScanCommand,
    {
      TableName: context.urlTableName,
      FilterExpression: '#attempts < :maxattempts',
      ExpressionAttributeNames: {
        '#attempts': 'attempts',
      },
      ExpressionAttributeValues: toAttributeValueMap({
        ':maxattempts': context.maxAttemptsPerUrl,
      }),
      ConsistentRead: true,
      Limit: Math.min(50, pageSize),
    },
    pageSize
  );
  const entries: UrlEntry[] = [];
  let index = 0;
  for (const item of items) {
    if (item && typeof item === 'object') {
      entries[index++] = parseAttributeValueMap<UrlEntry>(item);
    }
  }
  return entries;
}

export async function markUrlAsVisited(
  entry: Pick<UrlEntry, 'attempts' | 'url'> & Partial<Omit<UrlEntry, 'attempts' | 'url'>>,
  urlTableName: string
): Promise<void> {
  await deleteUrlRecord(entry.url, entry.attempts, urlTableName);
}

export async function setUrlStatus(
  context: Pick<CrawlContext, 'maxAttemptsPerUrl' | 'urlTableName'>,
  entry: Omit<UrlEntry, 'status'> & Partial<Pick<UrlEntry, 'status'>>,
  status: HttpResponseStatusCode,
  message?: string
): Promise<void> {
  const { urlTableName } = context;
  const { attempts, history, url } = entry;

  await deleteUrlRecord(url, attempts, urlTableName);

  const historyEntry: UrlHistoryEntry = {
    message: String(message || status),
    timestamp: Date.now(),
  };

  await client.send(new PutItemCommand({
    TableName: urlTableName,
    Item: toAttributeValueMap({
      attempts: status >= 400 && status < 500 && status !== 408 && status !== 429
        ? context.maxAttemptsPerUrl
        : attempts + 1,
      history: Array.isArray(history) ? [...history, historyEntry] : [historyEntry],
      status,
      url,
    }),
  }));
}

export async function storeUrls(
  urls: readonly HttpUrlString[],
  urlTableName: string
): Promise<void> {
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
              Item: toAttributeValueMap<UrlEntry>({
                attempts: 0,
                history: null,
                status: null,
                url,
              }),
            },
          })),
        },
      }))
    );
  }
  await Promise.all(promises);
}
