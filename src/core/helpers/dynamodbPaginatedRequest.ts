import type { DynamoDB, Request } from 'aws-sdk';

import { awsPaginatedRequest } from './awsPaginatedRequest';

export function dynamodbPaginatedRequest<Input extends DynamoDBPaginatedRequestInput>(
  boundApiMethod: BoundApiMethod<Input>,
  input: NoInfer<Input>,
  limit?: number
): Promise<DynamoDB.DocumentClient.AttributeMap[]> {
  return awsPaginatedRequest(
    boundApiMethod,
    input,
    'Items',
    'LastEvaluatedKey',
    'ExclusiveStartKey',
    limit
  );
}

interface BoundApiMethod<in Input extends DynamoDBPaginatedRequestInput> {
  (input: Input, ...args: any[]): Request<DynamoDBPaginatedRequestOutput, any>;
}

interface DynamoDBPaginatedRequestInput {
  ExclusiveStartKey?: DynamoDB.DocumentClient.Key;
}

interface DynamoDBPaginatedRequestOutput {
  Items?: DynamoDB.DocumentClient.ItemList;
  LastEvaluatedKey?: DynamoDB.DocumentClient.Key;
}
