import { envInteger } from '../src/common/envInteger';

describe('envInteger()', () => {
  const ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ENV };
  });

  afterAll(() => {
    process.env = ENV;
  });

  it('should return the correct value for an existing environment variable', () => {
    process.env.TEST_VALUE_INTEGER = '42';
    expect(envInteger('TEST_VALUE_INTEGER')).toBe(42);
  });

  it('should throw an error when the specified environment variable does not exist', () => {
    expect(() => envInteger('hello world')).toThrow('Missing environment variable: hello world');
  });

  it('should throw an error when the specified environment variable is not an integer', () => {
    process.env.TEST_VALUE_NON_INTEGER = '';
    expect(() => envInteger('TEST_VALUE_NON_INTEGER')).toThrow(
      'Cannot convert environment variable TEST_VALUE_NON_INTEGER from "" to an integer'
    );
  });
});
