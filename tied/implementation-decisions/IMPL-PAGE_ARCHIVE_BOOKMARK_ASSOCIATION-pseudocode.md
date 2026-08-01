# [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
# Associate a captured Local/File archive with a selected-backend bookmark while preserving metadata and compensating partial failure.

## RESOLVE_ARCHIVE_BOOKMARK_CONTEXT
- [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: resolve explicit backend ownership without aggregate URL lookup and retain the prior archive for compensation.
- Contract:
  - INPUT: request { url, preferredBackend }, selectedBackendLookup, archiveStore, isUrlAllowed
  - PRE: request exists; selectedBackendLookup, archiveStore, and isUrlAllowed are callable
  - OUTPUT: context { url, backend, existingBookmark, previousArchive } | { success: false, code }
  - POST:
    - success => existingBookmark may be null or any non-null record, including a stub
    - error => no page capture or bookmark mutation occurs
  - FAILURE_MODES: InvalidRequest, UnsupportedBackend, RestrictedUrl, InhibitedUrl, LookupFailed
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: RESOLVE_ARCHIVE_BOOKMARK_CONTEXT
  - IF url is absent: RETURN InvalidRequest
  - IF url is not HTTP(S): RETURN RestrictedUrl
  - IF preferredBackend is not local or file: RETURN UnsupportedBackend
  - IF isUrlAllowed(url) is false: RETURN InhibitedUrl
  - existingBookmark = AWAIT selectedBackendLookup(url, preferredBackend)
  - previousArchive = AWAIT archiveStore.read(url, preferredBackend)
  - RETURN context

## CAPTURE_ARCHIVE_AND_ASSOCIATE_BOOKMARK
- [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: capture and persist the archive before preserving or creating selected-backend bookmark ownership.
- Contract:
  - INPUT: context, captureContext, captureArchive, archiveStore
  - PRE: context passed RESOLVE_ARCHIVE_BOOKMARK_CONTEXT; archiveStore writes the selected backend
  - OUTPUT: current archive plus association state | { success: false, code, bookmarkCreated: false }
  - POST:
    - success => archive is current; existingBookmark is never rewritten
    - capture/storage error => bookmarkCreated is false and prior archive retention is reported
  - FAILURE_MODES: CaptureFailed, StorageFailed
  - DATA: previousArchive, currentArchive
  - DATA_TRANSITION: archive is written before missing-bookmark creation
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: CAPTURE_ARCHIVE_AND_ASSOCIATE_BOOKMARK
  - captured = AWAIT captureArchive(context.url, captureContext)
  - IF captured fails: RETURN stable failure with archiveRetained = previousArchive exists
  - saved = AWAIT archiveStore.saveArchive(context.url, context.backend, captured.archive)
  - IF saved fails: RETURN StorageFailed with archiveRetained = previousArchive exists
  - RETURN current archive plus previousArchive and existingBookmark

## CREATE_MINIMAL_BOOKMARK_IF_ABSENT
- [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [IMPL-DOM_UTILITIES] How: preserve any non-null selected-backend bookmark and create exactly one default-shaped bookmark only when lookup returned null.
- Contract:
  - INPUT: current archive, context, existingBookmark (nullable), createMinimalBookmark, saveBookmark, clock
  - PRE: archive write succeeded; selected backend is local or file; existingBookmark may be null or non-null
  - OUTPUT: { success: true, bookmark, bookmarkCreated } | { success: false, code: BookmarkSaveFailed }
  - POST:
    - existingBookmark non-null => no save occurs and bookmarkCreated is false
    - existingBookmark null and save succeeds => one bookmark uses archive URL/title, empty tags/notes, selected backend, and normal timestamps
  - FAILURE_MODES: BookmarkSaveFailed
  - DATA_TRANSITION: create one missing-bookmark record; never update a non-null existing record
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: CREATE_MINIMAL_BOOKMARK_IF_ABSENT
  - IF existingBookmark is non-null: RETURN { success: true, bookmark: existingBookmark, bookmarkCreated: false }
  - now = clock()
  - minimal = createMinimalBookmark({ url: context.url, description: archive.sourceTitle, tags: [], notes: '', preferredBackend: context.backend, time: now, updated_at: now })
  - saved = AWAIT saveBookmark(minimal)
  - IF saved fails: RETURN BookmarkSaveFailed
  - RETURN { success: true, bookmark: saved.bookmark OR minimal, bookmarkCreated: true }

## COMPENSATE_ARCHIVE_ASSOCIATION_FAILURE
- [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: restore the prior archive or remove only the new archive after bookmark association failure and expose uncertainty.
- Contract:
  - INPUT: context, previousArchive (nullable), archiveStore
  - PRE: current archive write succeeded and bookmark creation failed
  - OUTPUT: { archiveRetained, priorArchiveRestored, cleanupFailed, compensationError? }
  - POST:
    - previousArchive exists => restore is attempted
    - no previousArchive => only the new archive is removed
    - cleanup failure => cleanupFailed is true and the error remains visible
  - FAILURE_MODES: CompensationFailed
  - DATA_TRANSITION: current archive becomes previous archive or is deleted
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: COMPENSATE_ARCHIVE_ASSOCIATION_FAILURE
  - IF previousArchive exists: result = AWAIT archiveStore.restore(context.url, context.backend, previousArchive)
  - ELSE: result = AWAIT archiveStore.removeCurrent(context.url, context.backend)
  - IF result fails: RETURN archiveRetained = true, priorArchiveRestored = false, cleanupFailed = true, compensationError
  - IF previousArchive exists: RETURN archiveRetained = true, priorArchiveRestored = true, cleanupFailed = false
  - RETURN archiveRetained = false, priorArchiveRestored = false, cleanupFailed = false

## ARCHIVE_ASSOCIATION_RESULT_BOUNDARY
- [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: expose one stable response shape to message and popup/This Page callers.
- Contract:
  - INPUT: context result, archive result, bookmark result, compensation result
  - PRE: failed paths carry a stable code; bookmarkCreated defaults false
  - OUTPUT: success or failure response with association and compensation diagnostics
  - POST:
    - success => archive persistence and required bookmark association succeeded
    - failure => bookmarkCreated is false and CompensationFailed remains visible
  - FAILURE_MODES: delegated failure modes, CompensationFailed
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: ARCHIVE_ASSOCIATION_RESULT_BOUNDARY
  - IF context, capture, or archive write failed: RETURN failure with bookmarkCreated false and retention diagnostics
  - IF existingBookmark is non-null: RETURN success with bookmarkCreated false, archiveRetained true, cleanupFailed false
  - IF minimal bookmark save succeeds: RETURN success with bookmarkCreated true, archiveRetained true, cleanupFailed false
  - IF minimal bookmark save fails: RETURN failure merged with COMPENSATE_ARCHIVE_ASSOCIATION_FAILURE
