import type { NonMethodPropertyKey, HttpUrlString } from '@abacus/common';

import { classInstanceToJSON, toHttpUrlString } from '@abacus/common';
import { Product, type ProductProperties, type ProductPropertyKey } from './product';

export class ProductGroup {
  constructor(url: URL | HttpUrlString, products?: ArrayLike<ProductProperties> | Iterable<ProductProperties> | null) {
    this.#url = toHttpUrlString(url);
    this.#products = toProductArray(this, products);
    Object.preventExtensions(this);
  }

  #category: string | undefined;
  get category(): string | null {
    return this.#category || propertyFromProducts('category', this.#products, null);
  }
  set category(value: unknown) {
    this.#category = value == null ? void 0 : String(value);
  }

  #detail: string | undefined;
  get detail(): string | null {
    return this.#detail || propertyFromProducts('detail', this.#products, null);
  }
  set detail(value: unknown) {
    this.#detail = value == null ? void 0 : String(value);
  }

  #name: string | undefined;
  get name(): string {
    return this.#name || propertyFromProducts('productName', this.#products, '');
  }
  set name(value: unknown) {
    this.#name = value == null ? void 0 : String(value);
  }

  #products: readonly Product[];
  get products(): readonly Product[] {
    return this.#products;
  }

  #type: string | undefined;
  get type(): string | null {
    return this.#type || propertyFromProducts('type', this.#products, null);
  }
  set type(value: unknown) {
    this.#type = value == null ? void 0 : String(value);
  }

  #url: HttpUrlString;
  get url(): HttpUrlString {
    return this.#url;
  }

  addProduct(product: ProductProperties | null | undefined): void {
    this.addProducts([product]);
  }

  addProducts(
    products:
      | ArrayLike<ProductProperties | null | undefined>
      | Iterable<ProductProperties | null | undefined>
      | null
      | undefined
  ): void {
    const newProducts = toProductArray(this, products);
    if (newProducts.length) {
      const oldProducts = this.#products;
      this.#products = oldProducts.length
        ? Object.freeze([...oldProducts, ...newProducts])
        : newProducts;
    }
  }

  toJSON() {
    return classInstanceToJSON<ProductGroup>(this, productGroupPropertyKeys);
  }
}

const productGroupPropertyKeys = (() => {
  const keys = new Set(Reflect.ownKeys(ProductGroup.prototype) as ('constructor' | keyof ProductGroup)[]);
  keys.delete('addProduct');
  keys.delete('addProducts');
  keys.delete('constructor');
  keys.delete('toJSON');

  const descriptor = Object.freeze({ enumerable: true });
  const descriptors = Object.create(null);
  for (const key of keys) {
    descriptors[key] = descriptor;
  }
  Object.defineProperties(ProductGroup.prototype, descriptors);

  return Object.freeze(Array.from(keys)) as readonly ProductGroupPropertyKey[];
})();

Object.freeze(ProductGroup);
Object.freeze(ProductGroup.prototype);

function propertyFromProducts<Key extends ProductPropertyKey, Fallback = undefined>(
  key: Key,
  products: readonly Product[],
  fallback?: Fallback
): Product[Key] | Fallback {
  const { length } = products;
  if (!length) {
    return fallback;
  }
  let index = 1;
  const value: Product[Key] = products[0][key];
  while (index < length) {
    if (products[index++][key] !== value) {
      return fallback;
    }
  }
  return value;
}

function toProductArray(group: ProductGroup, value: unknown): readonly Product[] {
  let index = 0;
  let product: Product;
  let products: Product[] = [];
  if (value && typeof value === 'object') {
    for (const data of (Array.isArray(value) ? value : Array.from(value as any)) as (ProductProperties | null | undefined)[]) {
      if (data && typeof data === 'object') {
        product = new Product(group, data);
        if (product.id && product.productName && product.url) {
          products[index++] = product;
        }
      }
    }
  }
  return Object.freeze(products);
}

export type ProductGroupPropertyKey = NonMethodPropertyKey<ProductGroup>;
