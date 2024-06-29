import { toString } from '../src/common/toString';

describe('toString()', () => {
  it('should return the correct value', () => {
    expect(toString(42.5)).toBe('42.5');
    expect(toString('42.5')).toBe('42.5');
    expect(toString('')).toBe('');
    expect(toString(null)).toBe('');
    expect(toString(void 0)).toBe('');
    expect(toString({ a: 'x', b: 'y' })).toBe('[object Object]');
  });
});
