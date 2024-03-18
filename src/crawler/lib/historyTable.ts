import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import type { HistoryEntry } from '../types';

import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { dynamoDBItemToObject } from '@abacus/aws-utils';
import { env } from '@abacus/common';

const HISTORY_TABLE_NAME = env('HISTORY_TABLE_NAME');

const client = new DynamoDBClient();

export async function getHistoryEntry(crawlId: string): Promise<HistoryEntry> {
  const item = (await client.send(new GetItemCommand({
    ConsistentRead: true,
    Key: {
      crawlId: { S: crawlId, },
    },
    TableName: HISTORY_TABLE_NAME,
  }))).Item;
  if (!item) {
    throw new Error(`No history entry found with crawlId "${crawlId}"`);
  }
  return dynamoDBItemToObject<HistoryEntry>(item);
}

export async function putHistoryEntry(historyEntry: HistoryEntry): Promise<void> {
  const item: { [K in keyof HistoryEntry]: AttributeValue } = {
    batchUrlCount: { N: `${historyEntry.batchUrlCount}` },
    crawlId: { S: historyEntry.crawlId, },
    maxAttemptsPerUrl: { N: `${historyEntry.maxAttemptsPerUrl}` },
    maxConcurrentUrls: { N: `${historyEntry.maxConcurrentUrls}` },
    maxUrls: { N: `${historyEntry.maxUrls}` },
    startTimestamp: { N: `${historyEntry.startTimestamp}` },
    stateMachineUrlThreshold: { N: `${historyEntry.stateMachineUrlThreshold}` },
    targetOrigin: { S: historyEntry.targetOrigin },
    urlCount: { N: `${historyEntry.urlCount}` },
    urlTableName: { S: historyEntry.urlTableName },
  };
  const { endTimestamp } = historyEntry;
  if (endTimestamp) {
    item.endTimestamp = { N: `${endTimestamp}` };
  }
  await client.send(new PutItemCommand({
    Item: item,
    TableName: HISTORY_TABLE_NAME,
  }));
}

export async function updateHistoryEntry(
  crawlId: string,
  updateFields: Partial<HistoryEntry>
): Promise<void> {
  const historyEntry = await getHistoryEntry(crawlId);
  return putHistoryEntry({
    ...historyEntry,
    ...updateFields,
  });
}
