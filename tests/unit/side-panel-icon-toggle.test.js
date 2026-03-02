/**
 * [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR]
 * Unit tests: side panel toggle-close on REQUEST_SIDE_PANEL_CLOSE (visible and open long enough).
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
jest.mock('../../src/ui/side-panel/browser-tabs-panel.js', () => ({
  initBrowserTabsTab: jest.fn()
}))

import { MESSAGE_TYPES } from '../../src/core/message-handler.js'
import { shouldClosePanelOnToggleMessage } from '../../src/ui/side-panel/side-panel.js'

describe('[REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] Side panel toggle-close (shouldClosePanelOnToggleMessage)', () => {
  const REQUEST_CLOSE = { type: MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE }
  const loadTime = 1000
  const justOpened = loadTime + 100
  const openLongEnough = loadTime + 400

  test('returns true when message is REQUEST_SIDE_PANEL_CLOSE, visible, and open > 300ms', () => {
    expect(
      shouldClosePanelOnToggleMessage(REQUEST_CLOSE, {
        visibilityState: 'visible',
        now: openLongEnough,
        loadTime
      })
    ).toBe(true)
  })

  test('returns false when message is not REQUEST_SIDE_PANEL_CLOSE', () => {
    expect(
      shouldClosePanelOnToggleMessage({ type: 'OTHER' }, {
        visibilityState: 'visible',
        now: openLongEnough,
        loadTime
      })
    ).toBe(false)
  })

  test('returns false when visibilityState is not visible', () => {
    expect(
      shouldClosePanelOnToggleMessage(REQUEST_CLOSE, {
        visibilityState: 'hidden',
        now: openLongEnough,
        loadTime
      })
    ).toBe(false)
  })

  test('returns false when panel opened less than 300ms ago (avoid close on first open)', () => {
    expect(
      shouldClosePanelOnToggleMessage(REQUEST_CLOSE, {
        visibilityState: 'visible',
        now: justOpened,
        loadTime
      })
    ).toBe(false)
  })

  test('returns false when message is null or missing type', () => {
    expect(shouldClosePanelOnToggleMessage(null, { visibilityState: 'visible', now: openLongEnough, loadTime })).toBe(false)
    expect(shouldClosePanelOnToggleMessage({}, { visibilityState: 'visible', now: openLongEnough, loadTime })).toBe(false)
  })
})
