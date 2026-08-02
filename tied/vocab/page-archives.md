# Page archives (canonical)

**Scope:** Durable Local/File **archive artifacts**, selected-backend **archive-bookmark association**, sanitized readable content, **Offline Reader**, extracted-text search, and product **screenshot artifacts**. Vocabulary only — capture, storage, routing, and UI algorithms live in the linked IMPL pseudo-code.

**Traceability:** [REQ-PAGE_ARCHIVE_STORAGE](../requirements/REQ-PAGE_ARCHIVE_STORAGE.yaml) · [REQ-ARCHIVED_CONTENT_SEARCH](../requirements/REQ-ARCHIVED_CONTENT_SEARCH.yaml) · [REQ-OFFLINE_READER_MODE](../requirements/REQ-OFFLINE_READER_MODE.yaml) · [REQ-PAGE_SCREENSHOT_ARCHIVE](../requirements/REQ-PAGE_SCREENSHOT_ARCHIVE.yaml) · [ARCH-PAGE_ARCHIVE_STORAGE](../architecture-decisions/ARCH-PAGE_ARCHIVE_STORAGE.yaml) · [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION](../architecture-decisions/ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION.yaml) · [ARCH-ARCHIVED_CONTENT_SEARCH](../architecture-decisions/ARCH-ARCHIVED_CONTENT_SEARCH.yaml) · [ARCH-OFFLINE_READER_MODE](../architecture-decisions/ARCH-OFFLINE_READER_MODE.yaml) · [ARCH-PAGE_SCREENSHOT_ARCHIVE](../architecture-decisions/ARCH-PAGE_SCREENSHOT_ARCHIVE.yaml) · [IMPL-PAGE_ARCHIVE_STORAGE](../implementation-decisions/IMPL-PAGE_ARCHIVE_STORAGE.yaml) · [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION](../implementation-decisions/IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION.yaml) · [IMPL-ARCHIVED_CONTENT_SEARCH](../implementation-decisions/IMPL-ARCHIVED_CONTENT_SEARCH.yaml) · [IMPL-OFFLINE_READER_MODE](../implementation-decisions/IMPL-OFFLINE_READER_MODE.yaml) · [IMPL-PAGE_SCREENSHOT_ARCHIVE](../implementation-decisions/IMPL-PAGE_SCREENSHOT_ARCHIVE.yaml)

**See also:** [`storage-backends.md`](storage-backends.md) · [`bookmarks.md`](bookmarks.md) · [`bookmarks-index.md`](bookmarks-index.md) · [`ipc-messaging.md`](ipc-messaging.md) · [`config-and-privacy.md`](config-and-privacy.md) · [`ui-surfaces.md`](ui-surfaces.md)

---

## Preferred terms vs synonyms

| Preferred | Avoid / demote | Notes |
|-----------|----------------|-------|
| **archive artifact** | saved page copy, cached page | Durable sanitized HTML/text or product screenshot kept outside bookmark metadata |
| **archive-capable backend** | archive storage method | Only `local` and `file` support durable page artifacts in the current product scope |
| **archive-bookmark association** | archive link, archive-to-bookmark link | Boundary connecting an archive artifact to a bookmark in the explicitly selected backend |
| **archive content** | full-text mode | Extracted text from a stored archive; metadata search remains separate |
| **archive privacy boundary** | archive cache | Explicit capture honors inhibit URLs and Local/File backend restrictions before page capture |
| **archive snippet** | content preview | Bounded extracted-text context returned by archive-content search |
| **archived-content scope** | content search, full-text search | Explicit Local Bookmarks Index search scope for extracted archive text |
| **bookmark creation result** | bookmark saved status | `bookmarkCreated` distinguishes archive recapture from creation of a missing bookmark |
| **compensation outcome** | cleanup result | Explicit archive restoration/removal state after association failure |
| **stale archive status** | stale archive error | Reader-visible freshness warning; stale content remains readable |
| **Offline Reader** | archive reader, offline page link | Standalone extension page rendering stored sanitized archive content without live-page fetch |
| **Reader target** | archive link, offline page link | Extension URL that opens the stored archive in Offline Reader |
| **Reader re-sanitization** | render trusted archive HTML | Defense-in-depth sanitization at the Reader render boundary |
| **archive artifact status** | archive saved indicator | Selected-backend presence state for the readable archive and screenshot artifact legs |
| **saved-state indicator** | saved button color | Non-command visual and accessible state for an archive capture action |
| **Reader availability** | enabled Reader | Boolean derived strictly from readable archive presence; screenshot-only state does not enable Reader |
| **screenshot artifact** | demo screenshot, page image | Durable product image with its own hash/version and Local/File lifecycle |
| **screenshot presentation E2E** | screenshot capture E2E | E2E validation of seeded persisted screenshot rendering; capture binding is composition-tested |
| **source presentation profile** | page theme, source CSS, color profile | Bounded computed background, text, link, and color-scheme metadata captured separately from sanitized archive HTML |
| **Reader theme fallback** | default colors | Hoverboard-owned Reader colors used when source presentation is absent, unsafe, transparent, or below WCAG AA contrast |
| **selected-backend lookup** | aggregate URL lookup | Bookmark existence query constrained to `preferredBackend`; it does not use aggregate 2C semantics |
| **status context key** | cached status identity | URL/backend pair used to discard stale cross-tab or cross-backend status responses |

---

## Naming bridge

| Canonical concept | UI label | Message / storage | Code / procedure | TIED |
|-------------------|----------|-------------------|-----------------|------|
| Page archive | Save page archive | `hoverboard_page_archives` / `hoverboard-page-archives.json` | `PageArchiveStore` / `SAVE_PAGE_ARCHIVE` | [IMPL-PAGE_ARCHIVE_STORAGE] |
| Archive-capable backend | Local or File | `local` \| `file` | `RESOLVE_ARCHIVE_ADAPTER` | [ARCH-PAGE_ARCHIVE_STORAGE] |
| Archive privacy boundary | — | inhibit URL list | `ARCHIVE_PRIVACY_GATE` | [IMPL-PAGE_ARCHIVE_STORAGE] |
| Archive-bookmark association | Bookmark and archive saved | `CAPTURE_PAGE_ARCHIVE` | `CAPTURE_ARCHIVE_AND_ASSOCIATE_BOOKMARK` | [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] |
| Selected-backend lookup | — | `preferredBackend` | `getBookmarkForBackend` | [IMPL-BOOKMARK_ROUTER] |
| Compensation outcome | Archive cleanup status | `archiveRetained`, `priorArchiveRestored`, `cleanupFailed` | `COMPENSATE_ARCHIVE_ASSOCIATION_FAILURE` | [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] |
| Archived-content scope | Archived content | `SEARCH_ARCHIVED_CONTENT` | `APPLY_ARCHIVE_CONTENT_SCOPE` / `QUERY_ARCHIVED_CONTENT` | [IMPL-ARCHIVED_CONTENT_SEARCH] |
| Archive snippet | — | result `snippet` | `snippetAround` | [IMPL-ARCHIVED_CONTENT_SEARCH] |
| Offline Reader | Open offline Reader | `reader.html?url=…` or `archiveId` | `OPEN_OFFLINE_READER` / `LOAD_READER_ARCHIVE` | [IMPL-OFFLINE_READER_MODE] |
| Source presentation profile | — | `sourcePresentationProfile` | `EXTRACT_SOURCE_PRESENTATION` / `NORMALIZE_SOURCE_PRESENTATION` / `VALIDATE_SOURCE_PRESENTATION` / `APPLY_SOURCE_PRESENTATION` | [IMPL-PAGE_ARCHIVE_STORAGE] [IMPL-OFFLINE_READER_MODE] |
| Reader target | Open stored archive | Reader extension URL | `readerTarget` | [REQ-ARCHIVED_CONTENT_SEARCH] |
| Stale archive status | Archive status warning | `status: 'stale'` | `renderReaderArchive` | [IMPL-OFFLINE_READER_MODE] |
| Reader re-sanitization | — | — | `sanitizeArchiveHtml` at render | [IMPL-OFFLINE_READER_MODE] |
| Archive artifact status | Saved state | `GET_PAGE_ARCHIVE` / `GET_PAGE_SCREENSHOTS` with `backend` | `NORMALIZE_ARCHIVE_ARTIFACT_STATUS` / `APPLY_ARCHIVE_STATUS_UI` | [IMPL-PAGE_ARCHIVE_STATUS_UI] |
| Saved-state indicator | Active capture action | `archiveSaved` / `screenshotSaved` | `APPLY_ARCHIVE_STATUS_UI` | [IMPL-PAGE_ARCHIVE_STATUS_UI] |
| Reader availability | Open offline Reader | `readerAvailable = archiveSaved` | `APPLY_ARCHIVE_STATUS_UI` | [IMPL-PAGE_ARCHIVE_STATUS_UI] |
| Screenshot artifact | Save page screenshot | archive `screenshots` collection | `PageScreenshotStore` / `SAVE_PAGE_SCREENSHOT` | [IMPL-PAGE_SCREENSHOT_ARCHIVE] |
| Screenshot presentation E2E | — | seeded screenshot artifact | `extension-archive-features.spec.js` | [REQ-PAGE_SCREENSHOT_ARCHIVE] |
| Screenshot capture boundary | — | `CAPTURE_PAGE_SCREENSHOT` | `captureProductScreenshot` | [ARCH-PAGE_SCREENSHOT_ARCHIVE] |

---

## Named concepts

- **archive artifact** — Stored readable HTML/text or a product screenshot associated with a Local/File bookmark.
- **archive-capable backend** — The `local` or `file` storage backend; Pinboard, Sync, and Browser remain metadata-only.
- **archive-bookmark association** — Capture orchestration that writes the archive before preserving or creating selected-backend bookmark ownership.
- **archive privacy boundary** — HTTP(S), inhibit-list, backend, sanitizer, and size gates applied before content capture or screenshot capture.
- **archived-content scope** — Local Bookmarks Index mode that queries extracted archive text without changing metadata matching.
- **archive snippet** — Bounded text around the first case-insensitive query match.
- **bookmark creation result** — `bookmarkCreated` boolean returned by `CAPTURE_PAGE_ARCHIVE`.
- **compensation outcome** — Whether a prior archive was restored, a new archive was removed, or cleanup failed after bookmark association failure.
- **stale archive status** — A persisted archive is older than the requested freshness threshold; Reader shows a warning while retaining offline content.
- **Offline Reader** — Standalone extension surface that renders only stored sanitized content and exposes an explicit live URL action.
- **Reader target** — URL returned with archive search results to open Offline Reader.
- **Reader re-sanitization** — Defense-in-depth sanitization applied again immediately before inserting stored HTML into the Reader DOM.
- **archive artifact status** — Selected-backend presence state for the readable archive and screenshot artifact legs on the current tab URL.
- **saved-state indicator** — Non-command visual and accessibility state applied independently to the Save page archive and Save page screenshot actions.
- **Reader availability** — Whether Open offline Reader is enabled; this is derived only from `archiveSaved`.
- **screenshot artifact** — Separate binary image record with artifact ID, content hash, version, capture time, and storage backend.
- **screenshot presentation E2E** — Browser-level validation of Reader presentation for a persisted screenshot fixture; popup capture is validated at unit/composition boundaries.
- **capture source boundary** — The live service-worker scripting path supplies body HTML/text to the shared sanitization pipeline; the Readability document path remains a library/test boundary.
- **source presentation profile** — Optional archive metadata containing only allowlisted opaque computed colors and light/dark intent; it never contains source CSS and is excluded from archive identity hashes.
- **Reader theme fallback** — Extension-owned presentation used for legacy archives and any profile that fails validation or WCAG AA contrast.
- **selected-backend lookup** — Lookup through only the provider named by `preferredBackend`; any non-null stub counts as an existing bookmark.
- **status context key** — Current URL/backend pair used to reject stale asynchronous status results.

---

## Pseudo-code block names

| Preferred term / concept | Procedure / block | Owning IMPL |
|--------------------------|-------------------|-------------|
| Resolve archive adapter | `RESOLVE_ARCHIVE_ADAPTER` | [IMPL-PAGE_ARCHIVE_STORAGE] |
| Archive privacy gate | `ARCHIVE_PRIVACY_GATE` | [IMPL-PAGE_ARCHIVE_STORAGE] |
| Capture and validate archive | `CAPTURE_AND_VALIDATE` | [IMPL-PAGE_ARCHIVE_STORAGE] |
| Extract source presentation | `EXTRACT_SOURCE_PRESENTATION` | [IMPL-PAGE_ARCHIVE_STORAGE] |
| Normalize source presentation | `NORMALIZE_SOURCE_PRESENTATION` | [IMPL-PAGE_ARCHIVE_STORAGE] |
| Save page archive | `SAVE_PAGE_ARCHIVE` | [IMPL-PAGE_ARCHIVE_STORAGE] |
| Delete page archive | `DELETE_PAGE_ARCHIVE` | [IMPL-PAGE_ARCHIVE_STORAGE] |
| Resolve archive-bookmark context | `RESOLVE_ARCHIVE_BOOKMARK_CONTEXT` | [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] |
| Capture and associate bookmark | `CAPTURE_ARCHIVE_AND_ASSOCIATE_BOOKMARK` | [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] |
| Create minimal bookmark | `CREATE_MINIMAL_BOOKMARK_IF_ABSENT` | [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] |
| Compensate association failure | `COMPENSATE_ARCHIVE_ASSOCIATION_FAILURE` | [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] |
| Archive result boundary | `ARCHIVE_ASSOCIATION_RESULT_BOUNDARY` | [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] |
| Replace archive search entry | `REPLACE_ARCHIVED_CONTENT` | [IMPL-ARCHIVED_CONTENT_SEARCH] |
| Query archive content | `QUERY_ARCHIVED_CONTENT` | [IMPL-ARCHIVED_CONTENT_SEARCH] |
| Apply archive scope | `APPLY_ARCHIVE_CONTENT_SCOPE` | [IMPL-ARCHIVED_CONTENT_SEARCH] |
| Parse Reader query | `PARSE_READER_QUERY` | [IMPL-OFFLINE_READER_MODE] |
| Load Reader archive | `LOAD_READER_ARCHIVE` | [IMPL-OFFLINE_READER_MODE] |
| Validate source presentation | `VALIDATE_SOURCE_PRESENTATION` | [IMPL-OFFLINE_READER_MODE] |
| Apply source presentation | `APPLY_SOURCE_PRESENTATION` | [IMPL-OFFLINE_READER_MODE] |
| Render Reader state | `RENDER_READER_STATE` | [IMPL-OFFLINE_READER_MODE] |
| Normalize archive artifact status | `NORMALIZE_ARCHIVE_ARTIFACT_STATUS` | [IMPL-PAGE_ARCHIVE_STATUS_UI] |
| Query selected-backend artifact status | `QUERY_SELECTED_BACKEND_ARTIFACT_STATUS` | [IMPL-PAGE_ARCHIVE_STATUS_UI] |
| Apply archive status UI | `APPLY_ARCHIVE_STATUS_UI` | [IMPL-PAGE_ARCHIVE_STATUS_UI] |
| Refresh archive status after capture | `REFRESH_ARCHIVE_STATUS_AFTER_CAPTURE` | [IMPL-PAGE_ARCHIVE_STATUS_UI] |
| Reset archive status on context change | `RESET_ARCHIVE_STATUS_ON_CONTEXT_CHANGE` | [IMPL-PAGE_ARCHIVE_STATUS_UI] |
| Validate screenshot request | `VALIDATE_SCREENSHOT_REQUEST` | [IMPL-PAGE_SCREENSHOT_ARCHIVE] |
| Capture page screenshot | `CAPTURE_PAGE_SCREENSHOT` | [IMPL-PAGE_SCREENSHOT_ARCHIVE] |
| Save page screenshot | `SAVE_PAGE_SCREENSHOT` | [IMPL-PAGE_SCREENSHOT_ARCHIVE] |

---

## Alphabetical index

| Term | Section |
|------|---------|
| archive artifact | Preferred terms / Named concepts |
| archive content | Preferred terms |
| archive snippet | Preferred terms / Named concepts |
| archive privacy boundary | Preferred terms / Named concepts |
| archive-capable backend | Preferred terms / Named concepts |
| archive-bookmark association | Preferred terms / Named concepts |
| archive artifact status | Preferred terms / Named concepts / Naming bridge |
| archived-content scope | Preferred terms / Named concepts |
| ARCHIVE_ASSOCIATION_RESULT_BOUNDARY | Pseudo-code block names |
| ARCHIVE_PRIVACY_GATE | Pseudo-code block names |
| bookmark creation result | Preferred terms / Named concepts |
| CAPTURE_AND_VALIDATE | Pseudo-code block names |
| CAPTURE_ARCHIVE_AND_ASSOCIATE_BOOKMARK | Pseudo-code block names |
| CAPTURE_PAGE_SCREENSHOT | Pseudo-code block names |
| capture source boundary | Named concepts |
| compensation outcome | Preferred terms / Named concepts |
| COMPENSATE_ARCHIVE_ASSOCIATION_FAILURE | Pseudo-code block names |
| CREATE_MINIMAL_BOOKMARK_IF_ABSENT | Pseudo-code block names |
| DELETE_PAGE_ARCHIVE | Pseudo-code block names |
| EXTRACT_SOURCE_PRESENTATION | Pseudo-code block names |
| LOAD_READER_ARCHIVE | Pseudo-code block names |
| NORMALIZE_SOURCE_PRESENTATION | Pseudo-code block names |
| Offline Reader | Preferred terms / Named concepts |
| PARSE_READER_QUERY | Pseudo-code block names |
| QUERY_ARCHIVED_CONTENT | Pseudo-code block names |
| Reader target | Preferred terms / Naming bridge / Named concepts |
| REPLACE_ARCHIVED_CONTENT | Pseudo-code block names |
| RENDER_READER_STATE | Pseudo-code block names |
| Reader re-sanitization | Preferred terms / Named concepts |
| Reader theme fallback | Preferred terms / Named concepts |
| RESET_ARCHIVE_STATUS_ON_CONTEXT_CHANGE | Pseudo-code block names |
| RESOLVE_ARCHIVE_ADAPTER | Pseudo-code block names |
| RESOLVE_ARCHIVE_BOOKMARK_CONTEXT | Pseudo-code block names |
| QUERY_SELECTED_BACKEND_ARTIFACT_STATUS | Pseudo-code block names |
| SAVE_PAGE_ARCHIVE | Pseudo-code block names |
| SAVE_PAGE_SCREENSHOT | Pseudo-code block names |
| saved-state indicator | Preferred terms / Named concepts / Naming bridge |
| selected-backend lookup | Preferred terms / Named concepts |
| screenshot artifact | Preferred terms / Named concepts |
| screenshot presentation E2E | Preferred terms / Named concepts |
| source presentation profile | Preferred terms / Named concepts |
| stale archive status | Preferred terms / Named concepts |
| NORMALIZE_ARCHIVE_ARTIFACT_STATUS | Pseudo-code block names |
| Reader availability | Preferred terms / Naming bridge / Named concepts |
| status context key | Preferred terms / Named concepts |
| VALIDATE_SCREENSHOT_REQUEST | Pseudo-code block names |
| VALIDATE_SOURCE_PRESENTATION | Pseudo-code block names |
