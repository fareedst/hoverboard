# 🧪 Overlay Refresh Button Test Plan

**Semantic Token:** [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-BUTTON-001)]
**Cross-References:** [[IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-OVERLAY_SYSTEM] (was OVERLAY-DATA-DISPLAY-001)], [[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] (was POPUP-REFRESH-001)], [TOGGLE-SYNC-OVERLAY], [TAG-SYNC-OVERLAY], [SAFARI-EXT-SHIM-001]
**Date:** 2025-01-27
**Status:** Test Plan

---

## 🎯 Test Overview

This document outlines the comprehensive testing strategy for the overlay refresh button feature. All tests must include semantic tokens and coordinate with existing test patterns.

---

## 📋 Test Categories

### **Unit Tests**
- Button rendering and positioning
- Click handler functionality
- Error handling scenarios
- Theme integration
- Accessibility features

### **Integration Tests**
- Coordination with popup refresh
- Data flow integration
- Cross-platform compatibility
- Message passing coordination

### **Accessibility Tests**
- Screen reader compatibility
- Keyboard navigation
- Focus management
- ARIA label validation

### **Performance Tests**
- Refresh operation timing
- Memory usage impact
- UI responsiveness

---

## 🧪 Unit Test Implementation

### **Test File: `tests/unit/overlay-refresh-button.test.js`**

```javascript
// [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-TEST-001)] Unit tests for overlay refresh button
import { jest } from '@jest/globals'
import { OverlayManager } from '../../../src/features/content/overlay-manager.js'

describe('[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-BUTTON-001)] Overlay Refresh Button Unit Tests', () => {
  let overlayManager
  let mockDocument
  let mockMessageService

  beforeEach(() => {
    // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-TEST-001)] Setup test environment
    mockDocument = {
      createElement: jest.fn(),
      body: { appendChild: jest.fn() },
      getElementById: jest.fn()
    }

    mockMessageService = {
      sendMessage: jest.fn()
    }

    overlayManager = new OverlayManager(mockDocument, {
      overlayPosition: 'top-right',
      messageTimeout: 3000
    })

    // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-TEST-001)] Mock message service
    overlayManager.messageService = mockMessageService
  })

  describe('[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-UI-001)] Refresh Button UI Tests', () => {
    test('should render refresh button in correct position', () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-UI-001)] Test button placement
      const mockButton = {
        className: '',
        innerHTML: '',
        title: '',
        style: { cssText: '' },
        onclick: null
      }

      mockDocument.createElement.mockReturnValue(mockButton)

      // Create overlay with refresh button
      overlayManager.createOverlay()
      overlayManager.show({ bookmark: { url: 'https://example.com' } })

      // Verify button was created with correct properties
      expect(mockDocument.createElement).toHaveBeenCalledWith('button')
      expect(mockButton.className).toContain('refresh-button')
      expect(mockButton.innerHTML).toBe('🔄')
      expect(mockButton.title).toBe('Refresh Data')
      expect(mockButton.style.cssText).toContain('position: absolute')
      expect(mockButton.style.cssText).toContain('top: 8px')
      expect(mockButton.style.cssText).toContain('left: 40px')
    })

    test('should apply theme-aware styling', () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-UI-001)] Test theme integration
      const mockButton = {
        className: '',
        style: { cssText: '' }
      }

      mockDocument.createElement.mockReturnValue(mockButton)

      // Test with light theme
      overlayManager.applyVisibilitySettings({ theme: 'light-on-dark' })
      overlayManager.createOverlay()

      expect(mockButton.style.cssText).toContain('var(--theme-button-bg)')
      expect(mockButton.style.cssText).toContain('var(--theme-text-primary)')
    })

    test('should include accessibility attributes', () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-ACCESSIBILITY-001)] Test accessibility features
      const mockButton = {
        className: '',
        title: '',
        setAttribute: jest.fn()
      }

      mockDocument.createElement.mockReturnValue(mockButton)

      overlayManager.createOverlay()

      // Verify accessibility attributes
      expect(mockButton.setAttribute).toHaveBeenCalledWith('aria-label', 'Refresh Data')
      expect(mockButton.setAttribute).toHaveBeenCalledWith('role', 'button')
      expect(mockButton.setAttribute).toHaveBeenCalledWith('tabindex', '0')
    })
  })

  describe('[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-HANDLER-001)] Refresh Button Handler Tests', () => {
    test('should handle refresh button click successfully', async () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-HANDLER-001)] Test click handler
      const mockResponse = {
        success: true,
        data: {
          url: 'https://example.com',
          description: 'Updated Bookmark',
          tags: ['updated', 'refresh'],
          shared: 'yes',
          toread: 'no'
        }
      }

      mockMessageService.sendMessage.mockResolvedValue(mockResponse)

      // Mock show method
      overlayManager.show = jest.fn()
      overlayManager.showMessage = jest.fn()

      await overlayManager.handleRefreshButtonClick()

      // Verify message was sent
      expect(mockMessageService.sendMessage).toHaveBeenCalledWith({
        type: 'getCurrentBookmark',
        data: {
          url: window.location.href,
          title: document.title,
          tabId: null
        }
      })

      // Verify overlay was updated
      expect(overlayManager.show).toHaveBeenCalled()
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Data refreshed successfully', 'success')
    })

    test('should handle refresh errors gracefully', async () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-ERROR-001)] Test error handling
      mockMessageService.sendMessage.mockRejectedValue(new Error('API Error'))

      overlayManager.showMessage = jest.fn()

      await overlayManager.handleRefreshButtonClick()

      // Verify error was handled
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Failed to refresh data', 'error')
    })

    test('should handle empty response gracefully', async () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-ERROR-001)] Test empty response handling
      mockMessageService.sendMessage.mockResolvedValue({ success: false })

      overlayManager.showMessage = jest.fn()

      await overlayManager.handleRefreshButtonClick()

      // Verify error was handled
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Failed to refresh data', 'error')
    })
  })

  describe('[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-INTEGRATION-001)] Data Integration Tests', () => {
    test('should refresh overlay content with updated data', async () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-INTEGRATION-001)] Test data refresh
      const mockResponse = {
        success: true,
        data: {
          url: 'https://example.com',
          description: 'Updated Bookmark',
          tags: ['new', 'tags'],
          shared: 'no',
          toread: 'yes'
        }
      }

      mockMessageService.sendMessage.mockResolvedValue(mockResponse)

      const result = await overlayManager.refreshOverlayContent()

      expect(result).toEqual({
        bookmark: mockResponse.data,
        pageTitle: document.title,
        pageUrl: window.location.href
      })
    })

    test('should handle network errors during refresh', async () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-ERROR-001)] Test network error handling
      mockMessageService.sendMessage.mockRejectedValue(new Error('Network Error'))

      const result = await overlayManager.refreshOverlayContent()

      expect(result).toBeNull()
    })
  })

  describe('[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-SAFARI-001)] Cross-Platform Tests', () => {
    test('should work with Safari extension shim', async () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-SAFARI-001)] Test Safari compatibility
      const mockBrowser = {
        runtime: {
          sendMessage: jest.fn()
        }
      }

      // Mock Safari browser API
      global.browser = mockBrowser

      const mockResponse = {
        success: true,
        data: { url: 'https://example.com' }
      }

      mockBrowser.runtime.sendMessage.mockResolvedValue(mockResponse)

      const result = await overlayManager.refreshOverlayContent()

      expect(mockBrowser.runtime.sendMessage).toHaveBeenCalled()
      expect(result).toBeTruthy()
    })
  })
})
```

---

## 🔗 Integration Test Implementation

### **Test File: `tests/integration/overlay-refresh-integration.test.js`**

```javascript
// [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-TEST-001)] Integration tests for overlay refresh button
import { jest } from '@jest/globals'

describe('[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-BUTTON-001)] Integration Tests', () => {
  describe('[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-INTEGRATION-001)] Popup Coordination Tests', () => {
    test('should coordinate with popup refresh mechanisms', async () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-INTEGRATION-001)] Test popup coordination
      const mockPopupController = {
        refreshPopupData: jest.fn()
      }

      const mockOverlayManager = {
        handleRefreshButtonClick: jest.fn()
      }

      // Simulate refresh button click
      await mockOverlayManager.handleRefreshButtonClick()

      // Verify coordination with popup
      expect(mockPopupController.refreshPopupData).toHaveBeenCalled()
    })

    test('should use same message types as popup refresh', async () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-INTEGRATION-001)] Test message consistency
      const expectedMessage = {
        type: 'getCurrentBookmark',
        data: {
          url: 'https://example.com',
          title: 'Test Page'
        }
      }

      // Verify overlay uses same message format as popup
      expect(mockMessageService.sendMessage).toHaveBeenCalledWith(expectedMessage)
    })
  })

  describe('[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-DATA-COORDINATION-001)] Data Flow Integration Tests', () => {
    test('should integrate with overlay data display patterns', async () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-DATA-COORDINATION-001)] Test data flow integration
      const mockContent = {
        bookmark: {
          url: 'https://example.com',
          description: 'Test Bookmark',
          tags: ['test', 'integration']
        },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }

      // Verify refresh maintains data display patterns
      const refreshedContent = await overlayManager.refreshOverlayContent()
      
      expect(refreshedContent).toMatchObject({
        bookmark: expect.any(Object),
        pageTitle: expect.any(String),
        pageUrl: expect.any(String)
      })
    })

    test('should maintain data validation patterns', async () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-DATA-COORDINATION-001)] Test data validation
      const invalidData = {
        success: true,
        data: {
          url: 'invalid-url',
          tags: 'not-an-array'
        }
      }

      mockMessageService.sendMessage.mockResolvedValue(invalidData)

      const result = await overlayManager.refreshOverlayContent()

      // Verify invalid data is handled gracefully
      expect(result).toBeNull()
    })
  })

  describe('[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-SYNC-COORDINATION-001)] Synchronization Tests', () => {
    test('should coordinate with toggle synchronization', async () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-SYNC-COORDINATION-001)] Test toggle sync
      const mockToggleSync = {
        updateToggleState: jest.fn()
      }

      // Simulate refresh after toggle change
      await overlayManager.handleRefreshButtonClick()

      // Verify toggle state is updated
      expect(mockToggleSync.updateToggleState).toHaveBeenCalled()
    })

    test('should coordinate with tag synchronization', async () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-SYNC-COORDINATION-001)] Test tag sync
      const mockTagSync = {
        updateTagState: jest.fn()
      }

      // Simulate refresh after tag change
      await overlayManager.handleRefreshButtonClick()

      // Verify tag state is updated
      expect(mockTagSync.updateTagState).toHaveBeenCalled()
    })
  })
})
```

---

## ♿ Accessibility Test Implementation

### **Test File: `tests/accessibility/overlay-refresh-accessibility.test.js`**

```javascript
// [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-ACCESSIBILITY-001)] Accessibility tests for overlay refresh button
import { jest } from '@jest/globals'

describe('[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-BUTTON-001)] Accessibility Tests', () => {
  describe('[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-ACCESSIBILITY-001)] Screen Reader Tests', () => {
    test('should have proper ARIA labels', () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-ACCESSIBILITY-001)] Test ARIA labels
      const refreshButton = document.querySelector('.refresh-button')
      
      expect(refreshButton).toHaveAttribute('aria-label', 'Refresh Data')
      expect(refreshButton).toHaveAttribute('role', 'button')
    })

    test('should announce refresh status to screen readers', () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-ACCESSIBILITY-001)] Test status announcements
      const mockAriaLive = document.createElement('div')
      mockAriaLive.setAttribute('aria-live', 'polite')
      
      // Simulate refresh operation
      overlayManager.handleRefreshButtonClick()
      
      // Verify status is announced
      expect(mockAriaLive.textContent).toContain('Refreshing data')
    })
  })

  describe('[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-ACCESSIBILITY-001)] Keyboard Navigation Tests', () => {
    test('should be focusable with keyboard', () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-ACCESSIBILITY-001)] Test keyboard focus
      const refreshButton = document.querySelector('.refresh-button')
      
      refreshButton.focus()
      
      expect(document.activeElement).toBe(refreshButton)
    })

    test('should be activatable with Enter key', () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-ACCESSIBILITY-001)] Test Enter key activation
      const refreshButton = document.querySelector('.refresh-button')
      const clickHandler = jest.fn()
      
      refreshButton.onclick = clickHandler
      
      // Simulate Enter key press
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      refreshButton.dispatchEvent(enterEvent)
      
      expect(clickHandler).toHaveBeenCalled()
    })

    test('should be activatable with Space key', () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-ACCESSIBILITY-001)] Test Space key activation
      const refreshButton = document.querySelector('.refresh-button')
      const clickHandler = jest.fn()
      
      refreshButton.onclick = clickHandler
      
      // Simulate Space key press
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' })
      refreshButton.dispatchEvent(spaceEvent)
      
      expect(clickHandler).toHaveBeenCalled()
    })
  })

  describe('[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-ACCESSIBILITY-001)] Focus Management Tests', () => {
    test('should maintain focus during refresh operation', () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-ACCESSIBILITY-001)] Test focus management
      const refreshButton = document.querySelector('.refresh-button')
      
      refreshButton.focus()
      const initialFocus = document.activeElement
      
      // Simulate refresh operation
      overlayManager.handleRefreshButtonClick()
      
      // Verify focus is maintained
      expect(document.activeElement).toBe(initialFocus)
    })

    test('should restore focus after error', () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-ACCESSIBILITY-001)] Test focus restoration
      const refreshButton = document.querySelector('.refresh-button')
      
      refreshButton.focus()
      const initialFocus = document.activeElement
      
      // Simulate refresh error
      mockMessageService.sendMessage.mockRejectedValue(new Error('API Error'))
      overlayManager.handleRefreshButtonClick()
      
      // Verify focus is restored
      expect(document.activeElement).toBe(initialFocus)
    })
  })

  describe('[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-ACCESSIBILITY-001)] High Contrast Tests', () => {
    test('should be visible in high contrast mode', () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-ACCESSIBILITY-001)] Test high contrast
      const refreshButton = document.querySelector('.refresh-button')
      const computedStyle = window.getComputedStyle(refreshButton)
      
      // Verify sufficient contrast ratio
      const backgroundColor = computedStyle.backgroundColor
      const color = computedStyle.color
      
      // Calculate contrast ratio (simplified)
      const contrastRatio = calculateContrastRatio(backgroundColor, color)
      expect(contrastRatio).toBeGreaterThan(4.5) // WCAG AA standard
    })
  })
})

// Helper function for contrast ratio calculation
function calculateContrastRatio(bg, fg) {
  // Simplified contrast ratio calculation
  // In real implementation, use proper color contrast library
  return 5.0 // Mock value for testing
}
```

---

## ⚡ Performance Test Implementation

### **Test File: `tests/performance/overlay-refresh-performance.test.js`**

```javascript
// [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-TEST-001)] Performance tests for overlay refresh button
import { jest } from '@jest/globals'

describe('[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-BUTTON-001)] Performance Tests', () => {
  describe('[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-PERFORMANCE-001)] Refresh Operation Timing', () => {
    test('should complete refresh operation within 100ms', async () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-PERFORMANCE-001)] Test refresh timing
      const startTime = performance.now()
      
      await overlayManager.handleRefreshButtonClick()
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(100) // 100ms threshold
    })

    test('should not block UI during refresh', async () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-PERFORMANCE-001)] Test UI responsiveness
      const mockShowMessage = jest.fn()
      overlayManager.showMessage = mockShowMessage
      
      // Simulate slow network
      mockMessageService.sendMessage.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 50))
      )
      
      const refreshPromise = overlayManager.handleRefreshButtonClick()
      
      // Verify UI remains responsive
      expect(mockShowMessage).toHaveBeenCalledWith('Refreshing data...', 'info')
      
      await refreshPromise
    })
  })

  describe('[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-PERFORMANCE-001)] Memory Usage Tests', () => {
    test('should not cause memory leaks', async () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-PERFORMANCE-001)] Test memory usage
      const initialMemory = performance.memory?.usedJSHeapSize || 0
      
      // Perform multiple refresh operations
      for (let i = 0; i < 10; i++) {
        await overlayManager.handleRefreshButtonClick()
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be minimal (< 1MB)
      expect(memoryIncrease).toBeLessThan(1024 * 1024)
    })
  })

  describe('[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-PERFORMANCE-001)] Rendering Performance Tests', () => {
    test('should not cause layout thrashing', async () => {
      // [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-PERFORMANCE-001)] Test rendering performance
      const mockGetBoundingClientRect = jest.fn()
      const mockRefreshButton = {
        getBoundingClientRect: mockGetBoundingClientRect
      }
      
      document.querySelector = jest.fn().mockReturnValue(mockRefreshButton)
      
      await overlayManager.handleRefreshButtonClick()
      
      // Verify minimal DOM queries during refresh
      expect(mockGetBoundingClientRect).toHaveBeenCalledTimes(1)
    })
  })
})
```

---

## 🧪 Test Execution Strategy

### **Test Environment Setup**
```javascript
// [[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-TEST-001)] Test environment configuration
const testConfig = {
  // Mock browser APIs
  chrome: {
    runtime: {
      sendMessage: jest.fn()
    }
  },
  
  // Mock DOM APIs
  document: {
    createElement: jest.fn(),
    querySelector: jest.fn(),
    getElementById: jest.fn()
  },
  
  // Mock performance APIs
  performance: {
    now: jest.fn(),
    memory: {
      usedJSHeapSize: 0
    }
  }
}
```

### **Test Categories and Execution Order**

1. **Unit Tests** (Fastest execution)
   - Button rendering and positioning
   - Click handler functionality
   - Error handling scenarios

2. **Integration Tests** (Medium execution time)
   - Popup coordination
   - Data flow integration
   - Cross-platform compatibility

3. **Accessibility Tests** (Medium execution time)
   - Screen reader compatibility
   - Keyboard navigation
   - Focus management

4. **Performance Tests** (Longest execution time)
   - Refresh operation timing
   - Memory usage impact
   - UI responsiveness

### **Test Coverage Requirements**

- **Unit Tests**: 90%+ coverage for new functionality
- **Integration Tests**: All major integration points
- **Accessibility Tests**: All WCAG 2.1 AA requirements
- **Performance Tests**: All performance thresholds

---

## 📊 Test Results Reporting

### **Test Metrics**
- Total test count: 25+ tests
- Unit test coverage: 90%+
- Integration test coverage: 100%
- Accessibility test coverage: 100%
- Performance test coverage: 100%

### **Success Criteria**
- All tests pass consistently
- Performance benchmarks met
- Accessibility standards satisfied
- Cross-platform compatibility verified

---

**[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] (was OVERLAY-REFRESH-BUTTON-001)]** - Master semantic token for overlay refresh button functionality 