module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
      '^.+\\.ts$': 'ts-jest'
    },
    testMatch: ['**/__tests__/**/*.test.ts'],
    coverageDirectory: 'coverage',
    collectCoverage: true,
    coverageReporters: ['json-summary']
  };
  