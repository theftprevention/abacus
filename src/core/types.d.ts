export type ArrayElement<T> = T extends ArrayLike<infer E> ? E : never;

export type ArrayKey<T> = KeyByValueType<T, readonly unknown[] | undefined>;

export type Guid = `${string}-${string}-${string}-${string}-${string}`;

export type KeyByValueType<T, V> = {
  [K in keyof T]-?: T[K] extends V
    ? K
    : never;
}[keyof T];

export type NonMethodPropertyKey<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];

export type UrlString = `https://${string}`;
