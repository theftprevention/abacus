import type { UrlString } from '../../core/types';
import type { CrawlContext } from '../types';

import { DynamoDB, S3 } from 'aws-sdk';
import { env } from '../../core/helpers/env';
import { envInteger } from '../../core/helpers/envInteger';
import { dynamodbPaginatedRequest } from '../../core/helpers/dynamodbPaginatedRequest';
import { getHistoryEntry, putHistoryEntry } from '../lib/historyTable';
import { UrlStatus } from '../lib/urlTable';

const MAX_CONCURRENT_URLS = envInteger('MAX_CONCURRENT_URLS');
const S3_BUCKET = env('S3_BUCKET');
const S3_QUEUED_URLS_KEY = env('S3_QUEUED_URLS_KEY');
const STATE_MACHINE_URL_THRESHOLD = envInteger('STATE_MACHINE_URL_THRESHOLD');

const ddbDocumentClient = new DynamoDB.DocumentClient();
const s3Service = new S3();

export async function enqueueUrls(context: CrawlContext) {
  const historyEntry = await getHistoryEntry(context.crawlId);
  const {
    batchUrlCount: previousBatchUrlCount,
    urlCount: previousUrlCount,
  } = historyEntry;

  // Get next batch of URLS to visit
  const query = ddbDocumentClient.query.bind(ddbDocumentClient);
  const urls: UrlString[] = (await dynamodbPaginatedRequest(
    query,
    {
      TableName: context.urlTableName,
      ConsistentRead: true,
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeValues: {
        ':status': UrlStatus.PENDING,
      },
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      Limit: 50,
    },
    MAX_CONCURRENT_URLS
  )).map((entry) => entry.url);

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
  await s3Service.putObject({
    Bucket: S3_BUCKET,
    Key: S3_QUEUED_URLS_KEY,
    Body: JSON.stringify(urls.map((url) => ({ url, urlTableName }))),
  }).promise();

  return {
    queueIsNonEmpty: urls.length > 0,
    thresholdExceeded: batchUrlCount > STATE_MACHINE_URL_THRESHOLD,
  };
}
