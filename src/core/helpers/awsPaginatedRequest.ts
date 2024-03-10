import type { Client as IClient, Command, MetadataBearer } from '@smithy/types';
import type { ArrayElement, ArrayKey, KeyByValueType } from '../types';

import { toNonNegativeIntegerOrNull } from './toNonNegativeIntegerOrNull';

export async function awsPaginatedRequest<
  ClientInput extends object,
  ClientOutput extends MetadataBearer,
  ResolvedClientConfiguration,
  Input extends ClientInput,
  Output extends ClientOutput,
  ResultListKey extends ArrayKey<Output>
>(
  client: IClient<ClientInput, ClientOutput, ResolvedClientConfiguration> | (new () => IClient<ClientInput, ClientOutput, ResolvedClientConfiguration>),
  command: new (input: Input) => Command<ClientInput, Input, ClientOutput, Output, ResolvedClientConfiguration>,
  inputTemplate: Input | ({} extends Input ? null | undefined : never),
  resultListKey: ResultListKey,
  nextTokenKey: {
    [K in (keyof Input) & (keyof Output)]: Input[K] extends Output[K]
      ? Output[K] extends Input[K]
        ? K
        : never
      : never;
  }[(keyof Input) & (keyof Output)],
  nextTokenOutputKey?: null,
  limit?: number | null
): Promise<ArrayElement<Output[ResultListKey]>[]>;
export async function awsPaginatedRequest<
  ClientInput extends object,
  ClientOutput extends MetadataBearer,
  ResolvedClientConfiguration,
  Input extends ClientInput,
  Output extends ClientOutput,
  ResultListKey extends ArrayKey<Output>,
  NextTokenInputKey extends keyof Input
>(
  client: IClient<ClientInput, ClientOutput, ResolvedClientConfiguration> | (new () => IClient<ClientInput, ClientOutput, ResolvedClientConfiguration>),
  command: new (input: Input) => Command<ClientInput, Input, ClientOutput, Output, ResolvedClientConfiguration>,
  inputTemplate: Input | ({} extends Input ? null | undefined : never),
  resultListKey: ResultListKey,
  nextTokenInputKey: NextTokenInputKey,
  nextTokenOutputKey: KeyByValueType<Output, Input[NextTokenInputKey]>,
  limit?: number | null
): Promise<ArrayElement<Output[ResultListKey]>[]>;
export async function awsPaginatedRequest<
  ClientInput extends object,
  ClientOutput extends MetadataBearer,
  ResolvedClientConfiguration,
  Input extends ClientInput,
  Output extends ClientOutput,
  ResultListKey extends ArrayKey<Output>,
  NextTokenInputKey extends keyof Input,
  NextTokenOutputKey extends KeyByValueType<Output, Input[NextTokenInputKey]>
>(
  client: IClient<ClientInput, ClientOutput, ResolvedClientConfiguration> | (new () => IClient<ClientInput, ClientOutput, ResolvedClientConfiguration>),
  command: new (input: Input) => Command<ClientInput, Input, ClientOutput, Output, ResolvedClientConfiguration>,
  inputTemplate: Input | ({} extends Input ? null | undefined : never),
  resultListKey: ResultListKey,
  nextTokenInputKey: NextTokenInputKey,
  nextTokenOutputKey?: NextTokenOutputKey | null,
  limit?: number | null
): Promise<ArrayElement<Output[ResultListKey]>[]> {
  type Result = ArrayElement<Output[ResultListKey]>;
  type Token = Input[NextTokenInputKey];

  const input: Input = { ...inputTemplate } as Input;
  const results: Result[] = [];
  let output: Output;
  let page: readonly Result[] | null | undefined;
  let resultsCount: number;
  let token: Token | undefined;

  if (typeof client === 'function') {
    client = new client();
  }
  limit = toNonNegativeIntegerOrNull(limit) || Number.POSITIVE_INFINITY;
  if (!nextTokenOutputKey) {
    nextTokenOutputKey = nextTokenInputKey as any as NextTokenOutputKey;
  }

  do {
    if (token) {
      input[nextTokenInputKey] = token;
    }
    output = await client.send(new command(input));
    page = toArray(output[resultListKey]);
    token = output[nextTokenOutputKey] as Token | undefined;
    if (page && page.length) {
      results.push(...page);
      resultsCount = results.length;
      if (resultsCount === limit) {
        break;
      }
      if (resultsCount > limit) {
        results.splice(limit);
        break;
      }
    }
  } while (token);

  return results;
}

function toArray<T>(value: unknown): readonly T[] | null {
  return Array.isArray(value) ? (value as T[]) : null;
}
