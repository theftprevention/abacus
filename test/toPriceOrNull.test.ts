import { toPriceOrNull } from '../src/common/toPriceOrNull';

describe('toPriceOrNull()', () => {
  it('should return a number when provided with a valid price-like value', () => {
    expect(toPriceOrNull(42.5)).toBe(42.5);
    expect(toPriceOrNull('42.5')).toBe(42.5);
    expect(toPriceOrNull('$42.5')).toBe(42.5);
  });

  it('should return null when provided with a value that cannot be interpreted as a price', () => {
    expect(toPriceOrNull('hello world')).toBe(null);
    expect(toPriceOrNull('')).toBe(null);
    expect(toPriceOrNull(null)).toBe(null);
    expect(toPriceOrNull(void 0)).toBe(null);
  });
});
