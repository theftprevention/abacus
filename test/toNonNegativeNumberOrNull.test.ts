import { toNonNegativeNumberOrNull } from '../src/common/toNonNegativeNumberOrNull';

describe('toNonNegativeNumberOrNull()', () => {
  it('should return a number when provided with a valid number-like value', () => {
    expect(toNonNegativeNumberOrNull(42.5)).toBe(42.5);
    expect(toNonNegativeNumberOrNull('42.5')).toBe(42.5);
  });

  it('should return null when provided with a value that cannot be interpreted as a number', () => {
    expect(toNonNegativeNumberOrNull('hello world')).toBe(null);
    expect(toNonNegativeNumberOrNull('')).toBe(null);
    expect(toNonNegativeNumberOrNull(null)).toBe(null);
    expect(toNonNegativeNumberOrNull(void 0)).toBe(null);
  });
});
