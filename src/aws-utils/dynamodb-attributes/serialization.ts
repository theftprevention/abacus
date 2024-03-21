import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import type {
  ArrayElement,
  EmptyArray,
  NegativeInfinity,
  NonEmptyArray,
  PositiveInfinity,
  ToArray,
  Writable,
} from '@abacus/common';
import type {
  AttributeType,
  AttributeValueList,
  AttributeValueMap,
  BinaryAttributeValue,
  BinarySetAttributeValue,
  BooleanAttributeValue,
  KnownAttributeType,
  KnownAttributeValue,
  ListAttributeValue,
  MapAttributeValue,
  NullAttributeValue,
  NumberAttributeValue,
  NumberSetAttributeValue,
  StringAttributeValue,
  StringSetAttributeValue,
} from './types';

import { hasOwnProperty } from '@abacus/common';
import { attributeTypes } from './constants';

const objectPrototype = Object.prototype;

export function toAttributeValue<T>(value: T): ToKnownAttributeValue<T, null>;
export function toAttributeValue<T, Fallback>(
  value: T,
  fallback: Fallback
): ToKnownAttributeValue<T, Fallback>;
export function toAttributeValue<T, Fallback>(
  value: T,
  fallback?: Fallback
): ToKnownAttributeValue<T, Fallback> {
  return unknownToAttributeValue(
    value,
    (arguments.length >= 2 ? fallback : null) as Fallback,
    new WeakSet<object>()
  );
}

export function toAttributeValueMap<T extends object>(value: T): ToAttributeValueMap<T, null>;
export function toAttributeValueMap(value: object): AttributeValueMap | null {
  return value && typeof value === 'object'
    ? membersToAttributeValueMap(
        value instanceof Map ? membersFromMap(value) : membersFromObject(value),
        new WeakSet<object>()
      )
    : null;
}

function* arrayLikeToIterable<T>(source: ArrayLike<T>): Generator<T> {
  let index = 0;
  const length = Math.trunc(Number(source.length));
  while (index < length) {
    yield source[index];
    index++;
  }
}

function attributeValue<Type extends AttributeType>(
  type: Type,
  value: NonNullable<AttributeValue[Type]>
): Exclude<AttributeValue, { [T in Type]+?: undefined }> {
  const attr = Object.create(null);
  attr[type] = value;
  return attr;
}

function iterableToAttributeValue<T extends Iterable<unknown>>(
  value: T,
  visited: WeakSet<object>
): ToKnownAttributeValue<T, null>;
function iterableToAttributeValue(
  value: Iterable<unknown>,
  visited: WeakSet<object>
): AttributeValue | null {
  let setType: SetAttributeType | null | undefined;

  let evaluateSetType: (attribute: KnownAttributeValue) => void = (() => {
    function clearSetType(): null {
      evaluateSetType = () => (void 0);
      setType = null;
      return null;
    }

    function updateSetType(
      attributeType: KnownAttributeType | null
    ): SetAttributeType | null {
      let newSetType: SetAttributeType;
      switch (attributeType) {
        case attributeTypes.BINARY:
          newSetType = attributeTypes.BINARY_SET;
          break;
        case attributeTypes.NUMBER:
          newSetType = attributeTypes.NUMBER_SET;
          break;
        case attributeTypes.STRING:
          newSetType = attributeTypes.STRING_SET;
          break;
        default:
          return clearSetType();
      }
      switch (setType) {
        case void 0:
          setType = newSetType;
          break;
        case newSetType:
          break;
        default:
          return clearSetType();
      }
      return setType;
    };

    function getAttributeType<T extends KnownAttributeValue>(attribute: T): AttributeType<T> | null;
    function getAttributeType(attribute: KnownAttributeValue): KnownAttributeType | null {
      let type: KnownAttributeType | undefined;
      for (const key of Object.getOwnPropertyNames(attribute) as AttributeType[]) {
        if (attributeTypes.includes(key)) {
          if (type || key === attributeTypes.UNKNOWN) {
            return null;
          }
          type = key;
        }
      }
      if (!type) {
        return null;
      }
      if (!updateSetType(type)) {
        return clearSetType();
      }
      return type;
    }

    return (attribute): void => {
      const attributeType = getAttributeType(attribute);
      if (!attributeType) {
        return;
      }
      const elements = new Set<unknown>();
      elements.add(attribute[attributeType]);
      evaluateSetType = (attribute): void => {
        const attributeType = getAttributeType(attribute);
        if (attributeType) {
          const element = attribute[attributeType];
          if (elements.has(element)) {
            elements.clear();
            clearSetType();
          } else {
            elements.add(element);
          }
        }
      };
    };
  })();

  const attributes: KnownAttributeValue[] = [];
  let attribute: KnownAttributeValue | null;
  let index = 0;
  for (const element of value) {
    attribute = unknownToAttributeValue(element, null, visited);
    if (attribute) {
      attributes[index++] = attribute;
      evaluateSetType(attribute);
    }
  }

  if (setType) {
    let elementType: AttributeType<
      | AttributeValue.BMember
      | AttributeValue.NMember
      | AttributeValue.SMember
    >;
    switch (setType) {
      case attributeTypes.BINARY_SET:
        elementType = attributeTypes.BINARY;
        break;
      case attributeTypes.NUMBER_SET:
        elementType = attributeTypes.NUMBER;
        break;
      case attributeTypes.STRING_SET:
        elementType = attributeTypes.STRING;
        break;
      default:
        throw new Error('Unexpected fallthrough');
    }
    return attributeValue(
      setType,
      attributes.map(
        (attribute) => attribute[elementType]
      ) as NonNullable<SetAttribute[SetAttributeType]>
    );
  }

  return attributeValue(attributeTypes.LIST, attributes);
}

function membersFromMap<K, V>(
  map: ReadonlyMap<K, V>
): Generator<[K extends string ? K : K extends bigint | number ? `${K}` : never, V]>;
function* membersFromMap(map: ReadonlyMap<unknown, unknown>): Generator<[string, unknown]> {
  let key: unknown;
  for (const entry of map) {
    [key] = entry;
    switch (typeof key) {
      case 'string':
        yield entry as [string, unknown];
        break;
      case 'number':
        if (key !== key) {
          break;
        }
        // Intentional fallthrough
      case 'bigint':
        yield [String(key), entry[1]];
        break;
    }
  }
}

function* membersFromObject<T extends object>(value: T): Generator<[string & keyof T, T[keyof T]]> {
  let prototype: T | null = value;
  do {
    for (const key of Object.getOwnPropertyNames(prototype) as (string & keyof T)[]) {
      yield [key, value[key]];
    }
  } while ((prototype = Object.getPrototypeOf(prototype)) && prototype !== objectPrototype);
}

function membersToAttributeValueMap<T extends object = Record<PropertyKey, unknown>>(
  members: Iterable<readonly [string & keyof T, T[string & keyof T]]>,
  visited: WeakSet<object>
): ToAttributeValueMap<T, null>;
function membersToAttributeValueMap(
  members: Iterable<readonly [string, unknown]>,
  visited: WeakSet<object>
): AttributeValueMap | null {
  const attributes: AttributeValueMap = Object.create(null);
  let attribute: KnownAttributeValue | null;
  let count = 0;
  for (const [key, value] of members) {
    if (key && typeof key === 'string' && !hasOwnProperty(attributes, key)) {
      attribute = unknownToAttributeValue(value, null, visited);
      if (attribute) {
        attributes[key] = attribute;
        count++;
      }
    }
  }
  return count ? attributes : null;
}

function membersToMapAttributeValue<T extends object>(
  members: Iterable<readonly [string & keyof T, T[string & keyof T]]>,
  visited: WeakSet<object>
): ToMapAttributeValue<T, NullAttributeValue>;
function membersToMapAttributeValue(
  members: Iterable<readonly [string, unknown]>,
  visited: WeakSet<object>
): MapAttributeValue | NullAttributeValue {
  const attributes = membersToAttributeValueMap(members, visited);
  return attributes ? attributeValue(attributeTypes.MAP, attributes) : nullAttributeValue();
}

const nullAttributeValue = attributeValue.bind(
  void 0,
  attributeTypes.NULL,
  true
) as () => NullAttributeValue;

function objectIsArrayLike(value: object): value is ArrayLike<unknown> {
  return 'length' in value;
}

function objectIsIterable(value: object): value is Iterable<unknown> {
  return typeof (value as Record<PropertyKey, any>)[Symbol.iterator] === 'function';
}

function objectToAttributeValue<T extends object>(
  value: T,
  visited: WeakSet<object>
): ToKnownAttributeValue<T, null>;
function objectToAttributeValue(
  value: object,
  visited: WeakSet<object>
): AttributeValue | null {
  if (visited.has(value)) {
    return null;
  }
  visited.add(value);

  if (value instanceof Map) {
    return membersToMapAttributeValue(membersFromMap(value as Map<never, never>), visited);
  }
  if (value instanceof Uint8Array) {
    return value.length
      ? attributeValue(attributeTypes.BINARY, value.slice())
      : nullAttributeValue();
  }

  const iterable = objectIsIterable(value)
    ? value
    : objectIsArrayLike(value)
    ? arrayLikeToIterable(value)
    : null;
  return iterable
    ? iterableToAttributeValue(iterable, visited)
    : membersToMapAttributeValue(membersFromObject(value), visited);
}

function unknownToAttributeValue<T, Fallback>(
  value: T,
  fallback: Fallback,
  visited: WeakSet<object>
): ToKnownAttributeValue<T, Fallback>;
function unknownToAttributeValue<Fallback>(
  value: unknown,
  fallback: Fallback,
  visited: WeakSet<object>
): KnownAttributeValue | Fallback {
  switch (typeof value) {
    case 'bigint':
      return attributeValue(attributeTypes.NUMBER, String(value));
    case 'boolean':
      return attributeValue(attributeTypes.BOOLEAN, value);
    case 'object':
      return (value && objectToAttributeValue(value, visited)) || nullAttributeValue();
    case 'string':
      return value ? attributeValue(attributeTypes.STRING, value) : nullAttributeValue();
    case 'number':
      return Number.isFinite(value)
        ? attributeValue(attributeTypes.NUMBER, `${value}`)
        : nullAttributeValue();
    case 'undefined':
      return nullAttributeValue();
    default:
      return fallback;
  }
}

export type ToKnownAttributeValue<T, Fallback = never> = unknown extends T
  ? KnownAttributeValue | Fallback
  : T extends null | void | '' | readonly []
  ? NullAttributeValue
  : T extends boolean
  ? BooleanAttributeValue<T>
  : T extends bigint
  ? NumberAttributeValue<`${T}`>
  : T extends number
  ? ToNumberAttributeValue<T>
  : T extends string
  ? StringAttributeValue<T>
  : T extends symbol
  ? Fallback
  : T extends Uint8Array
  ? BinaryAttributeValue<T>
  : T extends NumberSetAttributeValueSource
  ? ToNumberSetAttributeValue<T>
  : T extends StringSetAttributeValueSource
  ? ToStringSetAttributeValue<T>
  : T extends BinarySetAttributeValueSource
  ? ToBinarySetAttributeValue<T>
  : T extends ArrayLike<unknown> | Iterable<unknown>
  ? ToListAttributeValue<T>
  : T extends object
  ? ToMapAttributeValue<T, Fallback>
  : Fallback;

type BinarySetAttributeValueSource = SetAttributeValueSource<Uint8Array>;

type NumberAttributeValueSource = bigint | number;

type NumberSetAttributeValueSource = SetAttributeValueSource<bigint | number>;

type NumberSetAttributeValueSourceArray = readonly NumberAttributeValueSource[];

type SetAttribute = AttributeValue.BSMember | AttributeValue.NSMember | AttributeValue.SSMember;

type SetAttributeValueSource<T> = ArrayLike<T> | Iterable<T>;

type SetAttributeType = AttributeType<SetAttribute>;

type StringSetAttributeValueSource = SetAttributeValueSource<string>;

type ToAttributeValueList<TArray extends readonly unknown[]> =
  TArray extends readonly []
    ? []
    : unknown extends ArrayElement<TArray>
    ? AttributeValueList
    : TArray extends readonly [infer Element, ...infer Remaining]
    ? ToAttributeValueList_HandleElement<Remaining, Element, 'first'>
    : TArray extends readonly [...infer Remaining, infer Element]
    ? ToAttributeValueList_HandleElement<Remaining, Element, 'last'>
    : ArrayElement<TArray>[] extends TArray
    ? ToKnownAttributeValue<ArrayElement<TArray>, never>[]
    : TArray extends readonly [(infer Element)?, ...infer Remaining]
    ? ToAttributeValueList_HandleElement<Remaining, Element, 'optional'>
    : never;

type ToAttributeValueList_HandleElement<
  TRemaining extends readonly unknown[],
  TElement,
  TPosition extends 'first' | 'last' | 'optional'
> = [ToKnownAttributeValue<TElement, never>] extends [never]
  ? ToAttributeValueList<TRemaining>
  : (
      | (
          TPosition extends 'last'
            ? [...ToAttributeValueList<TRemaining>, ToKnownAttributeValue<TElement, never>]
            : [ToKnownAttributeValue<TElement, never>, ...ToAttributeValueList<TRemaining>]
        )
      | (TPosition extends 'optional' ? ToAttributeValueList<TRemaining> : never)
    );

type ToAttributeValueMap<T extends object, Fallback> = T extends Function
  ? Fallback
  : T extends ReadonlyMap<infer K, infer V>
  ? Record<`${Exclude<Extract<K, bigint | number | string>, ''>}`, ToKnownAttributeValue<V>>
  : [keyof T] extends [never]
  ? string extends T
    ? Fallback
    : AttributeValueMap
  : [ToAttributeValueMap_Keys<T>] extends [never]
  ? Fallback
  : { [K in ToAttributeValueMap_Keys<T>]: ToKnownAttributeValue<T[K], never> };

type ToAttributeValueMap_Keys<T extends object> = {
  [K in keyof T]-?: K extends string
    ? K extends ''
      ? never
      : [ToKnownAttributeValue<T[K], never>] extends [never]
      ? never
      : K
    : never;
}[keyof T];

type ToBinarySetAttributeValue<T extends SetAttributeValueSource<Uint8Array>> =
  Writable<ToArray<T>> extends (infer TArray)
    ? TArray extends Uint8Array[]
      ? (
          | ([EmptyArray<TArray>] extends [never] ? never : NullAttributeValue)
          | ([NonEmptyArray<TArray>] extends [never] ? never : BinarySetAttributeValue<NonEmptyArray<TArray>>)
        )
      : never
    : never;

type ToListAttributeValue<T extends ArrayLike<unknown> | Iterable<unknown>> =
  ToArray<T> extends (infer TArray)
    ? TArray extends readonly unknown[]
      ? (
          | ([EmptyArray<TArray>] extends [never] ? never : NullAttributeValue)
          | ([NonEmptyArray<TArray>] extends [never] ? never : ListAttributeValue<ToAttributeValueList<NonEmptyArray<TArray>>>)
        )
      : never
    : never;

type ToMapAttributeValue<T extends object, Fallback> =
  ToAttributeValueMap<T, null> extends (infer Attributes)
    ? Attributes extends AttributeValueMap
      ? [keyof Attributes] extends [never]
        ? Fallback
        : (
            | MapAttributeValue<Attributes>
            | (Omit<{ a: null }, 'a'> extends Attributes ? Fallback : never)
          )
      : Fallback
    : never;

type ToNumberAttributeValue<T extends number> = T extends number
  ? number extends T
    ? NumberAttributeValue | NullAttributeValue
    : T extends NegativeInfinity | PositiveInfinity
    ? NullAttributeValue
    : NumberAttributeValue<`${T}`>
  : never;

type ToNumberSetArray<TArray extends readonly unknown[]> =
  TArray extends NumberSetAttributeValueSourceArray
    ? TArray extends readonly []
      ? []
      : TArray extends readonly [infer Element, ...infer Remaining]
      ? ToNumberSetArray_HandleElement<Remaining, Element, 'first'>
      : TArray extends readonly [...infer Remaining, infer Element]
      ? ToNumberSetArray_HandleElement<Remaining, Element, 'last'>
      : ArrayElement<TArray>[] extends TArray
      ? `${ArrayElement<TArray>}`[]
      : TArray extends readonly [(infer Element)?, ...infer Remaining]
      ? ToNumberSetArray_HandleElement<Remaining, Element, 'optional'>
      : never
    : never;

type ToNumberSetArray_HandleElement<
  TRemaining extends readonly unknown[],
  TElement,
  TPosition extends 'first' | 'last' | 'optional'
> = TElement extends NumberAttributeValueSource
  ? (
      | (
          TPosition extends 'last'
            ? [...ToNumberSetArray<TRemaining>, `${TElement}`]
            : [`${TElement}`, ...ToNumberSetArray<TRemaining>]
        )
      | (TPosition extends 'optional' ? ToNumberSetArray<TRemaining> : never)
    )
  : never;

type ToNumberSetAttributeValue<T extends NumberSetAttributeValueSource> =
  Writable<ToNumberSetArray<ToArray<T>>> extends (infer TArray)
    ? TArray extends `${bigint | number}`[]
      ? (
          | ([EmptyArray<TArray>] extends [never] ? never : NullAttributeValue)
          | ([NonEmptyArray<TArray>] extends [never] ? never : NumberSetAttributeValue<NonEmptyArray<TArray>>)
        )
      : never
    : never;

type ToStringSetAttributeValue<T extends SetAttributeValueSource<string>> =
  Writable<ToArray<T>> extends (infer TArray)
    ? TArray extends string[]
      ? (
          | ([EmptyArray<TArray>] extends [never] ? never : NullAttributeValue)
          | ([NonEmptyArray<TArray>] extends [never] ? never : StringSetAttributeValue<NonEmptyArray<TArray>>)
        )
      : never
    : never;
