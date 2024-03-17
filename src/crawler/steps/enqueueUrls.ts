import type { HttpUrlString } from '../../core/types';
import type { CrawlContext } from '../types';

import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { dynamoDBPaginatedRequest } from '../../core/helpers/dynamoDBPaginatedRequest';
import { env } from '../../core/helpers/env';
import { envInteger } from '../../core/helpers/envInteger';
import { toNonNegativeIntegerOrNull } from '../../core/helpers/toNonNegativeIntegerOrNull';
import { toHttpUrlStringOrNull } from '../../core/helpers/toHttpUrlStringOrNull';
import { getHistoryEntry, putHistoryEntry } from '../lib/historyTable';

const MAX_ATTEMPTS_PER_URL = envInteger('MAX_ATTEMPTS_PER_URL');
const MAX_CONCURRENT_URLS = envInteger('MAX_CONCURRENT_URLS');
const S3_BUCKET = env('S3_BUCKET');
const S3_QUEUED_URLS_KEY = env('S3_QUEUED_URLS_KEY');
const STATE_MACHINE_URL_THRESHOLD = envInteger('STATE_MACHINE_URL_THRESHOLD');

const dynamoDBClient = new DynamoDBClient();
const s3Client = new S3Client();

export async function enqueueUrls(context: CrawlContext) {
  const historyEntry = await getHistoryEntry(context.crawlId);
  const {
    batchUrlCount: previousBatchUrlCount,
    urlCount: previousUrlCount,
  } = historyEntry;

  // Get next batch of URLS to visit
  const items = (await dynamoDBPaginatedRequest(
    dynamoDBClient,
    QueryCommand,
    {
      TableName: context.urlTableName,
      KeyConditionExpression: '#status < :maxattempts',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':maxattempts': { N: `${MAX_ATTEMPTS_PER_URL}` },
      },
      ConsistentRead: true,
      Limit: Math.min(50, MAX_CONCURRENT_URLS),
    },
    MAX_CONCURRENT_URLS
  ));

  const { urlTableName } = context;
  const records: { status: number; url: HttpUrlString; urlTableName: typeof urlTableName }[] = [];
  let index = 0;
  let status: number | null;
  let url: HttpUrlString | null;
  for (const item of items) {
    if (
      item &&
      (url = toHttpUrlStringOrNull(item.url?.S)) &&
      (status = toNonNegativeIntegerOrNull(item.status?.N)) != null
    ) {
      records[index++] = { status, url, urlTableName };
    }
  }

  const queuedUrlCount = records.length;
  const batchUrlCount = previousBatchUrlCount + queuedUrlCount;
  const urlCount = previousUrlCount + queuedUrlCount;

  // Write the total URLs back to the history table
  await putHistoryEntry({
    ...historyEntry,
    batchUrlCount,
    urlCount,
  });

  // Save the URLs to S3 to avoid hitting the max request size limit of 256KB.
  await s3Client.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: S3_QUEUED_URLS_KEY,
    Body: JSON.stringify(records),
  }));

  return {
    queueIsNonEmpty: records.length > 0,
    thresholdExceeded: batchUrlCount > STATE_MACHINE_URL_THRESHOLD,
  };
}
