/**
 * [IMPL-PAGE_ARCHIVE_STORAGE] [IMPL-PAGE_SCREENSHOT_ARCHIVE] [IMPL-OFFLINE_READER_MODE]
 * [ARCH-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [ARCH-OFFLINE_READER_MODE]
 * [REQ-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_SCREENSHOT_ARCHIVE] [REQ-OFFLINE_READER_MODE]
 * Composition: PopupController registers the UIManager archive, screenshot, and Reader commands.
 * No popup.html invocation; UIManager DOM listeners are covered by unit tests and browser behavior by E2E.
 */

import { PopupController } from '../../src/ui/popup/PopupController.js'

function makeEmitterUiManager () {
  const handlers = new Map()
  return {
    elements: {},
    on: jest.fn((event, handler) => {
      handlers.set(event, handler)
    }),
    off: jest.fn(),
    emit: (event, ...args) => handlers.get(event)?.(...args),
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showActionError: jest.fn(),
    setLoading: jest.fn(),
    _handlers: handlers
  }
}

describe('[REQ-PAGE_ARCHIVE_STORAGE] popup archive action composition', () => {
  test('registers archive, screenshot, and Reader UI commands with bound handlers', () => {
    const uiManager = makeEmitterUiManager()
    const controller = new PopupController({
      uiManager,
      stateManager: { setState: jest.fn(), getState: jest.fn(() => ({})) },
      errorHandler: { handleError: jest.fn() }
    })

    expect(uiManager.on).toHaveBeenCalledWith('capturePageArchive', controller.handleCapturePageArchive)
    expect(uiManager.on).toHaveBeenCalledWith('capturePageScreenshot', controller.handleCapturePageScreenshot)
    expect(uiManager.on).toHaveBeenCalledWith('openOfflineReader', controller.handleOpenOfflineReader)
    expect(uiManager._handlers.get('capturePageArchive')).toBe(controller.handleCapturePageArchive)
  })
})
