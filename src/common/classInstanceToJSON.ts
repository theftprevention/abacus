import type { NonMethodPropertyKey } from './types';

export function classInstanceToJSON<T extends object>(
  target: T,
  keys: Iterable<NonMethodPropertyKey<T>>
): object {
  const result = {} as { -readonly [K in NonMethodPropertyKey<T>]: T[K] };
  for (const key of keys) {
    result[key] = target[key] as never;
  }
  return result;
}
