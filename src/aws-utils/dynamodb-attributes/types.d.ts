import type { AttributeValue } from '@aws-sdk/client-dynamodb';

export type AttributeType<Attribute extends AttributeValue = AttributeValue> =
  Attribute extends AttributeValue
    ? {
        [K in keyof Attribute]-?: [Exclude<Attribute[K], undefined>] extends [never] ? never : K;
      }[keyof Attribute]
    : never;

export type AttributeValueList = AttributeValue[];

export type AttributeValueMap = Record<string, AttributeValue>;

export type BinaryAttributeValue<T extends Uint8Array = Uint8Array> =
  TypedAttributeValue<AttributeValue.BMember, T>;

export type BinarySetAttributeValue<T extends Uint8Array[] = Uint8Array[]> =
  TypedAttributeValue<AttributeValue.BSMember, T>;

export type BooleanAttributeValue<T extends boolean = boolean> =
  TypedAttributeValue<AttributeValue.BOOLMember, T>;

export type KnownAttributeType<Attribute extends KnownAttributeValue = KnownAttributeValue> =
  AttributeType<Attribute>;

export type KnownAttributeValue = Exclude<AttributeValue, AttributeValue.$UnknownMember>;

export type ListAttributeValue<T extends AttributeValueList = AttributeValueList> =
  TypedAttributeValue<AttributeValue.LMember, T>;

export type MapAttributeValue<T extends AttributeValueMap = AttributeValueMap> =
  TypedAttributeValue<AttributeValue.MMember, T>;

export type NullAttributeValue = TypedAttributeValue<AttributeValue.NULLMember, true>;

export type NumberAttributeValue<T extends `${bigint | number}` = `${bigint | number}`> =
  TypedAttributeValue<AttributeValue.NMember, `${T}`>;

export type NumberSetAttributeValue<T extends `${bigint | number}`[] = `${bigint | number}`[]> =
  TypedAttributeValue<AttributeValue.NSMember, T>;

export type StringAttributeValue<T extends string = string> =
  TypedAttributeValue<AttributeValue.SMember, T>;

export type StringSetAttributeValue<T extends string[] = string[]> =
  TypedAttributeValue<AttributeValue.SSMember, T>;

export type UnknownAttributeType = {
  [K in keyof AttributeValue.$UnknownMember]-?:
    [Exclude<AttributeValue.$UnknownMember[K], undefined>] extends [never] ? never : K;
}[keyof AttributeValue.$UnknownMember];

export type { ParseAttributeValue, ParsedAttributeValue } from './parsing';

type TypedAttributeValue<
  Attribute extends AttributeValue,
  Value extends Exclude<Attribute[Exclude<keyof Attribute, '$unknown'>], undefined>
> = Record<
  {
    [Key in keyof Attribute]-?: [Attribute[Key]] extends [undefined] ? never : Key;
  }[Exclude<keyof Attribute, '$unknown'>],
  Value
>;
