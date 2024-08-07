import type { CrawlContext, CrawlOptions } from '../types';

import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import {
  env,
  envInteger,
  sanitizeTimestamp,
  toHttpUrlString,
  toHttpUrlStringOrNull,
  toNonNegativeIntegerOrNull,
  toString,
} from '@abacus/common';
import { getProductGroupUrls } from '@abacus/core';
import { putHistoryEntry } from '../lib/historyTable';
import { createUrlTable, storeUrls } from '../lib/urlTable';

const CRAWLER_STATE_MACHINE_ARN = env('CRAWLER_STATE_MACHINE_ARN');
const DISTRIBUTED_MAP_CONCURRENCY_LIMIT = envInteger('DISTRIBUTED_MAP_CONCURRENCY_LIMIT');

const sfnClient = new SFNClient();

/**
 * Begin a crawl.
 */
export async function beginCrawl(options: CrawlOptions) {
  if (!options || typeof options !== 'object') {
    options = Object.create(null) as NonNullable<typeof options>;
  }
  const crawlId = toString(options.crawlId) || sanitizeTimestamp();
  const maxUrls = toNonNegativeIntegerOrNull(options.maxUrls) || Number.MAX_SAFE_INTEGER;
  const urlTableName = `${env('URL_TABLE_NAME_PREFIX')}-${crawlId}`;

  const context: CrawlContext = {
    crawlId,

    maxAttemptsPerUrl:
      toNonNegativeIntegerOrNull(options.maxAttemptsPerUrl) ||
      envInteger('DEFAULT_MAX_ATTEMPTS_PER_URL'),

    maxConcurrentUrls: Math.max(
      toNonNegativeIntegerOrNull(options.maxConcurrentUrls) ||
        envInteger('DEFAULT_MAX_CONCURRENT_URLS'),
      DISTRIBUTED_MAP_CONCURRENCY_LIMIT
    ),

    maxUrls,

    preserveUrlTable: !!options.preserveUrlTable,

    stateMachineUrlThreshold:
      toNonNegativeIntegerOrNull(options.stateMachineUrlThreshold) ||
      envInteger('DEFAULT_STATE_MACHINE_URL_THRESHOLD'),

    targetOrigin:
      toHttpUrlStringOrNull(options.targetOrigin) ||
      toHttpUrlString(env('DEFAULT_TARGET_ORIGIN')),

    urlTableName,
  };

  await createUrlTable(urlTableName);

  const startTimestamp = Date.now();

  await putHistoryEntry({
    ...context,
    batchUrlCount: 0,
    startTimestamp,
    urlCount: 0
  });

  const productGroupUrls = await getProductGroupUrls(context.targetOrigin, maxUrls);

  await storeUrls(productGroupUrls, urlTableName);

  // Start step function execution
  const response = await sfnClient.send(new StartExecutionCommand({
    name: `crawl-${crawlId}-${sanitizeTimestamp(startTimestamp)}`,
    stateMachineArn: CRAWLER_STATE_MACHINE_ARN,
    input: JSON.stringify(context),
  }));

  return { stateMachineExecutionArn: response.executionArn };
}
