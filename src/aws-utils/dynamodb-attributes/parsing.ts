import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import type { AttributeType, AttributeValueList, AttributeValueMap } from './types';

import { hasOwnProperty } from '@abacus/common';
import { attributeTypes } from './constants';

const transformsByType = new Map<AttributeType, (value: unknown) => ParsedAttributeValue>([
  [attributeTypes.STRING, identity],
  [attributeTypes.NUMBER, Number],
  [attributeTypes.BINARY, identity],
  [attributeTypes.STRING_SET, identity],
  [attributeTypes.NUMBER_SET, (value: any) => Array.from(value, Number)],
  [attributeTypes.BINARY_SET, identity],
  [attributeTypes.MAP, parseAttributeValueMap as any],
  [attributeTypes.LIST, parseAttributeValueList as any],
  [attributeTypes.NULL, () => null],
  [attributeTypes.BOOLEAN, identity],
]);

function identity(value: any) {
  return value;
}

export function parseAttributeValue<Attribute>(attribute: Attribute): ParseAttributeValue<Attribute>;
export function parseAttributeValue<Attribute, Fallback>(
  attribute: Attribute,
  fallback: Fallback
): ParseAttributeValue<Attribute, Fallback>;
export function parseAttributeValue<Fallback>(
  attribute: AttributeValue | bigint | boolean | number | string | symbol | null | undefined,
  fallback?: Fallback
): ParsedAttributeValue | Fallback {
  if (attribute && typeof attribute === 'object') {
    for (const [type, transform] of transformsByType) {
      if (hasOwnProperty(attribute, type)) {
        return transform(attribute[type]);
      }
    }
  }
  return fallback;
}

export function parseAttributeValueList<T extends readonly unknown[] = unknown[]>(
  list: AttributeValueList
): T;
export function parseAttributeValueList(list: AttributeValueList): unknown[] {
  const result: unknown[] = [];
  let index = 0;
  let value;
  for (const attributeValue of list) {
    value = parseAttributeValue(attributeValue);
    if (value !== void 0) {
      result[index++] = value;
    }
  }
  return result;
}

export function parseAttributeValueMap<T extends object = Record<string, unknown>>(
  map: AttributeValueMap
): T;
export function parseAttributeValueMap(map: AttributeValueMap): Record<string, unknown> {
  const result: Record<string, unknown> = Object.create(null);
  let value: ParsedAttributeValue;
  for (const key of Object.getOwnPropertyNames(map)) {
    value = parseAttributeValue(map[key]);
    if (value !== void 0) {
      result[key] = value;
    }
  }
  return result;
}

export type ParseAttributeValue<Attribute, Fallback = undefined> =
  Attribute extends AttributeValue.NMember
    ? number
    : Attribute extends AttributeValue.NSMember
    ? number[]
    : Attribute extends AttributeValue.LMember
    ? unknown[]
    : Attribute extends AttributeValue.MMember
    ? Record<string, unknown>
    : Attribute extends AttributeValue.NULLMember
    ? null
    : Attribute extends AttributeValue.$UnknownMember
    ? Fallback
    : Attribute extends AttributeValue
    ? Exclude<Attribute[keyof AttributeValue], undefined>
    : Fallback;

export type ParsedAttributeValue<Fallback = undefined> =
  ParseAttributeValue<AttributeValue, Fallback>;
