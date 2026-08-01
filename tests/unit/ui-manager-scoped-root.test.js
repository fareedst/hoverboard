/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_BOOKMARK ===
 * [IMPL-SIDE_PANEL_BOOKMARK] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] — This block defines the Bookmark tab content and init: markup with data-popup-ref, PopupController + UIManager with container, and "By Tag" → switch tab. Implements REQ by providing popup-equivalent in panel; implements ARCH by scoped root.
 * 
 * ## CREATE_POPUP
 * 
 * - [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_BOOKMARK] [IMPL-UIManager_SCOPED_ROOT] How: Markup: #bookmarkPanel contains elements with data-popup-ref="mainInterface", data-popup-ref="loadingState", etc. Same structure as popup (quick actions, storage, tag management, search). Implements "Bookmark tab shows functional equivalent of popup UI". createPopup({ container }): when container provided, UIManager uses container for cacheElements (querySelector by data-popup-ref). PopupController receives that UIManager; loadInitialData gets current tab and bookmark; setupEventListeners binds same events. Implements reuse of popup stack with scoped root.
 * - Contract:
 *   - INPUT: User selects Bookmark tab; side-panel.js calls createPopup({ container: bookmarkPanel })
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Bookmark panel shows current-tab bookmark UI (quick actions, storage, tags, search); interactions work as in popup | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: bookmarkPanel (DOM root), UIManager(container), PopupController(uiManager, ...)
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: CREATE_POPUP
 *   - uiManager = new UIManager({ ..., container })  // UIManager.cacheElements uses container if set
 *   - controller = new PopupController({ uiManager, ... })
 *   - RETURN { controller, uiManager, ... }
 * 
 * ## BLOCK_2
 * 
 * - [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_BOOKMARK] How: "By Tag" in panel: when in side panel context, do not send OPEN_SIDE_PANEL; instead call switchToTagsTreeTab() (or emit so side-panel.js switches tab). Implements "By Tag switches to By Tag tab" in panel. When switching to Bookmark tab and it was already inited, call controller.refreshPopupData() so getCurrentTab and getBookmarkData run for the active tab; content then reflects current tab's bookmark state (same as badge). Implements "Bookmark tab reflects current tab when selected". Prompt refresh (like badge): when Bookmark tab is visible, refresh on tabs.onActivated and on tabs.onUpdated (when updated tab is active and status complete). refreshBookmarkTabIfVisible() calls controller.refreshPopupData() only when activeTab === "bookmark" and controller exists. Implements "Bookmark tab refreshes promptly when active tab changes or completes".
 * - Contract:
 *   - INPUT: User selects Bookmark tab; side-panel.js calls createPopup({ container: bookmarkPanel })
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Bookmark panel shows current-tab bookmark UI (quick actions, storage, tags, search); interactions work as in popup
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: bookmarkPanel (DOM root), UIManager(container), PopupController(uiManager, ...)
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_2
 *   - 1. ON "By Tag" click in This Page tab:
 *   - 2.   IF inPanelContext: switchToTagsTreeTab()  // e.g. callback from side-panel.js or global
 *   - 3.   ELSE: send OPEN_SIDE_PANEL  // popup context
 *   - 4. ON switchTab("bookmark"): IF bookmarkTabInited already true AND popupComponents.controller: controller.refreshPopupData()
 *   - 5. bindTabChangeRefresh(): chrome.tabs.onActivated → refreshBookmarkTabIfVisible(); chrome.tabs.onUpdated(tabId, changeInfo, tab) → IF changeInfo.status === "complete" AND tab.url AND updated tab is current window active tab: refreshBookmarkTabIfVisible()
 * 
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_BOOKMARK ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-UIManager_SCOPED_ROOT ===
 * [IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK] — Summary: Scoped DOM resolution so UIManager runs in popup (document) or side-panel Bookmark subtree (container) without duplicate ids.
 * 
 * ## CACHE_ELEMENTS
 * 
 * - [IMPL-UIManager_SCOPED_ROOT] [IMPL-SIDE_PANEL_BOOKMARK] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] How: How — composed_with IMPL-SIDE_PANEL_BOOKMARK: pre — Bookmark panel subtree mounted with data-popup-ref values matching popup element keys; ordering — container passed into UIManager constructor before cacheElements; post — this.elements[key] reference nodes under container (or null if missing); shared data — elementKeys and data-popup-ref attribute names align with popup ids.
 * - Contract:
 *   - INPUT: constructor options { container?: Element }; cacheElements() at init; updateSectionLabelsVisibility(showLabels: boolean)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: this.elements populated; section title nodes toggled visible/hidden | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: container (optional); elementKeys; data-popup-ref attribute names matching popup ids
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: CACHE_ELEMENTS
 *   - FOR each key in elementKeys:
 *   - IF this.container:
 *   - this.elements[key] = this.container.querySelector('[data-popup-ref="' + key + '"]')
 *   - ELSE:
 *   - this.elements[key] = document.getElementById(key)
 *   - How (sub-block): How — section labels: scope query to container or document; no throw on empty NodeList.
 * 
 * ## UPDATE_SECTION_LABELS_VISIBILITY
 * 
 * - [IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK] How: Implements updateSectionLabelsVisibility(showLabels) behavior for IMPL-UIManager_SCOPED_ROOT.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: UPDATE_SECTION_LABELS_VISIBILITY
 *   - root = this.container || document
 *   - sectionTitles = root.querySelectorAll('.section-title')
 *   - FOR each title in sectionTitles:
 *   - IF showLabels THEN title.style.display = ''
 *   - ELSE title.style.display = 'none'
 * 
 * === END IMPL-FULL-BLOCK: IMPL-UIManager_SCOPED_ROOT ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-PAGE_ARCHIVE_STATUS_UI ===
 * [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI] — Normalize and display selected-backend archive artifact status in shared popup/This Page UI; derive Offline Reader availability only from a readable archive.
 *
 * ## MAIN
 *
 * - [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI] How: Coordinate fail-closed normalization, backend-scoped queries, scoped DOM application, context resets, and capture refreshes without changing archive handlers.
 * - Contract:
 *   - INPUT: current tab URL, selected backend, archive/screenshot query responses, capture results, scoped UI root
 *   - PRE: PopupController and UIManager are initialized; selected backend is resolved from the current bookmark/context
 *   - OUTPUT: independent archiveSaved and screenshotSaved indicators plus readerAvailable = archiveSaved
 *   - POST: positive state exists only when the selected backend returns a valid persisted artifact; stale readable archive remains available
 *   - FAILURE_MODES: unsupported backend, rejected message, malformed response, missing artifact identity, stale context
 *   - DATA: currentUrl, selectedBackend, archiveSaved, screenshotSaved, readerAvailable, statusContextKey
 *   - DATA_TRANSITION: context changes clear all status before new query; successful query replaces only the matching status snapshot
 *   - EFFECTS: Async, IO, State, DOM
 *   - TERMINATION: total
 *
 * ## NORMALIZE_ARCHIVE_ARTIFACT_STATUS
 *
 * - [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI] How: Convert raw GET_PAGE_ARCHIVE and GET_PAGE_SCREENSHOTS results to a bounded all-false or positive status object; never infer persisted presence from metadata or defaults.
 * - Contract:
 *   - INPUT: artifactKind, backend, response
 *   - PRE: artifactKind is archive or screenshot
 *   - OUTPUT: { saved: boolean, readable: boolean, artifactId: string|null, backend: string|null }
 *   - POST: saved is true only for an accepted selected-backend persisted artifact; archive stale status remains readable
 *   - FAILURE_MODES: unsupported backend, success false, malformed payload, empty screenshot list, missing identity
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: NORMALIZE_ARCHIVE_ARTIFACT_STATUS
 *   - IF backend is not local or file: RETURN all-false
 *   - IF response is rejected, response.success is false, or response.data is malformed: RETURN all-false
 *   - IF artifactKind is archive:
 *   -   archive = response.data.archive OR response.archive OR response.data
 *   -   IF archive lacks persisted identity or non-empty readable content: RETURN all-false
 *   -   RETURN { saved: true, readable: true, artifactId: archive.id OR archive.archiveId, backend }
 *   - IF artifactKind is screenshot:
 *   -   screenshots = response.data.screenshots OR response.screenshots OR []
 *   -   artifact = first screenshot with id OR artifactId OR hash
 *   -   IF no artifact: RETURN all-false
 *   -   RETURN { saved: true, readable: false, artifactId: artifact.id OR artifact.artifactId OR artifact.hash, backend }
 *
 * ## QUERY_SELECTED_BACKEND_ARTIFACT_STATUS
 *
 * - [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI] How: Query each artifact leg only for local/file and always pass the selected backend, then normalize independently.
 * - Contract:
 *   - INPUT: currentUrl, selectedBackend, sendMessage
 *   - PRE: currentUrl is non-empty and status context is current
 *   - OUTPUT: normalized archive and screenshot status
 *   - POST: unsupported backend produces all-false without sending archive messages; query failures remain all-false
 *   - FAILURE_MODES: unsupported backend, message rejection, stale response
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: QUERY_SELECTED_BACKEND_ARTIFACT_STATUS
 *   - IF selectedBackend is not local or file: RETURN all-false
 *   - archiveResponse, screenshotResponse = AWAIT IN PARALLEL:
 *   -   sendMessage({ type: GET_PAGE_ARCHIVE, data: { url: currentUrl, backend: selectedBackend } })
 *   -   sendMessage({ type: GET_PAGE_SCREENSHOTS, data: { url: currentUrl, backend: selectedBackend } })
 *   - IF statusContextKey changed while awaiting: DISCARD both results
 *   - RETURN NORMALIZE archiveResponse and screenshotResponse independently
 *
 * ## APPLY_ARCHIVE_STATUS_UI
 *
 * - [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI] How: Apply the normalized snapshot to the current popup or scoped This Page root with non-color accessibility cues and independent recapture controls.
 * - Contract:
 *   - INPUT: normalized status, UIManager element cache
 *   - PRE: elements may be absent in optional contexts
 *   - OUTPUT: DOM reflects archiveSaved, screenshotSaved, and readerAvailable
 *   - POST: capture buttons remain enabled on archive-capable backends; Reader is visible but disabled with an explanation when unavailable
 *   - FAILURE_MODES: absent optional element
 *   - DATA_TRANSITION: set root archive/screenshot/Reader/backend datasets, set data-archive-saved/data-screenshot-saved and active classes independently, and synchronize the Reader status description visibility and aria-describedby hook
 *   - EFFECTS: DOM, State
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_ARCHIVE_STATUS_UI
 *   - archiveButton = elements.captureArchiveBtn; screenshotButton = elements.captureScreenshotBtn; readerButton = elements.openReaderBtn
 *   - root = elements.mainInterface OR scoped container
 *   - SET root data-archive-saved, data-screenshot-saved, data-reader-available, and data-archive-backend
 *   - SET archiveButton active and aria-label/title from archiveSaved; preserve disabled = false for local/file recapture
 *   - SET screenshotButton active and aria-label/title from screenshotSaved; preserve disabled = false for local/file recapture
 *   - SET readerButton disabled = NOT readerAvailable; SET aria-disabled and explanatory title/label when unavailable
 *   - SET archiveStatusDescription hidden = readerAvailable and text to the unavailable explanation when Reader is unavailable
 *   - SET readerButton aria-describedby to archiveStatusDescription when that element has an id
 *   - SET data attributes on each button and shared status state
 *
 * ## REFRESH_ARCHIVE_STATUS_AFTER_CAPTURE
 *
 * - [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI] How: Refresh only the successful capture leg after a successful archive or screenshot command, preserving the other leg.
 * - Contract:
 *   - INPUT: captureKind, currentUrl, selectedBackend, captureResult
 *   - PRE: captureResult is successful and context is current
 *   - OUTPUT: updated independent status snapshot
 *   - POST: failed capture does not create a positive indicator
 *   - FAILURE_MODES: capture failure, context change, status query failure
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: REFRESH_ARCHIVE_STATUS_AFTER_CAPTURE
 *   - IF captureResult.success is not true: RETURN current status
 *   - QUERY matching artifact leg with selected backend
 *   - APPLY matching normalized status while preserving the other leg
 *
 * ## RESET_ARCHIVE_STATUS_ON_CONTEXT_CHANGE
 *
 * - [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI] How: Clear persisted status before any new URL or selected-backend context can display it, preventing cross-tab/backend leakage.
 * - Contract:
 *   - INPUT: nextUrl, nextBackend, previous status context
 *   - PRE: context change is observable
 *   - OUTPUT: cleared status snapshot and new statusContextKey
 *   - POST: archiveSaved, screenshotSaved, and readerAvailable are false until the new context is queried
 *   - EFFECTS: State, DOM
 *   - TERMINATION: total
 * - PROCEDURE: RESET_ARCHIVE_STATUS_ON_CONTEXT_CHANGE
 *   - IF `${nextUrl}|${nextBackend}` equals statusContextKey: RETURN unchanged
 *   - SET statusContextKey = `${nextUrl}|${nextBackend}`
 *   - APPLY all-false status immediately
 *   - IF nextUrl is non-empty AND nextBackend is local or file: QUERY_SELECTED_BACKEND_ARTIFACT_STATUS
 *
 * === END IMPL-FULL-BLOCK: IMPL-PAGE_ARCHIVE_STATUS_UI ===
 */
import { UIManager } from '../../src/ui/popup/UIManager.js'

describe('[IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] UIManager scoped root', () => {
  /** @type {HTMLDivElement} */
  let container

  const noop = () => {}

  beforeEach(() => {
    container = document.createElement('div')
    container.id = 'bookmarkPanel'
    document.body.appendChild(container)
  })

  afterEach(() => {
    container?.remove()
  })

  test('without container uses document.getElementById for mainInterface', () => {
    const mainEl = document.createElement('div')
    mainEl.id = 'mainInterface'
    document.body.appendChild(mainEl)
    const ui = new UIManager({ errorHandler: { handleError: noop }, stateManager: null, config: {} })
    expect(ui.elements.mainInterface).toBe(mainEl)
    mainEl.remove()
  })

  test('with container uses container querySelector data-popup-ref for mainInterface', () => {
    const mainEl = document.createElement('div')
    mainEl.setAttribute('data-popup-ref', 'mainInterface')
    container.appendChild(mainEl)
    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })
    expect(ui.elements.mainInterface).toBe(mainEl)
    expect(ui.container).toBe(container)
  })

  test('with container resolves multiple refs from container subtree', () => {
    const mainEl = document.createElement('div')
    mainEl.setAttribute('data-popup-ref', 'mainInterface')
    const loadingEl = document.createElement('div')
    loadingEl.setAttribute('data-popup-ref', 'loadingState')
    const showHoverBtn = document.createElement('button')
    showHoverBtn.setAttribute('data-popup-ref', 'showHoverBtn')
    container.appendChild(mainEl)
    container.appendChild(loadingEl)
    container.appendChild(showHoverBtn)
    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })
    expect(ui.elements.mainInterface).toBe(mainEl)
    expect(ui.elements.loadingState).toBe(loadingEl)
    expect(ui.elements.showHoverBtn).toBe(showHoverBtn)
  })

  test('with container does not return document-level elements with same id', () => {
    const docMain = document.createElement('div')
    docMain.id = 'mainInterface'
    document.body.appendChild(docMain)
    const scopedMain = document.createElement('div')
    scopedMain.setAttribute('data-popup-ref', 'mainInterface')
    container.appendChild(scopedMain)
    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })
    expect(ui.elements.mainInterface).toBe(scopedMain)
    expect(ui.elements.mainInterface).not.toBe(docMain)
    docMain.remove()
  })

  test('[REQ-PAGE_ARCHIVE_STATUS_UI] applies independent saved-state hooks within the scoped root', () => {
    const archiveButton = document.createElement('button')
    archiveButton.setAttribute('data-popup-ref', 'captureArchiveBtn')
    const screenshotButton = document.createElement('button')
    screenshotButton.setAttribute('data-popup-ref', 'captureScreenshotBtn')
    const readerButton = document.createElement('button')
    readerButton.setAttribute('data-popup-ref', 'openReaderBtn')
    container.append(archiveButton, screenshotButton, readerButton)

    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })

    ui.updateArchiveArtifactStatus({
      backend: 'local',
      archiveSaved: true,
      screenshotSaved: false,
      readerAvailable: true,
      archiveArtifactId: 'archive-1',
      screenshotArtifactId: null
    })

    expect(archiveButton.classList.contains('active')).toBe(true)
    expect(archiveButton.dataset.archiveSaved).toBe('true')
    expect(archiveButton.getAttribute('aria-label')).toMatch(/saved/i)
    expect(screenshotButton.classList.contains('active')).toBe(false)
    expect(screenshotButton.dataset.screenshotSaved).toBe('false')
    expect(screenshotButton.disabled).toBe(false)
    expect(readerButton.disabled).toBe(false)
    expect(readerButton.getAttribute('aria-disabled')).toBe('false')
  })

  test('[REQ-PAGE_ARCHIVE_STATUS_UI] disables Reader with an explanation but keeps recapture controls enabled', () => {
    const archiveButton = document.createElement('button')
    archiveButton.setAttribute('data-popup-ref', 'captureArchiveBtn')
    const screenshotButton = document.createElement('button')
    screenshotButton.setAttribute('data-popup-ref', 'captureScreenshotBtn')
    const readerButton = document.createElement('button')
    readerButton.setAttribute('data-popup-ref', 'openReaderBtn')
    container.append(archiveButton, screenshotButton, readerButton)

    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })

    ui.updateArchiveArtifactStatus({
      backend: 'sync',
      archiveSaved: false,
      screenshotSaved: false,
      readerAvailable: false,
      archiveArtifactId: null,
      screenshotArtifactId: null
    })

    expect(archiveButton.disabled).toBe(false)
    expect(screenshotButton.disabled).toBe(false)
    expect(readerButton.disabled).toBe(true)
    expect(readerButton.getAttribute('aria-disabled')).toBe('true')
    expect(readerButton.getAttribute('aria-label')).toMatch(/archive/i)
    expect(readerButton.title).toMatch(/archive/i)
  })
})
