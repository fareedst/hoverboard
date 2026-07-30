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
import { UIManager } from '../../src/ui/popup/UIManager.js'
import { PopupController } from '../../src/ui/popup/PopupController.js'

function makeStorageButtons () {
  const container = document.createElement('div')
  container.id = 'storageBackendButtons'
  for (const backend of ['pinboard', 'local', 'file', 'sync', 'browser']) {
    const btn = document.createElement('button')
    btn.className = 'storage-backend-btn'
    btn.setAttribute('data-backend', backend)
    btn.setAttribute('aria-pressed', 'false')
    container.appendChild(btn)
  }
  return container
}

describe('[IMPL-MOVE_BOOKMARK_UI] storage button highlight and preferredBackend', () => {
  let container

  beforeEach(() => {
    document.body.innerHTML = ''
    container = makeStorageButtons()
    document.body.appendChild(container)
    global.chrome = {
      runtime: {
        sendMessage: jest.fn(),
        onMessage: { addListener: jest.fn() },
        getManifest: jest.fn().mockReturnValue({ version: '0.0.0' }),
        lastError: null
      },
      tabs: { query: jest.fn().mockResolvedValue([]) }
    }
  })

  test('updateStorageBackendValue sets aria-pressed on selected backend [IMPL-MOVE_BOOKMARK_UI]', () => {
    const ui = new UIManager({
      errorHandler: { handleError: jest.fn() },
      stateManager: null,
      config: {}
    })
    ui.elements.storageBackendButtons = container
    ui.updateStorageBackendValue('sync')
    const pressed = container.querySelectorAll('.storage-backend-btn[aria-pressed="true"]')
    expect(pressed).toHaveLength(1)
    expect(pressed[0].getAttribute('data-backend')).toBe('sync')
  })

  test('getSelectedStorageBackend reads aria-pressed button [IMPL-MOVE_BOOKMARK_UI]', () => {
    const ui = new UIManager({
      errorHandler: { handleError: jest.fn() },
      stateManager: null,
      config: {}
    })
    ui.elements.storageBackendButtons = container
    container.querySelector('[data-backend="browser"]').setAttribute('aria-pressed', 'true')
    const controller = new PopupController({
      uiManager: ui,
      stateManager: { setState: jest.fn() },
      errorHandler: { handleError: jest.fn() }
    })
    // Constructor may rebind uiManager; ensure elements point at our buttons
    controller.uiManager.elements.storageBackendButtons = container
    expect(controller.getSelectedStorageBackend()).toBe('browser')
  })

  test('updateStoragePinboardEnabled disables Pinboard without API key [IMPL-MOVE_BOOKMARK_UI]', () => {
    const ui = new UIManager({
      errorHandler: { handleError: jest.fn() },
      stateManager: null,
      config: {}
    })
    ui.elements.storageBackendButtons = container
    ui.updateStoragePinboardEnabled(false)
    const pin = container.querySelector('[data-backend="pinboard"]')
    expect(pin.disabled).toBe(true)
    ui.updateStoragePinboardEnabled(true)
    expect(pin.disabled).toBe(false)
  })
})
