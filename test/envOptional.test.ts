import { envOptional } from '../src/common/envOptional';

describe('envOptional()', () => {
  const ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ENV };
  });

  afterAll(() => {
    process.env = ENV;
  });

  it('should return the correct value for an existing environment variable', () => {
    process.env.TEST_OPTIONAL_VALUE = 'hello world';
    expect(envOptional('TEST_OPTIONAL_VALUE')).toBe('hello world');
  });

  it('should not throw an error when the specified environment variable does not exist', () => {
    expect(() => envOptional('hello world')).not.toThrow();
  });
});
