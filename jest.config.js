/**
 * Jest Configuration for Hoverboard Extension Testing
 * Comprehensive setup for unit, integration, and e2e testing
 */

export default {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test patterns - exclude Playwright tests
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.integration.test.js'
  ],
  
  // Exclude Playwright tests from Jest
  testPathIgnorePatterns: [
    '<rootDir>/tests/e2e/',
    '<rootDir>/tests/uat/',
    '<rootDir>/tests/playwright/'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.integration.test.js',
    '!src/**/*.e2e.test.js',
    '!**/node_modules/**'
  ],
  
  coverageDirectory: 'coverage',
  
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  
  // Module handling
  moduleFileExtensions: ['js', 'json'],
  
  // Module name mapping for aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Global settings
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Transform configuration for ES modules
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(puppeteer|@testing-library)/)'
  ]
}; 