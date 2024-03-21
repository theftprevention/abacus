import type { HistoryEntry } from '../types';

import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { parseAttributeValueMap, toAttributeValueMap } from '@abacus/aws-utils';
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
  return parseAttributeValueMap<HistoryEntry>(item);
}

export async function putHistoryEntry(historyEntry: HistoryEntry): Promise<void> {
  await client.send(new PutItemCommand({
    Item: toAttributeValueMap(historyEntry),
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
