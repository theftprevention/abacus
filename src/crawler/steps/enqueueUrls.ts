import type { UrlString } from '../../core/types';
import type { CrawlContext } from '../types';

import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { dynamoDBPaginatedRequest } from '../../core/helpers/dynamoDBPaginatedRequest';
import { env } from '../../core/helpers/env';
import { envInteger } from '../../core/helpers/envInteger';
import { toUrlStringOrNull } from '../../core/helpers/toUrlStringOrNull';
import { getHistoryEntry, putHistoryEntry } from '../lib/historyTable';
import { UrlStatus } from '../lib/urlTable';

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
      IndexName: context.urlTableStatusIndexName,
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeValues: {
        ':status': { N: `${UrlStatus.PENDING}` },
      },
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      Limit: 50,
    },
    MAX_CONCURRENT_URLS
  ));

  let index = 0;
  let url: UrlString | null;
  const urls: UrlString[] = [];
  for (const item of items) {
    url = toUrlStringOrNull(item?.url?.S);
    if (url) {
      urls[index++] = url;
    }
  }

  const queuedUrlCount = urls.length;
  const batchUrlCount = previousBatchUrlCount + queuedUrlCount;
  const urlCount = previousUrlCount + queuedUrlCount;

  // Write the total URLs back to the history table
  await putHistoryEntry({
    ...historyEntry,
    batchUrlCount,
    urlCount,
  });

  // Save the URLs to S3 to avoid hitting the max request size limit of 256KB.
  const { urlTableName } = context;
  await s3Client.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: S3_QUEUED_URLS_KEY,
    Body: JSON.stringify(urls.map((url) => ({ url, urlTableName }))),
  }));

  return {
    queueIsNonEmpty: urls.length > 0,
    thresholdExceeded: batchUrlCount > STATE_MACHINE_URL_THRESHOLD,
  };
}
