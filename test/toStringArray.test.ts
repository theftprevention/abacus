import { toStringArray } from '../src/common/toStringArray';

describe('toStringArray()', () => {
  it('should return the correct value', () => {
    expect(toStringArray(42.5)).toStrictEqual([]);
    expect(toStringArray('42.5')).toStrictEqual(['42.5']);
    expect(toStringArray('')).toStrictEqual([]);
    expect(toStringArray(0)).toStrictEqual([]);
    expect(toStringArray(false)).toStrictEqual([]);
    expect(toStringArray(null)).toStrictEqual([]);
    expect(toStringArray(void 0)).toStrictEqual([]);
    expect(toStringArray({ a: 'x', b: 'y' })).toStrictEqual([]);
    expect(toStringArray(new Set(['hello', 'world']))).toStrictEqual(['hello', 'world']);
  });
});
