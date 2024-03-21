import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import type { AttributeType } from './types';

const attributeTypesDict = Object.freeze({
  BINARY: 'B',
  BINARY_SET: 'BS',
  BOOLEAN: 'BOOL',
  LIST: 'L',
  MAP: 'M',
  NULL: 'NULL',
  NUMBER: 'N',
  NUMBER_SET: 'NS',
  STRING: 'S',
  STRING_SET: 'SS',
  UNKNOWN: '$unknown',
}) satisfies {
  readonly BINARY: AttributeType<AttributeValue.BMember>;
  readonly BINARY_SET: AttributeType<AttributeValue.BSMember>;
  readonly BOOLEAN: AttributeType<AttributeValue.BOOLMember>;
  readonly LIST: AttributeType<AttributeValue.LMember>;
  readonly MAP: AttributeType<AttributeValue.MMember>;
  readonly NULL: AttributeType<AttributeValue.NULLMember>;
  readonly NUMBER: AttributeType<AttributeValue.NMember>;
  readonly NUMBER_SET: AttributeType<AttributeValue.NSMember>;
  readonly STRING: AttributeType<AttributeValue.SMember>;
  readonly STRING_SET: AttributeType<AttributeValue.SSMember>;
  readonly UNKNOWN: AttributeType<AttributeValue.$UnknownMember>;
};

export const attributeTypes: readonly AttributeType[] & typeof attributeTypesDict = Object.freeze(
  Object.defineProperties(
    (Object.getOwnPropertyNames(attributeTypesDict) as any as (keyof typeof attributeTypesDict)[])
      .map((key) => attributeTypesDict[key]),
    Object.getOwnPropertyDescriptors(attributeTypesDict)
  )
) as any;
