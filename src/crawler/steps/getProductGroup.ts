import type { HttpResponseStatusCode, HttpUrlString } from '@abacus/common';
import type { CrawlContext } from '../types';

import { HttpResponseError, loadHtmlDocument } from '@abacus/common';
import { parseProductGroupFromDocument } from '@abacus/core';
import { saveProductGroup } from '../lib/productTable';
import { markUrlAsVisited, setUrlStatus } from '../lib/urlTable';

const socketHangUpPattern = /socket\s+hang\s+up/ig;

export interface GetProductGroupInput extends Pick<CrawlContext, 'maxAttemptsPerUrl' | 'urlTableName'> {
  status: number;
  url: HttpUrlString;
}

/**
 * Extract the products from a single webpage.
 */
export async function getProductGroup(input: GetProductGroupInput): Promise<void> {
  const { maxAttemptsPerUrl, status: priorAttempts, url, urlTableName } = input;

  // Mark the URL as visited
  await markUrlAsVisited(url, priorAttempts, urlTableName);

  // Load the HTML document
  let document: Document | null;
  try {
    document = await loadHtmlDocument(url);
  } catch (error) {
    let statusCode: HttpResponseStatusCode | null | undefined;
    if (error instanceof HttpResponseError) {
      statusCode = error.statusCode;
    } else if (!(error instanceof Error) || !socketHangUpPattern.test(error.message)) {
      // Make sure we retry if `node:http` throws a "socket hang up" error
      throw error;
    }
    let status: number;
    if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 408 && statusCode !== 429) {
      // A 4xx status code should not result in a retry unless it's either 408 (Request Timeout) or
      // 429 (Too Many Requests), both of which can be retried
      status = statusCode;
    } else {
      status = priorAttempts + 1;
      if (status >= maxAttemptsPerUrl) {
        status = statusCode || maxAttemptsPerUrl;
      }
    }
    await setUrlStatus(url, priorAttempts, status, urlTableName);
    return;
  }

  if (document) {
    // Parse the product group
    const productGroup = parseProductGroupFromDocument(document, url);

    // Save products to database
    await saveProductGroup(productGroup);
  }
}
