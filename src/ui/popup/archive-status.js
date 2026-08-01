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
const ARCHIVE_CAPABLE_BACKENDS = Object.freeze(['local', 'file'])

export function isArchiveCapableBackend (backend) {
  return ARCHIVE_CAPABLE_BACKENDS.includes(String(backend || '').toLowerCase())
}

function unwrapSuccessfulResponse (response) {
  if (!response || response.success === false) return null
  if (response.success === true && response.data && !response.archive && !response.screenshots) {
    return response.data
  }
  return response
}

function persistedIdentity (artifact) {
  const value = artifact?.archiveId || artifact?.artifactId || artifact?.id || artifact?.hash
  return typeof value === 'string' && value.trim() ? value : null
}

function normalizeArchiveStatus (response) {
  const payload = unwrapSuccessfulResponse(response)
  const archive = payload?.archive || payload
  const archiveArtifactId = persistedIdentity(archive)
  const readable = !!archiveArtifactId && (
    (typeof archive?.sanitizedHtml === 'string' && archive.sanitizedHtml.trim().length > 0) ||
    (typeof archive?.textContent === 'string' && archive.textContent.trim().length > 0)
  )
  return {
    saved: readable,
    artifactId: readable ? archiveArtifactId : null
  }
}

function normalizeScreenshotStatus (response) {
  const payload = unwrapSuccessfulResponse(response)
  const screenshots = Array.isArray(payload?.screenshots)
    ? payload.screenshots
    : (Array.isArray(payload) ? payload : [])
  const artifact = screenshots.find(item => !!persistedIdentity(item))
  return {
    saved: !!artifact,
    artifactId: artifact ? persistedIdentity(artifact) : null
  }
}

/**
 * [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI]
 * Normalize both independent artifact legs and derive Reader availability only from archiveSaved.
 *
 * @param {{ backend?: string, archiveResponse?: unknown, screenshotResponse?: unknown }} input
 * @returns {{ backend: string|null, archiveSaved: boolean, screenshotSaved: boolean, readerAvailable: boolean, archiveArtifactId: string|null, screenshotArtifactId: string|null }}
 */
export function normalizeArchiveArtifactStatus ({
  backend = null,
  archiveResponse = null,
  screenshotResponse = null
} = {}) {
  const normalizedBackend = typeof backend === 'string' ? backend.toLowerCase() : null
  if (!isArchiveCapableBackend(normalizedBackend)) {
    return {
      backend: normalizedBackend,
      archiveSaved: false,
      screenshotSaved: false,
      readerAvailable: false,
      archiveArtifactId: null,
      screenshotArtifactId: null
    }
  }

  const archiveStatus = normalizeArchiveStatus(archiveResponse)
  const screenshotStatus = normalizeScreenshotStatus(screenshotResponse)
  return {
    backend: normalizedBackend,
    archiveSaved: archiveStatus.saved,
    screenshotSaved: screenshotStatus.saved,
    readerAvailable: archiveStatus.saved,
    archiveArtifactId: archiveStatus.artifactId,
    screenshotArtifactId: screenshotStatus.artifactId
  }
}

export const EMPTY_ARCHIVE_ARTIFACT_STATUS = Object.freeze({
  backend: null,
  archiveSaved: false,
  screenshotSaved: false,
  readerAvailable: false,
  archiveArtifactId: null,
  screenshotArtifactId: null
})
