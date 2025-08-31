// jest.config.cjs
const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });

const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)', '<rootDir>/__tests__/**/*.js', '<rootDir>/__tests__/**/*.ts'],
  
  // Coverage configuration
  collectCoverage: false, // Set to true by --coverage flag
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
    '!src/app/**/layout.tsx',
    '!src/app/**/loading.tsx',
    '!src/app/**/not-found.tsx',
    '!src/app/**/error.tsx',
    '!src/app/globals.css',
    '!src/middleware.ts', // Middleware is hard to test in isolation
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',        // Console output
    'lcov',        // For PR comments
  ],
  // Coverage thresholds disabled - only use coverage for PR comments
  // coverageThreshold: {
  //   global: {
  //     branches: 1,
  //     functions: 1,
  //     lines: 1,
  //     statements: 1
  //   }
  // }
};

module.exports = createJestConfig(config);
