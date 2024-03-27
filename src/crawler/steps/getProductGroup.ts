import type { HttpResponseStatusCode } from '@abacus/common';
import type { UrlEntry } from '../lib/urlTable';
import type { CrawlContext } from '../types';

import { HttpResponseError, loadHtmlDocument } from '@abacus/common';
import { parseProductGroupFromDocument } from '@abacus/core';
import { saveProductGroup } from '../lib/productTable';
import { markUrlAsVisited, setUrlStatus } from '../lib/urlTable';

export type GetProductGroupInput =
  Pick<CrawlContext, 'maxAttemptsPerUrl' | 'urlTableName'> &
  Pick<UrlEntry, 'attempts' | 'history' | 'url'>;

/**
 * Extract the products from a single webpage.
 */
export async function getProductGroup(input: GetProductGroupInput): Promise<void> {
  const { url } = input;

  // Mark the URL as visited
  await markUrlAsVisited(input, input.urlTableName);

  // Load the HTML document
  let document: Document;
  try {
    document = await loadHtmlDocument(url);
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }
    const { message } = error;
    let status: HttpResponseStatusCode;
    if (error instanceof HttpResponseError) {
      status = error.statusCode || 599;
    } else {
      status = 599;
    }
    await setUrlStatus(input, input, status, message);
    return;
  }

  // Parse the product group
  const productGroup = parseProductGroupFromDocument(document, url);

  // Save products to database
  await saveProductGroup(productGroup);
}
