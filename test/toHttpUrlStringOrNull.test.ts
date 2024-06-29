import { toHttpUrlStringOrNull } from '../src/common/toHttpUrlStringOrNull';

describe('toHttpUrlStringOrNull()', () => {
  it('should return a string when provided with a valid URL-like string', () => {
    expect(toHttpUrlStringOrNull('HTTP://WWW.JACOBMCCOLLUM.COM')).toBe('https://www.jacobmccollum.com/');
  });

  it('should return null when provided with a value that cannot be interpreted as a URL', () => {
    expect(toHttpUrlStringOrNull('hello world')).toBe(null);
  });
});
