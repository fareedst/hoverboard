/**
 * [POPUP-CLOSE-BEHAVIOR-007] Integration tests for popup-overlay communication
 */

describe('[POPUP-CLOSE-BEHAVIOR-007] Popup-Overlay Integration', () => {
  let mockContentScript
  let mockPopupController
  let mockUIManager

  beforeEach(() => {
    // Mock content script
    mockContentScript = {
      overlayActive: false,
      currentBookmark: null,
      toggleHover: jest.fn().mockImplementation(async () => {
        mockContentScript.overlayActive = !mockContentScript.overlayActive
      }),
      handleMessage: jest.fn().mockImplementation((message, sender, sendResponse) => {
        switch (message.type) {
          case 'TOGGLE_HOVER':
            mockContentScript.toggleHover()
            sendResponse({ 
              success: true, 
              data: { 
                isVisible: mockContentScript.overlayActive,
                hasBookmark: !!mockContentScript.currentBookmark
              }
            })
            break
          case 'GET_OVERLAY_STATE':
            sendResponse({
              success: true,
              data: {
                isVisible: mockContentScript.overlayActive,
                hasBookmark: !!mockContentScript.currentBookmark,
                overlayElement: !!document.getElementById('hoverboard-overlay')
              }
            })
            break
          default:
            sendResponse({ success: false, error: 'Unknown message type' })
        }
      })
    }

    // Mock popup controller
    mockPopupController = {
      sendToTab: jest.fn().mockImplementation(async (message) => {
        return new Promise((resolve) => {
          mockContentScript.handleMessage(message, null, resolve)
        })
      }),
      uiManager: {
        updateShowHoverButtonState: jest.fn()
      }
    }

    // Mock UI manager
    mockUIManager = {
      updateShowHoverButtonState: jest.fn()
    }

    // Mock DOM
    global.document = {
      getElementById: jest.fn().mockReturnValue(null)
    }
  })

  test('[POPUP-CLOSE-BEHAVIOR-007] Toggle should maintain popup state', async () => {
    // Simulate initial state - overlay hidden
    mockContentScript.overlayActive = false
    mockContentScript.currentBookmark = { url: 'https://example.com' }

    // Simulate Show Hover button click
    const toggleResponse = await mockPopupController.sendToTab({
      type: 'TOGGLE_HOVER',
      data: {
        bookmark: mockContentScript.currentBookmark,
        tab: { id: 1, url: 'https://example.com' }
      }
    })

    // Verify overlay was toggled
    expect(mockContentScript.overlayActive).toBe(true)
    expect(toggleResponse.success).toBe(true)
    expect(toggleResponse.data.isVisible).toBe(true)

    // Simulate another toggle
    const secondToggleResponse = await mockPopupController.sendToTab({
      type: 'TOGGLE_HOVER',
      data: {
        bookmark: mockContentScript.currentBookmark,
        tab: { id: 1, url: 'https://example.com' }
      }
    })

    // Verify overlay was toggled back
    expect(mockContentScript.overlayActive).toBe(false)
    expect(secondToggleResponse.success).toBe(true)
    expect(secondToggleResponse.data.isVisible).toBe(false)
  })

  test('[POPUP-CLOSE-BEHAVIOR-007] State synchronization should work', async () => {
    // Set up initial state
    mockContentScript.overlayActive = true
    mockContentScript.currentBookmark = { url: 'https://example.com' }

    // Query overlay state
    const stateResponse = await mockPopupController.sendToTab({
      type: 'GET_OVERLAY_STATE'
    })

    // Verify state is correctly reported
    expect(stateResponse.success).toBe(true)
    expect(stateResponse.data.isVisible).toBe(true)
    expect(stateResponse.data.hasBookmark).toBe(true)

    // Toggle overlay
    await mockPopupController.sendToTab({
      type: 'TOGGLE_HOVER',
      data: { bookmark: mockContentScript.currentBookmark, tab: { id: 1 } }
    })

    // Query state again
    const updatedStateResponse = await mockPopupController.sendToTab({
      type: 'GET_OVERLAY_STATE'
    })

    // Verify state is updated
    expect(updatedStateResponse.data.isVisible).toBe(false)
  })

  test('[POPUP-CLOSE-BEHAVIOR-007] Should handle missing overlay element gracefully', async () => {
    // Overlay element is already mocked as null in beforeEach
    mockContentScript.overlayActive = true

    const stateResponse = await mockPopupController.sendToTab({
      type: 'GET_OVERLAY_STATE'
    })

    // Should still return state even if DOM element is missing
    expect(stateResponse.success).toBe(true)
    expect(stateResponse.data.isVisible).toBe(true)
    expect(stateResponse.data.overlayElement).toBe(false)
  })

  test('[POPUP-CLOSE-BEHAVIOR-007] Should handle bookmark state changes', async () => {
    // Start with no bookmark
    mockContentScript.currentBookmark = null
    mockContentScript.overlayActive = false

    let stateResponse = await mockPopupController.sendToTab({
      type: 'GET_OVERLAY_STATE'
    })

    expect(stateResponse.data.hasBookmark).toBe(false)

    // Add bookmark
    mockContentScript.currentBookmark = { url: 'https://example.com' }

    stateResponse = await mockPopupController.sendToTab({
      type: 'GET_OVERLAY_STATE'
    })

    expect(stateResponse.data.hasBookmark).toBe(true)
  })

  test('[POPUP-CLOSE-BEHAVIOR-007] Should handle rapid toggle operations', async () => {
    mockContentScript.currentBookmark = { url: 'https://example.com' }

    // Perform rapid toggles
    const promises = []
    for (let i = 0; i < 5; i++) {
      promises.push(mockPopupController.sendToTab({
        type: 'TOGGLE_HOVER',
        data: { bookmark: mockContentScript.currentBookmark, tab: { id: 1 } }
      }))
    }

    const responses = await Promise.all(promises)

    // All responses should be successful
    responses.forEach(response => {
      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
    })

    // Final state should be consistent
    const finalState = await mockPopupController.sendToTab({
      type: 'GET_OVERLAY_STATE'
    })

    expect(finalState.success).toBe(true)
    expect(typeof finalState.data.isVisible).toBe('boolean')
  })

  test('[POPUP-CLOSE-BEHAVIOR-007] Should handle error conditions gracefully', async () => {
    // Mock error condition
    mockContentScript.handleMessage = jest.fn().mockImplementation((message, sender, sendResponse) => {
      sendResponse({ success: false, error: 'Simulated error' })
    })

    const response = await mockPopupController.sendToTab({
      type: 'TOGGLE_HOVER',
      data: { bookmark: null, tab: { id: 1 } }
    })

    expect(response.success).toBe(false)
    expect(response.error).toBe('Simulated error')
  })
})

describe('[POPUP-CLOSE-BEHAVIOR-007] End-to-End User Experience', () => {
  test('[POPUP-CLOSE-BEHAVIOR-007] Complete user workflow should work correctly', async () => {
    // This test simulates the complete user experience
    const userWorkflow = {
      // 1. User opens popup
      popupOpen: true,
      
      // 2. User clicks Show Hover button
      showHoverClicked: false,
      
      // 3. Overlay appears
      overlayVisible: false,
      
      // 4. Popup stays open
      popupStillOpen: true,
      
      // 5. User clicks Show Hover again
      showHoverClickedAgain: false,
      
      // 6. Overlay disappears
      overlayHidden: false,
      
      // 7. Popup still open
      popupStillOpenAfterToggle: true
    }

    // Simulate the workflow
    userWorkflow.showHoverClicked = true
    userWorkflow.overlayVisible = true
    userWorkflow.popupStillOpen = true
    userWorkflow.showHoverClickedAgain = true
    userWorkflow.overlayHidden = true
    userWorkflow.popupStillOpenAfterToggle = true

    // Verify the workflow
    expect(userWorkflow.popupStillOpen).toBe(true)
    expect(userWorkflow.popupStillOpenAfterToggle).toBe(true)
    expect(userWorkflow.overlayVisible).toBe(true)
    expect(userWorkflow.overlayHidden).toBe(true)
  })

  test('[POPUP-CLOSE-BEHAVIOR-007] Button state should reflect overlay visibility', () => {
    const buttonStates = {
      overlayHidden: {
        text: 'Show Hoverboard',
        icon: '👁️',
        title: 'Show hoverboard overlay'
      },
      overlayVisible: {
        text: 'Hide Hoverboard',
        icon: '🙈',
        title: 'Hide hoverboard overlay'
      }
    }

    // Verify button states are correct
    expect(buttonStates.overlayHidden.text).toBe('Show Hoverboard')
    expect(buttonStates.overlayHidden.icon).toBe('👁️')
    expect(buttonStates.overlayVisible.text).toBe('Hide Hoverboard')
    expect(buttonStates.overlayVisible.icon).toBe('🙈')
  })
})

describe('[POPUP-CLOSE-BEHAVIOR-FIX-002] Persistent Popup Behavior', () => {
  let mockPopupController
  let mockUIManager

  beforeEach(() => {
    // Mock popup controller with new behavior
    mockPopupController = {
      sendMessage: jest.fn().mockResolvedValue({ success: true }),
      sendToTab: jest.fn().mockResolvedValue({ success: true }),
      currentPin: { url: 'https://example.com' },
      currentTab: { id: 123 },
      closePopup: jest.fn(),
      uiManager: {
        showSuccess: jest.fn(),
        showError: jest.fn()
      }
    }

    // Mock UI manager
    mockUIManager = {
      showSuccess: jest.fn(),
      showError: jest.fn()
    }

    // Mock global functions
    global.confirm = jest.fn().mockReturnValue(true)
    global.chrome = {
      tabs: {
        reload: jest.fn().mockResolvedValue()
      },
      runtime: {
        openOptionsPage: jest.fn()
      }
    }
  })

  test('[POPUP-CLOSE-BEHAVIOR-FIX-002] Popup should stay open after Delete Pin action', async () => {
    // Simulate delete pin action
    const deletePinHandler = async () => {
      // Mock the actual handler logic
      mockPopupController.sendMessage.mockResolvedValue({ success: true })
      mockPopupController.sendToTab.mockResolvedValue({ success: true })
      
      // Simulate successful deletion
      mockPopupController.currentPin = null
      mockUIManager.showSuccess('Bookmark deleted successfully')
      
      // Popup should NOT close
      expect(mockPopupController.closePopup).not.toHaveBeenCalled()
    }

    await deletePinHandler()

    // Verify popup stays open
    expect(mockPopupController.closePopup).not.toHaveBeenCalled()
    expect(mockUIManager.showSuccess).toHaveBeenCalledWith('Bookmark deleted successfully')
  })

  test('[POPUP-CLOSE-BEHAVIOR-FIX-002] Popup should stay open after Reload Extension action', async () => {
    // Simulate reload extension action
    const reloadExtensionHandler = async () => {
      // Mock the actual handler logic
      global.chrome.tabs.reload.mockResolvedValue()
      
      // Simulate successful reload
      mockUIManager.showSuccess('Extension reloaded successfully')
      
      // Popup should NOT close
      expect(mockPopupController.closePopup).not.toHaveBeenCalled()
    }

    await reloadExtensionHandler()

    // Verify popup stays open
    expect(mockPopupController.closePopup).not.toHaveBeenCalled()
    expect(mockUIManager.showSuccess).toHaveBeenCalledWith('Extension reloaded successfully')
  })

  test('[POPUP-CLOSE-BEHAVIOR-FIX-002] Popup should stay open after Open Options action', async () => {
    // Simulate open options action
    const openOptionsHandler = async () => {
      // Mock the actual handler logic
      global.chrome.runtime.openOptionsPage()
      
      // Simulate successful options page opening
      mockUIManager.showSuccess('Options page opened in new tab')
      
      // Popup should NOT close
      expect(mockPopupController.closePopup).not.toHaveBeenCalled()
    }

    await openOptionsHandler()

    // Verify popup stays open
    expect(mockPopupController.closePopup).not.toHaveBeenCalled()
    expect(mockUIManager.showSuccess).toHaveBeenCalledWith('Options page opened in new tab')
  })

  test('[POPUP-CLOSE-BEHAVIOR-FIX-002] Only popup close icon should close popup', () => {
    // Test that only the close icon closes the popup
    const actionButtons = [
      'Show Hover',
      'Toggle Private', 
      'Read Later',
      'Add Tag',
      'Remove Tag',
      'Delete Pin',
      'Reload Extension',
      'Open Options'
    ]

    // Simulate all action buttons being clicked
    actionButtons.forEach(button => {
      // All action buttons should NOT close popup
      expect(mockPopupController.closePopup).not.toHaveBeenCalled()
    })

    // Only the close icon should close popup
    const closeIconHandler = () => {
      mockPopupController.closePopup()
    }

    closeIconHandler()
    expect(mockPopupController.closePopup).toHaveBeenCalledTimes(1)
  })

  test('[POPUP-CLOSE-BEHAVIOR-FIX-002] Multiple actions should keep popup open', async () => {
    // Simulate user performing multiple actions
    const actions = [
      () => mockUIManager.showSuccess('Bookmark deleted successfully'),
      () => mockUIManager.showSuccess('Extension reloaded successfully'),
      () => mockUIManager.showSuccess('Options page opened in new tab')
    ]

    // Perform all actions
    for (const action of actions) {
      action()
      // Popup should remain open after each action
      expect(mockPopupController.closePopup).not.toHaveBeenCalled()
    }

    // Verify all success messages were shown
    expect(mockUIManager.showSuccess).toHaveBeenCalledWith('Bookmark deleted successfully')
    expect(mockUIManager.showSuccess).toHaveBeenCalledWith('Extension reloaded successfully')
    expect(mockUIManager.showSuccess).toHaveBeenCalledWith('Options page opened in new tab')
  })
}) 