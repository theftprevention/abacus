import type { UrlString } from './types';

import { Product, type ProductProperties } from './classes/product';
import { ProductGroup } from './classes/productGroup';
import { loadHtmlDocument } from './helpers/loadHtmlDocument';

const closeoutPattern = /CLOSEOUT/i;

export async function loadProductGroup(url: URL | UrlString): Promise<ProductGroup> {
  const document = await loadHtmlDocument(url);
  const group = new ProductGroup(url);

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
