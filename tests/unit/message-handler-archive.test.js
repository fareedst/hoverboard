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
 *     - success => archive has sanitizedHtml, textContent, contentHash, version, capturedAt, and optional sourcePresentationProfile
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
 * ## EXTRACT_SOURCE_PRESENTATION
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: extract only computed background, foreground, link, and color-scheme intent from the live document without copying source CSS.
 * - Contract:
 *   - INPUT: live document
 *   - PRE: document is available in the page-world executeScript context
 *   - OUTPUT: raw source presentation profile
 *   - POST:
 *     - background is the first opaque computed background found while walking from body toward document
 *     - text and link are computed color values; color-scheme is light, dark, or absent
 *     - no stylesheet text, inline style text, layout, script, or external asset enters the result
 *   - FAILURE_MODES: MissingDocument
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: EXTRACT_SOURCE_PRESENTATION
 *   - IF document or document.documentElement is absent: RETURN {}
 *   - nodes = body followed by each parent through document.documentElement
 *   - FOR node IN nodes:
 *     - style = GET_COMPUTED_STYLE(node)
 *     - IF background is absent and style.backgroundColor is opaque: SET background
 *   - text = GET_COMPUTED_STYLE(body OR document.documentElement).color
 *   - link = GET_COMPUTED_STYLE(first anchor OR body OR document.documentElement).color
 *   - colorScheme = document.documentElement.style.colorScheme OR computed color-scheme intent
 *   - RETURN { background, text, link, colorScheme }
 *
 * ## NORMALIZE_SOURCE_PRESENTATION
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: reduce raw computed presentation data to a bounded allowlisted archive field and keep it outside content identity hashes.
 * - Contract:
 *   - INPUT: raw source presentation profile, size limit
 *   - PRE: raw data is untrusted and may contain malformed CSS-like strings
 *   - OUTPUT: sourcePresentationProfile | absent
 *   - POST:
 *     - only canonical opaque colors and light/dark color-scheme intent remain
 *     - malformed, transparent, unsupported, and oversized values are omitted
 *     - contentHash and archiveId inputs remain based only on URL, sanitized HTML, and text
 *   - FAILURE_MODES: InvalidProfile
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: NORMALIZE_SOURCE_PRESENTATION
 *   - profile = parse each allowlisted color field as canonical RGB or hex
 *   - profile = remove transparent or invalid background and any invalid optional fields
 *   - profile.colorScheme = light or dark when the raw intent is allowlisted
 *   - IF serialized profile exceeds the profile size limit: RETURN absent
 *   - IF profile has no valid field: RETURN absent
 *   - RETURN profile
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
/**
 * === IMPL-FULL-BLOCK: IMPL-ARCHIVED_CONTENT_SEARCH ===
 * Search extracted text from Local/File archives without changing metadata search.
 *
 * ## REPLACE_ARCHIVED_CONTENT
 * - [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] How: synchronize one extracted-text entry with successful archive capture and remove it when text is empty.
 * - Contract:
 *   - INPUT: url, archive entry
 *   - PRE: url is normalizable; entry may be absent or have empty text
 *   - OUTPUT: none
 *   - POST:
 *     - non-empty entry => normalized URL maps to one normalized search entry
 *     - missing/empty entry => normalized URL is absent from the index
 *   - DATA: ArchiveTextIndex
 *   - DATA_TRANSITION: replace updates one URL; empty input removes one URL
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: REPLACE_ARCHIVED_CONTENT
 *   - IF entry is missing or text is empty: REMOVE_ARCHIVED_CONTENT(url); RETURN
 *   - index[normalize(url)] = normalizeEntry(entry)
 *
 * ## REMOVE_ARCHIVED_CONTENT
 * - [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] How: remove derived search state when an archive is deleted or compensation removes the current archive.
 * - Contract:
 *   - INPUT: url
 *   - PRE: url is normalizable
 *   - OUTPUT: none
 *   - POST: normalized URL is absent from ArchiveTextIndex
 *   - DATA: ArchiveTextIndex
 *   - DATA_TRANSITION: one normalized URL is deleted
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: REMOVE_ARCHIVED_CONTENT
 *   - DELETE index[normalize(url)]
 *
 * ## QUERY_ARCHIVED_CONTENT
 * - [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] How: return bounded deterministic snippets for explicit non-empty archive-content queries without mutating metadata or the index.
 * - Contract:
 *   - INPUT: query (string), ArchiveTextIndex
 *   - PRE: index entries came from successful archive captures
 *   - OUTPUT: list of { url, title, snippet, archiveStatus, readerTarget }
 *   - POST:
 *     - success => each result has a bounded snippet and deterministic order
 *     - empty query => empty list; index remains unchanged
 *   - DATA: ArchiveTextIndex
 *   - DATA_TRANSITION: query is read-only
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: QUERY_ARCHIVED_CONTENT
 *   - needle = normalizeQuery(query)
 *   - IF needle is empty: RETURN []
 *   - results = []
 *   - FOR each entry IN index:
 *     - position = findCaseInsensitive(entry.text, needle)
 *     - IF position >= 0: append result with bounded snippet and Reader target
 *   - SORT results BY position ASCENDING, capturedAt DESCENDING, url ASCENDING
 *   - RETURN results
 *
 * ## APPLY_ARCHIVE_CONTENT_SCOPE
 * - [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] How: keep archive browse/search independent from metadata filtering and rebuild derived entries from persisted artifacts before reading.
 * - Contract:
 *   - INPUT: scope ('metadata' | 'archive'), query, archiveStore, archiveSearch
 *   - PRE: scope is explicit; archiveStore and archiveSearch are available
 *   - OUTPUT: metadata filter result | archive result list
 *   - POST:
 *     - metadata scope => archive text is not queried
 *     - archive scope => metadata rows and metadata actions are not mutated
 *     - empty archive query => deterministic browse rows
 *   - FAILURE_MODES: StorageFailed, SearchFailed
 *   - DATA: persisted archives, ArchiveTextIndex, metadata rows
 *   - DATA_TRANSITION: archive scope rebuilds derived entries; metadata state remains unchanged
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_ARCHIVE_CONTENT_SCOPE
 *   - IF scope is not archive: RETURN APPLY_METADATA_SEARCH(query)
 *   - archives = AWAIT archiveStore.listArchives()
 *   - AWAIT archiveSearch.seed(archives)
 *   - IF normalizeQuery(query) is empty: RETURN BROWSE_ARCHIVED_CONTENT(archives, archiveSearch)
 *   - RETURN QUERY_ARCHIVED_CONTENT(query)
 *
 * ## BROWSE_ARCHIVED_CONTENT
 * - [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] How: map persisted archives to deterministic browse rows with bounded snippets and extension-resolvable Reader targets.
 * - Contract:
 *   - INPUT: persisted archive list, archiveSearch
 *   - PRE: archiveSearch is available; each archive has a URL or is discarded
 *   - OUTPUT: deterministic rows with title, snippet, status, storage, capturedAt, readerTarget
 *   - POST: each readerTarget resolves to the extension Reader page
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: BROWSE_ARCHIVED_CONTENT
 *   - rows = archiveSearch.browseArchivedContent(archives)
 *   - FOR each row IN rows:
 *     - row.readerTarget = extensionRuntimeUrl('src/ui/reader/reader.html', { url: row.url })
 *   - RETURN rows
 *
 * ## OPEN_READER_FROM_ARCHIVE_RESULT
 * - [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: open a stored archive result in Offline Reader rather than the live page.
 * - Contract:
 *   - INPUT: archive search result with readerTarget
 *   - PRE: readerTarget is non-empty and generated by BROWSE_ARCHIVED_CONTENT or QUERY_ARCHIVED_CONTENT
 *   - OUTPUT: extension navigation target
 *   - POST: target opens Reader with URL/archiveId query and performs no live-page fetch
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: OPEN_READER_FROM_ARCHIVE_RESULT
 *   - RETURN result.readerTarget
 *
 * === END IMPL-FULL-BLOCK: IMPL-ARCHIVED_CONTENT_SEARCH ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-OFFLINE_READER_MODE ===
 * Render persisted sanitized archive content in a dedicated Offline Reader without fetching the live page.
 *
 * ## LOAD_READER_ARCHIVE
 * - [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: parse URL/archiveId query, request only persisted archive state, and use an explicit freshness handoff.
 * - Contract:
 *   - INPUT: location { search }, sendMessage, elements, staleAfterMs option
 *   - PRE: Reader is an extension page; sendMessage reads persisted state only
 *   - OUTPUT: rendered Reader state
 *   - POST:
 *     - URL/archiveId query => one GET_PAGE_ARCHIVE request includes `staleAfterMs`
 *     - no query => no storage request and missing state is rendered
 *     - archive success => screenshot lookup uses the persisted archive URL
 *   - FAILURE_MODES: MissingArchive, StorageFailed, InvalidArchive
 *   - DATA: URLSearchParams, PageArchiveStore response, PageScreenshotStore response
 *   - DATA_TRANSITION: storage response becomes DOM state; no live page data enters Reader
 *   - EFFECTS: DOM, Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: LOAD_READER_ARCHIVE
 *   - query = PARSE_QUERY(location)
 *   - IF query.url and query.archiveId are absent: RENDER_READER_ARCHIVE(null); RETURN MissingArchive
 *   - staleAfterMs = options.staleAfterMs OR DEFAULT_READER_STALE_AFTER_MS (default 0, meaning no age-based override)
 *   - archiveResponse = AWAIT sendMessage(GET_PAGE_ARCHIVE, { url: query.url, archiveId: query.archiveId, staleAfterMs })
 *   - IF archiveResponse is missing or failed: RENDER_READER_ARCHIVE(null); RETURN MissingArchive
 *   - RENDER_READER_ARCHIVE(archiveResponse.archive)
 *   - screenshotResponse = AWAIT sendMessage(GET_PAGE_SCREENSHOTS, { url: archiveResponse.archive.url })
 *   - RENDER_READER_SCREENSHOTS(screenshotResponse.screenshots)
 *   - RETURN success
 *
 * ## RENDER_READER_ARCHIVE
 * - [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: render only sanitized stored HTML/text and show freshness state without loading live HTML.
 * - Contract:
 *   - INPUT: archive (nullable), Reader DOM elements
 *   - PRE: archive content came from persisted storage; sanitizer is available
 *   - OUTPUT: { success: true, archive } | { success: false, code: MissingArchive }
 *   - POST:
 *     - archive absent => content is empty, missing state is visible, live link is hidden
 *     - archive present => only sanitized HTML is inserted
 *     - stale archive => warning remains visible while content remains readable
 *   - FAILURE_MODES: MissingArchive, InvalidArchive
 *   - DATA_TRANSITION: archive fields become text/DOM state; no live HTML is inserted
 *   - EFFECTS: DOM
 *   - TERMINATION: total
 * - PROCEDURE: RENDER_READER_ARCHIVE
 *   - IF archive is absent:
 *     - clear content
 *     - show Archive unavailable
 *     - hide live link
 *     - RETURN MissingArchive
 *   - title = archive.sourceTitle OR archive.title OR archive.url
 *   - content.innerHTML = SANITIZE_ARCHIVE_HTML(archive.sanitizedHtml OR '')
 *   - status = archive.status == stale ? stale warning : available message
 *   - live link is optional and explicit; never auto-fetched
 *   - RETURN success
 *
 * ## RENDER_READER_SCREENSHOTS
 * - [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: present only persisted safe screenshot artifacts alongside Reader content.
 * - Contract:
 *   - INPUT: screenshots (list), screenshot DOM elements
 *   - PRE: screenshot response is untrusted data
 *   - OUTPUT: rendered screenshot list
 *   - POST:
 *     - only data:image png/jpeg/webp base64 values create img elements
 *     - empty safe list hides the screenshot section
 *   - FAILURE_MODES: InvalidArchive
 *   - EFFECTS: DOM
 *   - TERMINATION: total
 * - PROCEDURE: RENDER_READER_SCREENSHOTS
 *   - clear screenshot list
 *   - FOR each screenshot with valid data:image/*;base64 data:
 *     - append img with data URL and captured timestamp alt text
 *   - hide screenshot section when list is empty
 *
 * ## OPEN_LIVE_PAGE
 * - [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: expose explicit live-page navigation without coupling it to archive rendering or fetching it automatically.
 * - Contract:
 *   - INPUT: archive.url, live-link element
 *   - PRE: archive.url is HTTP(S)
 *   - OUTPUT: configured link
 *   - POST: user activation may navigate to the live URL; Reader performs no fetch
 *   - EFFECTS: DOM
 *   - TERMINATION: total
 * - PROCEDURE: OPEN_LIVE_PAGE
 *   - set live link href to archive.url only when URL is HTTP(S)
 *   - user activation opens the link; Reader does not fetch it
 *
 * === END IMPL-FULL-BLOCK: IMPL-OFFLINE_READER_MODE ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-PAGE_SCREENSHOT_ARCHIVE ===
 * Capture and persist a bounded product screenshot as a separate Local/File artifact.
 *
 * ## VALIDATE_SCREENSHOT_REQUEST
 * - [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: validate backend, URL, privacy, and requested dimensions before invoking browser capture.
 * - Contract:
 *   - INPUT: url, storage, options, limits, isUrlAllowed
 *   - PRE: request is explicit; isUrlAllowed is callable
 *   - OUTPUT: valid | { error: UnsupportedBackend | RestrictedUrl | InhibitedUrl | TooLarge }
 *   - POST:
 *     - valid => browser capture may be called
 *     - error => browser capture is not called
 *   - FAILURE_MODES: UnsupportedBackend, RestrictedUrl, InhibitedUrl, TooLarge
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: VALIDATE_SCREENSHOT_REQUEST
 *   - IF storage is not local or file: RETURN UnsupportedBackend
 *   - IF url is not HTTP(S): RETURN RestrictedUrl
 *   - IF isUrlAllowed(url) is false: RETURN InhibitedUrl
 *   - IF requested dimensions exceed limits: RETURN TooLarge
 *   - RETURN valid
 *
 * ## CAPTURE_PAGE_SCREENSHOT
 * - [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: perform pre-capture validation, capture through the dedicated browser boundary, then normalize and size-check the output.
 * - Contract:
 *   - INPUT: tabId, url, options, storage, limits, isUrlAllowed, dedicatedBrowserCapture
 *   - PRE: capture request is explicit; validation dependencies are available
 *   - OUTPUT: artifact | { success: false, code }
 *   - POST:
 *     - success => artifact has data URL, dimensions, format, contentHash, capturedAt
 *     - validation error => browser capture was not invoked
 *   - FAILURE_MODES: UnsupportedBackend, RestrictedUrl, InhibitedUrl, FullPageCaptureUnavailable, CaptureFailed, TooLarge
 *   - EFFECTS: Browser IO, Async
 *   - TERMINATION: total
 * - PROCEDURE: CAPTURE_PAGE_SCREENSHOT
 *   - validation = AWAIT VALIDATE_SCREENSHOT_REQUEST(url, storage, options, limits, isUrlAllowed)
 *   - IF validation fails: RETURN { success: false, code: validation }
 *   - IF options.fullPage and full-page capability is unavailable: RETURN FullPageCaptureUnavailable
 *   - binary = AWAIT dedicatedBrowserCapture(tabId, options)
 *   - IF binary fails: RETURN CaptureFailed
 *   - artifact = NORMALIZE_SCREENSHOT(binary, options)
 *   - IF artifact exceeds limits: RETURN TooLarge
 *   - RETURN artifact
 *
 * ## SAVE_PAGE_SCREENSHOT
 * - [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: persist a validated screenshot through the explicit adapter/store boundary only after capture succeeds.
 * - Contract:
 *   - INPUT: bookmark { url, storage }, tab, options, screenshotStore
 *   - PRE: screenshotStore is configured for the selected backend
 *   - OUTPUT: { success: true, artifact } | { success: false, code }
 *   - POST:
 *     - success => one current screenshot artifact exists for URL
 *     - failure => prior screenshot remains unchanged
 *   - FAILURE_MODES: delegated capture failures, UnsupportedBackend, StorageFailed
 *   - DATA_TRANSITION: successful recapture replaces current artifact after write
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_PAGE_SCREENSHOT
 *   - artifact = AWAIT CAPTURE_PAGE_SCREENSHOT(tab, options, bookmark.storage)
 *   - IF artifact is error: RETURN artifact
 *   - result = AWAIT screenshotStore.saveScreenshot(bookmark.url, bookmark.storage, artifact)
 *   - IF result fails: RETURN StorageFailed
 *   - RETURN { success: true, artifact: result.artifact }
 *
 * ## REPLACE_CURRENT_SCREENSHOT
 * - [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: use one explicit adapter write to replace every prior artifact for the normalized URL while preserving unrelated archive data.
 * - Contract:
 *   - INPUT: normalized URL, selected backend, validated screenshot artifact, adapter
 *   - PRE: backend is local or file; artifact passed validation and normalization
 *   - OUTPUT: { success: true, artifact } | { success: false, code: UnsupportedBackend | StorageFailed }
 *   - POST:
 *     - success => exactly one current screenshot artifact for URL remains
 *     - write failure => prior screenshot map remains unchanged
 *   - FAILURE_MODES: InvalidUrl, UnsupportedBackend, StorageFailed
 *   - DATA_TRANSITION: replacement data is prepared before one adapter write
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: REPLACE_CURRENT_SCREENSHOT
 *   - data = AWAIT readArchiveMap(adapter)
 *   - remove every data.screenshots entry whose artifact.url == normalize(url)
 *   - data.screenshots[artifact.artifactId] = artifact with version incremented from current URL artifact or 1
 *   - AWAIT adapter.writeArchiveFile(data)
 *   - RETURN { success: true, artifact: data.screenshots[artifact.artifactId] }
 *
 * ## LIST_PAGE_SCREENSHOTS
 * - [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: enumerate only durable product screenshot records through the selected adapter in deterministic order.
 * - Contract:
 *   - INPUT: optional selected backend, URL, adapters
 *   - PRE: backend is local or file when supplied
 *   - OUTPUT: deterministic screenshot artifact list
 *   - POST: list contains only durable screenshot records, ordered newest first
 *   - FAILURE_MODES: UnsupportedBackend, StorageUnavailable, StorageFailed
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: LIST_PAGE_SCREENSHOTS
 *   - RETURN screenshotStore.listScreenshots(backend, url)
 *
 * ## DELETE_PAGE_SCREENSHOTS
 * - [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: delete screenshot artifacts for one URL without changing readable archive content.
 * - Contract:
 *   - INPUT: URL, optional selected backend, adapters
 *   - PRE: URL is normalizable
 *   - OUTPUT: { success: true } | { success: false, code: InvalidUrl | UnsupportedBackend | StorageFailed }
 *   - POST: matching screenshot artifacts are absent; readable archive remains unless DELETE_PAGE_ARCHIVE runs
 *   - FAILURE_MODES: InvalidUrl, UnsupportedBackend, StorageFailed
 *   - DATA_TRANSITION: only matching screenshot records are removed
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: DELETE_PAGE_SCREENSHOTS
 *   - RETURN screenshotStore.deleteScreenshots(url, backend)
 *
 * === END IMPL-FULL-BLOCK: IMPL-PAGE_SCREENSHOT_ARCHIVE ===
 */
import { MessageHandler, MESSAGE_TYPES } from '../../src/core/message-handler.js'
import { InMemoryPageArchiveStorageAdapter } from '../../src/features/archive/page-archive-storage-adapter.js'
import { PageArchiveStore } from '../../src/features/archive/page-archive-store.js'
import { ArchiveContentSearch } from '../../src/features/archive/archive-content-search.js'
import { PageScreenshotStore } from '../../src/features/archive/page-screenshot-store.js'

const provider = {
  getStorageBackendForUrl: jest.fn().mockResolvedValue('local'),
  getBookmarkForBackend: jest.fn().mockResolvedValue(null),
  saveBookmark: jest.fn().mockImplementation(async bookmark => ({
    success: true,
    bookmark: { ...bookmark, time: bookmark.time || '2026-08-01T10:00:00.000Z' }
  })),
  deleteBookmark: jest.fn().mockResolvedValue({ success: true })
}

const tagService = {
  pinboardService: provider,
  sanitizeTag: value => value,
  handleTagAddition: jest.fn()
}

describe('archive message composition [REQ-PAGE_ARCHIVE_STORAGE]', () => {
  let handler
  let archiveStore
  let screenshotStore

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn().mockResolvedValue({ ok: true })
    const local = new InMemoryPageArchiveStorageAdapter()
    const file = new InMemoryPageArchiveStorageAdapter()
    const search = new ArchiveContentSearch()
    archiveStore = new PageArchiveStore({ localAdapter: local, fileAdapter: file, archiveSearch: search })
    screenshotStore = new PageScreenshotStore({ localAdapter: local, fileAdapter: file })
    handler = new MessageHandler(provider, tagService, archiveStore, screenshotStore)
    handler.configManager.isUrlAllowed = jest.fn().mockResolvedValue(true)
    global.chrome.scripting.executeScript = jest.fn().mockResolvedValue([{
      result: {
        title: 'Captured',
        html: '<article><h1>Captured</h1><script>bad()</script><p>Body text</p></article>',
        textContent: 'Captured Body text',
        sourcePresentationProfile: {
          background: 'rgb(255, 255, 255)',
          text: 'rgb(32, 33, 36)',
          link: 'rgb(0, 0, 238)',
          colorScheme: 'light'
        }
      }
    }])
    global.chrome.tabs.captureVisibleTab = jest.fn().mockResolvedValue('data:image/png;base64,' + 'A'.repeat(128))
  })

  // - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: extract only computed background, foreground, link, and color-scheme intent from the live document without copying source CSS.
  test('executes the source presentation extractor at the capture boundary [REQ-PAGE_ARCHIVE_STORAGE]', async () => {
    document.documentElement.innerHTML = '<head></head><body style="background-color: transparent; color: rgb(32, 33, 36)"><a href="https://example.com" style="color: rgb(0, 0, 238)">Read</a><p>Body text</p></body>'
    document.documentElement.style.backgroundColor = 'rgb(255, 255, 255)'
    document.documentElement.style.colorScheme = 'light'
    global.chrome.scripting.executeScript.mockImplementationOnce(async ({ func }) => [{ result: func() }])

    const captured = await handler.processMessage({
      type: MESSAGE_TYPES.CAPTURE_PAGE_ARCHIVE,
      data: { tabId: 7, url: 'https://example.com/extractor', preferredBackend: 'local' }
    }, { tab: { id: 7, url: 'https://example.com/extractor' } })

    expect(captured.archive.sourcePresentationProfile).toEqual({
      background: '#ffffff',
      text: '#202124',
      link: '#0000ee',
      colorScheme: 'light'
    })
  })

  // - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: extract only computed background, foreground, link, and color-scheme intent from the live document without copying source CSS.
  test('routes explicit capture, lookup, and archive search', async () => {
    const captured = await handler.processMessage({
      type: MESSAGE_TYPES.CAPTURE_PAGE_ARCHIVE,
      data: { tabId: 7, url: 'https://example.com/page', preferredBackend: 'local' }
    }, { tab: { id: 7, url: 'https://example.com/page' } })
    expect(captured.success).toBe(true)
    expect(captured.bookmarkCreated).toBe(true)
    expect(captured.archive.sanitizedHtml).not.toContain('<script')
    expect(captured.archive.sourcePresentationProfile).toEqual({
      background: '#ffffff',
      text: '#202124',
      link: '#0000ee',
      colorScheme: 'light'
    })

    const loaded = await handler.processMessage({
      type: MESSAGE_TYPES.GET_PAGE_ARCHIVE,
      data: { url: 'https://example.com/page' }
    }, {})
    expect(loaded.success).toBe(true)
    expect(loaded.archive.textContent).toContain('Body text')

    const search = await handler.processMessage({
      type: MESSAGE_TYPES.SEARCH_ARCHIVED_CONTENT,
      data: { query: 'body' }
    }, {})
    expect(search.results).toHaveLength(1)
    expect(search.results[0].readerTarget).toContain('reader.html')

    const browse = await handler.processMessage({
      type: MESSAGE_TYPES.SEARCH_ARCHIVED_CONTENT,
      data: { query: '' }
    }, {})
    expect(browse.results).toHaveLength(1)
    expect(browse.results[0].url).toBe('https://example.com/page')
  })

  // [REQ-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [IMPL-PAGE_ARCHIVE_STORAGE]
  // Popup messages have no sender.tab; explicit capture context must survive dispatch.
  test('preserves explicit archive tab context from popup messages', async () => {
    const captured = await handler.processMessage({
      type: MESSAGE_TYPES.CAPTURE_PAGE_ARCHIVE,
      data: { tabId: 7, url: 'https://example.com/popup-page', preferredBackend: 'local' }
    }, {})
    expect(captured.success).toBe(true)
    expect(captured.bookmarkCreated).toBe(true)
  })

  test('rejects archive capture without an explicit Local/File preferredBackend', async () => {
    const captured = await handler.processMessage({
      type: MESSAGE_TYPES.CAPTURE_PAGE_ARCHIVE,
      data: { tabId: 7, url: 'https://example.com/missing-backend' }
    }, { tab: { id: 7, url: 'https://example.com/missing-backend' } })

    expect(captured).toMatchObject({ success: false, code: 'UnsupportedBackend', bookmarkCreated: false })
    expect(global.chrome.scripting.executeScript).not.toHaveBeenCalled()
  })

  test('routes product screenshot capture separately from demo mode', async () => {
    const result = await handler.processMessage({
      type: MESSAGE_TYPES.CAPTURE_PAGE_SCREENSHOT,
      data: { tabId: 7, url: 'https://example.com/page', backend: 'local', options: { format: 'png' } }
    }, { tab: { id: 7, url: 'https://example.com/page' } })
    expect(result.success).toBe(true)
    expect(result.artifact.format).toBe('image/png')
    expect((await screenshotStore.listScreenshots('local'))).toHaveLength(1)
  })

  test('rejects oversized screenshot dimensions before browser capture [REQ-PAGE_SCREENSHOT_ARCHIVE]', async () => {
    const result = await handler.processMessage({
      type: MESSAGE_TYPES.CAPTURE_PAGE_SCREENSHOT,
      data: {
        tabId: 7,
        url: 'https://example.com/too-large',
        backend: 'local',
        options: { width: 5000, height: 800 }
      }
    }, { tab: { id: 7, url: 'https://example.com/too-large' } })

    expect(result).toEqual({ success: false, code: 'TooLarge' })
    expect(global.chrome.tabs.captureVisibleTab).not.toHaveBeenCalled()
  })

  test('dispatches screenshot listing and deletion through the dedicated artifact store', async () => {
    await screenshotStore.saveScreenshot('https://example.com/screenshot-dispatch', 'local', {
      artifactId: 'dispatch-shot',
      dataUrl: 'data:image/png;base64,' + 'B'.repeat(128)
    })

    const listed = await handler.processMessage({
      type: MESSAGE_TYPES.GET_PAGE_SCREENSHOTS,
      data: { url: 'https://example.com/screenshot-dispatch', backend: 'local' }
    }, {})
    expect(listed).toMatchObject({ success: true, screenshots: [expect.objectContaining({ artifactId: 'dispatch-shot' })] })

    const deleted = await handler.processMessage({
      type: MESSAGE_TYPES.DELETE_PAGE_SCREENSHOTS,
      data: { url: 'https://example.com/screenshot-dispatch', backend: 'local' }
    }, {})
    expect(deleted).toEqual({ success: true })
    expect(await screenshotStore.listScreenshots('local')).toEqual([])
  })

  test('does not capture inhibited archive or screenshot URLs', async () => {
    handler.configManager.isUrlAllowed.mockResolvedValue(false)
    const archiveResult = await handler.processMessage({
      type: MESSAGE_TYPES.CAPTURE_PAGE_ARCHIVE,
      data: { tabId: 7, url: 'https://example.com/private', preferredBackend: 'local' }
    }, { tab: { id: 7, url: 'https://example.com/private' } })
    const screenshotResult = await handler.processMessage({
      type: MESSAGE_TYPES.CAPTURE_PAGE_SCREENSHOT,
      data: { tabId: 7, url: 'https://example.com/private', backend: 'local' }
    }, { tab: { id: 7, url: 'https://example.com/private' } })
    expect(archiveResult).toMatchObject({ success: false, code: 'InhibitedUrl', bookmarkCreated: false })
    expect(screenshotResult).toEqual({ success: false, code: 'InhibitedUrl' })
    expect(global.chrome.scripting.executeScript).not.toHaveBeenCalled()
    expect(global.chrome.tabs.captureVisibleTab).not.toHaveBeenCalled()
  })

  test('bookmark deletion triggers archive cleanup without changing non-archive behavior', async () => {
    await archiveStore.saveArchive('https://example.com/delete', 'local', {
      url: 'https://example.com/delete',
      sanitizedHtml: '<p>x</p>',
      textContent: 'x'
    })
    const result = await handler.processMessage({
      type: MESSAGE_TYPES.DELETE_BOOKMARK,
      data: { url: 'https://example.com/delete', preferredBackend: 'local' }
    }, {})
    expect(result.success).toBe(true)
    expect(await archiveStore.getArchive('https://example.com/delete')).toBeNull()
  })
})
