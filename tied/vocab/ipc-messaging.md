# IPC and messaging (canonical)

**Scope:** Extension **message types** (`MESSAGE_TYPES`), content-script message names, popup/overlay **action → message** bridges, and roles of **service worker (SW)**, content script, popup/side panel, and offscreen/native file I/O messages. **Vocabulary only** — dispatch and validation algorithms stay in IMPL.

**Excludes:** Domain meaning of bookmarks/tags/backends (see sibling glossaries); UI chrome labels (see [`ui-surfaces.md`](ui-surfaces.md), [`side-panel.md`](side-panel.md)).

**Traceability:** [ARCH-MESSAGE_HANDLING](../architecture-decisions/ARCH-MESSAGE_HANDLING.yaml) · [ARCH-SERVICE_WORKER](../architecture-decisions/ARCH-SERVICE_WORKER.yaml) · [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION](../architecture-decisions/ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION.yaml) · [IMPL-MESSAGE_HANDLING](../implementation-decisions/IMPL-MESSAGE_HANDLING.yaml) · [IMPL-SERVICE_WORKER](../implementation-decisions/IMPL-SERVICE_WORKER.yaml) · [IMPL-RUNTIME_VALIDATION](../implementation-decisions/IMPL-RUNTIME_VALIDATION.yaml) · [IMPL-UI_ACTION_CONTRACT](../implementation-decisions/IMPL-UI_ACTION_CONTRACT.yaml) · [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION](../implementation-decisions/IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION.yaml) · [REQ-BOOKMARK_STATE_SYNCHRONIZATION](../requirements/REQ-BOOKMARK_STATE_SYNCHRONIZATION.yaml) · [REQ-SMART_BOOKMARKING](../requirements/REQ-SMART_BOOKMARKING.yaml) · [REQ-PAGE_ARCHIVE_STORAGE](../requirements/REQ-PAGE_ARCHIVE_STORAGE.yaml)

**See also:** [`storage-backends.md`](storage-backends.md) · [`tags.md`](tags.md) · [`ui-surfaces.md`](ui-surfaces.md) · [`side-panel.md`](side-panel.md) · [`domain-references.md`](domain-references.md) · `src/core/message-handler.js` · `src/shared/ui-action-contract.js`

---

## Preferred terms vs synonyms

| Preferred | Avoid / demote | Notes |
|-----------|----------------|-------|
| **MESSAGE_TYPES** | message enum (alone) | Canonical constant object in `message-handler.js` |
| **message type** | opcode, channel | String value of a `MESSAGE_TYPES` entry (e.g. `getCurrentBookmark`) |
| **service worker (SW)** | background page | MV3 background; owns most handlers |
| **content script** | page script | Handles overlay-facing `CONTENT_MESSAGE_TYPES` |
| **processMessage** | dispatch entry | MessageHandler entry with validation |
| **POPUP_ACTION_TO_MESSAGE** | action map | Maps `POPUP_ACTION_IDS` → primary message type |
| **envelope** | message payload wrapper | Validated at processMessage entry |

---

## Naming bridge: action → message

| UI / action concept | Action ID | Primary `MESSAGE_TYPES` value |
|---------------------|-----------|--------------------------------|
| Show Hover | `showHoverboard` | `toggleHover` (`TOGGLE_HOVER`) |
| Toggle Privacy | `togglePrivate` | `saveBookmark` |
| Read Later | `readLater` | `saveBookmark` |
| Delete pin | `deletePin` | `deleteBookmark` |
| Add / remove tag | `addTag` / `removeTag` | `saveTag` / `deleteTag` |
| Search tabs | `search` | `searchTabs` |
| Storage backend change | `storageBackendChange` | `moveBookmarkToStorage` |
| Show on page load | `showHoverOnPageLoadChange` | `updateOverlayConfig` |
| Open By Tag | `openTagsTree` | `OPEN_SIDE_PANEL` |
| Open Local Bookmarks Index | `openBookmarksIndex` | `OPEN_BOOKMARKS_INDEX` (optional data `q` for library search) |
| Search Bookmarks | library search control | `OPEN_BOOKMARKS_INDEX` + `{ q }` |
| Check / get link health | Index Check link health | `CHECK_LINK_HEALTH` / `GET_LINK_HEALTH` |
| Refresh API snapshot | Refresh API snapshot | `REFRESH_API_SNAPSHOT` |

---

## Catalog: `MESSAGE_TYPES` (SW / shared)

Exact constant keys and string values from `src/core/message-handler.js`:

### Retrieval

| Constant | Value |
|----------|-------|
| `GET_CURRENT_BOOKMARK` | `getCurrentBookmark` |
| `GET_TAGS_FOR_URL` | `getTagsForUrl` |
| `GET_RECENT_BOOKMARKS` | `getRecentBookmarks` |
| `GET_LOCAL_BOOKMARKS_FOR_INDEX` | `getLocalBookmarksForIndex` |
| `GET_AGGREGATED_BOOKMARKS_FOR_INDEX` | `getAggregatedBookmarksForIndex` |
| `GET_OPTIONS` | `getOptions` |
| `GET_TAB_ID` | `getTabId` |

### Bookmark / storage mutations

| Constant | Value |
|----------|-------|
| `SAVE_BOOKMARK` | `saveBookmark` |
| `DELETE_BOOKMARK` | `deleteBookmark` |
| `SAVE_TAG` | `saveTag` |
| `DELETE_TAG` | `deleteTag` |
| `SWITCH_STORAGE_MODE` | `switchStorageMode` |
| `GET_STORAGE_BACKEND_FOR_URL` | `getStorageBackendForUrl` |
| `MOVE_BOOKMARK_TO_STORAGE` | `moveBookmarkToStorage` |

### Overlay / sync / site

| Constant | Value |
|----------|-------|
| `TOGGLE_HOVER` | `toggleHover` |
| `HIDE_OVERLAY` | `hideOverlay` |
| `REFRESH_DATA` | `refreshData` |
| `REFRESH_HOVER` | `refreshHover` |
| `BOOKMARK_UPDATED` | `bookmarkUpdated` |
| `TAG_UPDATED` | `TAG_UPDATED` |
| `INHIBIT_URL` | `inhibitUrl` |
| `UPDATE_OVERLAY_CONFIG` | `updateOverlayConfig` |
| `GET_OVERLAY_CONFIG` | `getOverlayConfig` |

### Search

| Constant | Value |
|----------|-------|
| `SEARCH_TITLE` | `searchTitle` |
| `SEARCH_TITLE_TEXT` | `searchTitleText` |
| `SEARCH_TABS` | `searchTabs` |
| `SEARCH_LIBRARY_RESOURCES` | `searchLibraryResources` |
| `GET_SEARCH_HISTORY` | `getSearchHistory` |
| `CLEAR_SEARCH_STATE` | `clearSearchState` |

### Library portability

| Constant | Value |
|----------|-------|
| `EXPORT_LIBRARY_PACKAGE` | `exportLibraryPackage` |
| `IMPORT_LIBRARY_PACKAGE` | `importLibraryPackage` |

### Tags / AI / session

| Constant | Value |
|----------|-------|
| `ADD_TAG_TO_RECENT` | `addTagToRecent` |
| `GET_USER_RECENT_TAGS` | `getUserRecentTags` |
| `GET_SHARED_MEMORY_STATUS` | `getSharedMemoryStatus` |
| `GET_PAGE_CONTENT` | `GET_PAGE_CONTENT` |
| `GET_AI_TAGS` | `GET_AI_TAGS` |
| `CAPTURE_PAGE_ARCHIVE` | `CAPTURE_PAGE_ARCHIVE` |
| `GET_PAGE_ARCHIVE` | `GET_PAGE_ARCHIVE` |
| `DELETE_PAGE_ARCHIVE` | `DELETE_PAGE_ARCHIVE` |
| `SEARCH_ARCHIVED_CONTENT` | `SEARCH_ARCHIVED_CONTENT` |
| `CAPTURE_PAGE_SCREENSHOT` | `CAPTURE_PAGE_SCREENSHOT` |
| `GET_PAGE_SCREENSHOTS` | `GET_PAGE_SCREENSHOTS` |
| `DELETE_PAGE_SCREENSHOTS` | `DELETE_PAGE_SCREENSHOTS` |
| `GET_SESSION_TAGS` | `getSessionTags` |
| `RECORD_SESSION_TAGS` | `recordSessionTags` |

### Side panel / tabs / usage

| Constant | Value |
|----------|-------|
| `OPEN_SIDE_PANEL` | `OPEN_SIDE_PANEL` |
| `OPEN_BOOKMARKS_INDEX` | `OPEN_BOOKMARKS_INDEX` |
| `REFRESH_API_SNAPSHOT` | `REFRESH_API_SNAPSHOT` |
| `CHECK_LINK_HEALTH` | `CHECK_LINK_HEALTH` |
| `GET_LINK_HEALTH` | `GET_LINK_HEALTH` |
| `REQUEST_SIDE_PANEL_CLOSE` | `REQUEST_SIDE_PANEL_CLOSE` |
| `GET_RECENTLY_CLOSED_TABS` | `getRecentlyClosedTabs` |
| `GET_TAB_REFERRERS` | `getTabReferrers` |
| `GET_TABS_PAGE_TEXT` | `getTabsPageText` |
| `GET_TABS_IMPORTANT_TAGS` | `getTabsImportantTags` |
| `GET_BOOKMARK_USAGE` | `getBookmarkUsage` |
| `GET_BOOKMARK_USAGE_STATS` | `getBookmarkUsageStats` |
| `GET_BOOKMARK_NAVIGATION_GRAPH` | `getBookmarkNavigationGraph` |
| `GET_BOOKMARK_INBOUND_LINKS` | `getBookmarkInboundLinks` |

### Lifecycle / debug

| Constant | Value |
|----------|-------|
| `CONTENT_SCRIPT_READY` | `contentScriptReady` |
| `DEV_COMMAND` | `devCommand` |
| `ECHO` | `echo` |

### File / native (related; not all in `MESSAGE_TYPES` object)

| Type string | Role |
|-------------|------|
| `READ_FILE_BOOKMARKS` | Offscreen / adapter read of File storage |
| `WRITE_FILE_BOOKMARKS` | Offscreen / adapter write |
| `NATIVE_PING` | Options native-host health check |

---

## Content script types (`CONTENT_MESSAGE_TYPES`)

Handled in content-main (names as strings): `TOGGLE_HOVER`, `HIDE_OVERLAY`, `REFRESH_DATA`, `REFRESH_HOVER`, `CLOSE_IF_TO_READ`, `PING`, `SHOW_BOOKMARK_DIALOG`, `TOGGLE_HOVER_OVERLAY`, `UPDATE_CONFIG`, `updateOverlayTransparency`, `CHECK_PAGE_STATE`, `BOOKMARK_UPDATED`, `TAG_UPDATED`, `GET_OVERLAY_STATE`, `GET_PAGE_SELECTION`.

---

## Named concepts

- **MessageHandler** — SW-side router; `processMessage` + handler map.
- **sendToTab vs sendMessage** — Overlay/toggle often targets the active tab; CRUD goes to SW.
- **runtime validation** — Zod (or equivalent) at processMessage for critical types.
- **broadcast sync** — `BOOKMARK_UPDATED` / `TAG_UPDATED` keep popup, overlay, and side panel aligned.
- **observer listener** — A `runtime.onMessage` listener that only watches broadcasts (e.g. `BOOKMARK_UPDATED` in popup and side panel) and never answers a message. Must be declared **synchronous** and return `undefined`: from Chrome 144 a listener that returns a promise is treated as answering, and an `async` listener with no return resolves `undefined`, which Chrome delivers to the sender as `null`.
- **response-channel race** — Every extension context receives each `runtime.sendMessage`; the first context to answer wins. An observer listener that answers by accident beats the SW reply, so senders see `null` instead of the handler result.
- **missing response** — A `null` or `undefined` reply where a handler result was expected. Callers unwrap with `unwrapMessageResponse` and record a `messageResponseMissing` inspector action rather than dereferencing `response.success`.
- **OPEN_BOOKMARKS_INDEX `q`** — Optional query on open-index message; SW builds Index tab URL with `?q=` via `buildBookmarksIndexUrlWithQuery` ([REQ-LIBRARY_SEARCH_ENTRY]).
- **link health messages** — `CHECK_LINK_HEALTH` (batch HEAD→GET + persist) and `GET_LINK_HEALTH` (read `hoverboard_link_health`).
- **REFRESH_API_SNAPSHOT** — Extension writes `aggregate-snapshot.json` for Local Query API multi-backend GET.
- **archive messages** — `CAPTURE_PAGE_ARCHIVE`, `GET_PAGE_ARCHIVE`, and `DELETE_PAGE_ARCHIVE` carry readable archive lifecycle requests; `SEARCH_ARCHIVED_CONTENT` is an explicit Index scope.
- **archive association result** — `CAPTURE_PAGE_ARCHIVE` response data carrying `bookmarkCreated` and explicit archive compensation diagnostics for popup/This Page consumers.
- **screenshot messages** — `CAPTURE_PAGE_SCREENSHOT`, `GET_PAGE_SCREENSHOTS`, and `DELETE_PAGE_SCREENSHOTS` carry separate product screenshot artifacts and do not reuse demo capture messages.
- **cross-resource retrieval message** — `SEARCH_LIBRARY_RESOURCES` carries a read-only normalized query over explicit resource scopes; it returns source states and source-specific actions without source writes.
- **library portability messages** — `EXPORT_LIBRARY_PACKAGE` returns a versioned package; `IMPORT_LIBRARY_PACKAGE` performs a no-write plan or verified restore according to `data.mode`.

---

## Pseudo-code block names

| Preferred term / concept | Procedure / block (existing) | Owning IMPL |
|--------------------------|------------------------------|-------------|
| Dispatch | `processMessage` | [IMPL-MESSAGE_HANDLING](../implementation-decisions/IMPL-MESSAGE_HANDLING.yaml) |
| Recent bookmarks handler | `handleGetRecentBookmarks` | [IMPL-MESSAGE_HANDLING](../implementation-decisions/IMPL-MESSAGE_HANDLING.yaml) |
| Action contract map | `POPUP_ACTION_TO_MESSAGE` | [IMPL-UI_ACTION_CONTRACT](../implementation-decisions/IMPL-UI_ACTION_CONTRACT.yaml) |
| Envelope validate | `validateMessageEnvelope` / `validateMessageData` | [IMPL-RUNTIME_VALIDATION](../implementation-decisions/IMPL-RUNTIME_VALIDATION.yaml) |
| Missing response unwrap | `unwrapMessageResponse` / `isMissingMessageResponse` / `readMessageResponse` | [IMPL-MESSAGE_HANDLING](../implementation-decisions/IMPL-MESSAGE_HANDLING.yaml) |
| Open Index with optional `q` | `OPEN_BOOKMARKS_INDEX` / `OPEN_BOOKMARKS_INDEX_TAB` | [IMPL-LIBRARY_SEARCH_ENTRY](../implementation-decisions/IMPL-LIBRARY_SEARCH_ENTRY.yaml) / [IMPL-LOCAL_BOOKMARKS_INDEX](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX.yaml) |
| Check / get link health | `CHECK_LINK_HEALTH` / `GET_LINK_HEALTH` | [IMPL-LINK_HEALTH](../implementation-decisions/IMPL-LINK_HEALTH.yaml) |
| Refresh API snapshot | `REFRESH_API_SNAPSHOT` | [IMPL-LOCAL_QUERY_API](../implementation-decisions/IMPL-LOCAL_QUERY_API.yaml) |
| Archive lifecycle dispatch | `CAPTURE_PAGE_ARCHIVE` / `GET_PAGE_ARCHIVE` / `DELETE_PAGE_ARCHIVE` | [IMPL-PAGE_ARCHIVE_STORAGE](../implementation-decisions/IMPL-PAGE_ARCHIVE_STORAGE.yaml) |
| Archive association result boundary | `ARCHIVE_ASSOCIATION_RESULT_BOUNDARY` | [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] |
| Archive content query | `SEARCH_ARCHIVED_CONTENT` | [IMPL-ARCHIVED_CONTENT_SEARCH](../implementation-decisions/IMPL-ARCHIVED_CONTENT_SEARCH.yaml) |
| Screenshot artifact dispatch | `CAPTURE_PAGE_SCREENSHOT` / `GET_PAGE_SCREENSHOTS` / `DELETE_PAGE_SCREENSHOTS` | [IMPL-PAGE_SCREENSHOT_ARCHIVE](../implementation-decisions/IMPL-PAGE_SCREENSHOT_ARCHIVE.yaml) |
| Cross-resource retrieval dispatch | `SEARCH_LIBRARY_RESOURCES` | [IMPL-CROSS_RESOURCE_RETRIEVAL] |
| Library portability dispatch | `EXPORT_LIBRARY_PACKAGE` / `IMPORT_LIBRARY_PACKAGE` | [IMPL-LIBRARY_PORTABILITY] |

---

## Alphabetical index

| Term | Section |
|------|---------|
| archive association result | Named concepts |
| BOOKMARK_UPDATED | Catalog |
| CAPTURE_PAGE_ARCHIVE | Catalog / Named concepts |
| CAPTURE_PAGE_SCREENSHOT | Catalog / Named concepts |
| cross-resource retrieval message | Named concepts |
| DELETE_PAGE_ARCHIVE | Catalog |
| DELETE_PAGE_SCREENSHOTS | Catalog |
| CHECK_LINK_HEALTH | Catalog / Named concepts |
| CONTENT_MESSAGE_TYPES | Content script types |
| envelope | Preferred terms |
| EXPORT_LIBRARY_PACKAGE | Catalog |
| GET_LINK_HEALTH | Catalog / Named concepts |
| GET_PAGE_ARCHIVE | Catalog |
| GET_PAGE_SCREENSHOTS | Catalog |
| IMPORT_LIBRARY_PACKAGE | Catalog |
| library portability messages | Named concepts |
| MESSAGE_TYPES | Preferred terms |
| MessageHandler | Named concepts |
| missing response | Named concepts |
| NATIVE_PING | File / native |
| observer listener | Named concepts |
| OPEN_BOOKMARKS_INDEX | Catalog / Named concepts |
| OPEN_SIDE_PANEL | Catalog |
| POPUP_ACTION_TO_MESSAGE | Preferred terms |
| processMessage | Pseudo-code block names |
| READ_FILE_BOOKMARKS | File / native |
| REFRESH_API_SNAPSHOT | Catalog / Named concepts |
| response-channel race | Named concepts |
| unwrapMessageResponse | Pseudo-code block names |
| service worker (SW) | Preferred terms |
| TAG_UPDATED | Catalog |
| SEARCH_ARCHIVED_CONTENT | Catalog / Named concepts |
| SEARCH_LIBRARY_RESOURCES | Catalog / Named concepts |
