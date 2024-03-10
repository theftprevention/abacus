export type ArrayElement<T> = T extends ArrayLike<infer E> ? E : never;

export type ArrayKey<T> = KeyByValueType<T, readonly unknown[]>;

export type Guid = `${string}-${string}-${string}-${string}-${string}`;

export type KeyByValueType<T, V> = {
  [K in keyof T]-?: [Extract<T[K], V>] extends [never] ? never : K;
}[keyof T];

export type NonMethodPropertyKey<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];

export type UrlString = `https://${string}`;
