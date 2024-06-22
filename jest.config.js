module.exports = {
  moduleNameMapper: {
    '@abacus/aws-utils': '<rootDir>/src/aws-utils',
    '@abacus/common': '<rootDir>/src/common',
    '@abacus/core': '<rootDir>/src/core',
    '@abacus/crawler': '<rootDir>/src/crawler',
  },
  roots: ['<rootDir>/test'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  }
};
