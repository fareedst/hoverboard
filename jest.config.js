/**
 * Jest Configuration for Hoverboard Extension Testing
 * Comprehensive setup for unit, integration, and e2e testing
 */

export default {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.integration.test.js',
    '<rootDir>/tests/**/*.e2e.test.js'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src-new/**/*.js',
    '!src-new/**/*.test.js',
    '!src-new/**/*.integration.test.js',
    '!src-new/**/*.e2e.test.js',
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
    '^@/(.*)$': '<rootDir>/src-new/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Global settings
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true
}; 