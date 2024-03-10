import { toNonNegativeNumberOrNull } from './toNonNegativeNumberOrNull';

export function toPriceOrNull(value: unknown): number | null {
  return toNonNegativeNumberOrNull(value);
}
