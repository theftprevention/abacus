import type { HttpUrlString } from '../../core/types';

import { HttpResponseError } from '../../core/classes/httpResponseError';
import { envInteger } from '../../core/helpers/envInteger';
import { loadHtmlDocument } from '../../core/helpers/loadHtmlDocument';
import { parseProductGroupFromDocument } from '../../core/parseProductGroupFromDocument';
import { saveProductGroup } from '../lib/productTable';
import { markUrlAsVisited, setUrlStatus } from '../lib/urlTable';

const MAX_ATTEMPTS_PER_URL = envInteger('MAX_ATTEMPTS_PER_URL');

export async function getProductGroup(
  url: URL | HttpUrlString,
  priorAttempts: number,
  urlTableName: string
): Promise<void> {
  // Mark the URL as visited
  await markUrlAsVisited(url, priorAttempts, urlTableName);

  // Load the HTML document
  let document: Document | null;
  try {
    document = await loadHtmlDocument(url);
  } catch (error) {
    if (!(error instanceof HttpResponseError)) {
      throw error;
    }
    let status: number;
    const { statusCode } = error;
    if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 408 && statusCode !== 429) {
      // A 4xx status code should not result in a retry unless it's either 408 (Request Timeout) or
      // 429 (Too Many Requests), both of which can be retried
      status = statusCode;
    } else {
      status = priorAttempts + 1;
      if (status >= MAX_ATTEMPTS_PER_URL) {
        status = statusCode || MAX_ATTEMPTS_PER_URL;
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
