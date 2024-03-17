import type { HttpUrlString } from '@abacus/common';

import { Product, type ProductProperties } from './product';
import { ProductGroup } from './productGroup';

const closeoutPattern = /CLOSEOUT/i;

export function parseProductGroupFromDocument(
  document: Document,
  url: URL | HttpUrlString
): ProductGroup {
  const group = new ProductGroup(url);

  // Parse the product data
  const productDataJson = document.getElementById('productData')?.getAttribute('data-skus');
  if (!productDataJson) {
    return group;
  }
  type Item = ProductProperties | null | undefined;
  let productData: Item | Item[] = JSON.parse(productDataJson);
  if (!productData || typeof productData !== 'object') {
    return group;
  }
  if (!Array.isArray(productData)) {
    productData = [productData];
  }
  group.addProducts(productData);

  const descriptionContainer = document.querySelector('.abc-product-card .description');
  if (descriptionContainer) {
    // Determine whether each product is part of a closeout sale
    let pillContainer: Element | null;
    let pillText: string | null;
    let productId: Product['productId'];
    for (const product of group.products) {
      if (
        (productId = product.productId) &&
        (pillContainer = descriptionContainer.querySelector(`.pills[ng-show="product.productId==='${productId}'"]`)) &&
        (pillText = pillContainer.getElementsByClassName('red-pill')[0]?.textContent) &&
        closeoutPattern.test(pillText)
      ) {
        product.closeout = true;
      }
    }
  }

  return group;
}
