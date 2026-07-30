/**
 * === IMPL-FULL-BLOCK: IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL ===
 * Popup unwrap response.data; prefer currentPin.url for move.
 * === END IMPL-FULL-BLOCK: IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-MOVE_BOOKMARK_UI ===
 * [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] — Popup Save to five buttons; load backend, move on click, preferredBackend on save. Contract: URL and bookmark and actions; highlighted button and move/save requests.
 * 
 * ## MAIN
 * 
 * - [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] How: Logical block for IMPL-MOVE_BOOKMARK_UI.
 * - Contract:
 *   - INPUT: currentUrl (tab), currentPin (current bookmark if any), user action (select storage button, save)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: highlighted storage button; move request; save request with preferredBackend | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: storage section with five buttons (Pinboard, Local, File, Sync, Browser); one has aria-pressed="true"
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Set highlighted button from getStorageBackendForUrl or default; update Pinboard enabled.
 *   - 1. ON popup load (or bookmark data load):
 *   - 2.   IF currentPin exists: backend = send getStorageBackendForUrl(currentUrl)
 *   - 3.   ELSE: backend = defaultStorageMode
 *   - 4.   SET highlighted button to backend (data-backend attribute)
 *   - 5.   updateStoragePinboardEnabled(hasApiToken)
 *   - How (sub-block): Send move; use inner result; refresh and update UI on success.
 *   - 6. ON storage button click (user selects different backend):
 *   - 7.   url = currentPin?.url || currentTab?.url
 *   - 8.   SEND moveBookmarkToStorage(url, targetBackend)
 *   - 9.   result = response?.data ?? response   // inner result (IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL)
 *   - 10.   IF result.success: refresh bookmark data; update highlighted button
 *   - 11.   ELSE: show error from result
 *   - How (sub-block): Set preferredBackend from selected button; send saveBookmark so router uses highlighted storage.
 *   - 12. ON save (createBookmark, addTagsToBookmark, toggle private, toggle read-later):
 *   - 13.   data.preferredBackend = getSelectedStorageBackend()   // aria-pressed button; allowlist pinboard|local|file|sync|browser else null
 *   - 14.   SEND saveBookmark(data)   // router uses preferredBackend
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
