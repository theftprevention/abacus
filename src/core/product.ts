import type { Guid, NonMethodPropertyKey, HttpUrlString } from '@abacus/common';
import type { ProductGroup } from './productGroup';

import {
  classInstanceToJSON,
  toGuidOrNull,
  toHttpUrlStringOrNull,
  toNonNegativeIntegerOrNull,
  toPriceOrNull,
  toString,
  toStringArray,
  toStringOrNull,
} from '@abacus/common';

export class Product {
  constructor(group: ProductGroup, properties?: ProductProperties | null) {
    this.#group = group;
    if (properties && typeof properties === 'object') {
      for (const key of productPropertyKeys) {
        if (key !== 'url' && key in properties) {
          this[key] = properties[key];
        }
      }
    }
    Object.preventExtensions(this);
  }

  #group: ProductGroup;

  //#region availableInStore
  #availableInStore: boolean = false;
  get availableInStore(): boolean {
    return this.#availableInStore;
  }
  set availableInStore(value: unknown) {
    this.#availableInStore = !!value;
  }
  //#endregion

  //#region category
  #category: string | null = null;
  get category(): string | null {
    return this.#category;
  }
  set category(value: unknown) {
    this.#category = toStringOrNull(value);
  }
  //#endregion

  //#region closeout
  #closeout: boolean = false;
  get closeout(): boolean {
    return this.#closeout;
  }
  set closeout(value: unknown) {
    this.#closeout = !!value;
  }
  //#endregion

  //#region currentPrice
  #currentPrice: number | null = null;
  get currentPrice(): number | null {
    return this.#currentPrice;
  }
  set currentPrice(value: unknown) {
    this.#currentPrice = toPriceOrNull(value);
  }
  //#endregion

  //#region detail
  #detail: string | null = null;
  get detail(): string | null {
    return this.#detail;
  }
  set detail(value: unknown) {
    this.#detail = toStringOrNull(value);
  }
  //#endregion

  //#region disableAddToCart
  #disableAddToCart: boolean = false;
  get disableAddToCart(): boolean {
    return this.#disableAddToCart;
  }
  set disableAddToCart(value: unknown) {
    this.#disableAddToCart = !!value;
  }
  //#endregion

  //#region discountPrice
  #discountPrice: number | null = null;
  get discountPrice(): number | null {
    return this.#discountPrice;
  }
  set discountPrice(value: unknown) {
    this.#discountPrice = toPriceOrNull(value);
  }
  //#endregion

  //#region directShip
  #directShip: boolean = false;
  get directShip(): boolean {
    return this.#directShip;
  }
  set directShip(value: unknown) {
    this.#directShip = !!value;
  }
  //#endregion

  //#region enableNonWarehouseOloQuantityMaxLessInventory
  #enableNonWarehouseOloQuantityMaxLessInventory: boolean = false;
  get enableNonWarehouseOloQuantityMaxLessInventory(): boolean {
    return this.#enableNonWarehouseOloQuantityMaxLessInventory;
  }
  set enableNonWarehouseOloQuantityMaxLessInventory(value: unknown) {
    this.#enableNonWarehouseOloQuantityMaxLessInventory = !!value;
  }
  //#endregion

  //#region fact
  #fact: string | null = null;
  get fact(): string | null {
    return this.#fact;
  }
  set fact(value: unknown) {
    this.#fact = toStringOrNull(value);
  }
  //#endregion

  //#region hasWarehouseInventory
  #hasWarehouseInventory: boolean = false;
  get hasWarehouseInventory(): boolean {
    return this.#hasWarehouseInventory;
  }
  set hasWarehouseInventory(value: unknown) {
    this.#hasWarehouseInventory = !!value;
  }
  //#endregion

  //#region hideAddToCart
  #hideAddToCart: boolean = false;
  get hideAddToCart(): boolean {
    return this.#hideAddToCart;
  }
  set hideAddToCart(value: unknown) {
    this.#hideAddToCart = !!value;
  }
  //#endregion

  //#region hideInventory
  #hideInventory: boolean = false;
  get hideInventory(): boolean {
    return this.#hideInventory;
  }
  set hideInventory(value: unknown) {
    this.#hideInventory = !!value;
  }
  //#endregion

  //#region id
  #id: Guid | null = null;
  get id(): Guid | null {
    return this.#id;
  }
  set id(value: unknown) {
    this.#id = toGuidOrNull(value);
  }
  //#endregion

  //#region limitedAvailability
  #limitedAvailability: boolean = false;
  get limitedAvailability(): boolean {
    return this.#limitedAvailability;
  }
  set limitedAvailability(value: unknown) {
    this.#limitedAvailability = !!value;
  }
  //#endregion

  //#region lottery
  #lottery: boolean = false;
  get lottery(): boolean {
    return this.#lottery;
  }
  set lottery(value: unknown) {
    this.#lottery = !!value;
  }
  //#endregion

  //#region luxury
  #luxury: boolean = false;
  get luxury(): boolean {
    return this.#luxury;
  }
  set luxury(value: unknown) {
    this.#luxury = !!value;
  }
  //#endregion

  //#region new
  #new: boolean = false;
  get new(): boolean {
    return this.#new;
  }
  set new(value: unknown) {
    this.#new = !!value;
  }
  //#endregion

  //#region nonWarehouseOloQuantityMaxLessInventory
  #nonWarehouseOloQuantityMaxLessInventory: number | null = null;
  get nonWarehouseOloQuantityMaxLessInventory(): number | null {
    return this.#nonWarehouseOloQuantityMaxLessInventory;
  }
  set nonWarehouseOloQuantityMaxLessInventory(value: unknown) {
    this.#nonWarehouseOloQuantityMaxLessInventory = toNonNegativeIntegerOrNull(value);
  }
  //#endregion

  //#region onlineOnly
  #onlineOnly: boolean = false;
  get onlineOnly(): boolean {
    return this.#onlineOnly;
  }
  set onlineOnly(value: unknown) {
    this.#onlineOnly = !!value;
  }
  //#endregion

  //#region onSale
  #onSale: boolean = false;
  get onSale(): boolean {
    return this.#onSale;
  }
  set onSale(value: unknown) {
    this.#onSale = !!value;
  }
  //#endregion

  //#region productId
  #productId: string | null = null;
  get productId(): string | null {
    return this.#productId;
  }
  set productId(value: unknown) {
    this.#productId = toStringOrNull(value);
  }
  //#endregion

  //#region productImageAlt
  #productImageAlt: string | null = null;
  get productImageAlt(): string | null {
    return this.#productImageAlt;
  }
  set productImageAlt(value: unknown) {
    this.#productImageAlt = toStringOrNull(value);
  }
  //#endregion

  //#region productImageUrl
  #productImageUrl: string | null = null;
  get productImageUrl(): HttpUrlString | null {
    const url = this.#productImageUrl;
    return url ? toHttpUrlStringOrNull(url, this.#group.url) : null;
  }
  set productImageUrl(value: unknown) {
    this.#productImageUrl = toStringOrNull(value);
  }
  //#endregion

  //#region productLabelId
  #productLabelId: number | null = null;
  get productLabelId(): number | null {
    return this.#productLabelId;
  }
  set productLabelId(value: unknown) {
    this.#productLabelId = toNonNegativeIntegerOrNull(value);
  }
  //#endregion

  //#region productMessages
  #productMessages: readonly string[] = Object.freeze([]);
  get productMessages(): readonly string[] {
    return this.#productMessages;
  }
  set productMessages(value: unknown) {
    this.#productMessages = toStringArray(value);
  }
  //#endregion

  //#region productName
  #productName: string = '';
  get productName(): string {
    return this.#productName;
  }
  set productName(value: unknown) {
    this.#productName = toString(value);
  }
  //#endregion

  //#region proof
  #proof: number | null = null;
  get proof(): number | null {
    return this.#proof;
  }
  set proof(value: unknown) {
    this.#proof = toNonNegativeIntegerOrNull(value);
  }
  //#endregion

  //#region quantityMax
  #quantityMax: number | null = null;
  get quantityMax(): number | null {
    return this.#quantityMax;
  }
  set quantityMax(value: unknown) {
    this.#quantityMax = toNonNegativeIntegerOrNull(value);
  }
  //#endregion

  //#region quantityMin
  #quantityMin: number | null = null;
  get quantityMin(): number | null {
    return this.#quantityMin;
  }
  set quantityMin(value: unknown) {
    this.#quantityMin = toNonNegativeIntegerOrNull(value);
  }
  //#endregion

  //#region retailPrice
  #retailPrice: number | null = null;
  get retailPrice(): number | null {
    return this.#retailPrice;
  }
  set retailPrice(value: unknown) {
    this.#retailPrice = toPriceOrNull(value);
  }
  //#endregion

  //#region size
  #size: string | null = null;
  get size(): string | null {
    return this.#size;
  }
  set size(value: unknown) {
    this.#size = toStringOrNull(value);
  }
  //#endregion

  //#region specialPackaging
  #specialPackaging: boolean = false;
  get specialPackaging(): boolean {
    return this.#specialPackaging;
  }
  set specialPackaging(value: unknown) {
    this.#specialPackaging = !!value;
  }
  //#endregion

  //#region storeOnly
  #storeOnly: boolean = false;
  get storeOnly(): boolean {
    return this.#storeOnly;
  }
  set storeOnly(value: unknown) {
    this.#storeOnly = !!value;
  }
  //#endregion

  //#region type
  #type: string | null = null;
  get type(): string | null {
    return this.#type;
  }
  set type(value: unknown) {
    this.#type = toStringOrNull(value);
  }
  //#endregion

  //#region url
  #url: string | null = null;
  get url(): HttpUrlString {
    const group = this.#group;
    const groupUrl = group.url;
    const override = this.#url;
    let url: URL | HttpUrlString | null;
    if (override && (url = toHttpUrlStringOrNull(override, groupUrl))) {
      return url;
    }
    url = new URL(groupUrl);
    const params = url.searchParams;
    if (!params.has('productSize')) {
      const index = group.products.indexOf(this);
      if (index >= 0) {
        params.set('productSize', String(index));
      }
    }
    return url.href as HttpUrlString;
  }
  set url(value: unknown) {
    this.#url = toStringOrNull(value);
  }
  //#endregion

  //#region warehouseDelivery
  #warehouseDelivery: boolean = false;
  get warehouseDelivery(): boolean {
    return this.#warehouseDelivery;
  }
  set warehouseDelivery(value: unknown) {
    this.#warehouseDelivery = !!value;
  }
  //#endregion

  //#region warehouseOloQuantityMaxLessInventory
  #warehouseOloQuantityMaxLessInventory: number | null = null;
  get warehouseOloQuantityMaxLessInventory(): number | null {
    return this.#warehouseOloQuantityMaxLessInventory;
  }
  set warehouseOloQuantityMaxLessInventory(value: unknown) {
    this.#warehouseOloQuantityMaxLessInventory = toNonNegativeIntegerOrNull(value);
  }
  //#endregion

  //#region warehouseOnlineOrderable
  #warehouseOnlineOrderable: boolean = false;
  get warehouseOnlineOrderable(): boolean {
    return this.#warehouseOnlineOrderable;
  }
  set warehouseOnlineOrderable(value: unknown) {
    this.#warehouseOnlineOrderable = !!value;
  }
  //#endregion

  //#region warehouseOnly
  #warehouseOnly: boolean = false;
  get warehouseOnly(): boolean {
    return this.#warehouseOnly;
  }
  set warehouseOnly(value: unknown) {
    this.#warehouseOnly = !!value;
  }
  //#endregion

  toJSON() {
    return classInstanceToJSON<Product>(this, productPropertyKeys);
  }
}

const productPropertyKeys: ReadonlySet<ProductPropertyKey> = (() => {
  const keys = new Set(Reflect.ownKeys(Product.prototype) as ('constructor' | keyof Product)[]);
  keys.delete('constructor');
  keys.delete('toJSON');

  const descriptor = Object.freeze({ enumerable: true });
  const descriptors = Object.create(null);
  for (const key of keys) {
    descriptors[key] = descriptor;
  }
  Object.defineProperties(Product.prototype, descriptors);

  return keys as ReadonlySet<ProductPropertyKey>;
})();

Object.freeze(Product);
Object.freeze(Product.prototype);

export type ProductProperties = {
  -readonly [K in ProductPropertyKey]+?: unknown;
};

export type ProductPropertyKey = NonMethodPropertyKey<Product>;
