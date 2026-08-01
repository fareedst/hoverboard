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

import { PopupController } from '../../src/ui/popup/PopupController.js'

function makeUiManager () {
  return {
    elements: {
      openReaderBtn: { disabled: false }
    },
    on: jest.fn(),
    off: jest.fn(),
    updateArchiveArtifactStatus: jest.fn(),
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showActionError: jest.fn()
  }
}

describe('[REQ-PAGE_ARCHIVE_STATUS_UI] selected-backend status composition', () => {
  test('queries archive and screenshots with the selected backend after context resolution', async () => {
    const uiManager = makeUiManager()
    const controller = new PopupController({
      uiManager,
      stateManager: { setState: jest.fn(), getState: jest.fn(() => ({})) },
      errorHandler: { handleError: jest.fn() }
    })
    controller.currentTab = { url: 'https://example.com/page' }
    controller._resolvedStorageBackend = 'file'
    controller.sendMessage = jest.fn()
      .mockResolvedValueOnce({
        success: true,
        archive: {
          archiveId: 'archive-1',
          sanitizedHtml: '<article>Readable</article>'
        }
      })
      .mockResolvedValueOnce({
        success: true,
        screenshots: [{ artifactId: 'screenshot-1' }]
      })

    await controller.refreshArchiveArtifactStatus({ force: true })

    expect(controller.sendMessage).toHaveBeenNthCalledWith(1, {
      type: 'GET_PAGE_ARCHIVE',
      data: { url: 'https://example.com/page', backend: 'file' }
    })
    expect(controller.sendMessage).toHaveBeenNthCalledWith(2, {
      type: 'GET_PAGE_SCREENSHOTS',
      data: { url: 'https://example.com/page', backend: 'file' }
    })
    expect(uiManager.updateArchiveArtifactStatus).toHaveBeenLastCalledWith(expect.objectContaining({
      archiveSaved: true,
      screenshotSaved: true,
      readerAvailable: true
    }))
  })

  test('starts both independent status queries before either response resolves', async () => {
    const uiManager = makeUiManager()
    const controller = new PopupController({
      uiManager,
      stateManager: { setState: jest.fn(), getState: jest.fn(() => ({})) },
      errorHandler: { handleError: jest.fn() }
    })
    controller.currentTab = { url: 'https://example.com/page' }
    controller._resolvedStorageBackend = 'local'
    const resolvers = {}
    controller.sendMessage = jest.fn(({ type }) => new Promise(resolve => {
      resolvers[type] = resolve
    }))

    const pending = controller.refreshArchiveArtifactStatus({ force: true })

    expect(controller.sendMessage).toHaveBeenCalledTimes(2)
    expect(controller.sendMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'GET_PAGE_ARCHIVE' }))
    expect(controller.sendMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'GET_PAGE_SCREENSHOTS' }))

    resolvers.GET_PAGE_ARCHIVE({ success: true, archive: { archiveId: 'archive-1', sanitizedHtml: '<p>Readable</p>' } })
    resolvers.GET_PAGE_SCREENSHOTS({ success: true, screenshots: [{ artifactId: 'screenshot-1' }] })
    await pending
  })

  test('resets status on backend context changes and does not query unsupported backends', async () => {
    const uiManager = makeUiManager()
    const controller = new PopupController({
      uiManager,
      stateManager: { setState: jest.fn(), getState: jest.fn(() => ({})) },
      errorHandler: { handleError: jest.fn() }
    })
    controller.currentTab = { url: 'https://example.com/page' }
    controller.sendMessage = jest.fn()

    await controller.refreshArchiveArtifactStatus({ backend: 'sync' })

    expect(controller.sendMessage).not.toHaveBeenCalled()
    expect(uiManager.updateArchiveArtifactStatus).toHaveBeenLastCalledWith(expect.objectContaining({
      backend: 'sync',
      archiveSaved: false,
      screenshotSaved: false,
      readerAvailable: false
    }))
  })

  test('discards a response that resolves after the URL context changes', async () => {
    const uiManager = makeUiManager()
    const controller = new PopupController({
      uiManager,
      stateManager: { setState: jest.fn(), getState: jest.fn(() => ({})) },
      errorHandler: { handleError: jest.fn() }
    })
    controller.currentTab = { url: 'https://example.com/old' }
    controller._resolvedStorageBackend = 'local'
    const resolvers = []
    controller.sendMessage = jest.fn(() => new Promise(resolve => {
      resolvers.push(resolve)
    }))

    const pending = controller.refreshArchiveArtifactStatus({ force: true })
    controller._archiveStatusContextKey = 'https://example.com/new|local'
    controller.resetArchiveArtifactStatus('local')

    resolvers[0]({ success: true, archive: { archiveId: 'archive-old', sanitizedHtml: '<p>Old</p>' } })
    resolvers[1]({ success: true, screenshots: [{ artifactId: 'screenshot-old' }] })
    await pending

    expect(uiManager.updateArchiveArtifactStatus).toHaveBeenLastCalledWith(expect.objectContaining({
      archiveSaved: false,
      screenshotSaved: false,
      readerAvailable: false
    }))
  })

  test('refreshes the archive leg after successful archive capture without changing screenshot state', async () => {
    const uiManager = makeUiManager()
    const controller = new PopupController({
      uiManager,
      stateManager: { setState: jest.fn(), getState: jest.fn(() => ({})) },
      errorHandler: { handleError: jest.fn() }
    })
    controller.currentTab = { id: 7, url: 'https://example.com/page' }
    controller.currentPin = { url: 'https://example.com/page' }
    controller._resolvedStorageBackend = 'local'
    controller.getSelectedStorageBackend = jest.fn(() => 'local')
    controller._archiveStatusContextKey = 'https://example.com/page|local'
    controller._archiveArtifactStatus = {
      backend: 'local',
      archiveSaved: false,
      screenshotSaved: true,
      readerAvailable: false,
      archiveArtifactId: null,
      screenshotArtifactId: 'screenshot-1'
    }
    controller.sendMessage = jest.fn()
      .mockResolvedValueOnce({
        success: true,
        archive: {
          archiveId: 'archive-1',
          sanitizedHtml: '<article>Readable</article>'
        },
        bookmarkCreated: false
      })
      .mockResolvedValueOnce({
        success: true,
        archive: {
          archiveId: 'archive-1',
          sanitizedHtml: '<article>Readable</article>'
        }
      })

    await controller.handleCapturePageArchive()

    expect(controller.sendMessage).toHaveBeenNthCalledWith(2, {
      type: 'GET_PAGE_ARCHIVE',
      data: { url: 'https://example.com/page', backend: 'local' }
    })
    expect(uiManager.updateArchiveArtifactStatus).toHaveBeenLastCalledWith(expect.objectContaining({
      archiveSaved: true,
      screenshotSaved: true,
      readerAvailable: true
    }))
  })

  test('refreshes the screenshot leg using the capture URL and preserves archive state', async () => {
    const uiManager = makeUiManager()
    const controller = new PopupController({
      uiManager,
      stateManager: { setState: jest.fn(), getState: jest.fn(() => ({})) },
      errorHandler: { handleError: jest.fn() }
    })
    controller.currentTab = { id: 7, url: 'https://example.com/tab-url' }
    controller.currentPin = { url: 'https://example.com/bookmark-url' }
    controller._resolvedStorageBackend = 'local'
    controller.getSelectedStorageBackend = jest.fn(() => 'local')
    controller._archiveStatusContextKey = 'https://example.com/bookmark-url|local'
    controller._archiveArtifactStatus = {
      backend: 'local',
      archiveSaved: true,
      screenshotSaved: false,
      readerAvailable: true,
      archiveArtifactId: 'archive-1',
      screenshotArtifactId: null
    }
    controller.sendMessage = jest.fn()
      .mockResolvedValueOnce({ success: true, artifactId: 'screenshot-1' })
      .mockResolvedValueOnce({ success: true, screenshots: [{ artifactId: 'screenshot-1' }] })

    await controller.handleCapturePageScreenshot()

    expect(controller.sendMessage).toHaveBeenNthCalledWith(2, {
      type: 'GET_PAGE_SCREENSHOTS',
      data: { url: 'https://example.com/bookmark-url', backend: 'local' }
    })
    expect(uiManager.updateArchiveArtifactStatus).toHaveBeenLastCalledWith(expect.objectContaining({
      archiveSaved: true,
      screenshotSaved: true,
      readerAvailable: true
    }))
  })

  test('blocks Offline Reader when no readable archive is available', async () => {
    const uiManager = makeUiManager()
    const controller = new PopupController({
      uiManager,
      stateManager: { setState: jest.fn(), getState: jest.fn(() => ({})) },
      errorHandler: { handleError: jest.fn() }
    })
    controller.currentPin = { url: 'https://example.com/bookmark-url' }
    controller._archiveArtifactStatus = {
      backend: 'local',
      archiveSaved: false,
      screenshotSaved: true,
      readerAvailable: false,
      archiveArtifactId: null,
      screenshotArtifactId: 'screenshot-1'
    }

    await controller.handleOpenOfflineReader()

    expect(uiManager.showError).toHaveBeenCalledWith(expect.stringContaining('unavailable'))
    expect(chrome.tabs.create).not.toHaveBeenCalled()
  })
})
