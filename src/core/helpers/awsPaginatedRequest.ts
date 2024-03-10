import type { AWSError, Request } from 'aws-sdk';
import type { ArrayElement, ArrayKey } from '../types';

import { toNonNegativeIntegerOrNull } from './toNonNegativeIntegerOrNull';

export async function awsPaginatedRequest<
  Input extends object,
  Output extends object,
  ResultListKey extends ArrayKey<Output>,
  NextTokenKey extends (keyof Input) & (keyof Output)
>(
  boundApiMethod: BoundApiMethod<Input, Output>,
  input: Input,
  resultListKey: ResultListKey,
  nextTokenKey: NextTokenKey
): Promise<ArrayElement<Output[ResultListKey]>[]>;
export async function awsPaginatedRequest<
  Input extends object,
  Output extends object,
  ResultListKey extends ArrayKey<Output>,
  NextTokenOutputKey extends keyof Output,
  NextTokenInputKey extends keyof Input
>(
  boundApiMethod: BoundApiMethod<Input, Output>,
  input: Input,
  resultListKey: ResultListKey,
  nextTokenOutputKey: NextTokenOutputKey,
  nextTokenInputKey: NextTokenInputKey,
  limit?: number
): Promise<ArrayElement<Output[ResultListKey]>[]>;
export async function awsPaginatedRequest<
  Input extends object,
  Output extends object,
  ResultListKey extends ArrayKey<Output>,
  NextTokenOutputKey extends keyof Output,
  NextTokenInputKey extends keyof Input
>(
  boundApiMethod: BoundApiMethod<Input, Output>,
  input: Input,
  resultListKey: ResultListKey,
  nextTokenOutputKey: NextTokenOutputKey,
  nextTokenInputKey?: NextTokenInputKey,
  limit?: number
): Promise<ArrayElement<Output[ResultListKey]>[]> {
  type Result = ArrayElement<Output[ResultListKey]>;

  let page: Result[] | null;
  let response: Output;
  let resultsCount: number;
  let token: Output[NextTokenOutputKey] | undefined;
  const results: Result[] = [];

  limit = toNonNegativeIntegerOrNull(limit) || Number.POSITIVE_INFINITY;
  if (!nextTokenInputKey) {
    nextTokenInputKey = nextTokenOutputKey as any as NextTokenInputKey;
  }

  do {
    response = await boundApiMethod({
      ...input,
      [nextTokenInputKey]: token,
    }).promise();
    page = toArray(response[resultListKey]);
    token = response[nextTokenOutputKey];
    if (!page || !page.length) {
      continue;
    }
    results.push(...page);
    resultsCount = results.length;
    if (resultsCount === limit) {
      break;
    }
    if (resultsCount > limit) {
      results.splice(limit);
      break;
    }
  } while (token);
  
  return results;
}

function toArray<T>(value: unknown): T[] | null {
  return Array.isArray(value) ? (value as T[]) : null;
}

interface BoundApiMethod<in Input extends object, out Output extends object> {
  (input: Input, callback?: (error: AWSError, data: Output) => void): Request<Output, any>;
}
