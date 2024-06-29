import { toNonNegativeIntegerOrNull } from '../src/common/toNonNegativeIntegerOrNull';

describe('toNonNegativeIntegerOrNull()', () => {
  it('should return an integer when provided with a valid integer-like value', () => {
    expect(toNonNegativeIntegerOrNull(42.5)).toBe(42);
    expect(toNonNegativeIntegerOrNull('42.5')).toBe(42);
  });

  it('should return null when provided with a value that cannot be interpreted as an integer', () => {
    expect(toNonNegativeIntegerOrNull('hello world')).toBe(null);
    expect(toNonNegativeIntegerOrNull('')).toBe(null);
    expect(toNonNegativeIntegerOrNull(null)).toBe(null);
    expect(toNonNegativeIntegerOrNull(void 0)).toBe(null);
  });
});
