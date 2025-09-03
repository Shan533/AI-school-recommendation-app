// jest.config.cjs
const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });

const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: [
    '<rootDir>/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)', 
    '<rootDir>/__tests__/**/*.js', 
    '<rootDir>/__tests__/**/*.ts'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/.*\\.skip\\.',  // Ignore .skip.* test files
    '<rootDir>/__tests__/.*\\.vitest\\.' // Ignore .vitest.* test files
  ],
  
  // Coverage configuration
  collectCoverage: false, // Set to true by --coverage flag
  collectCoverageFrom: [
    // Only include backend logic and utilities
    'src/lib/**/*.{js,jsx,ts,tsx}',           // Utility functions and business logic
    'src/app/api/**/*.{js,jsx,ts,tsx}',       // API routes
    
    // Exclude everything else
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
    '!src/components/**/*',                    // Exclude all frontend components
    '!src/app/**/page.tsx',                   // Exclude Next.js pages
    '!src/app/**/layout.tsx',                 // Exclude Next.js layouts
    '!src/app/**/loading.tsx',                // Exclude Next.js loading pages
    '!src/app/**/not-found.tsx',              // Exclude Next.js 404 pages
    '!src/app/**/error.tsx',                  // Exclude Next.js error pages
    '!src/app/globals.css',                   // Exclude global CSS
    '!src/middleware.ts',                     // Middleware is hard to test in isolation
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',           // Console output
    'json-summary',   // For PR comments
    'lcov',          // For other integrations
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
