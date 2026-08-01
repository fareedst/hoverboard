/**
 * [REQ-PAGE_ARCHIVE_STORAGE] [IMPL-PAGE_ARCHIVE_STORAGE] [IMPL-UIManager_SCOPED_ROOT]
 * Visible action feedback for archive/screenshot success paths.
 */

import { UIManager } from '../../src/ui/popup/UIManager.js'

describe('[IMPL-PAGE_ARCHIVE_STORAGE] UIManager action feedback', () => {
  /** @returns {UIManager} */
  function createUiWithFeedback () {
    const ui = new UIManager({
      errorHandler: { handleError: jest.fn() },
      stateManager: { setState: jest.fn() },
      config: {}
    })
    ui.elements.actionFeedback = {
      classList: {
        _classes: new Set(['hidden']),
        remove: jest.fn(function (...names) { names.forEach((n) => this._classes.delete(n)) }),
        add: jest.fn(function (...names) { names.forEach((n) => this._classes.add(n)) })
      }
    }
    ui.elements.actionFeedbackMessage = { textContent: '' }
    ui.hideError = jest.fn()
    return ui
  }

  test('showActionSuccess reveals success banner with message', () => {
    const ui = createUiWithFeedback()
    ui.showActionSuccess('Page archive saved')
    expect(ui.elements.actionFeedback.classList.remove).toHaveBeenCalledWith('hidden', 'success', 'error')
    expect(ui.elements.actionFeedback.classList.add).toHaveBeenCalledWith('success')
    expect(ui.elements.actionFeedbackMessage.textContent).toBe('Page archive saved')
    expect(ui.hideError).toHaveBeenCalled()
  })

  test('showSuccess delegates to visible action feedback when banner exists', () => {
    const ui = createUiWithFeedback()
    const spy = jest.spyOn(ui, 'showActionSuccess')
    ui.showSuccess('Page archive saved')
    expect(spy).toHaveBeenCalledWith('Page archive saved')
  })

  test('binds archive, screenshot, and Reader buttons to PopupController events [REQ-PAGE_ARCHIVE_STORAGE]', () => {
    const ui = createUiWithFeedback()
    ui.elements.captureArchiveBtn = document.createElement('button')
    ui.elements.captureScreenshotBtn = document.createElement('button')
    ui.elements.openReaderBtn = document.createElement('button')
    ui.emit = jest.fn()
    ui.setupEventListeners()

    ui.elements.captureArchiveBtn.click()
    ui.elements.captureScreenshotBtn.click()
    ui.elements.openReaderBtn.click()

    expect(ui.emit.mock.calls).toEqual([
      ['capturePageArchive'],
      ['capturePageScreenshot'],
      ['openOfflineReader']
    ])
  })
})
