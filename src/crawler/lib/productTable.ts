import type { ProductGroup } from '@abacus/core';

import { DynamoDBClient, BatchWriteItemCommand } from '@aws-sdk/client-dynamodb';
import { toAttributeValueMap } from '@abacus/aws-utils';
import { env } from '@abacus/common';

const client = new DynamoDBClient();

const PRODUCT_TABLE_NAME = env('PRODUCT_TABLE_NAME');

export async function saveProductGroup(productGroup: ProductGroup): Promise<void> {
  const { products } = productGroup;
  if (!products.length) {
    return;
  }
  await client.send(new BatchWriteItemCommand({
    RequestItems: {
      [PRODUCT_TABLE_NAME]: productGroup.products.map((product) => ({
        PutRequest: {
          Item: toAttributeValueMap(product),
        },
      })),
    },
  }));
}
