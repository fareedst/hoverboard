/**
 * === IMPL-FULL-BLOCK: IMPL-POPUP_SESSION ===
 * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] — PopupController handlers await messages; StateManager and UIManager updates; no window.close. Contract: user actions and GET_OVERLAY_STATE; popup open and state/UI in sync.
 * 
 * ## MAIN
 * 
 * - [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] How: Logical block for IMPL-POPUP_SESSION.
 * - Contract:
 *   - INPUT: user actions (show overlay, toggle private, save, etc.); GET_OVERLAY_STATE fallback
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: popup stays open; state and UI updated; no window.close
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: StateManager (overlay visible, bookmark, etc.); UIManager (button states, labels)
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Await message; update state and UI; inline notification; do not close.
 *   - 1. PopupController handler (e.g. handleShowHoverboard):
 *   - 2.   AWAIT send message (e.g. TOGGLE_OVERLAY)
 *   - 3.   StateManager.update(...); UIManager.updateShowHoverButtonState(...)
 *   - 4.   INLINE notification if needed; DO NOT call window.close
 *   - How (sub-block): On open sync overlay state to StateManager and UIManager.
 *   - 5. ON popup open: SEND GET_OVERLAY_STATE; SYNC state to StateManager and UIManager
 * 
 * === END IMPL-FULL-BLOCK: IMPL-POPUP_SESSION ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-UX_CORE ===
 * [IMPL-UX_CORE] [ARCH-UX_CORE] [REQ-CORE_UX_PRESERVATION] [REQ-POPUP_PERSISTENT_SESSION] — How: preserve multi-action popup/overlay workflows; popup session stays open across successive actions.
 * 
 * ## HANDLE_POPUP_ACTION
 * 
 * - [IMPL-UX_CORE] [ARCH-UX_CORE] [REQ-POPUP_PERSISTENT_SESSION] How: after action success, refresh live data in place instead of closing the popup.
 * - Contract:
 *   - INPUT: popup/overlay user actions (save, tag, toggle, refresh); session lifecycle events
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: UI remains usable for chained actions; no forced auto-close after success; core overlay/popup behaviors retained | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: PopupController; UIManager; overlay-manager; ARCH-POPUP_SESSION / IMPL-POPUP_SESSION composition
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_POPUP_ACTION
 *   - result = AWAIT dispatch(action)
 *   - IF result.ok: REFRESH_POPUP_STATE(); KEEP popup open
 *   - ELSE: SHOW error; KEEP popup open
 *   - RETURN result
 *   - How (sub-block): How: overlay continues to support close/refresh/tag without regressing core show/hide UX.
 * 
 * ## PRESERVE_OVERLAY_CORE
 * 
 * - [IMPL-UX_CORE] [ARCH-UX_CORE] [REQ-CORE_UX_PRESERVATION] [REQ-POPUP_PERSISTENT_SESSION] How: Implements PRESERVE_OVERLAY_CORE behavior for IMPL-UX_CORE.
 * - Contract:
 *   - INPUT: popup/overlay user actions (save, tag, toggle, refresh); session lifecycle events
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: UI remains usable for chained actions; no forced auto-close after success; core overlay/popup behaviors retained
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: PopupController; UIManager; overlay-manager; ARCH-POPUP_SESSION / IMPL-POPUP_SESSION composition
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: PRESERVE_OVERLAY_CORE
 *   - SHOW/HIDE overlay per config and site policy
 *   - RETAIN close and refresh controls (IMPL-OVERLAY_CONTROLS)
 *   - RETURN
 * 
 * === END IMPL-FULL-BLOCK: IMPL-UX_CORE ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-PRIVACY ===
 * [IMPL-PRIVACY] [ARCH-PRIVACY] [REQ-PRIVACY_CONTROLS] — How: honor private/shared bookmark flags and site inhibition so sensitive URLs and private pins stay under user control.
 * 
 * ## APPLY_PRIVACY_CONTROLS
 * 
 * - [IMPL-PRIVACY] [ARCH-PRIVACY] [REQ-PRIVACY_CONTROLS] How: before injecting page UI, check inhibit rules; before save, map private UI to API shared=no.
 * - Contract:
 *   - INPUT: bookmark shared/toread/private flags; inhibit URL lists from ConfigManager; site management rules
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Pinboard/local payloads with correct shared flag; overlay/popup suppressed on inhibited URLs
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: ConfigManager hoverboard_settings; IMPL-URL_INHIBITION; Pinboard API shared field
 *   - EFFECTS: Http, IO
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_PRIVACY_CONTROLS
 *   - IF isUrlInhibited(url): SUPPRESS overlay/hover; RETURN blocked
 *   - draft.shared = NOT draft.private
 *   - RETURN draft ready for SAVE_BOOKMARK
 * 
 * === END IMPL-FULL-BLOCK: IMPL-PRIVACY ===
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

  describe('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] - Checkbox state loading', () => {
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

  describe('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] - Checkbox state saving', () => {
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

  describe('[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] - Configuration broadcasting', () => {
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