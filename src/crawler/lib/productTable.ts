import type { ProductGroup } from '../../core/classes/productGroup';

import { DynamoDB } from 'aws-sdk';
import { env } from '../../core/helpers/env';

const ddbDocumentClient = new DynamoDB.DocumentClient();

const PRODUCT_TABLE_NAME = env('PRODUCT_TABLE_NAME');

export async function saveProductGroup(productGroup: ProductGroup): Promise<void> {
  await ddbDocumentClient.batchWrite({
    RequestItems: {
      [PRODUCT_TABLE_NAME]: productGroup.products.map((product) => ({
        PutRequest: {
          Item: product.toJSON(),
        },
      })),
    },
  }).promise();
}
