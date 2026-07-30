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
})
