export type ArrayElement<T> = T extends ArrayLike<infer E> ? E : never;

export type ArrayKey<T> = KeyByValueType<T, readonly unknown[] | undefined>;

export type ArrayLikeToArray<T extends ArrayLike<unknown>> = T extends readonly unknown[]
  ? T
  : ArrayLikeToArray_Internal<T>;

type ArrayLikeToArray_Internal<
  TArrayLike extends ArrayLike<unknown>,
  TPassedLengths extends number = never,
  TResult extends TArrayLike[number][] = []
> = TArrayLike extends ArrayLike<unknown>
  ? number extends TArrayLike['length']
    ? [
        ...TResult,
        ...(
          number extends keyof TArrayLike
            ? TArrayLike[number]
            : TArrayLike[Extract<keyof TArrayLike, number>] | undefined
        )[],
      ]
    : TResult['length'] extends TArrayLike['length']
    ? [Exclude<TArrayLike['length'], TPassedLengths | TResult['length']>] extends [never]
      ? TResult
      : ArrayLikeToArray_Internal<
          TArrayLike,
          TPassedLengths | TResult['length'],
          [...TResult, TArrayLike[TResult['length']]?]
        >
    : ArrayLikeToArray_Internal<
        TArrayLike,
        TPassedLengths,
        [TPassedLengths] extends [never]
          ? [...TResult, TArrayLike[TResult['length']]]
          : [...TResult, TArrayLike[TResult['length']]?]
      >
  : never;

export type ArrayMatchWritability<
  TTarget extends readonly unknown[],
  TSource extends readonly unknown[]
> = TSource extends unknown[]
  ? TTarget extends unknown[]
    ? TTarget
    : { -readonly [I in keyof TTarget]: TTarget[I] }
  : TTarget extends unknown[]
  ? Readonly<TTarget>
  : TTarget;

export type EmptyArray<T extends readonly unknown[] = []> = T extends readonly unknown[]
  ? readonly [] extends T
    ? readonly []
    : [] extends T
    ? []
    : never
  : never;

export type Guid = `${string}-${string}-${string}-${string}-${string}`;

export type HttpUrlString = `http${'' | 's'}://${string}`;

export type KeyByValueType<T, V> = {
  [K in keyof T]-?: T[K] extends V
    ? K
    : never;
}[keyof T];

// eslint-disable-next-line @typescript-eslint/no-loss-of-precision
export type NegativeInfinity = -1e+999;

export type NonEmptyArray<
  T extends readonly unknown[] = [unknown, ...unknown[]] | [...unknown[], unknown]
> = T extends readonly unknown[] ? NonEmptyArray_Internal<T, [], T> : never;

type NonEmptyArray_Internal<
  T extends readonly unknown[],
  TTail extends unknown[],
  TOriginal extends readonly unknown[]
> = T extends readonly [unknown, ...unknown[]]
  ? ArrayMatchWritability<T, TOriginal>
  : T extends readonly [...infer THead, infer TLast]
  ? NonEmptyArray_Internal<THead, [TLast, ...TTail], TOriginal>
  : T extends readonly []
  ? TTail extends readonly []
    ? never
    : ArrayMatchWritability<TTail, TOriginal>
  : ArrayElement<T>[] extends T
  ? TTail extends readonly []
    ? ArrayMatchWritability<
        [ArrayElement<T>, ...ArrayElement<T>[]] | [...ArrayElement<T>[], ArrayElement<T>],
        TOriginal
      >
    : ArrayMatchWritability<[...ArrayElement<T>[], ...TTail], TOriginal>
  : T extends readonly [(infer TElement)?, ...infer TRemaining]
  ? (
      | ArrayMatchWritability<[TElement, ...TRemaining], TOriginal>
      | NonEmptyArray_Internal<TRemaining, TTail, TOriginal>
    )
  : never;

export type NonMethodPropertyKey<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

// eslint-disable-next-line @typescript-eslint/no-loss-of-precision
export type PositiveInfinity = 1e+999;

export type ToArray<T extends ArrayLike<unknown> | Iterable<unknown>> = T extends ArrayLike<unknown>
  ? ArrayLikeToArray<T>
  : T extends Iterable<infer U>
  ? U[]
  : never;

export type Writable<T> = { -readonly [K in keyof T]: T[K] };
