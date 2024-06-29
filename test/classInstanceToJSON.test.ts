import { classInstanceToJSON } from '../src/common/classInstanceToJSON';

describe('classInstanceToJSON()', () => {
  it('should return an object containing the correct properties', () => {
    const obj = {
      a: 'x',
      b: 'y',
      c: 'z',
    };
    expect(classInstanceToJSON(obj, ['a', 'b', 'd'] as any)).toStrictEqual({
      a: 'x',
      b: 'y',
      d: void 0,
    });
  });
});
