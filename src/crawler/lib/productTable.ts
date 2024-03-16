import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import type { Product } from '../../core/classes/product';
import type { ProductGroup } from '../../core/classes/productGroup';
import type { KeyByValueType } from '../../core/types';

import { DynamoDBClient, BatchWriteItemCommand } from '@aws-sdk/client-dynamodb';
import { env } from '../../core/helpers/env';

const client = new DynamoDBClient();

const PRODUCT_TABLE_NAME = env('PRODUCT_TABLE_NAME');

function attribute<
  Key extends PropertyKey,
  Type extends Exclude<keyof AttributeValue, '$unknown'>
>(
  key: Key,
  type: Type,
  value: NonNullable<AttributeValue[Type]>
): { [K in Key]: Exclude<AttributeValue, { [T in Type]+?: undefined }> } {
  return { [key]: { [type]: value } } as any;
}

function boolean<Key extends KeyByValueType<Product, boolean>>(
  key: Key,
  product: Product
): { [K in Key]: AttributeValue.BOOLMember } {
  return attribute(key, 'BOOL', product[key]);
}

function number<Key extends KeyByValueType<Product, number | null>>(
  key: Key,
  product: Product
): { [K in Key]: AttributeValue.NMember | AttributeValue.NULLMember } {
  const value = product[key];
  return value == null ? NULL(key) : attribute(key, 'N', `${value}`);
}

function NULL<Key extends PropertyKey>(key: Key): { [K in Key]: AttributeValue.NULLMember } {
  return attribute(key, 'NULL', true);
}

function string<Key extends KeyByValueType<Product, string | null>>(
  key: Key,
  product: Product
): { [K in Key]: AttributeValue.SMember | AttributeValue.NULLMember } {
  const value = product[key];
  return value ? attribute(key, 'S', value) : NULL(key);
}

function stringSet<Key extends KeyByValueType<Product, readonly string[]>>(
  key: Key,
  product: Product
): { [K in Key]: AttributeValue.SSMember | AttributeValue.NULLMember } {
  const values = product[key];
  return Array.isArray(values) && values.length
    ? attribute(key, 'SS', values.slice())
    : NULL(key);
}

export async function saveProductGroup(productGroup: ProductGroup): Promise<void> {
  await client.send(new BatchWriteItemCommand({
    RequestItems: {
      [PRODUCT_TABLE_NAME]: productGroup.products.map((product) => ({
        PutRequest: {
          Item: {
            ...boolean('availableInStore', product),
            ...string('category', product),
            ...boolean('closeout', product),
            ...number('currentPrice', product),
            ...string('detail', product),
            ...boolean('disableAddToCart', product),
            ...number('discountPrice', product),
            ...boolean('directShip', product),
            ...boolean('enableNonWarehouseOloQuantityMaxLessInventory', product),
            ...string('fact', product),
            ...stringSet('flavors', product),
            ...boolean('hasWarehouseInventory', product),
            ...boolean('hideAddToCart', product),
            ...boolean('hideInventory', product),
            ...string('id', product),
            ...boolean('limitedAvailability', product),
            ...boolean('lottery', product),
            ...boolean('luxury', product),
            ...boolean('new', product),
            ...number('nonWarehouseOloQuantityMaxLessInventory', product),
            ...boolean('onlineOnly', product),
            ...boolean('onSale', product),
            ...string('productId', product),
            ...string('productImageAlt', product),
            ...string('productImageUrl', product),
            ...number('productLabelId', product),
            ...stringSet('productMessages', product),
            ...string('productName', product),
            ...number('proof', product),
            ...number('quantityMax', product),
            ...number('quantityMin', product),
            ...number('retailPrice', product),
            ...string('size', product),
            ...boolean('specialPackaging', product),
            ...boolean('storeOnly', product),
            ...string('type', product),
            ...string('url', product),
            ...boolean('warehouseDelivery', product),
            ...number('warehouseOloQuantityMaxLessInventory', product),
            ...boolean('warehouseOnlineOrderable', product),
            ...boolean('warehouseOnly', product),
          },
        },
      })),
    },
  }));
}
