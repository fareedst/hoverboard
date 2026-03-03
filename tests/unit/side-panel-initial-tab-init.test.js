/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Unit tests: when panel loads with Tags tree as the restored tab, runInitialTabInit must pass currentBookmarkTags to initTagsTreeTab so the Tags tree tab displays the current URL's DB record.
 */

const mockInitTagsTreeTab = jest.fn()
jest.mock('../../src/ui/side-panel/tags-tree.js', () => ({
  initTagsTreeTab: (...args) => mockInitTagsTreeTab(...args),
  setSelectedTagsFromCurrentBookmark: jest.fn()
}))
jest.mock('../../src/ui/index.js', () => ({
  init: jest.fn().mockResolvedValue(),
  popup: jest.fn()
}))
jest.mock('../../src/shared/ErrorHandler.js', () => ({
  ErrorHandler: jest.fn()
}))
jest.mock('../../src/config/config-manager.js', () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    getConfig: jest.fn().mockResolvedValue({})
  }))
}))

import {
  runInitialTabInit,
  setPopupComponentsForTest,
  resetTagsTreeTabInitedForTest,
  setSidePanelVersion
} from '../../src/ui/side-panel/side-panel.js'
import { TAB_TAGS_TREE } from '../../src/ui/side-panel/side-panel-tab-state.js'

describe('[IMPL-SIDE_PANEL_TABS] setSidePanelVersion', () => {
  beforeEach(() => {
    document.body.innerHTML = '<span id="side-panel-title-version"></span><span id="side-panel-version"></span>'
  })

  // [IMPL-SIDE_PANEL_TABS] Single-line header: left "Hoverboard vX", right build time (UTC).
  test('sets title+version (left) and build time (right) [IMPL-SIDE_PANEL_TABS]', () => {
    setSidePanelVersion('1.2.3', '2026-03-02 14:30')
    expect(document.getElementById('side-panel-title-version').textContent).toBe('Hoverboard v1.2.3')
    expect(document.getElementById('side-panel-version').textContent).toBe('2026-03-02 14:30')
  })

  test('when version is empty string left shows "Hoverboard", right shows build time', () => {
    setSidePanelVersion('', '2026-03-02 14:30')
    expect(document.getElementById('side-panel-title-version').textContent).toBe('Hoverboard')
    expect(document.getElementById('side-panel-version').textContent).toBe('2026-03-02 14:30')
  })

  // [IMPL-SIDE_PANEL_TABS] When #side-panel-version element is missing, setSidePanelVersion does not throw (no-op).
  test('when #side-panel-version element is missing does not throw', () => {
    document.body.innerHTML = '<span id="side-panel-title-version"></span>'
    expect(() => setSidePanelVersion('1.0.0', '2026-01-01 00:00')).not.toThrow()
  })
})

describe('[REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TAGS_TREE] runInitialTabInit with Tags tree tab', () => {
  beforeEach(() => {
    mockInitTagsTreeTab.mockClear()
    resetTagsTreeTabInitedForTest()
  })

  test('when activeTab is tagsTree and controller has currentPin.tags, initTagsTreeTab is called with currentBookmarkTags', async () => {
    const controller = {
      currentPin: { tags: 'work, personal' },
      normalizeTags: (t) => (t ? t.split(',').map((s) => s.trim()) : [])
    }
    setPopupComponentsForTest({ controller })

    await runInitialTabInit(TAB_TAGS_TREE)

    expect(mockInitTagsTreeTab).toHaveBeenCalledTimes(1)
    expect(mockInitTagsTreeTab).toHaveBeenCalledWith(
      expect.objectContaining({ currentBookmarkTags: ['work', 'personal'] })
    )
  })

  test('when activeTab is tagsTree and controller has no currentPin, initTagsTreeTab is called with empty currentBookmarkTags', async () => {
    const controller = {
      currentPin: null,
      normalizeTags: () => []
    }
    setPopupComponentsForTest({ controller })

    await runInitialTabInit(TAB_TAGS_TREE)

    expect(mockInitTagsTreeTab).toHaveBeenCalledTimes(1)
    expect(mockInitTagsTreeTab).toHaveBeenCalledWith(
      expect.objectContaining({ currentBookmarkTags: [] })
    )
  })
})
