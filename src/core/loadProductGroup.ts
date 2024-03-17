import type { HttpUrlString } from './types';

import { HttpResponseError } from './classes/httpResponseError';
import { Product, type ProductProperties } from './classes/product';
import { ProductGroup } from './classes/productGroup';
import { loadHtmlDocument } from './helpers/loadHtmlDocument';

const closeoutPattern = /CLOSEOUT/i;

export async function loadProductGroup(url: URL | HttpUrlString): Promise<ProductGroup> {
  let document: Document;
  const group = new ProductGroup(url);

  try {
    document = await loadHtmlDocument(url);
  } catch (error) {
    if (error instanceof HttpResponseError && error.statusCode === 404) {
      return group;
    }
    throw error;
  }

  // Parse the product data
  const productDataJson = document.getElementById('productData')?.getAttribute('data-skus');
  if (!productDataJson) {
    return group;
  }
  type Item = ProductProperties | string | number | boolean | null | undefined;
  let productData: Item | Item[] = JSON.parse(productDataJson);
  if (!productData || typeof productData !== 'object') {
    return group;
  }
  if (!Array.isArray(productData)) {
    productData = [productData];
  }
  let product: Product;
  const products: Product[] = [];
  for (const element of productData) {
    if (
      element &&
      typeof element === 'object' &&
      (product = new Product(element)).productName &&
      product.url
    ) {
      products.push(product);
    }
  }

  const descriptionContainer = document.querySelector('.abc-product-card .description');
  const determineCloseout: (product: Product) => void = descriptionContainer
    ? (product) => {
        const { productId } = product;
        if (productId) {
          const pillContainer = descriptionContainer.querySelector(`.pills[ng-show="product.productId==='${productId}'"]`);
          if (pillContainer) {
            const pillText = pillContainer.getElementsByClassName('red-pill')[0]?.textContent;
            if (pillText && closeoutPattern.test(pillText)) {
              product.closeout = true;
            }
          }
        }
      }
    : function () {};

  let index = 0;
  let productUrl: URL | string | null | undefined;
  for (const product of products) {
    // Determine whether each product is part of a closeout sale
    determineCloseout(product);

    // Append the 'productSize' query parameter to the product URLs
    productUrl = product.url;
    if (productUrl) {
      try {
        productUrl = new URL(productUrl);
        const params = productUrl.searchParams;
        if (!params.has('productSize')) {
          params.set('productSize', String(index));
        }
        product.url = productUrl.href;
      } catch {}
    }
    index++;
  }

  group.products = products;
  return group;
}
