/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-UIManager_SCOPED_ROOT] [IMPL-SIDE_PANEL_BOOKMARK]
 * Unit tests: UIManager with optional container resolves elements via data-popup-ref from that container
 * so the same popup logic works in the side panel Bookmark tab without duplicate global IDs.
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
