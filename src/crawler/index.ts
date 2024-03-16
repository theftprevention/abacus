import type { UrlString } from '../core/types';
import type { CrawlContext, CrawlOptions } from './types';

import { v4 as uuid } from 'uuid';
import { env } from '../core/helpers/env';
import { sanitizeTimestamp } from '../core/helpers/sanitizeTimestamp';
import { toString } from '../core/helpers/toString';
import { toUrlString } from '../core/helpers/toUrlString';
import { toUrlStringOrNull } from '../core/helpers/toUrlStringOrNull';
import { beginCrawl } from './steps/beginCrawl';
import { enqueueUrls } from './steps/enqueueUrls';
import { getProductGroup } from './steps/getProductGroup';
import { nextExecution } from './steps/nextExecution';
import { stopCrawl } from './steps/stopCrawl';

/**
 * Begin a crawl.
 */
export async function beginCrawlHandler(options?: Partial<CrawlOptions> | null) {
  if (!options || typeof options !== 'object') {
    options = Object.create(null) as NonNullable<typeof options>;
  }
  const crawlId = toString(options.crawlId) || uuid();
  const prefix = toString(options.urlTableNamePrefix) || env('URL_TABLE_NAME_PREFIX');
  const urlTableName = `${prefix ? `${prefix}-` : ''}${crawlId}`;

  return await beginCrawl({
    crawlId,
    crawlName: toString(options.crawlName) || `crawl-${sanitizeTimestamp()}`,
    stateMachineArn: toString(options.stateMachineArn) || env('CRAWLER_STATE_MACHINE_ARN'),
    targetOrigin: toUrlStringOrNull(options.targetOrigin) || toUrlString(env('TARGET_ORIGIN')),
    urlTableName,
  });
}

/**
 * Read all non visited urls from context table so that they can be passed to the crawl lambdas.
 */
export async function enqueueUrlsHandler(event: { Payload: { context: CrawlContext } }) {
  return await enqueueUrls(event.Payload.context);
}

/**
 * Extract the products from a single webpage.
 */
export async function getProductGroupHandler(event: { url: UrlString; urlTableName: string }) {
  return await getProductGroup(event.url, event.urlTableName);
}

/**
 * Responsible for continuing execution via another state machine execution if we're getting too
 * close to the maximum number of steps in our state machine execution.
 */
export async function nextExecutionHandler(event: { Payload: { context: CrawlContext } }) {
  return await nextExecution(event.Payload.context);
}

/**
 * When complete, clear the URL database.
 */
export async function stopCrawlHandler(event: { Payload: { context: CrawlContext } }) {
  return await stopCrawl(event.Payload.context);
}
