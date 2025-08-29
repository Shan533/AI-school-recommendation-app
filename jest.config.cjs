// jest.config.cjs
const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });

const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)', '<rootDir>/__tests__/**/*.js', '<rootDir>/__tests__/**/*.ts'],
};

module.exports = createJestConfig(config);
