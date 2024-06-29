import { toHttpUrlString } from '../src/common/toHttpUrlString';

describe('toHttpUrlString()', () => {
  it('should return a string when provided with a valid URL-like string', () => {
    expect(toHttpUrlString('HTTP://WWW.JACOBMCCOLLUM.COM')).toBe('https://www.jacobmccollum.com/');
  });

  it('should throw a TypeError when provided with a value that cannot be interpreted as a URL', () => {
    expect(() => toHttpUrlString('hello world')).toThrow();
  });
});
