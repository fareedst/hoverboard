/**
 * [POPUP-CLOSE-BEHAVIOR-006] Popup close behavior - [REQ-POPUP_PERSISTENT_SESSION] [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION]
 */

import { PopupController } from '../../src/ui/popup/PopupController.js'
import { UIManager } from '../../src/ui/popup/UIManager.js'

describe('[REQ-POPUP_PERSISTENT_SESSION] [IMPL-POPUP_SESSION] Popup Close Behavior', () => {
  let popupController
  let mockUIManager
  let mockStateManager
  let mockErrorHandler

  beforeEach(() => {
    // Setup mocks
    mockUIManager = {
      updateShowHoverButtonState: jest.fn(),
      showError: jest.fn(),
      showSuccess: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      setLoading: jest.fn(),
      updateCurrentTags: jest.fn(),
      updatePrivateStatus: jest.fn(),
      updateReadLaterStatus: jest.fn(),
      updateConnectionStatus: jest.fn()
    }

    mockStateManager = {
      setState: jest.fn()
    }

    mockErrorHandler = {
      handleError: jest.fn()
    }

    // Mock chrome API
    global.chrome = {
      tabs: {
        query: jest.fn().mockResolvedValue([{ id: 1, url: 'https://example.com' }])
      },
      runtime: {
        sendMessage: jest.fn().mockResolvedValue({ success: true })
      }
    }

    // Mock window.close
    global.window = {
      close: jest.fn()
    }

    popupController = new PopupController({
      uiManager: mockUIManager,
      stateManager: mockStateManager,
      errorHandler: mockErrorHandler
    })

    // Mock sendToTab method
    popupController.sendToTab = jest.fn()
    
    // Mock closePopup method
    popupController.closePopup = jest.fn()

    // Ensure the uiManager is the mocked one
    popupController.uiManager = mockUIManager
  })

  describe('handleShowHoverboard', () => {
    test('[POPUP-CLOSE-BEHAVIOR-006] should not call closePopup after toggle', async () => {
      // Mock successful toggle response
      popupController.sendToTab.mockResolvedValue({
        success: true,
        data: { isVisible: true }
      })

      // Mock canInjectIntoTab to return true
      popupController.canInjectIntoTab = jest.fn().mockReturnValue(true)

      await popupController.handleShowHoverboard()

      // Verify closePopup was NOT called
      expect(popupController.closePopup).not.toHaveBeenCalled()
      
      // Verify sendToTab was called with TOGGLE_HOVER
      expect(popupController.sendToTab).toHaveBeenCalledWith({
        type: 'TOGGLE_HOVER',
        data: {
          bookmark: popupController.currentPin,
          tab: popupController.currentTab
        }
      })

      // Verify UI was updated with overlay state
      expect(mockUIManager.updateShowHoverButtonState).toHaveBeenCalledWith(true)
    })

    test('[POPUP-CLOSE-BEHAVIOR-006] should handle toggle response data correctly', async () => {
      // Mock toggle response with overlay state
      popupController.sendToTab.mockResolvedValue({
        success: true,
        data: { isVisible: false }
      })

      popupController.canInjectIntoTab = jest.fn().mockReturnValue(true)

      await popupController.handleShowHoverboard()

      // Verify UI was updated with correct state
      expect(mockUIManager.updateShowHoverButtonState).toHaveBeenCalledWith(false)
    })

    test('[POPUP-CLOSE-BEHAVIOR-006] should fallback to updateOverlayState when no response data', async () => {
      // Mock toggle response without data
      popupController.sendToTab.mockResolvedValue({
        success: true
      })

      popupController.canInjectIntoTab = jest.fn().mockReturnValue(true)

      await popupController.handleShowHoverboard()

      // Verify updateOverlayState was called as fallback
      expect(popupController.sendToTab).toHaveBeenCalledWith({
        type: 'GET_OVERLAY_STATE'
      })
    })
  })

  describe('updateOverlayState', () => {
    test('[POPUP-CLOSE-BEHAVIOR-005] should update UI with overlay state', async () => {
      // Mock GET_OVERLAY_STATE response
      popupController.sendToTab.mockResolvedValue({
        success: true,
        data: {
          isVisible: true,
          hasBookmark: true,
          overlayElement: true
        }
      })

      await popupController.updateOverlayState()

      // Verify sendToTab was called with GET_OVERLAY_STATE
      expect(popupController.sendToTab).toHaveBeenCalledWith({
        type: 'GET_OVERLAY_STATE'
      })

      // Verify UI was updated
      expect(mockUIManager.updateShowHoverButtonState).toHaveBeenCalledWith(true)
    })

    test('[POPUP-CLOSE-BEHAVIOR-ARCH-005] should handle errors gracefully', async () => {
      // Mock error response
      popupController.sendToTab.mockRejectedValue(new Error('Network error'))

      await popupController.updateOverlayState()

      // Verify fallback to default state
      expect(mockUIManager.updateShowHoverButtonState).toHaveBeenCalledWith(false)
    })
  })

  describe('Other button handlers', () => {
    test('[POPUP-CLOSE-BEHAVIOR-006] handleTogglePrivate should NOT call closePopup', async () => {
      // Test handleTogglePrivate
      popupController.sendMessage = jest.fn().mockResolvedValue({ success: true })
      popupController.currentPin = { shared: 'yes' }

      await popupController.handleTogglePrivate()

      // Verify closePopup was NOT called (handleTogglePrivate doesn't close popup)
      expect(popupController.closePopup).not.toHaveBeenCalled()
    })

    test('[POPUP-CLOSE-BEHAVIOR-006] handleReadLater should NOT call closePopup', async () => {
      // Test handleReadLater
      popupController.sendMessage = jest.fn().mockResolvedValue({ success: true })
      popupController.currentPin = { toread: 'no' }

      await popupController.handleReadLater()

      // Verify closePopup was NOT called (handleReadLater doesn't close popup)
      expect(popupController.closePopup).not.toHaveBeenCalled()
    })

    test('[POPUP-CLOSE-BEHAVIOR-FIX-001] handleDeletePin should NOT call closePopup', async () => {
      // Test handleDeletePin with new behavior - popup stays open
      popupController.currentPin = { url: 'https://example.com' }
      
      // Mock confirm to return true - ensure it's available in all contexts
      const mockConfirm = jest.fn().mockReturnValue(true)
      // Set globalThis.confirm (checked first in the code) - ensure globalThis exists and confirm is a function
      if (typeof globalThis === 'undefined') {
        global.globalThis = global
      }
      globalThis.confirm = mockConfirm
      // Also set window.confirm as fallback
      if (typeof window !== 'undefined') {
        window.confirm = mockConfirm
      }
      // Set global.confirm for Jest environment
      global.confirm = mockConfirm

      // Mock sendMessage to resolve successfully - sendMessage returns response.data when response.success is true
      // So we need to mock it to return the data directly (not wrapped in {success: true})
      const sendMessageMock = jest.fn().mockResolvedValue({})
      popupController.sendMessage = sendMessageMock
      
      // Mock sendToTab to resolve successfully - it's called after showSuccess, so it shouldn't affect the test
      // But we need to ensure it doesn't throw an error
      popupController.sendToTab = jest.fn().mockResolvedValue({ success: true })
      popupController.canInjectIntoTab = jest.fn().mockReturnValue(true)
      popupController.currentTab = { id: 1, url: 'https://example.com' }

      // Ensure setLoading doesn't throw - it calls uiManager.setLoading which is already mocked
      // No need to mock setLoading itself since it's a real method that calls the mocked uiManager

      await popupController.handleDeletePin()

      // Verify confirm was called (if it wasn't, the function would return early)
      expect(mockConfirm).toHaveBeenCalled()
      
      // Verify sendMessage was called with correct parameters
      expect(sendMessageMock).toHaveBeenCalledWith({
        type: 'deleteBookmark',
        data: { url: 'https://example.com' }
      })
      
      // Verify closePopup was NOT called (new behavior)
      expect(popupController.closePopup).not.toHaveBeenCalled()
      
      // Verify success message was shown (check if it was called at all)
      // This verifies that the deletion succeeded and the confirm dialog worked
      // Note: showSuccess is called after sendMessage succeeds, so if sendMessage was called,
      // showSuccess should also be called unless there's an error
      // Check if errorHandler was called (which would indicate an error occurred)
      if (popupController.errorHandler.handleError.mock.calls.length > 0) {
        console.log('Error occurred:', popupController.errorHandler.handleError.mock.calls)
      }
      expect(popupController.uiManager.showSuccess).toHaveBeenCalledWith('Bookmark deleted successfully')
    })

    test('[POPUP-CLOSE-BEHAVIOR-FIX-001] handleReloadExtension should NOT call closePopup', async () => {
      // Test handleReloadExtension with new behavior - popup stays open
      popupController.currentTab = { id: 123 }

      // Mock chrome API
      global.chrome = {
        tabs: {
          reload: jest.fn().mockResolvedValue()
        }
      }

      await popupController.handleReloadExtension()

      // Verify closePopup was NOT called (new behavior)
      expect(popupController.closePopup).not.toHaveBeenCalled()
      
      // Verify success message was shown (check if it was called at all)
      expect(popupController.uiManager.showSuccess).toHaveBeenCalled()
    })

    test('[POPUP-CLOSE-BEHAVIOR-FIX-001] handleOpenOptions should NOT call closePopup', async () => {
      // Test handleOpenOptions with new behavior - popup stays open
      
      // Mock chrome API
      global.chrome = {
        runtime: {
          openOptionsPage: jest.fn()
        }
      }

      await popupController.handleOpenOptions()

      // Verify closePopup was NOT called (new behavior)
      expect(popupController.closePopup).not.toHaveBeenCalled()
      
      // Verify success message was shown (check if it was called at all)
      expect(popupController.uiManager.showSuccess).toHaveBeenCalled()
    })
  })
})

describe('[POPUP-CLOSE-BEHAVIOR-005] UIManager Show Hover Button State', () => {
  let uiManager

  beforeEach(() => {
    // Mock DOM elements
    const mockShowHoverBtn = {
      querySelector: jest.fn().mockReturnValue({
        textContent: ''
      }),
      setAttribute: jest.fn()
    }

    // Mock document.getElementById
    global.document = {
      getElementById: jest.fn().mockReturnValue(mockShowHoverBtn)
    }

    uiManager = new UIManager({
      errorHandler: { handleError: jest.fn() },
      stateManager: { setState: jest.fn() },
      config: {}
    })

    // Mock the elements
    uiManager.elements.showHoverBtn = mockShowHoverBtn
  })

  test('[POPUP-CLOSE-BEHAVIOR-005] should update button text and icon for visible overlay', () => {
    const mockActionIcon = { textContent: '' }

    uiManager.elements.showHoverBtn.querySelector
      .mockReturnValueOnce(mockActionIcon)  // .action-icon

    uiManager.updateShowHoverButtonState(true)

    expect(mockActionIcon.textContent).toBe('🙈')
    expect(uiManager.elements.showHoverBtn.title).toBe('Hide hoverboard overlay')
    expect(uiManager.elements.showHoverBtn.setAttribute).toHaveBeenCalledWith('aria-label', 'Hide hoverboard overlay')
  })

  test('[POPUP-CLOSE-BEHAVIOR-005] should update button text and icon for hidden overlay', () => {
    const mockActionIcon = { textContent: '' }

    uiManager.elements.showHoverBtn.querySelector
      .mockReturnValueOnce(mockActionIcon)  // .action-icon

    uiManager.updateShowHoverButtonState(false)

    expect(mockActionIcon.textContent).toBe('👁️')
    expect(uiManager.elements.showHoverBtn.title).toBe('Show hoverboard overlay')
    expect(uiManager.elements.showHoverBtn.setAttribute).toHaveBeenCalledWith('aria-label', 'Show hoverboard overlay')
  })

  test('[POPUP-CLOSE-BEHAVIOR-005] should handle missing button elements gracefully', () => {
    uiManager.elements.showHoverBtn = null

    // Should not throw error
    expect(() => {
      uiManager.updateShowHoverButtonState(true)
    }).not.toThrow()
  })
}) 