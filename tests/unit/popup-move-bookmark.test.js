/**
 * === IMPL-FULL-BLOCK: IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL ===
 * Popup unwrap response.data; prefer currentPin.url for move.
 * === END IMPL-FULL-BLOCK: IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-MOVE_BOOKMARK_UI ===
 * [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] [REQ-READ_LATER_BROWSER_FALLBACK]
 * Implements the shared Save to control and the new-bookmark-only Read Later backend resolution.
 *
 * ## Summary contract
 *
 * - [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] [REQ-READ_LATER_BROWSER_FALLBACK] How: Keep ordinary Save to routing unchanged while resolving Browser-selected new Read Later saves to a metadata-capable backend.
 * - Contract:
 *   - INPUT: currentTab, currentPin, selected Save to backend, ConfigManager, UIManager, and bookmark message boundary
 *   - PRE: the shared popup stack is initialized; selected backend is one of pinboard, local, file, sync, or browser
 *   - OUTPUT: ordinary save/move requests preserve selected backend; new Read Later save uses an effective metadata-capable backend; UI reflects effective backend after success
 *   - POST:
 *     - success => persisted bookmark and Save to state use the effective backend
 *     - failure => Save to and archive-status state remain unchanged
 *   - FAILURE_MODES: ConfigReadFailed, SaveFailed, MoveFailed
 *   - DATA: currentTab, currentPin, selectedBackend, effectiveBackend, fallbackApplied, Save to DOM state, archive-status state
 *   - DATA_TRANSITION: only successful new Read Later saves replace selectedBackend with effectiveBackend; failed saves leave UI and archive state unchanged
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 *
 * ## IS_PERSISTED_BOOKMARK
 *
 * - [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] [REQ-READ_LATER_BROWSER_FALLBACK] How: Distinguish a persisted bookmark from the empty/stub currentPin by requiring persisted bookmark identity rather than object truthiness.
 * - Contract:
 *   - INPUT: currentPin (bookmark or null)
 *   - PRE: currentPin is null or bookmark-shaped data
 *   - OUTPUT: boolean
 *   - POST:
 *     - true => currentPin has a non-empty persisted identity such as time
 *     - false => currentPin is absent or has an empty/stub identity
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: IS_PERSISTED_BOOKMARK
 *   - IF currentPin is absent: RETURN false
 *   - IF currentPin.time is absent or blank: RETURN false
 *   - RETURN true
 *
 * ## RESOLVE_READ_LATER_BACKEND
 *
 * - [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] [REQ-READ_LATER_BROWSER_FALLBACK] How: Preserve every selected metadata-capable backend; resolve selected Browser through the normalized default storage mode and fall back to Local without provider I/O.
 * - Contract:
 *   - INPUT: selectedBackend, getStorageMode
 *   - PRE: selectedBackend is a valid Save to backend; getStorageMode is callable and applies ConfigManager normalization
 *   - OUTPUT: { effectiveBackend, fallbackApplied } | { error: ConfigReadFailed }
 *   - POST:
 *     - selectedBackend in pinboard, local, file, or sync => effectiveBackend equals selectedBackend and fallbackApplied is false
 *     - selectedBackend browser and configured mode in pinboard, local, file, or sync => effectiveBackend equals configured mode and fallbackApplied is true
 *     - selectedBackend browser and configured mode browser => effectiveBackend equals local and fallbackApplied is true
 *     - error ConfigReadFailed => no provider save or UI state mutation occurs
 *   - FAILURE_MODES: ConfigReadFailed
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: RESOLVE_READ_LATER_BACKEND
 *   - IF selectedBackend is pinboard, local, file, or sync: RETURN { effectiveBackend: selectedBackend, fallbackApplied: false }
 *   - configuredBackend = AWAIT getStorageMode()
 *   - IF configuredBackend is pinboard, local, file, or sync: RETURN { effectiveBackend: configuredBackend, fallbackApplied: true }
 *   - RETURN { effectiveBackend: local, fallbackApplied: true }
 *
 * ## CREATE_READ_LATER_BOOKMARK
 *
 * - [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] [REQ-READ_LATER_BROWSER_FALLBACK] How: Reuse the existing bookmark creation path with toread set to yes and the resolved preferredBackend; ordinary createBookmark callers remain unchanged.
 * - Contract:
 *   - INPUT: currentTab, effectiveBackend, createBookmark
 *   - PRE: currentTab has an HTTP(S) URL; effectiveBackend is metadata-capable
 *   - OUTPUT: { success, bookmark, effectiveBackend } | { error: SaveFailed }
 *   - POST:
 *     - success => one new bookmark save was requested with toread yes and preferredBackend effectiveBackend
 *     - error SaveFailed => no success UI or Save to mutation occurs
 *   - FAILURE_MODES: SaveFailed
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: CREATE_READ_LATER_BOOKMARK
 *   - result = AWAIT createBookmark([], yes, yes, effectiveBackend, suppressSuccess: true)
 *   - IF result is failure: RETURN { error: SaveFailed }
 *   - RETURN { success: true, bookmark: result.bookmark, effectiveBackend }
 *
 * ## APPLY_READ_LATER_RESULT
 *
 * - [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] [REQ-READ_LATER_BROWSER_FALLBACK] How: Apply Save to and informational feedback only after a successful new Read Later save; keep archive-status and Offline Reader state independent.
 * - Contract:
 *   - INPUT: saveResult, effectiveBackend, fallbackApplied, currentPin, UIManager
 *   - PRE: saveResult is the result of CREATE_READ_LATER_BOOKMARK; UIManager may expose Save to and feedback methods
 *   - OUTPUT: updated bookmark/read-later UI or failure feedback
 *   - POST:
 *     - success => Read Later success feedback is shown
 *     - success with fallbackApplied => additionally Save to shows effectiveBackend and informational feedback names Browser limitation and effectiveBackend
 *     - success without fallback => selected backend remains unchanged
 *     - failure => Save to, archive-status, and Offline Reader state are unchanged
 *   - FAILURE_MODES: SaveFailed
 *   - DATA: currentPin, Save to DOM state, archive-status state
 *   - DATA_TRANSITION: on success, currentPin.toread becomes yes; on fallback success, selected Save to becomes effectiveBackend; on failure, unchanged
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_READ_LATER_RESULT
 *   - IF saveResult is failure: SHOW failure feedback; RETURN { error: SaveFailed }
 *   - SET currentPin.toread = yes
 *   - UPDATE read-later status to true
 *   - SHOW Read Later success feedback
 *   - IF fallbackApplied:
 *     - SET Save to backend to effectiveBackend
 *     - SHOW informational feedback naming Browser limitation and effectiveBackend
 *   - RETURN { success: true, effectiveBackend }
 *
 * ## READ_LATER_EVENT_BINDING
 *
 * - [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] [REQ-READ_LATER_BROWSER_FALLBACK] How: Route the shared UIManager readLater event through PopupController.handleReadLater for both popup and scoped This Page surfaces.
 * - Contract:
 *   - INPUT: UIManager readLater event, PopupController.handleReadLater, popup or This Page initialization
 *   - PRE: UIManager and PopupController share the same event/controller path
 *   - OUTPUT: one handleReadLater invocation with the current surface context
 *   - POST:
 *     - success => the same Read Later resolver and result application run in popup and This Page
 *     - failure => no duplicate fallback or archive command is emitted
 *   - FAILURE_MODES: BindingMissing
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: READ_LATER_EVENT_BINDING
 *   - ON UIManager emits readLater:
 *     - INVOKE PopupController.handleReadLater
 *   - ON This Page initializes shared popup:
 *     - REUSE the same UIManager event binding
 *
 * ## READ_LATER_ACTION
 *
 * - [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] [REQ-READ_LATER_BROWSER_FALLBACK] How: Keep persisted-bookmark updates on the existing path and apply fallback only to new Read Later bookmark creation.
 * - Contract:
 *   - INPUT: currentPin, currentTab, getSelectedStorageBackend, getStorageMode, saveBookmark, UIManager
 *   - PRE: currentTab has an HTTP(S) URL and dependencies are wired
 *   - OUTPUT: saved Read Later bookmark and UI state | { error: ConfigReadFailed | SaveFailed }
 *   - POST:
 *     - persisted bookmark => existing toggle update path is used without Read Later fallback
 *     - unbookmarked URL => CREATE_READ_LATER_BOOKMARK receives the effective backend
 *     - failure => no false success, Save to mutation, or archive command
 *   - FAILURE_MODES: ConfigReadFailed, SaveFailed
 *   - DATA: currentPin, selectedBackend, effectiveBackend, fallbackApplied
 *   - DATA_TRANSITION: only successful new saves update currentPin and fallback selection
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: READ_LATER_ACTION
 *   - IF IS_PERSISTED_BOOKMARK(currentPin):
 *     - TOGGLE toread through the existing update save path
 *     - RETURN existing update result
 *   - selectedBackend = getSelectedStorageBackend()
 *   - resolution = AWAIT RESOLVE_READ_LATER_BACKEND(selectedBackend, getStorageMode)
 *   - IF resolution is error: RETURN resolution
 *   - saveResult = AWAIT CREATE_READ_LATER_BOOKMARK(currentTab, resolution.effectiveBackend, createBookmark)
 *   - RETURN APPLY_READ_LATER_RESULT(saveResult, resolution.effectiveBackend, resolution.fallbackApplied, currentPin, UIManager)
 *
 * === END IMPL-FULL-BLOCK: IMPL-MOVE_BOOKMARK_UI ===
 */
import { PopupController } from '../../src/ui/popup/PopupController.js'

describe('[IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL] handleStorageBackendChange', () => {
  let popupController
  let mockUIManager

  beforeEach(() => {
    mockUIManager = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      showError: jest.fn(),
      showSuccess: jest.fn(),
      setLoading: jest.fn(),
      updateShowHoverButtonState: jest.fn(),
      updateCurrentTags: jest.fn(),
      updatePrivateStatus: jest.fn(),
      updateReadLaterStatus: jest.fn(),
      updateConnectionStatus: jest.fn(),
      updateVersionInfo: jest.fn(),
      updateStorageBackendValue: jest.fn(),
      updateStorageLocalToggle: jest.fn()
    }
    global.chrome = {
      runtime: {
        sendMessage: jest.fn(),
        onMessage: { addListener: jest.fn() },
        getManifest: jest.fn().mockReturnValue({ version: '0.0.0' }),
        lastError: null
      },
      tabs: { query: jest.fn().mockResolvedValue([]) }
    }
    popupController = new PopupController({
      uiManager: mockUIManager,
      stateManager: { setState: jest.fn() },
      errorHandler: { handleError: jest.fn() }
    })
    popupController.getBookmarkData = jest.fn().mockResolvedValue({
      url: 'https://pin.example/a',
      tags: ['t'],
      shared: 'yes',
      toread: 'no',
      time: '2020-01-01T00:00:00Z'
    })
    popupController.normalizeTags = jest.fn((t) => (Array.isArray(t) ? t : []))
  })

  test('prefers currentPin.url over currentTab.url for move [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL]', async () => {
    popupController.currentPin = { url: 'https://pin.example/a', tags: [] }
    popupController.currentTab = { id: 1, url: 'https://tab.example/b' }
    global.chrome.runtime.sendMessage.mockImplementation((_msg, cb) => {
      cb({ success: true, data: { success: true } })
    })
    await popupController.handleStorageBackendChange('local')
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'moveBookmarkToStorage',
        data: { url: 'https://pin.example/a', targetBackend: 'local' }
      }),
      expect.any(Function)
    )
  })

  test('unwraps response.data for success UI [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL]', async () => {
    popupController.currentPin = { url: 'https://pin.example/a', tags: [] }
    popupController.currentTab = { id: 1, url: 'https://pin.example/a' }
    global.chrome.runtime.sendMessage.mockImplementation((_msg, cb) => {
      cb({ success: true, data: { success: true, message: 'ok' } })
    })
    await popupController.handleStorageBackendChange('file')
    expect(mockUIManager.showSuccess).toHaveBeenCalledWith(expect.stringContaining('file'))
    expect(mockUIManager.updateStorageBackendValue).toHaveBeenCalledWith('file')
  })

  test('shows error when inner result.success is false [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL]', async () => {
    popupController.currentPin = { url: 'https://pin.example/a', tags: [] }
    popupController.currentTab = { id: 1, url: 'https://pin.example/a' }
    global.chrome.runtime.sendMessage.mockImplementation((_msg, cb) => {
      cb({ success: true, data: { success: false, message: 'move denied' } })
    })
    await popupController.handleStorageBackendChange('sync')
    expect(mockUIManager.showError).toHaveBeenCalledWith('move denied')
    expect(mockUIManager.showSuccess).not.toHaveBeenCalled()
  })
})
