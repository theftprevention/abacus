import type { ProductGroup } from '../../core/classes/productGroup';
import type { HttpUrlString } from '../../core/types';

import { HttpResponseError } from '../../core/classes/httpResponseError';
import { loadProductGroup } from '../../core/loadProductGroup';
import { saveProductGroup } from '../lib/productTable';
import { markUrlAsVisited } from '../lib/urlTable';

export async function getProductGroup(url: URL | HttpUrlString, urlTableName: string): Promise<void> {
  // Mark the URL as visited
  await markUrlAsVisited(url, urlTableName);

  // Load the product group
  let productGroup: ProductGroup;
  try {
    productGroup = await loadProductGroup(url);
  } catch (error) {
    if (!(error instanceof HttpResponseError)) {
      throw error;
    }
    // TODO: Handle server errors / timeouts
    throw error;
  }

  // Save products to database
  await saveProductGroup(productGroup);
}
