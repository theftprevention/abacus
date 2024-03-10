import type { AttributeValue } from '@aws-sdk/client-dynamodb';

const attributeTypes = new Map<keyof AttributeValue, (value: unknown) => ParsedAttributeValue>([
  // string
  ['S', identity],
  // number
  ['N', Number],
  // binary
  ['B', identity],
  // string set
  ['SS', identity],
  // number set
  ['NS', (value: any) => Array.from(value, Number)],
  // binary set
  ['BS', identity],
  // map
  ['M', parseAttributeValueMap as any],
  // list
  ['L', parseAttributeValueList as any],
  // null
  ['NULL', () => null],
  // boolean
  ['BOOL', identity],
]);

export function dynamoDBItemToObject<T extends object = Record<string, unknown>>(
  item: Record<string, AttributeValue>
): T {
  return parseAttributeValueMap(item) as T;
}

const hasOwnProperty = Function.prototype.call.bind(Object.prototype.hasOwnProperty) as {
  (target: object, key: PropertyKey): boolean;
};

function identity(value: any) {
  return value;
}

function parseAttributeValue(
  attributeValue: AttributeValue | null | undefined
): ParsedAttributeValue {
  if (attributeValue && typeof attributeValue === 'object') {
    for (const [typeKey, transform] of attributeTypes) {
      if (hasOwnProperty(attributeValue, typeKey)) {
        return transform(attributeValue[typeKey]);
      }
    }
  }
  return void 0;
}

function parseAttributeValueList(list: AttributeValue[]): unknown[] {
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

function parseAttributeValueMap(
  map: Record<string, AttributeValue>
): Record<string, unknown> {
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

type ParsedAttributeValue<
  Attribute extends AttributeValue = AttributeValue
> = Attribute extends AttributeValue.NMember
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
  ? undefined
  : Exclude<Attribute[keyof AttributeValue], undefined>;
