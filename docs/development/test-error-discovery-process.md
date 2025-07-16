# Test Error Discovery and Diagnosis Process

## Overview

This document outlines the systematic approach for discovering, diagnosing, and resolving test failures in the Hoverboard extension project.

## Process Steps

### 1. Initial Test Execution

**Command**: `npm test`
- Run the full test suite to identify failing tests
- Note the exit code (1 indicates failures)
- Capture the complete output for analysis

**Example Output Analysis**:
```
Test Suites: 1 failed, 18 passed, 19 total
Tests:       2 failed, 289 passed, 291 total
```

### 2. Verbose Test Execution

**Command**: `npm test -- --verbose`
- Provides detailed output for each test
- Shows exact error messages and stack traces
- Identifies specific failing test cases

### 3. Error Pattern Analysis

**Key Information to Extract**:
- **Error Type**: `TypeError`, `ReferenceError`, etc.
- **Error Message**: Exact error description
- **File Location**: Source file and line number
- **Stack Trace**: Call chain leading to the error
- **Test Context**: Which test case is failing

### 4. Root Cause Investigation

#### 4.1 Code Analysis
- Examine the failing line in the source code
- Understand the expected vs. actual behavior
- Check constructor parameters and dependencies

#### 4.2 Test Setup Analysis
- Review test setup and mocking
- Verify mock objects and their interfaces
- Check for inconsistencies between test and production code

#### 4.3 Dependency Chain Analysis
- Trace the call chain from test to error
- Identify where the expected interface breaks
- Check for missing or incorrect parameters

### 5. Specific Investigation Techniques

#### 5.1 Targeted Test Execution
```bash
# Run specific failing test
npm test -- --testNamePattern="specific test name"

# Run tests in specific file
npm test -- tests/integration/popup-tag-integration.test.js
```

#### 5.2 Code Examination
```bash
# Search for specific error patterns
grep -r "Cannot destructure" src/

# Find constructor definitions
grep -r "constructor" src/ui/popup/
```

#### 5.3 Test Environment Verification
- Check Jest configuration (`jest.config.js`)
- Verify test setup files (`tests/setup.js`)
- Review mock implementations

### 6. Common Error Patterns

#### 6.1 Constructor Parameter Mismatch
**Symptoms**:
- `TypeError: Cannot destructure property 'x' of 'undefined'`
- Constructor expects object but receives undefined

**Investigation**:
- Check constructor parameter destructuring
- Verify dependency injection in calling code
- Review test mock setup

#### 6.2 Mock Interface Mismatch
**Symptoms**:
- Methods not found on mock objects
- Unexpected mock behavior

**Investigation**:
- Compare mock implementation with real interface
- Check mock method signatures
- Verify mock setup in test beforeEach

#### 6.3 Async/Await Issues
**Symptoms**:
- Tests timing out
- Promises not resolving
- Race conditions

**Investigation**:
- Check async/await usage
- Verify Promise handling
- Review test timeouts

### 7. Diagnosis Documentation

#### 7.1 Create Diagnosis Document
**Template**: `docs/development/test-failure-diagnosis-YYYY-MM-DD.md`

**Required Sections**:
- Summary
- Failed Tests (list with line numbers)
- Error Details (exact error message)
- Code Analysis (problem location)
- Root Cause (detailed explanation)
- Impact Assessment
- Recommended Fix
- Implementation Priority
- Testing Strategy

#### 7.2 Code Analysis Format
```markdown
### Problem Location

**File**: `path/to/file.js:line`
```javascript
// Problematic code line
```

**File**: `path/to/expected.js:line`
```javascript
// Expected code structure
```
```

### 8. Fix Implementation

#### 8.1 Code Fixes
- Apply the identified fix
- Maintain backward compatibility
- Follow existing code patterns

#### 8.2 Test Fixes
- Update test setup if needed
- Fix mock implementations
- Ensure test isolation

#### 8.3 Verification
```bash
# Run specific failing tests
npm test -- --testNamePattern="failing test name"

# Run full test suite
npm test

# Run with coverage
npm run test:coverage
```

### 9. Prevention Strategies

#### 9.1 Code Quality
- Use TypeScript for better type safety
- Add constructor parameter validation
- Implement interface contracts

#### 9.2 Test Quality
- Use consistent mock patterns
- Implement proper test isolation
- Add integration test coverage

#### 9.3 Documentation
- Keep test documentation updated
- Document mock interfaces
- Maintain troubleshooting guides

## Example: 2025-07-15 Diagnosis

### Error Discovery
```bash
npm test -- --verbose
```

### Error Analysis
- **Error**: `TypeError: Cannot destructure property 'errorHandler' of 'undefined'`
- **Location**: `src/ui/popup/UIManager.js:6`
- **Root Cause**: `PopupController` creates `UIManager()` without parameters

### Fix Implementation
```javascript
// Before
this.uiManager = dependencies.uiManager || new UIManager()

// After
this.uiManager = dependencies.uiManager || new UIManager({
  errorHandler: this.errorHandler,
  stateManager: this.stateManager,
  config: {}
})
```

## Tools and Commands

### Essential Commands
```bash
# Full test suite
npm test

# Verbose output
npm test -- --verbose

# Specific test
npm test -- --testNamePattern="test name"

# Test file
npm test -- tests/path/to/file.test.js

# Coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Investigation Commands
```bash
# Search for patterns
grep -r "pattern" src/

# Find files
find . -name "*.test.js"

# Check Jest config
cat jest.config.js
```

## Success Metrics

- **Test Pass Rate**: 100% of tests passing
- **Error Resolution Time**: < 30 minutes for common issues
- **Documentation Coverage**: All failures documented
- **Prevention**: Reduced recurrence of similar issues

---

**Last Updated**: 2025-07-15  
**Process Owner**: Development Team  
**Review Cycle**: Quarterly 