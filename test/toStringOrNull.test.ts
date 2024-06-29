import { toStringOrNull } from '../src/common/toStringOrNull';

describe('toStringOrNull()', () => {
  it('should return the correct value', () => {
    expect(toStringOrNull(42.5)).toBe('42.5');
    expect(toStringOrNull('42.5')).toBe('42.5');
    expect(toStringOrNull('')).toBe(null);
    expect(toStringOrNull(0)).toBe('0');
    expect(toStringOrNull(false)).toBe('false');
    expect(toStringOrNull(null)).toBe(null);
    expect(toStringOrNull(void 0)).toBe(null);
    expect(toStringOrNull({ a: 'x', b: 'y' })).toBe('[object Object]');
  });
});
