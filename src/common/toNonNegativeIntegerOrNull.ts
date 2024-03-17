import { toNonNegativeNumberOrNull } from './toNonNegativeNumberOrNull';

export function toNonNegativeIntegerOrNull(value: unknown): number | null {
  const number = toNonNegativeNumberOrNull(value);
  return number == null ? null : Math.trunc(number);
}
