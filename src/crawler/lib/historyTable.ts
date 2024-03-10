import type { HistoryEntry } from '../types';

import { DynamoDB } from 'aws-sdk';
import { env } from '../../core/helpers/env';

const HISTORY_TABLE_NAME = env('HISTORY_TABLE_NAME');
const ddbDocumentClient = new DynamoDB.DocumentClient();

export async function getHistoryEntry(crawlId: string): Promise<HistoryEntry> {
  const entry = (await ddbDocumentClient.get({
    TableName: HISTORY_TABLE_NAME,
    Key: { crawlId },
    ConsistentRead: true,
  }).promise()).Item as HistoryEntry | undefined;
  if (!entry) {
    throw new Error(`No history entry found with crawlId "${crawlId}"`);
  }
  return entry;
}

export async function putHistoryEntry(historyEntry: HistoryEntry): Promise<void> {
  await ddbDocumentClient.put({
    TableName: HISTORY_TABLE_NAME,
    Item: historyEntry,
  }).promise();
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
