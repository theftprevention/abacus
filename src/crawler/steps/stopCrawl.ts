import type { CrawlContext } from '../types';

import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../../core/helpers/env';
import { updateHistoryEntry } from '../lib/historyTable';
import { deleteUrlTable } from '../lib/urlTable';

const S3_BUCKET = env('S3_BUCKET');
const S3_QUEUED_URLS_KEY = env('S3_QUEUED_URLS_KEY');

const s3Client = new S3Client();

export async function stopCrawl(context: CrawlContext): Promise<void> {
  // Delete the temporary queuedUrls file from the S3 working bucket
  await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: S3_QUEUED_URLS_KEY }));

  // Delete the URL tracking table
  await deleteUrlTable(context);

  // Update the end timestamp
  await updateHistoryEntry(context.crawlId, {
    endTimestamp: Date.now(),
  });
}
