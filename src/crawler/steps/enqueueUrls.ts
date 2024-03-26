import type { HttpUrlString } from '@abacus/common';
import type { GetProductGroupInput } from './getProductGroup';
import type { CrawlContext } from '../types';

import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { dynamoDBPaginatedRequest } from '@abacus/aws-utils';
import { env, toHttpUrlStringOrNull, toNonNegativeIntegerOrNull } from '@abacus/common';
import { getHistoryEntry, putHistoryEntry } from '../lib/historyTable';

const S3_BUCKET = env('S3_BUCKET');
const S3_QUEUED_URLS_KEY = env('S3_QUEUED_URLS_KEY');

const dynamoDBClient = new DynamoDBClient();
const s3Client = new S3Client();

/**
 * Read all non visited urls from context table so that they can be passed to the crawl lambdas.
 */
export async function enqueueUrls(context: CrawlContext) {
  const { maxAttemptsPerUrl, urlTableName } = context;
  const historyEntry = await getHistoryEntry(context.crawlId);
  const {
    batchUrlCount: previousBatchUrlCount,
    urlCount: previousUrlCount,
  } = historyEntry;
  const records: GetProductGroupInput[] = [];

  const remainingUrls = context.maxUrls - previousUrlCount;
  if (remainingUrls > 0) {
    // Get next batch of URLS to visit
    const pageSize = Math.min(context.maxConcurrentUrls, remainingUrls);
    const items = await dynamoDBPaginatedRequest(
      dynamoDBClient,
      ScanCommand,
      {
        TableName: urlTableName,
        FilterExpression: '#status < :maxattempts',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':maxattempts': { N: `${maxAttemptsPerUrl}` },
        },
        ConsistentRead: true,
        Limit: Math.min(50, pageSize),
      },
      pageSize
    );
    let index = 0;
    let status: number | null;
    let url: HttpUrlString | null;
    for (const item of items) {
      if (
        item &&
        (url = toHttpUrlStringOrNull(item.url?.S)) &&
        (status = toNonNegativeIntegerOrNull(item.status?.N)) != null
      ) {
        records[index++] = { maxAttemptsPerUrl, status, url, urlTableName };
      }
    }
  }

  const queuedUrlCount = records.length;
  const queueIsNonEmpty = queuedUrlCount > 0;
  const batchUrlCount = previousBatchUrlCount + queuedUrlCount;

  if (queueIsNonEmpty) {
    // Write the total URLs back to the history table
    await putHistoryEntry({
      ...historyEntry,
      batchUrlCount,
      urlCount: previousUrlCount + queuedUrlCount,
    });

    // Save the URLs to S3 to avoid hitting the max request size limit of 256KB.
    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: S3_QUEUED_URLS_KEY,
      Body: JSON.stringify(records),
    }));
  }

  return {
    queueIsNonEmpty,
    thresholdExceeded: batchUrlCount >= context.stateMachineUrlThreshold,
  };
}
