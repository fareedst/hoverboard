/**
 * [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
 * Associate a captured Local/File archive with selected-backend bookmark ownership while preserving metadata and compensating partial failure.
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-PAGE_ARCHIVE_STORAGE ===
 * Capture and persist sanitized readable page archives and separate artifacts for Local/File bookmarks.
 *
 * ## RESOLVE_ARCHIVE_ADAPTER
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: resolve only Local/File archive adapters and report unsupported or unavailable storage before capture.
 * - Contract:
 *   - INPUT: backend (string), adapters (map)
 *   - PRE: backend is supplied as a string; adapters may omit an unconfigured File adapter
 *   - OUTPUT: adapter | { error: UnsupportedBackend | StorageUnavailable }
 *   - POST:
 *     - success => adapter is the adapter registered for local or file
 *     - error => no capture or state transition occurs
 *   - FAILURE_MODES: UnsupportedBackend, StorageUnavailable
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: RESOLVE_ARCHIVE_ADAPTER
 *   - backend = lowercase(String(backend))
 *   - IF backend is not local or file: RETURN { error: UnsupportedBackend }
 *   - adapter = adapters[backend]
 *   - IF adapter is absent: RETURN { error: StorageUnavailable }
 *   - RETURN adapter
 *
 * ## ARCHIVE_PRIVACY_GATE
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: enforce HTTP(S), inhibit-list, explicit-capture, and Local/File boundaries before page content or screenshot capture.
 * - Contract:
 *   - INPUT: bookmark { url, storage }, isUrlAllowed (function), captureExplicit (boolean)
 *   - PRE: bookmark is present; isUrlAllowed is callable
 *   - OUTPUT: allowed | { error: RestrictedUrl | InhibitedUrl | UnsupportedBackend | InvalidRequest }
 *   - POST:
 *     - success => browser capture may proceed
 *     - error => browser capture is not attempted
 *   - FAILURE_MODES: InvalidRequest, UnsupportedBackend, RestrictedUrl, InhibitedUrl
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: ARCHIVE_PRIVACY_GATE
 *   - IF captureExplicit is false: RETURN { error: InvalidRequest }
 *   - IF bookmark.url is not HTTP(S): RETURN { error: RestrictedUrl }
 *   - IF bookmark.storage is not local or file: RETURN { error: UnsupportedBackend }
 *   - IF isUrlAllowed(bookmark.url) is false: RETURN { error: InhibitedUrl }
 *   - RETURN allowed
 *
 * ## CAPTURE_AND_VALIDATE
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: capture and normalize the readable artifact only after the archive privacy gate succeeds.
 * - Contract:
 *   - INPUT: bookmark, capture options, capturePageContent (function)
 *   - PRE: bookmark passed ARCHIVE_PRIVACY_GATE; capturePageContent is callable
 *   - OUTPUT: archive | { error: CaptureFailed | TooLarge | RestrictedUrl | InhibitedUrl | UnsupportedBackend }
 *   - POST:
 *     - success => archive has sanitizedHtml, textContent, contentHash, version, capturedAt
 *     - error => no archive is persisted
 *   - FAILURE_MODES: CaptureFailed, TooLarge, RestrictedUrl, InhibitedUrl, UnsupportedBackend
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: CAPTURE_AND_VALIDATE
 *   - gate = AWAIT ARCHIVE_PRIVACY_GATE(bookmark)
 *   - IF gate is error: RETURN gate
 *   - captured = AWAIT capturePageContent(bookmark.url, options)
 *   - IF captured fails: RETURN { error: CaptureFailed }
 *   - archive = NORMALIZE_ARCHIVE(captured)
 *   - IF archive exceeds limits: RETURN { error: TooLarge }
 *   - RETURN archive
 *
 * ## SAVE_PAGE_ARCHIVE
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: preserve the prior archive, write the new artifact, and update derived archive search only after storage succeeds.
 * - Contract:
 *   - INPUT: bookmark { url, storage }, capture options, adapters, archiveSearch
 *   - PRE: capture is explicit; bookmark.url is HTTP(S); archiveSearch may be absent
 *   - OUTPUT: { success: true, archive } | { success: false, code, previous? }
 *   - POST:
 *     - success => one current archive version and matching derived text entry exist
 *     - StorageFailed => prior archive remains available when the adapter supports atomic failure
 *   - FAILURE_MODES: InvalidRequest, UnsupportedBackend, StorageUnavailable, RestrictedUrl, InhibitedUrl, CaptureFailed, TooLarge, StorageFailed
 *   - DATA: archive collections and derived ArchiveTextIndex
 *   - DATA_TRANSITION: successful write replaces one URL version; failure does not claim a new archive
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_PAGE_ARCHIVE
 *   - adapter = RESOLVE_ARCHIVE_ADAPTER(bookmark.storage, adapters)
 *   - IF adapter is error: RETURN { success: false, code: adapter.error }
 *   - archive = AWAIT CAPTURE_AND_VALIDATE(bookmark, options, capturePageContent)
 *   - IF archive is error: RETURN { success: false, code: archive.error }
 *   - previous = AWAIT adapter.readArchiveFile(bookmark.url)
 *   - result = AWAIT adapter.writeArchiveFile(bookmark.url, archive)
 *   - IF result fails: RETURN { success: false, code: StorageFailed, previous }
 *   - IF archiveSearch exists: AWAIT archiveSearch.replaceArchivedContent(bookmark.url, archive)
 *   - RETURN { success: true, archive }
 *
 * ## DELETE_PAGE_ARCHIVE
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: delete the selected backend's readable archive, screenshot artifacts, and derived search state together.
 * - Contract:
 *   - INPUT: bookmark { url, storage }, optional selected backend, adapters, archiveSearch
 *   - PRE: bookmark.url is normalized or normalizable
 *   - OUTPUT: { success: true } | { success: false, code: InvalidUrl | UnsupportedBackend | StorageUnavailable | StorageFailed }
 *   - POST:
 *     - success => readable archive, screenshot artifacts, and selected-backend search entry are absent
 *     - error => unrelated URLs and backends are unchanged
 *   - FAILURE_MODES: InvalidUrl, UnsupportedBackend, StorageUnavailable, StorageFailed
 *   - DATA: archive and screenshot collections, ArchiveTextIndex
 *   - DATA_TRANSITION: only the requested URL is removed
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: DELETE_PAGE_ARCHIVE
 *   - adapter = RESOLVE_ARCHIVE_ADAPTER(bookmark.storage, adapters)
 *   - IF adapter is error: RETURN { success: false, code: adapter.error }
 *   - REMOVE readable archive and matching screenshot records for bookmark.url
 *   - IF archiveSearch exists: AWAIT archiveSearch.removeArchivedContent(bookmark.url)
 *   - RETURN { success: true }
 *
 * ## LOOKUP_PAGE_ARCHIVE
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: resolve the explicitly selected adapter before reading a URL or archive identifier and never fetch the live page.
 * - Contract:
 *   - INPUT: identifier (URL or archiveId), optional backend, adapters
 *   - PRE: identifier is present; backend is local or file when supplied
 *   - OUTPUT: archive | { error: MissingArchive | UnsupportedBackend | StorageUnavailable | StorageFailed }
 *   - POST:
 *     - success => returned archive is persisted sanitized data; no network request occurs
 *     - error => no network request occurs
 *   - FAILURE_MODES: MissingArchive, UnsupportedBackend, StorageUnavailable, StorageFailed
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: LOOKUP_PAGE_ARCHIVE
 *   - candidates = backend is supplied ? [backend] : [local, file]
 *   - FOR candidate IN candidates:
 *     - adapter = RESOLVE_ARCHIVE_ADAPTER(candidate, adapters)
 *     - IF adapter is error and backend is supplied: RETURN { error: adapter.error }
 *     - IF adapter is error: CONTINUE
 *     - IF identifier is an archiveId: archive = AWAIT adapter.getArchiveById(identifier)
 *     - ELSE: archive = AWAIT adapter.getArchive(normalizeUrl(identifier))
 *     - IF archive exists: RETURN archive
 *   - RETURN { error: MissingArchive }
 *
 * ## LIST_PAGE_ARCHIVES
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: enumerate persisted Local/File artifacts through resolved adapters for explicit browse and search-scope wiring.
 * - Contract:
 *   - INPUT: optional backend, adapters
 *   - PRE: backend is local or file when supplied
 *   - OUTPUT: archives | { error: UnsupportedBackend | StorageUnavailable | StorageFailed }
 *   - POST:
 *     - success => archives contain only persisted records in deterministic order
 *   - FAILURE_MODES: UnsupportedBackend, StorageUnavailable, StorageFailed
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: LIST_PAGE_ARCHIVES
 *   - candidates = backend is supplied ? [backend] : [local, file]
 *   - FOR candidate IN candidates:
 *     - adapter = RESOLVE_ARCHIVE_ADAPTER(candidate, adapters)
 *     - IF adapter is error and backend is supplied: RETURN { error: adapter.error }
 *     - IF adapter is error: CONTINUE
 *     - archives = archives CONCAT AWAIT adapter.listArchives()
 *   - RETURN SORT archives BY capturedAt DESCENDING, url ASCENDING
 *
 * === END IMPL-FULL-BLOCK: IMPL-PAGE_ARCHIVE_STORAGE ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION ===
 * Associate a captured Local/File archive with a selected-backend bookmark while preserving metadata and compensating partial failure.
 *
 * ## RESOLVE_ARCHIVE_BOOKMARK_CONTEXT
 * - [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: resolve explicit backend ownership without aggregate URL lookup and retain the prior archive for compensation.
 * - Contract:
 *   - INPUT: request { url, preferredBackend }, selectedBackendLookup, archiveStore, isUrlAllowed
 *   - PRE: request exists; selectedBackendLookup, archiveStore, and isUrlAllowed are callable
 *   - OUTPUT: context { url, backend, existingBookmark, previousArchive } | { success: false, code }
 *   - POST:
 *     - success => existingBookmark may be null or any non-null record, including a stub
 *     - error => no page capture or bookmark mutation occurs
 *   - FAILURE_MODES: InvalidRequest, UnsupportedBackend, RestrictedUrl, InhibitedUrl, LookupFailed
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: RESOLVE_ARCHIVE_BOOKMARK_CONTEXT
 *   - IF url is absent: RETURN InvalidRequest
 *   - IF url is not HTTP(S): RETURN RestrictedUrl
 *   - IF preferredBackend is not local or file: RETURN UnsupportedBackend
 *   - IF isUrlAllowed(url) is false: RETURN InhibitedUrl
 *   - existingBookmark = AWAIT selectedBackendLookup(url, preferredBackend)
 *   - previousArchive = AWAIT archiveStore.read(url, preferredBackend)
 *   - RETURN context
 *
 * ## CAPTURE_ARCHIVE_AND_ASSOCIATE_BOOKMARK
 * - [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: capture and persist the archive before preserving or creating selected-backend bookmark ownership.
 * - Contract:
 *   - INPUT: context, captureContext, captureArchive, archiveStore
 *   - PRE: context passed RESOLVE_ARCHIVE_BOOKMARK_CONTEXT; archiveStore writes the selected backend
 *   - OUTPUT: current archive plus association state | { success: false, code, bookmarkCreated: false }
 *   - POST:
 *     - success => archive is current; existingBookmark is never rewritten
 *     - capture/storage error => bookmarkCreated is false and prior archive retention is reported
 *   - FAILURE_MODES: CaptureFailed, StorageFailed
 *   - DATA: previousArchive, currentArchive
 *   - DATA_TRANSITION: archive is written before missing-bookmark creation
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: CAPTURE_ARCHIVE_AND_ASSOCIATE_BOOKMARK
 *   - captured = AWAIT captureArchive(context.url, captureContext)
 *   - IF captured fails: RETURN stable failure with archiveRetained = previousArchive exists
 *   - saved = AWAIT archiveStore.saveArchive(context.url, context.backend, captured.archive)
 *   - IF saved fails: RETURN StorageFailed with archiveRetained = previousArchive exists
 *   - RETURN current archive plus previousArchive and existingBookmark
 *
 * ## CREATE_MINIMAL_BOOKMARK_IF_ABSENT
 * - [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [IMPL-DOM_UTILITIES] How: preserve any non-null selected-backend bookmark and create exactly one default-shaped bookmark only when lookup returned null.
 * - Contract:
 *   - INPUT: current archive, context, existingBookmark (nullable), createMinimalBookmark, saveBookmark, clock
 *   - PRE: archive write succeeded; selected backend is local or file; existingBookmark may be null or non-null
 *   - OUTPUT: { success: true, bookmark, bookmarkCreated } | { success: false, code: BookmarkSaveFailed }
 *   - POST:
 *     - existingBookmark non-null => no save occurs and bookmarkCreated is false
 *     - existingBookmark null and save succeeds => one bookmark uses archive URL/title, empty tags/notes, selected backend, and normal timestamps
 *   - FAILURE_MODES: BookmarkSaveFailed
 *   - DATA_TRANSITION: create one missing-bookmark record; never update a non-null existing record
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: CREATE_MINIMAL_BOOKMARK_IF_ABSENT
 *   - IF existingBookmark is non-null: RETURN { success: true, bookmark: existingBookmark, bookmarkCreated: false }
 *   - now = clock()
 *   - minimal = createMinimalBookmark({ url: context.url, description: archive.sourceTitle, tags: [], notes: '', preferredBackend: context.backend, time: now, updated_at: now })
 *   - saved = AWAIT saveBookmark(minimal)
 *   - IF saved fails: RETURN BookmarkSaveFailed
 *   - RETURN { success: true, bookmark: saved.bookmark OR minimal, bookmarkCreated: true }
 *
 * ## COMPENSATE_ARCHIVE_ASSOCIATION_FAILURE
 * - [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: restore the prior archive or remove only the new archive after bookmark association failure and expose uncertainty.
 * - Contract:
 *   - INPUT: context, previousArchive (nullable), archiveStore
 *   - PRE: current archive write succeeded and bookmark creation failed
 *   - OUTPUT: { archiveRetained, priorArchiveRestored, cleanupFailed, compensationError? }
 *   - POST:
 *     - previousArchive exists => restore is attempted
 *     - no previousArchive => only the new archive is removed
 *     - cleanup failure => cleanupFailed is true and the error remains visible
 *   - FAILURE_MODES: CompensationFailed
 *   - DATA_TRANSITION: current archive becomes previous archive or is deleted
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: COMPENSATE_ARCHIVE_ASSOCIATION_FAILURE
 *   - IF previousArchive exists: result = AWAIT archiveStore.restore(context.url, context.backend, previousArchive)
 *   - ELSE: result = AWAIT archiveStore.removeCurrent(context.url, context.backend)
 *   - IF result fails: RETURN archiveRetained = true, priorArchiveRestored = false, cleanupFailed = true, compensationError
 *   - IF previousArchive exists: RETURN archiveRetained = true, priorArchiveRestored = true, cleanupFailed = false
 *   - RETURN archiveRetained = false, priorArchiveRestored = false, cleanupFailed = false
 *
 * ## ARCHIVE_ASSOCIATION_RESULT_BOUNDARY
 * - [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: expose one stable response shape to message and popup/This Page callers.
 * - Contract:
 *   - INPUT: context result, archive result, bookmark result, compensation result
 *   - PRE: failed paths carry a stable code; bookmarkCreated defaults false
 *   - OUTPUT: success or failure response with association and compensation diagnostics
 *   - POST:
 *     - success => archive persistence and required bookmark association succeeded
 *     - failure => bookmarkCreated is false and CompensationFailed remains visible
 *   - FAILURE_MODES: delegated failure modes, CompensationFailed
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: ARCHIVE_ASSOCIATION_RESULT_BOUNDARY
 *   - IF context, capture, or archive write failed: RETURN failure with bookmarkCreated false and retention diagnostics
 *   - IF existingBookmark is non-null: RETURN success with bookmarkCreated false, archiveRetained true, cleanupFailed false
 *   - IF minimal bookmark save succeeds: RETURN success with bookmarkCreated true, archiveRetained true, cleanupFailed false
 *   - IF minimal bookmark save fails: RETURN failure merged with COMPENSATE_ARCHIVE_ASSOCIATION_FAILURE
 *
 * === END IMPL-FULL-BLOCK: IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION ===
 */
import { minEmpty, newPin } from '../../shared/utils.js'

const ARCHIVE_BACKENDS = new Set(['local', 'file'])

const isSuccessful = result => result?.success === true

const failureResponse = (code, fields = {}) => ({
  success: false,
  code,
  bookmarkCreated: false,
  archiveRetained: false,
  priorArchiveRestored: false,
  cleanupFailed: false,
  ...fields
})

const defaultCreateMinimalBookmark = data => {
  const base = minEmpty({
    url: data.url,
    description: data.description,
    tags: '',
    extended: data.notes || ''
  }, data.description)
  return newPin(base, {
    url: data.url,
    description: data.description,
    tags: '',
    extended: data.notes || '',
    preferredBackend: data.preferredBackend,
    time: data.time,
    updated_at: data.updated_at,
    dt: data.time
  })
}

/**
 * [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] Resolve explicit backend ownership without aggregate URL lookup.
 */
async function resolveArchiveBookmarkContext (request, dependencies) {
  const url = typeof request?.url === 'string' ? request.url.trim() : ''
  const backend = String(request?.preferredBackend || '').toLowerCase()
  if (!url) return failureResponse('InvalidRequest')
  if (!/^https?:/i.test(url)) return failureResponse('RestrictedUrl')
  if (!ARCHIVE_BACKENDS.has(backend)) return failureResponse('UnsupportedBackend')

  const isUrlAllowed = dependencies.isUrlAllowed || (async () => true)
  if (!(await isUrlAllowed(url))) return failureResponse('InhibitedUrl')

  let existingBookmark
  let previousArchive
  try {
    existingBookmark = await dependencies.selectedBackendLookup(url, backend)
    // A non-null stub is an owned bookmark; do not use aggregate 2C lookup here.
    previousArchive = await dependencies.archiveStore.read(url, backend)
  } catch (error) {
    return failureResponse('LookupFailed', { error: error?.message || String(error) })
  }

  return { url, backend, existingBookmark, previousArchive }
}

/**
 * [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] Capture and commit the archive before preserving or creating bookmark ownership.
 */
async function captureArchiveAndAssociateBookmark (request, dependencies = {}) {
  const context = await resolveArchiveBookmarkContext(request, dependencies)
  if (context?.success === false) return context

  let captured
  try {
    captured = await dependencies.captureArchive(context.url, request?.captureContext)
  } catch (error) {
    return failureResponse('CaptureFailed', {
      error: error?.message || String(error),
      archiveRetained: Boolean(context.previousArchive)
    })
  }
  if (!isSuccessful(captured)) {
    return failureResponse(captured?.code || 'CaptureFailed', {
      error: captured?.error,
      archiveRetained: Boolean(context.previousArchive)
    })
  }

  let savedArchive
  try {
    savedArchive = await dependencies.archiveStore.saveArchive(context.url, context.backend, captured.archive)
  } catch (error) {
    return failureResponse('StorageFailed', {
      error: error?.message || String(error),
      archiveRetained: Boolean(context.previousArchive)
    })
  }
  if (!isSuccessful(savedArchive)) {
    return failureResponse(savedArchive?.code || 'StorageFailed', {
      error: savedArchive?.error,
      archiveRetained: Boolean(context.previousArchive)
    })
  }

  const archive = savedArchive.archive || captured.archive
  if (context.existingBookmark !== null && context.existingBookmark !== undefined) {
    return {
      success: true,
      archive,
      bookmark: context.existingBookmark,
      bookmarkCreated: false,
      archiveRetained: true,
      priorArchiveRestored: false,
      cleanupFailed: false
    }
  }

  // [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [IMPL-DOM_UTILITIES] Create exactly one default-shaped selected-backend bookmark only when lookup returned null.
  const clock = dependencies.clock || (() => new Date().toISOString())
  const now = clock()
  const createMinimalBookmark = dependencies.createMinimalBookmark || defaultCreateMinimalBookmark
  const minimalBookmark = createMinimalBookmark({
    url: context.url,
    description: archive?.sourceTitle || '',
    tags: [],
    notes: '',
    preferredBackend: context.backend,
    time: now,
    updated_at: now
  })

  let savedBookmark
  try {
    savedBookmark = await dependencies.saveBookmark(minimalBookmark)
  } catch (error) {
    savedBookmark = { success: false, code: 'BookmarkSaveFailed', error: error?.message || String(error) }
  }
  if (isSuccessful(savedBookmark)) {
    return {
      success: true,
      archive,
      bookmark: savedBookmark.bookmark || minimalBookmark,
      bookmarkCreated: true,
      archiveRetained: true,
      priorArchiveRestored: false,
      cleanupFailed: false
    }
  }

  const compensation = await compensateArchiveAssociationFailure(context, dependencies)
  return failureResponse(savedBookmark?.code || 'BookmarkSaveFailed', {
    error: savedBookmark?.error,
    ...compensation
  })
}

/**
 * [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] Restore the prior archive or remove the new archive after bookmark association failure.
 */
async function compensateArchiveAssociationFailure (context, dependencies) {
  try {
    const result = context.previousArchive
      ? await dependencies.archiveStore.restore(context.url, context.backend, context.previousArchive)
      : await dependencies.archiveStore.removeCurrent(context.url, context.backend)
    if (!isSuccessful(result)) {
      return {
        archiveRetained: true,
        priorArchiveRestored: false,
        cleanupFailed: true,
        compensationError: result?.error || result?.code || 'CompensationFailed'
      }
    }
    return {
      archiveRetained: Boolean(context.previousArchive),
      priorArchiveRestored: Boolean(context.previousArchive),
      cleanupFailed: false
    }
  } catch (error) {
    return {
      archiveRetained: true,
      priorArchiveRestored: false,
      cleanupFailed: true,
      compensationError: error?.message || String(error)
    }
  }
}

/**
 * [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] Expose one stable response shape to message and UI callers.
 */
export { captureArchiveAndAssociateBookmark, resolveArchiveBookmarkContext, compensateArchiveAssociationFailure }
