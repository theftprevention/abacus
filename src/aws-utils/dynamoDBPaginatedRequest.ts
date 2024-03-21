import type {
  DynamoDBClient,
  DynamoDBClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from '@aws-sdk/client-dynamodb';
import type { Command } from '@smithy/types';
import type { AttributeValueMap } from './dynamodb-attributes';

import { awsPaginatedRequest } from './awsPaginatedRequest';

const NEXT_TOKEN_INPUT_KEY = 'ExclusiveStartKey';
type NextTokenInputKey = typeof NEXT_TOKEN_INPUT_KEY;

const NEXT_TOKEN_OUTPUT_KEY = 'LastEvaluatedKey';
type NextTokenOutputKey = typeof NEXT_TOKEN_OUTPUT_KEY;

const RESULT_LIST_KEY = 'Items';
type ResultListKey = typeof RESULT_LIST_KEY;

export function dynamoDBPaginatedRequest<Input extends DynamoDBPaginatedRequestInput>(
  client: DynamoDBClient | (new () => DynamoDBClient),
  command: DynamoDBPaginatedRequestCommand<Input>,
  inputTemplate: Input | ({} extends Input ? null | undefined : never),
  limit?: number | null
): Promise<AttributeValueMap[]>;
export function dynamoDBPaginatedRequest(
  client: DynamoDBClient | (new () => DynamoDBClient),
  command: DynamoDBPaginatedRequestCommand,
  inputTemplate: DynamoDBPaginatedRequestInput,
  limit?: number | null
): Promise<AttributeValueMap[]> {
  return awsPaginatedRequest(
    client,
    command,
    inputTemplate,
    RESULT_LIST_KEY,
    NEXT_TOKEN_INPUT_KEY,
    NEXT_TOKEN_OUTPUT_KEY,
    limit
  );
}

interface DynamoDBPaginatedRequestCommand<
  Input extends DynamoDBPaginatedRequestInput = DynamoDBPaginatedRequestInput
> {
  new (input: Input): Command<
    ServiceInputTypes,
    Input,
    ServiceOutputTypes,
    DynamoDBPaginatedRequestOutput,
    DynamoDBClientResolvedConfig
  >;
}

type DynamoDBPaginatedRequestInput = FilterPayloadTypes<ServiceInputTypes, NextTokenInputKey>;

type DynamoDBPaginatedRequestOutput = FilterPayloadTypes<
  ServiceOutputTypes,
  NextTokenOutputKey | ResultListKey
>;

type FilterPayloadTypes<Payload extends object, Keys extends PropertyKey> = Payload extends object
  ? [Keys] extends [keyof Payload]
    ? Payload
    : never
  : never;
