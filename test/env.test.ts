import { env } from '../src/common/env';

describe('env()', () => {
  const ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ENV };
  });

  afterAll(() => {
    process.env = ENV;
  });

  it('should return the correct value for an existing environment variable', () => {
    process.env.TEST_VALUE = 'hello world';
    expect(env('TEST_VALUE')).toBe('hello world');
  });

  it('should throw an error when the specified environment variable does not exist', () => {
    expect(() => env('hello world')).toThrow('Missing environment variable: hello world');
  });
});
