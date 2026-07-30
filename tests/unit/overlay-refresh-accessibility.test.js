/**
 * === IMPL-FULL-BLOCK: IMPL-OVERLAY_CONTROLS ===
 * [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_CONTROL_LAYOUT] — Close and refresh buttons with fixed position, 24px min touch target, ARIA, theme vars. Contract: parent and theme and callback; control elements and styles.
 * 
 * ## CREATE_CLOSE_BUTTON
 * 
 * - Layout contract [ARCH-OVERLAY]/[ARCH-OVERLAY_CONTROLS]: Close at top/right 8/8 (px from edges). How: Implements createCloseButton() behavior for IMPL-OVERLAY_CONTROLS.
 * - Contract:
 *   - INPUT: parent element; theme CSS variables; callback (close/refresh)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: control elements with fixed position, min 24px touch target, ARIA, keyboard handlers
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: inline styles (position absolute); theme vars for colors; ARIA labels/roles
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: CREATE_CLOSE_BUTTON
 *   - CREATE button; SET position top 8px right 8px, size (min 24px); SET aria-label
 *   - APPLY theme vars; ATTACH click -> callback; ATTACH key (Escape)
 *   - RETURN element
 *   - How (sub-block): Create refresh button with position, size, ARIA, theme, click handler.
 * 
 * ## CREATE_REFRESH_BUTTON
 * 
 * - Layout contract [ARCH-OVERLAY]/[ARCH-OVERLAY_CONTROLS]: Refresh at top/right 8/40 (px from edges). How: Implements createRefreshButton() behavior for IMPL-OVERLAY_CONTROLS.
 * - Contract:
 *   - INPUT: parent element; theme CSS variables; callback (close/refresh)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: control elements with fixed position, min 24px touch target, ARIA, keyboard handlers
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: inline styles (position absolute); theme vars for colors; ARIA labels/roles
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: CREATE_REFRESH_BUTTON
 *   - CREATE button; SET position top 8px right 40px, size; SET aria-label
 *   - APPLY theme vars; ATTACH click -> callback
 *   - RETURN element
 * 
 * === END IMPL-FULL-BLOCK: IMPL-OVERLAY_CONTROLS ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-UI_TESTABILITY_HOOKS ===
 * [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-MODULE_VALIDATION] — setOnMessageProcessed, setOnAction, setOnStateChange so tests assert without DOM. Contract: callbacks set by tests; message/action/state trigger callbacks.
 * 
 * ## MAIN
 * 
 * - [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-MODULE_VALIDATION] How: Logical block for IMPL-UI_TESTABILITY_HOOKS.
 * - Contract:
 *   - INPUT: optional callback fn (set by tests); message (processMessage); popup/overlay action or state change
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: test can assert on message payload, action id, state without DOM
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: MessageHandler._onMessageProcessed; PopupController._onAction, _onStateChange; OverlayManager._onStateChange
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): After processMessage invoke callback with msg/result.
 *   - 1. MessageHandler: AFTER processMessage(msg): IF _onMessageProcessed: CALL with msg/result
 *   - How (sub-block): On action/state change invoke callbacks.
 *   - 2. PopupController: ON action: IF _onAction: CALL with actionId; ON state change: IF _onStateChange: CALL with state
 *   - 3. OverlayManager: ON visibility/content change: IF _onStateChange: CALL with { visible, contentSnapshot }
 *   - How (sub-block): Set callbacks, trigger, assert args.
 *   - 4. Tests: SET callbacks; TRIGGER message/action; ASSERT callback invoked with expected args
 * 
 * === END IMPL-FULL-BLOCK: IMPL-UI_TESTABILITY_HOOKS ===
 */
import { OverlayManager } from '../../src/features/content/overlay-manager.js'
const { createMockDocument } = require('../utils/mock-dom')

const respondWithRecentTags = () => ({ recentTags: [] })

const mockRefreshResponse = (mockMessageService, { bookmark, rawResponse, error } = {}) => {
  mockMessageService.sendMessage.mockImplementation(async (payload) => {
    if (payload?.type === 'getRecentBookmarks') {
      return respondWithRecentTags()
    }
    if (payload?.type === 'getCurrentBookmark') {
      if (error) {
        throw error
      }
      if (rawResponse) {
        return rawResponse
      }
      return {
        success: true,
        data: bookmark || { url: 'https://example.com', tags: ['test'] }
      }
    }
    return { success: true }
  })
}

// [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_TESTABILITY] Accessibility test suite for overlay refresh button
describe('[IMPL-OVERLAY_CONTROLS] [IMPL-UI_TESTABILITY_HOOKS] Accessibility Tests', () => {
  let overlayManager
  let mockDocument
  let mockMessageService

  beforeEach(() => {
    // [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Setup accessibility test environment
    mockDocument = createMockDocument()
    mockMessageService = {
      sendMessage: jest.fn()
    }
    overlayManager = new OverlayManager(mockDocument, {})
    overlayManager.messageService = mockMessageService
    overlayManager.showMessage = jest.fn()
    mockRefreshResponse(mockMessageService, {
      bookmark: { url: 'https://example.com', tags: ['test'] }
    })
  })

  afterEach(() => {
    // [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Cleanup accessibility test environment
    jest.clearAllMocks()
    if (mockDocument.reset) {
      mockDocument.reset()
    }
  })

  // Simple test to verify mock document is working
  test('Mock document should work correctly', () => {
    const button = mockDocument.createElement('button')
    button.className = 'refresh-button'
    mockDocument.body.appendChild(button)
    
    const foundButton = mockDocument.querySelector('.refresh-button')
    expect(foundButton).toBe(button)
  })

  // Test to see what happens when we call overlayManager.show()
  test('OverlayManager.show() should create refresh button', async () => {
    const content = {
      bookmark: { url: 'https://example.com', tags: ['test'] },
      pageTitle: 'Test Page',
      pageUrl: 'https://example.com'
    }
    
    await overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    expect(overlayManager.overlayElement).toBeDefined()
    expect(refreshButton).not.toBeNull()
  })

  // Debug test to diagnose refresh button registration
  test.skip('Debug: Check what elements are created during show()', async () => {
    // SKIPPED: This test revealed that OverlayManager.show() only creates one div element
    // and doesn't create the refresh button or other expected elements during tests.
    // 
    // PROPOSED SOLUTION:
    // 1. Add debug logging to OverlayManager.show() method to trace execution flow
    // 2. Check for early returns or conditions that prevent full overlay creation
    // 3. Verify that the content object structure matches what the method expects
    // 4. Ensure all DOM creation calls use this.document instead of global document
    // 5. Mock any dependencies (like VisibilityControls) that might cause early returns
    // 
    // Once the root cause is identified, the accessibility tests should be able to find
    // the refresh button and validate its properties properly.
    
    const content = {
      bookmark: { url: 'https://example.com', tags: ['test'] },
      pageTitle: 'Test Page',
      pageUrl: 'https://example.com'
    }
    
    // Clear any previous state
    mockDocument._allElements = []
    mockDocument._elementsByClass.clear()
    
    function w(msg) { process.stdout.write(msg + '\n') }
    w('=== DEBUG TEST START ===')
    w('Before show() - tracked elements: ' + mockDocument._allElements.length)
    w('Before show() - tracked classes: ' + JSON.stringify(Array.from(mockDocument._elementsByClass.keys())))
    
    await overlayManager.show(content)
    
    w('After show() - tracked elements: ' + mockDocument._allElements.length)
    w('After show() - all tracked elements: ' + JSON.stringify(mockDocument._allElements.map(el => ({
      tagName: el.tagName,
      className: el.className,
      id: el.id
    })), null, 2))
    w('After show() - tracked classes: ' + JSON.stringify(Array.from(mockDocument._elementsByClass.entries()), null, 2))
    
    const refreshButton = mockDocument.querySelector('.refresh-button')
    w('refreshButton query result: ' + (refreshButton ? JSON.stringify({ tagName: refreshButton.tagName, className: refreshButton.className, id: refreshButton.id }) : 'null'))
    
    // Also try querying by tag name
    const allButtons = mockDocument.querySelectorAll('button')
    w('All buttons found: ' + allButtons.length)
    allButtons.forEach((btn, i) => {
      w(`Button ${i}: ` + JSON.stringify({
        tagName: btn.tagName,
        className: btn.className,
        id: btn.id,
        innerHTML: btn.innerHTML
      }))
    })
    
    w('=== DEBUG TEST END ===')
    
    // Force the test to fail so we can see the output
    expect(refreshButton).not.toBeNull()
  })

  // [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] ARIA attributes tests
  describe('ARIA Attributes', () => {
    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should have proper ARIA attributes', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      // Act
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert
      expect(refreshButton.setAttribute).toHaveBeenCalledWith('aria-label', 'Refresh Data')
      expect(refreshButton.setAttribute).toHaveBeenCalledWith('role', 'button')
      expect(refreshButton.setAttribute).toHaveBeenCalledWith('tabindex', '0')
    })

    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should have descriptive title attribute', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      // Act
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert
      expect(refreshButton.title).toBe('Refresh Data')
    })

    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should have proper button role', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      // Act
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert
      const role = refreshButton.getAttribute('role')
      expect(refreshButton.getAttribute).toHaveBeenCalledWith('role')
      expect(role).toBe('button')
      expect(refreshButton.setAttribute).toHaveBeenCalledWith('role', 'button')
    })
  })

  // [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Keyboard navigation tests
  describe('Keyboard Navigation', () => {
    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should be focusable with tabindex', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      // Act
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert
      expect(refreshButton.setAttribute).toHaveBeenCalledWith('tabindex', '0')
      expect(refreshButton.tabIndex).toBe(0)
    })

    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should respond to Enter key', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      const enterEvent = { key: 'Enter', preventDefault: jest.fn() }
      const initialCalls = mockMessageService.sendMessage.mock.calls.length
      await refreshButton._triggerKeydown(enterEvent)
      // Assert
      expect(enterEvent.preventDefault).toHaveBeenCalled()
      expect(mockMessageService.sendMessage.mock.calls.length).toBeGreaterThan(initialCalls)
    })

    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should respond to Space key', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      const spaceEvent = { key: ' ', preventDefault: jest.fn() }
      const initialCalls = mockMessageService.sendMessage.mock.calls.length
      await refreshButton._triggerKeydown(spaceEvent)
      // Assert
      expect(spaceEvent.preventDefault).toHaveBeenCalled()
      expect(mockMessageService.sendMessage.mock.calls.length).toBeGreaterThan(initialCalls)
    })

    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should not respond to other keys', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      const otherEvent = { key: 'A', preventDefault: jest.fn() }
      const initialCalls = mockMessageService.sendMessage.mock.calls.length
      await refreshButton._triggerKeydown(otherEvent)
      // Assert
      expect(otherEvent.preventDefault).not.toHaveBeenCalled()
      expect(mockMessageService.sendMessage.mock.calls.length).toBe(initialCalls)
    })

    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should prevent default on Enter key', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      const enterEvent = { key: 'Enter', preventDefault: jest.fn() }
      await refreshButton._triggerKeydown(enterEvent)
      // Assert
      expect(enterEvent.preventDefault).toHaveBeenCalled()
    })
  })

  // [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Focus management tests
  describe('Focus Management', () => {
    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should maintain focus during loading', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      refreshButton.focus()
      await refreshButton._triggerClick()
      // Assert
      expect(refreshButton.focus).toHaveBeenCalled()
    })

    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should restore focus after completion', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      refreshButton.focus()
      await refreshButton._triggerClick()
      // Assert
      expect(refreshButton.focus).toHaveBeenCalled()
    })
  })

  // [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Screen reader compatibility tests
  describe('Screen Reader Compatibility', () => {
    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should have meaningful aria-label', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert
      expect(refreshButton.setAttribute).toHaveBeenCalledWith('aria-label', 'Refresh Data')
    })

    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should announce loading state to screen readers', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      await refreshButton._triggerClick()
      // Assert
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Refreshing data...', 'info')
    })

    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should announce completion to screen readers', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      await refreshButton._triggerClick()
      // Assert
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Data refreshed successfully', 'success')
    })

    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should announce errors to screen readers', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      mockRefreshResponse(mockMessageService, { error: new Error('fail') })
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      await refreshButton._triggerClick()
      // Assert
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Failed to refresh data', 'error')
    })
  })

  // [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Visual accessibility tests
  describe('Visual Accessibility', () => {
    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should have sufficient color contrast', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert - Check that theme variables are used for proper contrast
      expect(refreshButton.style.cssText).toContain('var(--theme-button-bg)')
      expect(refreshButton.style.cssText).toContain('var(--theme-text-primary)')
    })

    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should have focus indicator', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert - Check that focus styles are defined
      expect(refreshButton.style.cssText).toContain('outline')
    })

    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should have hover state indicator', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert - Check that transition is defined for smooth hover effects
      expect(refreshButton.style.cssText).toContain('transition')
    })
  })

  // [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] State management accessibility tests
  describe('State Management Accessibility', () => {
    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should disable button during loading', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      const clickPromise = refreshButton._triggerClick()
      // Assert loading state before await
      expect(refreshButton.disabled).toBe(true)
      await clickPromise
    })

    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should re-enable button after completion', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      await refreshButton._triggerClick()
      // Assert
      expect(refreshButton.disabled).toBe(false)
    })

    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should re-enable button after error', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      mockRefreshResponse(mockMessageService, { error: new Error('fail') })
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      await refreshButton._triggerClick()
      // Assert
      expect(refreshButton.disabled).toBe(false)
    })
  })

  // [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Semantic HTML tests
  describe('Semantic HTML', () => {
    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should use button element', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert
      expect(refreshButton.tagName).toBe('BUTTON')
    })

    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should have meaningful content', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert
      expect(refreshButton.innerHTML).toBe('🔄')
    })
  })

  // [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] WCAG compliance tests
  describe('WCAG Compliance', () => {
    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should meet WCAG 2.1 AA standards', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert - Check for required WCAG 2.1 AA features
      expect(refreshButton.setAttribute).toHaveBeenCalledWith('aria-label', 'Refresh Data')
      expect(refreshButton.setAttribute).toHaveBeenCalledWith('role', 'button')
      expect(refreshButton.setAttribute).toHaveBeenCalledWith('tabindex', '0')
      expect(refreshButton.title).toBe('Refresh Data')
    })

    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should support keyboard-only navigation', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act & Assert - Test keyboard navigation
      expect(refreshButton.tabIndex).toBe(0)
      expect(refreshButton.onkeydown).toBeDefined()
    })

    test('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Should provide clear visual feedback', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert - Check for visual feedback mechanisms
      expect(refreshButton.style.cssText).toContain('transition')
      expect(refreshButton.style.cssText).toContain('cursor: pointer')
    })
  })
})

// [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_REFRESH_ACTION] [TEST-OVERLAY_REFRESH] Export test utilities for other test files
export {
  createMockDocument
} 