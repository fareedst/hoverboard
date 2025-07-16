# OVERLAY REFRESH TEST PLAN

**Semantic Token:** [OVERLAY-REFRESH-001]
**Cross-References:** [OVERLAY-DATA-DISPLAY-001], [OVERLAY-THEMING-001], [TOGGLE-SYNC-OVERLAY], [TAG-SYNC-OVERLAY], [SAFARI-EXT-SHIM-001]
**Date:** 2025-01-27
**Status:** Test Planning

---

## 🧪 Test Strategy Overview

This document outlines the comprehensive testing strategy for the overlay refresh button feature. The refresh button is already implemented and provides manual refresh capability to update bookmark data in the overlay window.

### **Test Objectives**
- **Functionality**: Verify refresh button works correctly in all scenarios
- **Accessibility**: Ensure full accessibility compliance
- **Theme Integration**: Validate theme-aware styling
- **Error Handling**: Test graceful error recovery
- **Cross-Platform**: Verify Chrome and Safari compatibility
- **Performance**: Ensure minimal performance impact

---

## 📋 Test Categories

### 1. Unit Tests
**Location**: `tests/unit/overlay-refresh-button.test.js`
**Scope**: Individual component functionality
**Priority**: HIGH

### 2. Integration Tests
**Location**: `tests/integration/overlay-refresh-integration.test.js`
**Scope**: End-to-end functionality with message service
**Priority**: HIGH

### 3. Accessibility Tests
**Location**: `tests/unit/overlay-refresh-accessibility.test.js`
**Scope**: Keyboard navigation, screen reader support
**Priority**: HIGH

### 4. Theme Integration Tests
**Location**: `tests/unit/overlay-refresh-theme.test.js`
**Scope**: Theme-aware styling and transitions
**Priority**: MEDIUM

### 5. Performance Tests
**Location**: `tests/performance/overlay-refresh-performance.test.js`
**Scope**: Performance impact and optimization
**Priority**: MEDIUM

---

## 🔧 Unit Test Implementation

### Test File: `tests/unit/overlay-refresh-button.test.js`

#### Test Suite Structure
```javascript
// [OVERLAY-REFRESH-TEST-001] Overlay refresh button unit tests
describe('[OVERLAY-REFRESH-001] Overlay Refresh Button', () => {
  let overlayManager
  let mockMessageService
  let mockDocument

  beforeEach(() => {
    // Setup test environment
    mockDocument = createMockDocument()
    mockMessageService = createMockMessageService()
    overlayManager = new OverlayManager(mockDocument, {})
    overlayManager.messageService = mockMessageService
  })

  afterEach(() => {
    // Cleanup test environment
    jest.clearAllMocks()
  })
})
```

#### Test Cases

##### Button Rendering Tests
```javascript
// [OVERLAY-REFRESH-TEST-001] Button rendering tests
describe('Button Rendering', () => {
  test('[OVERLAY-REFRESH-UI-001] Should render refresh button correctly', () => {
    // Arrange
    const content = createMockBookmarkContent()
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    
    // Assert
    expect(refreshButton).toBeTruthy()
    expect(refreshButton.innerHTML).toBe('🔄')
    expect(refreshButton.title).toBe('Refresh Data')
    expect(refreshButton.getAttribute('aria-label')).toBe('Refresh Data')
    expect(refreshButton.getAttribute('role')).toBe('button')
    expect(refreshButton.getAttribute('tabindex')).toBe('0')
  })

  test('[OVERLAY-REFRESH-UI-001] Should position refresh button in top-left corner', () => {
    // Arrange
    const content = createMockBookmarkContent()
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    const computedStyle = window.getComputedStyle(refreshButton)
    
    // Assert
    expect(computedStyle.position).toBe('absolute')
    expect(computedStyle.top).toBe('8px')
    expect(computedStyle.left).toBe('8px')
  })

  test('[OVERLAY-REFRESH-UI-001] Should apply correct CSS classes', () => {
    // Arrange
    const content = createMockBookmarkContent()
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    
    // Assert
    expect(refreshButton.className).toContain('refresh-button')
  })
})
```

##### Click Handler Tests
```javascript
// [OVERLAY-REFRESH-TEST-001] Click handler tests
describe('Click Handler', () => {
  test('[OVERLAY-REFRESH-HANDLER-001] Should handle successful refresh', async () => {
    // Arrange
    const content = createMockBookmarkContent()
    const updatedContent = createMockUpdatedBookmarkContent()
    mockMessageService.sendMessage.mockResolvedValue({
      success: true,
      data: updatedContent.bookmark
    })
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    await refreshButton.click()
    
    // Assert
    expect(mockMessageService.sendMessage).toHaveBeenCalledWith({
      type: 'getCurrentBookmark',
      data: { url: 'https://example.com' }
    })
    expect(overlayManager.show).toHaveBeenCalledWith(updatedContent)
  })

  test('[OVERLAY-REFRESH-HANDLER-001] Should show loading message during refresh', async () => {
    // Arrange
    const content = createMockBookmarkContent()
    mockMessageService.sendMessage.mockResolvedValue({
      success: true,
      data: content.bookmark
    })
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    await refreshButton.click()
    
    // Assert
    expect(overlayManager.showMessage).toHaveBeenCalledWith('Refreshing data...', 'info')
  })

  test('[OVERLAY-REFRESH-HANDLER-001] Should show success message after refresh', async () => {
    // Arrange
    const content = createMockBookmarkContent()
    mockMessageService.sendMessage.mockResolvedValue({
      success: true,
      data: content.bookmark
    })
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    await refreshButton.click()
    
    // Assert
    expect(overlayManager.showMessage).toHaveBeenCalledWith('Data refreshed successfully', 'success')
  })
})
```

##### Error Handling Tests
```javascript
// [OVERLAY-REFRESH-TEST-001] Error handling tests
describe('Error Handling', () => {
  test('[OVERLAY-REFRESH-ERROR-001] Should handle network errors gracefully', async () => {
    // Arrange
    const content = createMockBookmarkContent()
    mockMessageService.sendMessage.mockRejectedValue(new Error('Network error'))
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    await refreshButton.click()
    
    // Assert
    expect(overlayManager.showMessage).toHaveBeenCalledWith('Failed to refresh data', 'error')
  })

  test('[OVERLAY-REFRESH-ERROR-001] Should handle invalid response data', async () => {
    // Arrange
    const content = createMockBookmarkContent()
    mockMessageService.sendMessage.mockResolvedValue({
      success: false,
      data: null
    })
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    await refreshButton.click()
    
    // Assert
    expect(overlayManager.showMessage).toHaveBeenCalledWith('Failed to refresh data', 'error')
  })

  test('[OVERLAY-REFRESH-ERROR-001] Should handle missing response data', async () => {
    // Arrange
    const content = createMockBookmarkContent()
    mockMessageService.sendMessage.mockResolvedValue(null)
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    await refreshButton.click()
    
    // Assert
    expect(overlayManager.showMessage).toHaveBeenCalledWith('Failed to refresh data', 'error')
  })
})
```

---

## 🔗 Integration Test Implementation

### Test File: `tests/integration/overlay-refresh-integration.test.js`

#### Test Suite Structure
```javascript
// [OVERLAY-REFRESH-TEST-001] Overlay refresh integration tests
describe('[OVERLAY-REFRESH-001] Integration Tests', () => {
  let overlayManager
  let messageService
  let mockBackgroundScript

  beforeEach(async () => {
    // Setup integration test environment
    messageService = new MessageClient()
    overlayManager = new OverlayManager(document, {})
    overlayManager.messageService = messageService
    
    // Mock background script responses
    mockBackgroundScript = createMockBackgroundScript()
  })

  afterEach(() => {
    // Cleanup integration test environment
    jest.clearAllMocks()
  })
})
```

#### Test Cases

##### Message Service Integration
```javascript
// [OVERLAY-REFRESH-TEST-001] Message service integration tests
describe('Message Service Integration', () => {
  test('[OVERLAY-REFRESH-INTEGRATION-001] Should communicate with background script', async () => {
    // Arrange
    const mockBookmarkData = createMockBookmarkData()
    mockBackgroundScript.handleMessage.mockResolvedValue({
      success: true,
      data: mockBookmarkData
    })
    
    // Act
    const result = await overlayManager.refreshOverlayContent()
    
    // Assert
    expect(mockBackgroundScript.handleMessage).toHaveBeenCalledWith({
      type: 'getCurrentBookmark',
      data: { url: window.location.href }
    })
    expect(result).toEqual({
      bookmark: mockBookmarkData,
      pageTitle: document.title,
      pageUrl: window.location.href
    })
  })

  test('[OVERLAY-REFRESH-INTEGRATION-001] Should handle background script errors', async () => {
    // Arrange
    mockBackgroundScript.handleMessage.mockRejectedValue(new Error('Background script error'))
    
    // Act
    const result = await overlayManager.refreshOverlayContent()
    
    // Assert
    expect(result).toBeNull()
  })
})
```

##### Data Flow Integration
```javascript
// [OVERLAY-REFRESH-TEST-001] Data flow integration tests
describe('Data Flow Integration', () => {
  test('[OVERLAY-REFRESH-INTEGRATION-001] Should update overlay with fresh data', async () => {
    // Arrange
    const originalContent = createMockBookmarkContent()
    const updatedBookmarkData = createMockUpdatedBookmarkData()
    mockBackgroundScript.handleMessage.mockResolvedValue({
      success: true,
      data: updatedBookmarkData
    })
    
    // Act
    overlayManager.show(originalContent)
    const refreshButton = document.querySelector('.refresh-button')
    await refreshButton.click()
    
    // Assert
    expect(overlayManager.show).toHaveBeenCalledWith({
      bookmark: updatedBookmarkData,
      pageTitle: document.title,
      pageUrl: window.location.href
    })
  })

  test('[OVERLAY-REFRESH-INTEGRATION-001] Should preserve existing content on refresh failure', async () => {
    // Arrange
    const originalContent = createMockBookmarkContent()
    mockBackgroundScript.handleMessage.mockRejectedValue(new Error('Network error'))
    
    // Act
    overlayManager.show(originalContent)
    const refreshButton = document.querySelector('.refresh-button')
    await refreshButton.click()
    
    // Assert
    expect(overlayManager.show).not.toHaveBeenCalledWith(originalContent)
  })
})
```

---

## ♿ Accessibility Test Implementation

### Test File: `tests/unit/overlay-refresh-accessibility.test.js`

#### Test Suite Structure
```javascript
// [OVERLAY-REFRESH-TEST-001] Accessibility tests
describe('[OVERLAY-REFRESH-001] Accessibility Tests', () => {
  let overlayManager
  let mockDocument

  beforeEach(() => {
    // Setup accessibility test environment
    mockDocument = createMockDocument()
    overlayManager = new OverlayManager(mockDocument, {})
  })

  afterEach(() => {
    // Cleanup accessibility test environment
    jest.clearAllMocks()
  })
})
```

#### Test Cases

##### ARIA Attributes
```javascript
// [OVERLAY-REFRESH-TEST-001] ARIA attributes tests
describe('ARIA Attributes', () => {
  test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should have correct ARIA attributes', () => {
    // Arrange
    const content = createMockBookmarkContent()
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    
    // Assert
    expect(refreshButton.getAttribute('aria-label')).toBe('Refresh Data')
    expect(refreshButton.getAttribute('role')).toBe('button')
    expect(refreshButton.getAttribute('tabindex')).toBe('0')
  })

  test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should have descriptive tooltip', () => {
    // Arrange
    const content = createMockBookmarkContent()
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    
    // Assert
    expect(refreshButton.title).toBe('Refresh Data')
  })
})
```

##### Keyboard Navigation
```javascript
// [OVERLAY-REFRESH-TEST-001] Keyboard navigation tests
describe('Keyboard Navigation', () => {
  test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should handle Enter key press', async () => {
    // Arrange
    const content = createMockBookmarkContent()
    mockMessageService.sendMessage.mockResolvedValue({
      success: true,
      data: content.bookmark
    })
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
    refreshButton.dispatchEvent(enterEvent)
    
    // Assert
    expect(mockMessageService.sendMessage).toHaveBeenCalled()
  })

  test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should handle Space key press', async () => {
    // Arrange
    const content = createMockBookmarkContent()
    mockMessageService.sendMessage.mockResolvedValue({
      success: true,
      data: content.bookmark
    })
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ' })
    refreshButton.dispatchEvent(spaceEvent)
    
    // Assert
    expect(mockMessageService.sendMessage).toHaveBeenCalled()
  })

  test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should prevent default on keyboard activation', async () => {
    // Arrange
    const content = createMockBookmarkContent()
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
    const preventDefaultSpy = jest.spyOn(enterEvent, 'preventDefault')
    refreshButton.dispatchEvent(enterEvent)
    
    // Assert
    expect(preventDefaultSpy).toHaveBeenCalled()
  })
})
```

##### Focus Management
```javascript
// [OVERLAY-REFRESH-TEST-001] Focus management tests
describe('Focus Management', () => {
  test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should be focusable', () => {
    // Arrange
    const content = createMockBookmarkContent()
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    
    // Assert
    expect(refreshButton.getAttribute('tabindex')).toBe('0')
  })

  test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should have visible focus indicator', () => {
    // Arrange
    const content = createMockBookmarkContent()
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    const computedStyle = window.getComputedStyle(refreshButton)
    
    // Assert
    expect(computedStyle.outline).not.toBe('none')
  })
})
```

---

## 🎨 Theme Integration Test Implementation

### Test File: `tests/unit/overlay-refresh-theme.test.js`

#### Test Suite Structure
```javascript
// [OVERLAY-REFRESH-TEST-001] Theme integration tests
describe('[OVERLAY-REFRESH-001] Theme Integration Tests', () => {
  let overlayManager
  let mockDocument

  beforeEach(() => {
    // Setup theme test environment
    mockDocument = createMockDocument()
    overlayManager = new OverlayManager(mockDocument, {})
  })

  afterEach(() => {
    // Cleanup theme test environment
    jest.clearAllMocks()
  })
})
```

#### Test Cases

##### Theme-Aware Styling
```javascript
// [OVERLAY-REFRESH-TEST-001] Theme-aware styling tests
describe('Theme-Aware Styling', () => {
  test('[OVERLAY-REFRESH-THEME-001] Should use theme CSS variables', () => {
    // Arrange
    const content = createMockBookmarkContent()
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    const computedStyle = window.getComputedStyle(refreshButton)
    
    // Assert
    expect(computedStyle.backgroundColor).toBe('var(--theme-button-bg)')
    expect(computedStyle.color).toBe('var(--theme-text-primary)')
    expect(computedStyle.borderColor).toBe('var(--theme-border)')
  })

  test('[OVERLAY-REFRESH-THEME-001] Should have hover state styling', () => {
    // Arrange
    const content = createMockBookmarkContent()
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    const hoverStyle = getComputedStyle(refreshButton, ':hover')
    
    // Assert
    expect(hoverStyle.backgroundColor).toBe('var(--theme-button-hover)')
  })

  test('[OVERLAY-REFRESH-THEME-001] Should have focus state styling', () => {
    // Arrange
    const content = createMockBookmarkContent()
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    const focusStyle = getComputedStyle(refreshButton, ':focus')
    
    // Assert
    expect(focusStyle.outline).toBe('2px solid var(--theme-input-focus)')
  })
})
```

##### Theme Transitions
```javascript
// [OVERLAY-REFRESH-TEST-001] Theme transition tests
describe('Theme Transitions', () => {
  test('[OVERLAY-REFRESH-THEME-001] Should have smooth transitions', () => {
    // Arrange
    const content = createMockBookmarkContent()
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    const computedStyle = window.getComputedStyle(refreshButton)
    
    // Assert
    expect(computedStyle.transition).toBe('var(--theme-transition)')
  })

  test('[OVERLAY-REFRESH-THEME-001] Should adapt to theme changes', () => {
    // Arrange
    const content = createMockBookmarkContent()
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    
    // Simulate theme change
    document.body.classList.add('hoverboard-theme-light-on-dark')
    const darkThemeStyle = window.getComputedStyle(refreshButton)
    
    document.body.classList.remove('hoverboard-theme-light-on-dark')
    document.body.classList.add('hoverboard-theme-dark-on-light')
    const lightThemeStyle = window.getComputedStyle(refreshButton)
    
    // Assert
    expect(darkThemeStyle.color).not.toBe(lightThemeStyle.color)
  })
})
```

---

## ⚡ Performance Test Implementation

### Test File: `tests/performance/overlay-refresh-performance.test.js`

#### Test Suite Structure
```javascript
// [OVERLAY-REFRESH-TEST-001] Performance tests
describe('[OVERLAY-REFRESH-001] Performance Tests', () => {
  let overlayManager
  let mockDocument

  beforeEach(() => {
    // Setup performance test environment
    mockDocument = createMockDocument()
    overlayManager = new OverlayManager(mockDocument, {})
  })

  afterEach(() => {
    // Cleanup performance test environment
    jest.clearAllMocks()
  })
})
```

#### Test Cases

##### Refresh Operation Performance
```javascript
// [OVERLAY-REFRESH-TEST-001] Performance tests
describe('Refresh Operation Performance', () => {
  test('[OVERLAY-REFRESH-PERFORMANCE-001] Should complete refresh within acceptable time', async () => {
    // Arrange
    const content = createMockBookmarkContent()
    const startTime = performance.now()
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    await refreshButton.click()
    const endTime = performance.now()
    
    // Assert
    const duration = endTime - startTime
    expect(duration).toBeLessThan(1000) // Should complete within 1 second
  })

  test('[OVERLAY-REFRESH-PERFORMANCE-001] Should not cause memory leaks', async () => {
    // Arrange
    const content = createMockBookmarkContent()
    const initialMemory = performance.memory?.usedJSHeapSize || 0
    
    // Act
    for (let i = 0; i < 10; i++) {
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      await refreshButton.click()
    }
    
    const finalMemory = performance.memory?.usedJSHeapSize || 0
    const memoryIncrease = finalMemory - initialMemory
    
    // Assert
    expect(memoryIncrease).toBeLessThan(1024 * 1024) // Should not increase by more than 1MB
  })
})
```

##### DOM Manipulation Performance
```javascript
// [OVERLAY-REFRESH-TEST-001] DOM performance tests
describe('DOM Manipulation Performance', () => {
  test('[OVERLAY-REFRESH-PERFORMANCE-001] Should minimize DOM queries', async () => {
    // Arrange
    const content = createMockBookmarkContent()
    const querySelectorSpy = jest.spyOn(mockDocument, 'querySelector')
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    await refreshButton.click()
    
    // Assert
    expect(querySelectorSpy).toHaveBeenCalledTimes(1) // Should only query once for the button
  })

  test('[OVERLAY-REFRESH-PERFORMANCE-001] Should not create unnecessary elements', async () => {
    // Arrange
    const content = createMockBookmarkContent()
    const createElementSpy = jest.spyOn(mockDocument, 'createElement')
    
    // Act
    overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    await refreshButton.click()
    
    // Assert
    expect(createElementSpy).not.toHaveBeenCalled() // Should not create new elements during refresh
  })
})
```

---

## 📊 Test Coverage Requirements

### Unit Test Coverage
- **Button Rendering**: 100% coverage
- **Click Handler**: 100% coverage
- **Error Handling**: 100% coverage
- **Accessibility**: 100% coverage

### Integration Test Coverage
- **Message Service**: 100% coverage
- **Data Flow**: 100% coverage
- **Background Script**: 100% coverage

### Accessibility Test Coverage
- **ARIA Attributes**: 100% coverage
- **Keyboard Navigation**: 100% coverage
- **Focus Management**: 100% coverage

### Theme Test Coverage
- **Theme Variables**: 100% coverage
- **Theme Transitions**: 100% coverage
- **Theme Changes**: 100% coverage

### Performance Test Coverage
- **Refresh Performance**: 100% coverage
- **Memory Usage**: 100% coverage
- **DOM Performance**: 100% coverage

---

## 🎯 Test Success Criteria

### Functional Success Criteria
- ✅ **Button Renders**: Refresh button appears in correct position
- ✅ **Click Works**: Button responds to mouse clicks
- ✅ **Data Updates**: Overlay content updates with fresh data
- ✅ **Error Handling**: Graceful error recovery
- ✅ **User Feedback**: Clear success/error messages

### Accessibility Success Criteria
- ✅ **Keyboard Navigation**: Button responds to Enter and Space keys
- ✅ **ARIA Attributes**: All required ARIA attributes present
- ✅ **Focus Management**: Proper focus indicators
- ✅ **Screen Reader**: Compatible with screen reader software

### Theme Success Criteria
- ✅ **Theme Variables**: Uses CSS custom properties
- ✅ **Theme Changes**: Adapts to theme switching
- ✅ **Transitions**: Smooth visual transitions
- ✅ **Consistency**: Matches other overlay elements

### Performance Success Criteria
- ✅ **Response Time**: Refresh completes within 1 second
- ✅ **Memory Usage**: No significant memory leaks
- ✅ **DOM Efficiency**: Minimal DOM manipulation
- ✅ **Resource Usage**: Low CPU and memory impact

---

## 🔧 Test Environment Setup

### Mock Objects
```javascript
// Mock document for testing
function createMockDocument() {
  return {
    createElement: jest.fn((tag) => ({
      tagName: tag.toUpperCase(),
      className: '',
      innerHTML: '',
      style: { cssText: '' },
      setAttribute: jest.fn(),
      getAttribute: jest.fn(),
      addEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      querySelector: jest.fn(),
      querySelectorAll: jest.fn()
    })),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(),
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn()
    }
  }
}

// Mock message service for testing
function createMockMessageService() {
  return {
    sendMessage: jest.fn()
  }
}

// Mock bookmark content for testing
function createMockBookmarkContent() {
  return {
    bookmark: {
      url: 'https://example.com',
      description: 'Test Bookmark',
      tags: ['test', 'example'],
      shared: 'yes',
      toread: 'no'
    },
    pageTitle: 'Test Page',
    pageUrl: 'https://example.com'
  }
}
```

### Test Utilities
```javascript
// Test utilities for overlay refresh button
const testUtils = {
  // Create mock overlay manager
  createMockOverlayManager: (document, config = {}) => {
    return new OverlayManager(document, config)
  },

  // Create mock message service
  createMockMessageService: () => {
    return {
      sendMessage: jest.fn()
    }
  },

  // Create mock bookmark content
  createMockBookmarkContent: () => {
    return {
      bookmark: {
        url: 'https://example.com',
        description: 'Test Bookmark',
        tags: ['test', 'example'],
        shared: 'yes',
        toread: 'no'
      },
      pageTitle: 'Test Page',
      pageUrl: 'https://example.com'
    }
  },

  // Create mock updated bookmark content
  createMockUpdatedBookmarkContent: () => {
    return {
      bookmark: {
        url: 'https://example.com',
        description: 'Updated Test Bookmark',
        tags: ['test', 'example', 'updated'],
        shared: 'no',
        toread: 'yes'
      },
      pageTitle: 'Updated Test Page',
      pageUrl: 'https://example.com'
    }
  }
}
```

---

## 📋 Test Execution Plan

### Phase 1: Unit Tests (Day 1)
- **Duration**: 2-3 hours
- **Scope**: Button rendering, click handling, error scenarios
- **Deliverable**: Complete unit test suite

### Phase 2: Integration Tests (Day 1)
- **Duration**: 1-2 hours
- **Scope**: Message service integration, data flow
- **Deliverable**: Complete integration test suite

### Phase 3: Accessibility Tests (Day 2)
- **Duration**: 1-2 hours
- **Scope**: Keyboard navigation, ARIA attributes
- **Deliverable**: Complete accessibility test suite

### Phase 4: Theme Tests (Day 2)
- **Duration**: 1 hour
- **Scope**: Theme integration, styling
- **Deliverable**: Complete theme test suite

### Phase 5: Performance Tests (Day 2)
- **Duration**: 1 hour
- **Scope**: Performance metrics, memory usage
- **Deliverable**: Complete performance test suite

**Total Estimated Time**: 6-9 hours over 2 days

---

**[OVERLAY-REFRESH-001]** - Master semantic token for overlay refresh button functionality 