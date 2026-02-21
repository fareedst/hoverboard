/**
 * Popup checkbox (show hover on page load) - [REQ-OVERLAY_AUTO_SHOW_CONTROL] [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION]
 * [SHOW-HOVER-CHECKBOX-TEST-001] through [SHOW-HOVER-CHECKBOX-TEST-003]
 */

import { PopupController } from '../../src/ui/popup/PopupController.js'
import { UIManager } from '../../src/ui/popup/UIManager.js'
import { StateManager } from '../../src/ui/popup/StateManager.js'
import { ConfigManager } from '../../src/config/config-manager.js'
import { ErrorHandler } from '../../src/shared/ErrorHandler.js'

// Mock DOM elements
const mockElements = {
  showHoverOnPageLoad: {
    checked: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }
}

// Mock UIManager
jest.mock('../../src/ui/popup/UIManager.js', () => ({
  UIManager: jest.fn().mockImplementation(() => ({
    elements: mockElements,
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showMainInterface: jest.fn(),
    updateConnectionStatus: jest.fn(),
    updatePrivateStatus: jest.fn(),
    updateReadLaterStatus: jest.fn(),
    updateCurrentTags: jest.fn(),
    updateRecentTags: jest.fn(),
    updateVersionInfo: jest.fn(),
    updateShowHoverButtonState: jest.fn(),
    setupEventListeners: jest.fn()
  }))
}))

// Mock ConfigManager
jest.mock('../../src/config/config-manager.js', () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    getConfig: jest.fn().mockResolvedValue({
      showHoverOnPageLoad: false,
      hoverShowTooltips: false,
      recentTagsCountMax: 32,
      initRecentPostsCount: 15,
      uxAutoCloseTimeout: 0,
      uxRecentRowWithBlock: true,
      uxRecentRowWithBookmarkButton: true,
      uxRecentRowWithCloseButton: true,
      uxRecentRowWithPrivateButton: true,
      uxRecentRowWithDeletePin: true,
      uxRecentRowWithInput: true,
      uxUrlStripHash: false,
      uxShowSectionLabels: false,
      badgeTextIfNotBookmarked: '-',
      badgeTextIfBookmarkedNoTags: '📌',
      badgeTextIfPrivate: '🔒',
      badgeTextIfQueued: '📋',
      defaultVisibilityTheme: 'light-on-dark',
      defaultTransparencyEnabled: false,
      defaultBackgroundOpacity: 5
    }),
    updateConfig: jest.fn().mockResolvedValue(true),
    getAuthToken: jest.fn().mockResolvedValue('test-token'),
    setAuthToken: jest.fn().mockResolvedValue(true),
    getInhibitUrls: jest.fn().mockResolvedValue([]),
    setInhibitUrls: jest.fn().mockResolvedValue(true),
    isUrlAllowed: jest.fn().mockResolvedValue(true),
    addInhibitUrl: jest.fn().mockResolvedValue({ inhibit: '' }),
    hasAuthToken: jest.fn().mockResolvedValue(true),
    getAuthTokenParam: jest.fn().mockResolvedValue('auth_token=test-token'),
    exportConfig: jest.fn().mockResolvedValue({
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      settings: {},
      authToken: 'test-token',
      inhibitUrls: []
    }),
    importConfig: jest.fn().mockResolvedValue(true),
    resetToDefaults: jest.fn().mockResolvedValue(true),
    initializeDefaults: jest.fn().mockResolvedValue(true)
  }))
}))

// Mock StateManager
jest.mock('../../src/ui/popup/StateManager.js', () => ({
  StateManager: jest.fn().mockImplementation(() => ({
    setState: jest.fn(),
    getState: jest.fn().mockReturnValue({}),
    subscribe: jest.fn(),
    unsubscribe: jest.fn()
  }))
}))

// Mock ErrorHandler
jest.mock('../../src/shared/ErrorHandler.js', () => ({
  ErrorHandler: jest.fn().mockImplementation(() => ({
    handleError: jest.fn(),
    logError: jest.fn()
  }))
}))

// Mock chrome API
global.chrome = {
  runtime: {
    getManifest: jest.fn().mockReturnValue({ version: '1.0.0' }),
    onMessage: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn().mockResolvedValue({ success: true }),
    openOptionsPage: jest.fn()
  },
  tabs: {
    query: jest.fn().mockResolvedValue([{ id: 1, url: 'https://example.com', title: 'Example' }]),
    sendMessage: jest.fn().mockResolvedValue({ success: true }),
    reload: jest.fn().mockResolvedValue(true)
  },
  storage: {
    sync: {
      get: jest.fn().mockResolvedValue({
        hoverboard_settings: {
          showHoverOnPageLoad: false
        }
      }),
      set: jest.fn().mockResolvedValue(true)
    }
  }
}

describe('[REQ-OVERLAY_AUTO_SHOW_CONTROL] [IMPL-POPUP_SESSION] Popup Checkbox Functionality', () => {
  let popupController
  let configManager
  let uiManager

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Create fresh instances
    configManager = new ConfigManager()
    uiManager = new UIManager()
    popupController = new PopupController({
      configManager,
      uiManager
    })

    // Mock the methods that are used in the tests
    popupController.sendToTab = jest.fn().mockResolvedValue({ success: true })
    popupController.sendMessage = jest.fn().mockResolvedValue({ success: true })
  })

  describe('[SHOW-HOVER-CHECKBOX-TEST-001] - Checkbox state loading', () => {
    test('should load checkbox state from configuration', async () => {
      // Mock config with showHoverOnPageLoad: true
      configManager.getConfig.mockResolvedValue({
        showHoverOnPageLoad: true
      })

      await popupController.loadShowHoverOnPageLoadSetting()

      expect(configManager.getConfig).toHaveBeenCalled()
      expect(uiManager.elements.showHoverOnPageLoad.checked).toBe(true)
    })

    test('should handle configuration loading errors', async () => {
      configManager.getConfig.mockRejectedValue(new Error('Config error'))

      await popupController.loadShowHoverOnPageLoadSetting()

      expect(popupController.errorHandler.handleError).toHaveBeenCalledWith(
        'Failed to load page load setting',
        expect.any(Error)
      )
    })
  })

  describe('[SHOW-HOVER-CHECKBOX-TEST-002] - Checkbox state saving', () => {
    test('should save checkbox state to configuration', async () => {
      uiManager.elements.showHoverOnPageLoad.checked = true

      await popupController.handleShowHoverOnPageLoadChange()

      expect(configManager.updateConfig).toHaveBeenCalledWith({
        showHoverOnPageLoad: true
      })
      expect(uiManager.showSuccess).toHaveBeenCalledWith('Hover will show on page load')
    })

    test('should save unchecked state to configuration', async () => {
      uiManager.elements.showHoverOnPageLoad.checked = false

      await popupController.handleShowHoverOnPageLoadChange()

      expect(configManager.updateConfig).toHaveBeenCalledWith({
        showHoverOnPageLoad: false
      })
      expect(uiManager.showSuccess).toHaveBeenCalledWith('Hover will not show on page load')
    })

    test('should handle configuration update errors', async () => {
      configManager.updateConfig.mockRejectedValue(new Error('Update error'))
      uiManager.elements.showHoverOnPageLoad.checked = true

      await popupController.handleShowHoverOnPageLoadChange()

      expect(popupController.errorHandler.handleError).toHaveBeenCalledWith(
        'Failed to update page load setting',
        expect.any(Error)
      )
    })
  })

  describe('[SHOW-HOVER-CHECKBOX-TEST-003] - Configuration broadcasting', () => {
    test('should broadcast configuration updates to content scripts', async () => {
      configManager.getConfig.mockResolvedValue({
        showHoverOnPageLoad: true
      })
      popupController.currentTab = { id: 1, url: 'https://example.com' }

      await popupController.broadcastConfigUpdate()

      expect(popupController.sendToTab).toHaveBeenCalledWith({
        type: 'UPDATE_CONFIG',
        data: { showHoverOnPageLoad: true }
      })
      expect(popupController.sendMessage).toHaveBeenCalledWith({
        type: 'updateOverlayConfig',
        data: { showHoverOnPageLoad: true }
      })
    })

    test('should handle broadcasting errors', async () => {
      // Mock configManager.getConfig to throw an error
      configManager.getConfig.mockRejectedValue(new Error('Config error'))

      await popupController.broadcastConfigUpdate()

      expect(popupController.errorHandler.handleError).toHaveBeenCalledWith(
        'Failed to broadcast config update',
        expect.any(Error)
      )
    })
  })

  describe('Event handling', () => {
    test('should bind checkbox event handler', () => {
      expect(uiManager.on).toHaveBeenCalledWith(
        'showHoverOnPageLoadChange',
        expect.any(Function)
      )
    })
  })
}) 