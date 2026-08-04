# Local Bookmarks Index and interchange (canonical)

**Scope:** **Local Bookmarks Index** management page, export/import scopes and conflict policies, regex find-and-replace, **Browser Bookmark Import**, and **Netscape Bookmark File Format** interchange. **Vocabulary only** — filter/export algorithms stay in IMPL.

**Excludes:** Per-URL storage backend routing (see [`storage-backends.md`](storage-backends.md)); pin field semantics (see [`bookmarks.md`](bookmarks.md)); side-panel **Bookmarks** tab (browser `bookmarks.getTree` — see [`side-panel.md`](side-panel.md)).

**Traceability:** [REQ-LOCAL_BOOKMARKS_INDEX](../requirements/REQ-LOCAL_BOOKMARKS_INDEX.yaml) · [REQ-BROWSER_BOOKMARK_STORAGE](../requirements/REQ-BROWSER_BOOKMARK_STORAGE.yaml) · [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT](../requirements/REQ-LOCAL_BOOKMARKS_INDEX_EXPORT.yaml) · [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT](../requirements/REQ-LOCAL_BOOKMARKS_INDEX_IMPORT.yaml) · [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS](../requirements/REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS.yaml) · [REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE](../requirements/REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE.yaml) · [REQ-BROWSER_BOOKMARK_IMPORT](../requirements/REQ-BROWSER_BOOKMARK_IMPORT.yaml) · [REQ-LIBRARY_SEARCH_ENTRY](../requirements/REQ-LIBRARY_SEARCH_ENTRY.yaml) · [REQ-LINK_HEALTH](../requirements/REQ-LINK_HEALTH.yaml) · [REQ-LOCAL_QUERY_API](../requirements/REQ-LOCAL_QUERY_API.yaml) · [ARCH-LOCAL_BOOKMARKS_INDEX](../architecture-decisions/ARCH-LOCAL_BOOKMARKS_INDEX.yaml) · [ARCH-BROWSER_BOOKMARK_IMPORT](../architecture-decisions/ARCH-BROWSER_BOOKMARK_IMPORT.yaml) · [ARCH-LIBRARY_SEARCH_ENTRY](../architecture-decisions/ARCH-LIBRARY_SEARCH_ENTRY.yaml) · [ARCH-LINK_HEALTH](../architecture-decisions/ARCH-LINK_HEALTH.yaml) · [IMPL-LOCAL_BOOKMARKS_INDEX](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX.yaml) · [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT.yaml) · [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT.yaml) · [IMPL-BROWSER_BOOKMARK_IMPORT](../implementation-decisions/IMPL-BROWSER_BOOKMARK_IMPORT.yaml) · [IMPL-LIBRARY_SEARCH_ENTRY](../implementation-decisions/IMPL-LIBRARY_SEARCH_ENTRY.yaml) · [IMPL-LINK_HEALTH](../implementation-decisions/IMPL-LINK_HEALTH.yaml)

**See also:** [`bookmarks.md`](bookmarks.md) · [`storage-backends.md`](storage-backends.md) · [`side-panel.md`](side-panel.md) · [`domain-references.md`](domain-references.md) · [`../../docs/BOOKMARK_IMPORT_EXPORT.md`](../../docs/BOOKMARK_IMPORT_EXPORT.md) (which surface for HTML vs rich CSV) · [`../../docs/BOOKMARK_HTML_FORMAT.md`](../../docs/BOOKMARK_HTML_FORMAT.md)

---

## Preferred terms vs synonyms

| Preferred | Avoid / demote | Notes |
|-----------|----------------|-------|
| **Local Bookmarks Index** | bookmarks table, index page | Full-page table of Hoverboard-stored bookmarks (local+file+sync+browser aggregation) |
| **Storage column** | backend column | Shows which storage backend holds the row |
| **Stores (L / F / S / B)** | Stores (L / F / S), store filters | Filter checkboxes for Local / File / Sync / Browser |
| **Browser (B)** | Chrome store checkbox | Index Stores checkbox for **Browser storage (backend)** (`browser`) — not Pinboard, not side-panel Bookmarks |
| **export scope** | export mode | `all` \| `displayed` \| `selected` |
| **import conflict policy** | conflict mode | **Skip** \| **Overwrite** \| **Merge tags** |
| **Browser Bookmark Import** | Chrome import page | Page that copies browser bookmarks into Hoverboard backends |
| **Netscape Bookmark File Format** | bookmarks.html format | Doctype `NETSCAPE-Bookmark-file-1` |
| **Use folder names as tags** | folder→tag | Import option mapping folder path to tags |
| **Import to** | import target | Index CSV/JSON import: Local \| File \| Sync \| Browser. **Browser Bookmark Import** page: Local \| File \| Sync only (Browser excluded as target — source is already the Chrome tree) |
| **regex find-and-replace** | bulk replace | Title / URL / Tags / Notes fields on selection |
| **index-open dismisses side panel** | close sidebar on index | On Local Bookmarks Index **tab create** (popup / command / context menu) only; broadcast `REQUEST_SIDE_PANEL_CLOSE`. Not on index page refresh. Toolbar icon may reopen the **side panel**. |
| **Search Bookmarks** | library search (alone) | Capture UI control that opens Index with `?q=`; **not** Search tabs ([REQ-LIBRARY_SEARCH_ENTRY]) |
| **cross-resource retrieval** | universal search, global search | Read-only query contract spanning bookmark metadata, archive text, Tabs, Browser Bookmarks (page), and Visit History (page); preserves source-specific actions and privacy boundaries |
| **retrieval scope validation** | scope checking | Canonical source-registry check performed before bounded reads; permission-denied sources remain selected so their isolated source state is reported |
| **All resources scope** | aggregate scope, all-resources mode | Local Bookmarks Index scope with value `all-resources`; queries cross-resource retrieval and is read-only |
| **read-only control gate** | disabled controls | Scope guard that disables selection, metadata mutation, CSV export, and library package import/export |
| **sourceStates** | source status map | Per-source `available`, `stale`, `unavailable`, or `permissionDenied` state returned by cross-resource retrieval |
| **portable library package** | full export, backup archive | Versioned, checksum-verified package for lossless non-secret library state; configuration and secrets follow separate policy |
| **archive-content scope** | content search, full-text mode | Explicit Local Bookmarks Index scope for extracted text; metadata search remains the default |
| **Reader target** | archive link, offline page link | Extension Reader URL returned with archive search results |
| **archive snippet** | content preview | Bounded extracted-text context shown in an archive-content result |
| **link health** | dead-link check, uptime | Batch HTTP HEAD→GET status for Index URLs with inhibit skip + AbortController timeout; effectively enabled when **linkHealthChecksEnabled** is absent, explicitly disabled only by stored `false`, and always user-triggered; side table `hoverboard_link_health` ([REQ-LINK_HEALTH]) |
| **linkHealthChecksEnabled** | enable link checks | Options **Enable link health checks**; absent setting defaults effectively `true`, explicit stored `false` is preserved |
| **filtered / total provider-row counts** | store counts, bookmark totals by backend | Stores control label format; total counts all loaded rows for a named provider, filtered counts rows surviving search, Show only, Hide, and Health before Store selection; duplicate rows count separately |
| **storage normalization** | backend coercion | Trim and lowercase `local`, `file`, `sync`, and `browser` row storage values before Store filtering/counting |
| **Health column** | status column | Index column + optional filter over last link-health result |
| **link health hint** | health badge (capture) | Compact This Page/popup text from stored map when opt-in on |
| **Refresh API snapshot** | write aggregate snapshot | Index/Options action → `REFRESH_API_SNAPSHOT` writes `aggregate-snapshot.json` for Local Query API |
| **fixed head control panel** | head controls | Sticky Local Bookmarks Index filter region with one active control group |
| **fixed footer control panel** | footer controls | Sticky Local Bookmarks Index action region with a nullable active group: no visible group when collapsed, otherwise one active control group |
| **one-visible-group rule** | multiple visible control groups | Each expanded control region exposes exactly one selected tab and visible fieldset; a collapsed footer exposes none |
| **collapsed footer state** | Actions default, compact footer | Footer state with `activeFooterGroup = null`, all footer panels hidden, and Actions as the sole roving-tabindex entry |
| **activeFooterGroup** | selected footer, open action panel | Nullable state value identifying the expanded Actions, Import, or Export group |
| **live Browser source** | Chrome import page | Index Import source backed by `chrome.bookmarks.getTree`; distinct from Browser storage as a destination |
| **target-scoped conflict lookup** | global duplicate check | Conflict map built only from the selected Local, File, or Sync target; Browser source rows never conflict with themselves |
| **cleaned URL collapse** | duplicate browser rows | One live Browser import row per URL after trimming and removing trailing slashes, with folder paths/tags unioned |
| **Browser-import deep link** | legacy import URL | `?source=browser` entry that selects the Index Import group and live Browser source |
| **legacy import compatibility redirect** | standalone import page | `browser-bookmark-import.html` replaces location with Index `?source=browser` |

---

## Naming bridge: index and interchange

| Canonical concept | UI label | Message / API | Storage / format | Code |
|-------------------|----------|---------------|------------------|------|
| Index load (local only) | Local Bookmarks Index | `getLocalBookmarksForIndex` | — | bookmarks-table |
| Open index tab | Bookmarks index | `OPEN_BOOKMARKS_INDEX` (+ optional `q`) | tab URL `?q=` | SW `_openBookmarksIndexTab` via `buildBookmarksIndexUrlWithQuery` |
| Library search entry | Search Bookmarks | `OPEN_BOOKMARKS_INDEX` `{ q }` | Index search prefill | [IMPL-LIBRARY_SEARCH_ENTRY] |
| Link health check | Check link health | `CHECK_LINK_HEALTH` / `GET_LINK_HEALTH` | `hoverboard_link_health` | [IMPL-LINK_HEALTH] |
| API snapshot refresh | Refresh API snapshot | `REFRESH_API_SNAPSHOT` | `aggregate-snapshot.json` | [IMPL-LOCAL_QUERY_API] |
| Head sticky offset | `--index-head-sticky-height` | CSS variable measured from the fixed head control panel | [IMPL-LOCAL_BOOKMARKS_INDEX] |
| Footer sticky spacing | `--index-footer-sticky-height` | CSS variable measured from the fixed footer control panel | [IMPL-LOCAL_BOOKMARKS_INDEX] |
| Scroll-gated table header offset | `sticky-thead-offset` | Root class applied when the bookmark list scrolls beneath the fixed head panel | [IMPL-LOCAL_BOOKMARKS_INDEX] |
| Index prefill helper | Search Bookmarks (`?q=`) | — | — | `prefillSearchFromQuery` ([IMPL-LIBRARY_SEARCH_ENTRY]) |
| Index Check link health UI | Check link health | `CHECK_LINK_HEALTH` | — | `runCheckLinkHealth` / `formatHealthCellLabel` ([IMPL-LINK_HEALTH]) |
| Index Refresh API snapshot UI | Refresh API snapshot | `REFRESH_API_SNAPSHOT` | — | `runRefreshApiSnapshot` ([IMPL-LOCAL_QUERY_API]) |
| Aggregated index | Storage column | `getAggregatedBookmarksForIndex` | storage field on row | BookmarkRouter aggregate |
| Store row counts | `filtered / total` beside each Stores checkbox | `COUNT_INDEX_ROWS_BY_STORE` | provider-row counts before Store selection | bookmarks-table-filter |
| Browser import source | Browser source selector | `chrome.bookmarks.getTree` | collapsed live-tree records | `loadBrowserImportRecords` |
| Browser import target conflicts | Skip / Overwrite / Merge | `buildTargetBookmarksByUrl` | selected target rows only | bookmarks-table-browser-import |
| Browser import deep link | Index Import group | `source=browser` query | live Browser source selected | bookmarks-table |
| Retrieval scope validation | — | supported source registry | validated canonical scope list | `validateRetrievalScopes` / `VALIDATE_RETRIEVAL_SCOPES` |
| Bulk Delete | Delete (Actions for selected) | `deleteBookmark` | `preferredBackend` from row **Storage column** (same bridge as Add tags) | `buildDeletePayload` → BookmarkRouter |
| Delete status | `#delete-result` | — | pending `Deleting…` / final `Deleted N…` | `bookmarks-table-delete-status` |
| Export CSV | Export all / displayed / selected | — | CSV columns Title←`description`, Notes←`extended` | `bookmarks-table-csv` |
| Import CSV/JSON | Import (control group) | — | preferredBackend on save; pending/final in `#import-result` | bookmarks-table import |
| Archive-content search | Archived content | `SEARCH_ARCHIVED_CONTENT` | extracted text outside metadata snapshot | `ArchiveContentSearch` / `loadArchiveSearchResults` |
| Reader result | Open offline Reader | — | `reader.html?url=…` | `readerTarget` |
| Cross-resource retrieval | Search all resources | `SEARCH_LIBRARY_RESOURCES` | normalized query + explicit source scopes | `CrossResourceRetrieval` / `CROSS_RESOURCE_RETRIEVAL` |
| Portable library package | Export / Import library package | `EXPORT_LIBRARY_PACKAGE` / `IMPORT_LIBRARY_PACKAGE` | versioned manifest + checksums + safe relative artifacts | `LibraryPackage` / `LIBRARY_PORTABILITY` |

| Browser HTML import | Browser Bookmark Import | — | Netscape HTML | `browser-bookmark-import` |
| Folder in HTML | Folder | `<H3>` + nested `<DL>` | — | BOOKMARK_HTML_FORMAT |
| Link in HTML | Bookmark (URL) | `<A HREF>` | `ADD_DATE`, `LAST_MODIFIED` | same |
| Bookmarks bar marker | Bookmarks Bar | `PERSONAL_TOOLBAR_FOLDER` / `bookmark_bar` | — | same |

---

## Named concepts

- **Local Bookmarks Index** — Management UI under `src/ui/bookmarks-table/`; not the side-panel Bookmarks tab.
- **allBookmarks / filteredBookmarks / selectedUrls** — In-page data sets for display and bulk ops.
- **timeColumnSource / timeDisplayMode / sortKey** — Table time-column controls.
- **Show only / Hide** — Tag include/exclude, to-read, private, and time-range filters.
- **fixed head control panel** — Sticky Local Bookmarks Index filter region; its accessible tabs select exactly one of **Stores**, **Show only**, **Hide**, or **Table Display**.
- **fixed footer control panel** — Sticky Local Bookmarks Index action region; its accessible tabs select exactly one of **Actions**, **Import**, or **Export**, or collapse the footer when the active tab is activated again.
- **one-visible-group rule** — Each expanded control region exposes one selected tab and one visible fieldset; the collapsed footer hides all fieldsets without losing their form values.
- **collapsed footer state** — The normal Index initialization state: `activeFooterGroup` is `null`, no footer tab is selected, all footer panels are hidden, and Actions retains `tabindex="0"` for keyboard entry.
- **activeFooterGroup** — The nullable runtime state used by `selectControlGroup` to open a footer group or collapse it when the active tab is activated again.
- **live Browser source** — A source mode in the Index Import control that reads the native Chrome bookmark tree directly; it is not the Browser storage backend target.
- **target-scoped conflict lookup** — Conflict detection that filters aggregate rows to the selected Local, File, or Sync destination before applying Skip, Overwrite, or Merge tags.
- **cleaned URL collapse** — Normalization that trims a Browser URL and removes trailing slashes before merging duplicate tree nodes into one selectable import record.
- **Browser-import deep link** — The `?source=browser` query used by legacy page, command, context-menu, toolbar, and keyboard entry points to select the Index Import group.
- **legacy import compatibility redirect** — `browser-bookmark-import.html` no longer hosts import UI; on load it replaces location with `bookmarks-table.html?source=browser`.
- **Visits / Last Visited** — Usage columns when usage tracking data exists.
- **Add tags / Delete tags** — Bulk tag ops on selected rows (merge/dedupe case-insensitive).
- **Skip / Overwrite / Merge tags** — When imported URL already exists: leave alone; replace record; or merge tag sets.
- **Import control group** — Dedicated fieldset on Local Bookmarks Index (sibling of **Actions for selected**): conflict radios, **Import to**, **Import** button last, then `#import-result`.
- **import result pending / final** — Pending: `Importing…` (accepted, warning color). Final: `Imported N…` counts (success color). Same `#import-result` element.
- **delete result pending / final** — Pending: `Deleting…` (accepted, warning color). Final: `Deleted N…` counts (success color). Same `#delete-result` element next to **Delete**.
- **Netscape Bookmark File Format** — Interchange HTML with doctype `NETSCAPE-Bookmark-file-1` (see `docs/BOOKMARK_HTML_FORMAT.md`).
- **store-change reload** — When a **Stores (L / F / S / B)** checkbox changes and `allBookmarks` is empty while at least one store is checked, re-run **LOAD_LOCAL_BOOKMARKS_INDEX** so a failed/empty first fetch can recover without a full page reload.
- **Browser (B)** — Stores checkbox `#store-browser` for backend `browser` (native `chrome.bookmarks`); peer to Local/File/Sync for filter, move, and import targets.
- **index-open dismisses side panel** — Creating the Local Bookmarks Index tab via popup, command, or context menu dismisses an already-open **side panel** (`REQUEST_SIDE_PANEL_CLOSE`). Refresh of the index document does not re-dismiss. Options page `href` open does not use this path.
- **Search Bookmarks** — Popup/This Page control; opens Local Bookmarks Index with encoded `?q=` prefilled into the Index search field. Distinct from Search tabs.
- **link health** — SW fetch HEAD then GET with AbortController timeout; skip URLs matching **inhibit URL** list (`hoverboard_inhibit_urls`); enabled when **linkHealthChecksEnabled** is absent and disabled only by explicit stored `false`; results in `chrome.storage.local` key `hoverboard_link_health`; Index **Health column** and status filter; optional This Page/popup **link health hint**. Configuration resolution never dispatches a network check; only the explicit Index action does.
- **filtered / total provider-row counts** — Per-Store `filtered / total` labels for Local, File, Sync, and Browser. Total uses all loaded provider rows; filtered applies Search, Show only, Hide, and Health before Store selection; counts are row-based, preserve duplicates, and remain visible when a Store is unchecked.
- **storage normalization** — Count/filter mapping that trims and lowercases known `local`, `file`, `sync`, and `browser` storage values; missing storage is Local only for Local fallback rows and unknown storage is not attributed to a named Store.
- **Refresh API snapshot** — Writes multi-backend `aggregate-snapshot.json` under the File storage directory for Local Query API GET preference (Phase 2).
- **Index orchestrators** — Composition-testable Index UI helpers: `prefillSearchFromQuery` (`bookmarks-table-library-search.js`), `runCheckLinkHealth` / `formatHealthCellLabel` (`bookmarks-table-link-health.js`), `runRefreshApiSnapshot` (`bookmarks-table-api-snapshot.js`). Wired thinly from `bookmarks-table.js` init / button handlers.
- **archive-content scope** — Explicit search scope that queries extracted archive text; selecting it does not alter metadata matching.
- **archive snippet** — Bounded text context returned by archive search for row display.
- **Reader target** — Stored archive destination in `src/ui/reader/reader.html`; it never refetches the live URL.
- **cross-resource retrieval** — One read-only query contract over bookmark metadata, archive text, Tabs, Browser Bookmarks (page), and Visit History (page), with source identity and source-specific actions preserved.
- **retrieval scope validation** — A pure pre-read boundary that rejects sources outside the canonical registry, preserves canonical ordering, and leaves permission-denied sources for `READ_RETRIEVAL_SOURCE` to report without calling their adapters.
- **All resources scope** — Local Bookmarks Index value `all-resources` that delegates matching to `SEARCH_LIBRARY_RESOURCES` and keeps the result surface read-only.
- **read-only control gate** — `isReadOnlySearchScope` and related control-state updates disable selection, bulk mutation, CSV export, and portable library package import/export while an aggregate scope is active.
- **sourceStates** — Aggregate retrieval state map keyed by source; permission denial is isolated to its source so available sources still return results.
- **portable library package** — A versioned, checksum-verified container for lossless non-secret library state, including durable archive artifacts and safe restoration metadata.

---

## Pseudo-code block names

| Preferred term / concept | Procedure / block (existing) | Owning IMPL |
|--------------------------|------------------------------|-------------|
| Open index tab + dismiss panel | `OPEN_BOOKMARKS_INDEX_TAB` | [IMPL-LOCAL_BOOKMARKS_INDEX](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX.yaml) |
| Build Index URL with query | `BUILD_BOOKMARKS_INDEX_URL_WITH_QUERY` | [IMPL-LIBRARY_SEARCH_ENTRY](../implementation-decisions/IMPL-LIBRARY_SEARCH_ENTRY.yaml) |
| Open library search | `OPEN_LIBRARY_SEARCH` | [IMPL-LIBRARY_SEARCH_ENTRY](../implementation-decisions/IMPL-LIBRARY_SEARCH_ENTRY.yaml) |
| Prefill Index search from `?q=` | `PREFILL_INDEX_SEARCH_FROM_QUERY` | [IMPL-LIBRARY_SEARCH_ENTRY](../implementation-decisions/IMPL-LIBRARY_SEARCH_ENTRY.yaml) |
| Classify HTTP status | `CLASSIFY_HTTP_STATUS` | [IMPL-LINK_HEALTH](../implementation-decisions/IMPL-LINK_HEALTH.yaml) |
| Build health record | `BUILD_HEALTH_RECORD` | [IMPL-LINK_HEALTH](../implementation-decisions/IMPL-LINK_HEALTH.yaml) |
| Match inhibit list | `URL_MATCHES_INHIBIT_LIST` | [IMPL-LINK_HEALTH](../implementation-decisions/IMPL-LINK_HEALTH.yaml) |
| Fetch with link-health timeout | `FETCH_WITH_LINK_HEALTH_TIMEOUT` | [IMPL-LINK_HEALTH](../implementation-decisions/IMPL-LINK_HEALTH.yaml) |
| Link health checks enabled flag | `IS_LINK_HEALTH_CHECKS_ENABLED` | [IMPL-LINK_HEALTH](../implementation-decisions/IMPL-LINK_HEALTH.yaml) |
| Manual-only link health dispatch | `PRESERVE_MANUAL_ONLY_LINK_HEALTH` | [IMPL-LINK_HEALTH](../implementation-decisions/IMPL-LINK_HEALTH.yaml) |
| Format capture-UI health hint | `FORMAT_LINK_HEALTH_HINT` | [IMPL-LINK_HEALTH](../implementation-decisions/IMPL-LINK_HEALTH.yaml) |
| Gate Index check controls | `APPLY_LINK_HEALTH_CONTROLS_GATE` | [IMPL-LINK_HEALTH](../implementation-decisions/IMPL-LINK_HEALTH.yaml) |
| Check link health batch | `CHECK_LINK_HEALTH` | [IMPL-LINK_HEALTH](../implementation-decisions/IMPL-LINK_HEALTH.yaml) |
| Get link health map | `GET_LINK_HEALTH` | [IMPL-LINK_HEALTH](../implementation-decisions/IMPL-LINK_HEALTH.yaml) |
| Filter Index by health | `FILTER_BOOKMARKS_BY_HEALTH` | [IMPL-LINK_HEALTH](../implementation-decisions/IMPL-LINK_HEALTH.yaml) |
| Index Check link health UI | `RUN_CHECK_LINK_HEALTH_UI` | [IMPL-LINK_HEALTH](../implementation-decisions/IMPL-LINK_HEALTH.yaml) |
| Capture UI link health hint | `CAPTURE_UI_LINK_HEALTH_HINT` | [IMPL-LINK_HEALTH](../implementation-decisions/IMPL-LINK_HEALTH.yaml) |
| Index Refresh API snapshot UI | `RUN_REFRESH_API_SNAPSHOT_UI` | [IMPL-LOCAL_QUERY_API](../implementation-decisions/IMPL-LOCAL_QUERY_API.yaml) |
| Load index rows | `LOAD_LOCAL_BOOKMARKS_INDEX` | [IMPL-LOCAL_BOOKMARKS_INDEX](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX.yaml) |
| Fixed head controls | `HEAD_CONTROL_PANEL` | [IMPL-LOCAL_BOOKMARKS_INDEX](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX.yaml) |
| Fixed footer controls | `FOOTER_CONTROL_PANEL` | [IMPL-LOCAL_BOOKMARKS_INDEX](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX.yaml) |
| Initialize control tabs | `INITIALIZE_INDEX_CONTROL_TABS` | [IMPL-LOCAL_BOOKMARKS_INDEX](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX.yaml) |
| Sync sticky control offsets | `SYNC_CONTROL_PANEL_OFFSETS` | [IMPL-LOCAL_BOOKMARKS_INDEX](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX.yaml) |
| Apply scroll-gated table header offset | `APPLY_STICKY_THEAD_OFFSET` | [IMPL-LOCAL_BOOKMARKS_INDEX](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX.yaml) |
| Store-change reload predicate | `shouldReloadBookmarksOnStoreChange` | [IMPL-LOCAL_BOOKMARKS_INDEX](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX.yaml) |
| Count Store rows | `COUNT_INDEX_ROWS_BY_STORE` | [IMPL-LOCAL_BOOKMARKS_INDEX](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX.yaml) |
| SW provider init mutex | `PROVIDER_INIT_MUTEX` / `ensureBookmarkProviderInitialized` | [IMPL-LOCAL_BOOKMARKS_INDEX](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX.yaml) |
| Bulk Delete | `BULK_DELETE` / `runBulkDelete` | [IMPL-LOCAL_BOOKMARKS_INDEX](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX.yaml) |
| Export CSV | `(proposed) EXPORT_BOOKMARKS_CSV` | [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT.yaml) |
| Import records | `(proposed) IMPORT_BOOKMARKS_INDEX` | [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT.yaml) |
| Regex replace | `(proposed) REGEX_REPLACE_BOOKMARK_FIELDS` | [IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE.yaml) |
| Browser import conflict | Skip / Overwrite / Merge handlers | [IMPL-BROWSER_BOOKMARK_IMPORT](../implementation-decisions/IMPL-BROWSER_BOOKMARK_IMPORT.yaml) |
| Legacy import compatibility redirect | `LEGACY_IMPORT_COMPATIBILITY_REDIRECT` | [IMPL-BROWSER_BOOKMARK_IMPORT](../implementation-decisions/IMPL-BROWSER_BOOKMARK_IMPORT.yaml) |
| Query archive content | `QUERY_ARCHIVED_CONTENT` | [IMPL-ARCHIVED_CONTENT_SEARCH](../implementation-decisions/IMPL-ARCHIVED_CONTENT_SEARCH.yaml) |
| Apply archive-content scope | `APPLY_ARCHIVE_CONTENT_SCOPE` | [IMPL-ARCHIVED_CONTENT_SEARCH](../implementation-decisions/IMPL-ARCHIVED_CONTENT_SEARCH.yaml) |
| Cross-resource retrieval | `CROSS_RESOURCE_RETRIEVAL` | [IMPL-CROSS_RESOURCE_RETRIEVAL](../implementation-decisions/IMPL-CROSS_RESOURCE_RETRIEVAL.yaml) |
| Retrieval scope validation | `VALIDATE_RETRIEVAL_SCOPES` | [IMPL-CROSS_RESOURCE_RETRIEVAL](../implementation-decisions/IMPL-CROSS_RESOURCE_RETRIEVAL.yaml) |
| Apply All resources read-only control gate | `APPLY_ALL_RESOURCES_READ_ONLY_CONTROL_GATE` | [IMPL-CROSS_RESOURCE_RETRIEVAL](../implementation-decisions/IMPL-CROSS_RESOURCE_RETRIEVAL.yaml) |
| Portable library package | `LIBRARY_PORTABILITY` | [IMPL-LIBRARY_PORTABILITY](../implementation-decisions/IMPL-LIBRARY_PORTABILITY.yaml) |

---

## Alphabetical index

| Term | Section |
|------|---------|
| Add tags / Delete tags | Named concepts |
| All resources scope | Preferred terms / Named concepts |
| activeFooterGroup | Preferred terms / Named concepts |
| APPLY_ALL_RESOURCES_READ_ONLY_CONTROL_GATE | Pseudo-code block names |
| archive-content scope | Preferred terms / Named concepts |
| archive snippet | Preferred terms / Named concepts |
| cross-resource retrieval | Preferred terms / Named concepts / Pseudo-code block names |
| retrieval scope validation | Preferred terms / Naming bridge / Named concepts |
| filtered / total provider-row counts | Preferred terms / Named concepts |
| Bulk Delete | Pseudo-code block names / Naming bridge |
| delete result pending / final | Named concepts |
| Browser Bookmark Import | Preferred terms |
| Browser-import deep link | Preferred terms / Named concepts |
| cleaned URL collapse | Preferred terms / Named concepts |
| collapsed footer state | Preferred terms / Named concepts |
| export scope | Preferred terms |
| fixed footer control panel | Named concepts |
| fixed head control panel | Named concepts |
| one-visible-group rule | Named concepts |
| read-only control gate | Preferred terms / Named concepts |
| sourceStates | Preferred terms / Named concepts |
| import conflict policy | Preferred terms |
| Import to | Preferred terms |
| Import control group | Named concepts |
| import result pending / final | Named concepts |
| live Browser source | Preferred terms / Named concepts |
| BUILD_BOOKMARKS_INDEX_URL_WITH_QUERY | Pseudo-code block names |
| APPLY_LINK_HEALTH_CONTROLS_GATE | Pseudo-code block names |
| BUILD_HEALTH_RECORD | Pseudo-code block names |
| CAPTURE_UI_LINK_HEALTH_HINT | Pseudo-code block names |
| CHECK_LINK_HEALTH | Pseudo-code block names |
| CLASSIFY_HTTP_STATUS | Pseudo-code block names |
| FETCH_WITH_LINK_HEALTH_TIMEOUT | Pseudo-code block names |
| FILTER_BOOKMARKS_BY_HEALTH | Pseudo-code block names |
| FORMAT_LINK_HEALTH_HINT | Pseudo-code block names |
| GET_LINK_HEALTH | Pseudo-code block names |
| Health column | Preferred terms |
| index-open dismisses side panel | Preferred terms / Named concepts |
| IS_LINK_HEALTH_CHECKS_ENABLED | Pseudo-code block names |
| link health | Preferred terms / Named concepts |
| link health hint | Preferred terms |
| linkHealthChecksEnabled | Preferred terms |
| storage normalization | Preferred terms / Named concepts |
| target-scoped conflict lookup | Preferred terms / Named concepts |
| Manual-only link health dispatch | Pseudo-code block names |
| Count Store rows | Pseudo-code block names |
| URL_MATCHES_INHIBIT_LIST | Pseudo-code block names |
| Local Bookmarks Index | Preferred terms |
| OPEN_BOOKMARKS_INDEX_TAB | Pseudo-code block names |
| OPEN_LIBRARY_SEARCH | Pseudo-code block names |
| PREFILL_INDEX_SEARCH_FROM_QUERY | Pseudo-code block names |
| prefillSearchFromQuery | Named concepts / Naming bridge |
| Refresh API snapshot | Preferred terms / Named concepts |
| RUN_CHECK_LINK_HEALTH_UI | Pseudo-code block names |
| RUN_REFRESH_API_SNAPSHOT_UI | Pseudo-code block names |
| runCheckLinkHealth | Named concepts / Naming bridge |
| runRefreshApiSnapshot | Named concepts / Naming bridge |
| formatHealthCellLabel | Named concepts / Naming bridge |
| Index orchestrators | Named concepts |
| Search Bookmarks | Preferred terms / Named concepts |
| Netscape Bookmark File Format | Named concepts |
| PROVIDER_INIT_MUTEX | Pseudo-code block names |
| regex find-and-replace | Preferred terms |
| Reader target | Preferred terms / Named concepts |
| portable library package | Preferred terms / Named concepts / Pseudo-code block names |
| Skip / Overwrite / Merge tags | Named concepts |
| Storage column | Preferred terms |
| Stores (L / F / S / B) | Preferred terms |
| Browser (B) | Preferred terms |
| store-change reload | Named concepts |
| shouldReloadBookmarksOnStoreChange | Pseudo-code block names |
| LOAD_LOCAL_BOOKMARKS_INDEX | Pseudo-code block names |
| Use folder names as tags | Preferred terms |
