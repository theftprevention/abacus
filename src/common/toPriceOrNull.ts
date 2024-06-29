import { toNonNegativeNumberOrNull } from './toNonNegativeNumberOrNull';

const leadingDollarSign = /^\s*\$?\s*/;

export function toPriceOrNull(value: unknown): number | null {
  return toNonNegativeNumberOrNull(
    typeof value === 'string' ? value.replace(leadingDollarSign, '') : value
  );
}
