import { toGuidOrNull } from '../src/common/toGuidOrNull';

describe('toGuidOrNull()', () => {
  it('should return a valid GUID when provided with a valid GUID-like string', () => {
    expect(toGuidOrNull('935C154CD70A4985A278DD5B573DBE6F')).toBe('935c154c-d70a-4985-a278-dd5b573dbe6f');
  });

  it('should return null when provided with a value that cannot be interpreted as a GUID', () => {
    expect(toGuidOrNull('hello world')).toBe(null);
  });
});
