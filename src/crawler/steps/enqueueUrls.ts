import type { HttpUrlString } from '@abacus/common';
import type { GetProductGroupInput } from './getProductGroup';
import type { CrawlContext } from '../types';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '@abacus/common';
import { getHistoryEntry, putHistoryEntry } from '../lib/historyTable';
import { getBatchOfUnvisitedUrls } from '../lib/urlTable';

const S3_BUCKET = env('S3_BUCKET');
const S3_QUEUED_URLS_KEY = env('S3_QUEUED_URLS_KEY');

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
    const items = await getBatchOfUnvisitedUrls(context, remainingUrls);
    let index = 0;
    let url: HttpUrlString | null;
    for (const item of items) {
      if (item && (url = item.url)) {
        records[index++] = {
          attempts: item.attempts,
          history: item.history,
          maxAttemptsPerUrl,
          url,
          urlTableName,
        };
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
