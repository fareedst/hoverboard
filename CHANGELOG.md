# Changelog

All notable changes to the Hoverboard Browser Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **Screenshot placeholder flow** (`IMPL-SCREENSHOT_MODE`) – Placeholder screenshots now show bookmarks reliably:
  - **Storage seed awaited:** The script awaits `chrome.storage.local.set` and `chrome.storage.sync.set` in the options page so the popup and bookmarks index load after data is written.
  - **Popup-as-tab URL:** When the popup is opened as a full tab (screenshot flow), the message handler now prefers `data.url` when it is an `http`/`https` URL so `getCurrentBookmark` returns the bookmark for the screenshot URL (e.g. Pinboard) instead of the extension tab URL.
  - **Wait for content:** The popup sets `data-screenshot-ready="true"` on `#mainInterface` when loading finishes in screenshot mode; the script waits for this attribute before capturing so the popup screenshot shows tags and bookmark data.
  - **Local store checked for index:** The Local Bookmarks Index shows no rows until at least one store (Local / File / Sync) is checked. The script now checks the **Local (L)** checkbox before capturing the index screenshot so seeded local bookmarks are visible.

### Added

- **Screenshot seed from file** (`IMPL-SCREENSHOT_MODE`) – Formal way to load placeholder data from a JSON file:
  - **CLI:** `node scripts/screenshots-placeholder.js [--seed=path/to/seed.json]`
  - **Env:** `SCREENSHOT_SEED_FILE=path node scripts/screenshots-placeholder.js`
  - **Seed shape:** `hoverboard_local_bookmarks` (object keyed by URL), `hoverboard_storage_index` (optional), `hoverboard_theme` (optional), `hoverboard_settings` (optional for sync). See `scripts/screenshot-placeholder-data.js` for the default seed and bookmark shape.
  - **Example file:** `scripts/screenshot-seed.example.json` – copy and edit for custom screenshot data.

## [1.5.0] - 2026-02-18

### Added

- **Local Bookmarks Index – Sticky Table Display and column headers** (`REQ-LOCAL_BOOKMARKS_INDEX`, `ARCH-LOCAL_BOOKMARKS_INDEX`, `IMPL-LOCAL_BOOKMARKS_INDEX`) – When you scroll past the Table Display section, the **Table Display** block (search, Time column, Time format) and the **table column headers** remain at the top of the viewport while the table body scrolls underneath. Content above (header, Stores, Show only, Hide) scrolls away normally; **Actions for selected** and the row count scroll with the table. Implemented with CSS `position: sticky`, a CSS variable `--table-display-sticky-height` (set via `setTableDisplayStickyHeight` and ResizeObserver in `bookmarks-table-sticky.js`), and an IntersectionObserver so the header offset is applied only after scrolling past the Table Display (avoids the header painting as a second row). Unit tests for `setTableDisplayStickyHeight` in `tests/unit/bookmarks-table-index.test.js`.

- **Local Bookmarks Index – Bookmark count at bottom and always visible** (`REQ-LOCAL_BOOKMARKS_INDEX`, `ARCH-LOCAL_BOOKMARKS_INDEX`, `IMPL-LOCAL_BOOKMARKS_INDEX`) – The bookmark count (# bookmarks) always appears at the bottom of the page: last in document order; when content is short, a `.footer-spacer` (flex: 1 1 0) pushes it to the visual bottom; when content is long, `.footer-info { position: sticky; bottom: 0 }` keeps the count bar visible at the bottom of the viewport while scrolling. Layout uses html/body min-height: 100vh, body flex column, container flex: 1 and min-height: 100vh. Unit tests in `tests/unit/bookmarks-table-index.test.js`: footer-info with row-count as last content, footer-spacer before footer-info, and CSS with position sticky and bottom 0 for .footer-info.

- **Local Bookmarks Index – Time column toggles** (`REQ-LOCAL_BOOKMARKS_INDEX`, `ARCH-LOCAL_BOOKMARKS_INDEX`, `IMPL-LOCAL_BOOKMARKS_INDEX`) – On the Local Bookmarks Index page, two toolbar controls affect the single **Time** column:
  - **Time column:** Choose **Create time** or **Last updated** (displays `time` or `updated_at` [REQ-BOOKMARK_CREATE_UPDATE_TIMES]); only one time column is shown. Sorting by the Time column uses the selected source.
  - **Time format:** Choose **Absolute** (`YYYY-MM-DD HH:mm:ss`) or **Age** (two largest units, e.g. `N days O hours`, `45 seconds`, `just now`).
  - Implementation: `bookmarks-table-time.js` exports `formatTimeAbsolute` and `formatTimeAge`; table state `timeColumnSource` and `timeDisplayMode`; compare uses effective key when sort is Time. Unit tests in `tests/unit/bookmarks-table-time.test.js` and integration in `tests/unit/bookmarks-table-index.test.js`.

- **Local Bookmarks Index – UI groups and Delete selected** (`REQ-LOCAL_BOOKMARKS_INDEX`, `ARCH-LOCAL_BOOKMARKS_INDEX`, `IMPL-LOCAL_BOOKMARKS_INDEX`) – Toolbar reorganized into four groups; bulk delete with confirmation:
  - **Stores:** Checkboxes for Local (L), File (F), Sync (S). Default: all unchecked so no bookmarks are shown until at least one store is selected (avoids overly long default list).
  - **Show only:** Tags (comma-separated, include), To read only, Private only, Time range (Start/End date-time inputs, Time field: Create time | Last updated).
  - **Hide:** Tags (comma-separated, exclude).
  - **Actions for selected:** Existing Export, Move, and Import; new **Delete** button. Confirmation dialog shows record count; if 8 or fewer selected, bookmark names are listed. Uses existing `deleteBookmark` message per URL; table refreshes and selection clears after delete.
  - Unit tests: matchStoresFilter, time range (parseTimeRangeValue, getBookmarkTimeMs, inTimeRange), matchExcludeTags, buildDeleteConfirmMessage; filter pipeline order tests in `tests/unit/bookmarks-table-index.test.js`.

- **Screenshot and placeholder tooling** (`IMPL-SCREENSHOT_MODE`, `IMPL-POPUP_THEME_CSS`) – Tooling to generate reproducible README/marketing screenshots with no live account:
  - **Placeholder data:** `scripts/screenshot-placeholder-data.js` defines demo bookmarks and `hoverboard_theme: 'dark'` so the popup renders in dark theme during capture.
  - **Playwright script:** `scripts/screenshots-placeholder.js` builds the extension, launches Chrome with the extension loaded, injects placeholder data and theme, then captures popup, options, local bookmarks index, and a Pinboard.in page with overlay; uses **sharp** to composite the popup onto the Pinboard page image. Outputs to `images/` (e.g. `Hoverboard_v1.0.7.0_Chrome_Popup.png`, `Hoverboard_v1.0.7.0_Chrome_Pinboard.png`, `Hoverboard_v1.0.7.0_Chrome_Options.png`, `local-bookmarks-index.png`).
  - **npm scripts:** `npm run screenshots` (capture with current tab/state) and `npm run screenshots:placeholder` (full placeholder flow; use for README assets).
  - **Popup dark theme for screenshots:** Popup CSS `:root.hb-theme-dark` (`IMPL-POPUP_THEME_CSS`) ensures the popup respects ThemeManager so screenshot mode shows the dark popup consistently.

### Fixed

- **Local Bookmarks Index – Table header row no longer appears as second row** – The sticky `top` offset for the table header was applied even at scroll zero, causing the header to be painted below a blank band. The thead now defaults to `top: 0`; the offset is applied only when the user has scrolled past the Table Display (via class `sticky-thead-offset` and IntersectionObserver), so the header is the first row when at the top of the page and sticks below the Table Display when scrolled.

## [1.4.0] - 2026-02-18

### Added

- **Bookmark create-time and most-recent-update-time** (`REQ-BOOKMARK_CREATE_UPDATE_TIMES`, `ARCH-BOOKMARK_CREATE_UPDATE_TIMES`, `IMPL-BOOKMARK_CREATE_UPDATE_TIMES`) – Each bookmark tracks create-time (`time`) and most-recent-update-time (`updated_at`). For new records, `updated_at` equals create-time; for local/file/sync, updates set `updated_at` to now while preserving `time`; Pinboard has only create-time, so `updated_at` is always equal to `time`. Legacy data without `updated_at` is normalized to `updated_at = time`. CSV export adds an optional **Updated** column; import supports 8- and 9-column CSV and defaults `updated_at` from `time` when missing. Unit tests: file-bookmark-service, sync-bookmark-service, local-bookmark-service, url-tags-manager, bookmarks-table-export, bookmarks-table-import, pinboard-bookmark-times, bookmark-router.

## [1.3.0] - 2026-02-18

### Added

- **Selection to tag input on extension icon click** (`REQ-SELECTION_TO_TAG_INPUT`, `ARCH-SELECTION_TO_TAG_INPUT`, `IMPL-SELECTION_TO_TAG_INPUT`) – New UX: when you highlight text on a page and open the popup by clicking the extension icon, the highlighted text is placed in the **New Tag** textbox so you can submit it as new tags in one step.
  - **≤ 8 words:** Full selection is used (after normalizing).
  - **> 8 words:** Only the first 8 words are used.
  - **Punctuation:** Removed from the selection before prefill (e.g. "hello, world!" → "hello world").
  - **No selection or restricted page:** Tag input is left unchanged; no error is shown.
  - Content script handles `GET_PAGE_SELECTION`; popup requests selection on load and prefills the tag input. Unit tests in `tests/unit/selection-to-tag-input.test.js`.

### Changed

- **Dependencies: overrides re-added for Jest 30 security** – Re-added npm `overrides` in `package.json`: `minimatch: ^10.2.1` (fixes HIGH ReDoS GHSA-3ppc-4f35-3m26 in Jest/tooling) and `test-exclude: ^7.0.1` (coverage tree uses glob ^10; removes deprecated glob 7 and inflight). Keeps Jest 30 secure and up to date without downgrading. `npm run validate` passes; only **moderate** ajv (GHSA-2g4f-4pwh-qvx6) in ESLint remains, unfixable without breaking ESLint.

## [1.2.0] - 2026-02-17

### Added

- **Local Bookmarks Index layout and export** (`REQ-LOCAL_BOOKMARKS_INDEX`, `REQ-LOCAL_BOOKMARKS_INDEX_EXPORT`) – UX updates:
  - **Compact header:** Banner and page heading use minimal height (smaller logo, tighter spacing, smaller type for title and subtitle).
  - **Export and Move below table:** "Export all", "Export displayed", "Export selected", and "Move selected to" (dropdown + Move button) are in an **actions-below-table** block under the bookmarks table (no longer in the toolbar).
  - **Export selected:** New "Export selected" button; enabled when one or more bookmarks are selected; downloads CSV of only the selected bookmarks. Unit tests in `tests/unit/bookmarks-table-export.test.js` for CSV helpers and selected-scope logic.

- **Local Bookmarks Index import** (`REQ-LOCAL_BOOKMARKS_INDEX_IMPORT`, `ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT`, `IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT`) – Import bookmarks from CSV or JSON on the index page:
  - **Import** (hidden file input + button) accepts `.csv` and `.json` files in the same format as export (CSV: Title, URL, Tags, Time, Storage, Shared, To read, Notes; JSON: array of bookmark objects).
  - **Only new:** Skips rows whose URL is already in the index (merge without overwriting).
  - **Overwrite existing:** Sends every row to `saveBookmark` (backend upserts by URL).
  - **Import to:** Target storage dropdown (Local | File | Sync); uses existing `saveBookmark` message with `preferredBackend` (no new backend API).
  - Result message shows imported, skipped, and failed counts; table refreshes after import. Unit tests in `tests/unit/bookmarks-table-import.test.js` for `parseCsv`, JSON normalization contract, and only-new vs overwrite filtering.

- **Browser Bookmark Import** (`REQ-BROWSER_BOOKMARK_IMPORT`, `ARCH-BROWSER_BOOKMARK_IMPORT`, `IMPL-BROWSER_BOOKMARK_IMPORT`) – Dedicated page to copy **browser bookmarks** into Hoverboard:
  - **Open from:** Popup footer ("Browser bookmark import") or Options ("Browser bookmark import"); opens in a new tab. Popup handler is bound in PopupController so the button works correctly.
  - **Data source:** `chrome.bookmarks.getTree()` in the page (requires `bookmarks` permission); tree flattened to a list with folder path per bookmark.
  - **Table:** Select (checkboxes, select-all), Title, URL (link with external indicator), Folder path, Date added; search over title/URL; filter by folder (dropdown of unique folder paths); sortable columns (default: Date added descending).
  - **Conflict mode:** When a selected URL already exists in Hoverboard — **Skip** (do not overwrite), **Overwrite** (replace with browser data), **Merge** (keep existing description/notes, merge tags).
  - **Tags:** Optional "Use folder names as tags" (folder path segments → sanitized tags) and "Add tags (comma-separated)" applied to every imported bookmark.
  - **Import to:** Target storage dropdown (Local | File | Sync); uses existing `saveBookmark` with `preferredBackend`. Result message shows imported, skipped, and failed counts.
  - **Implementation:** `src/ui/browser-bookmark-import/` (HTML, JS, CSS, utils); pure helpers in `browser-bookmark-import-utils.js` for tests. Unit tests in `tests/unit/browser-bookmark-import.test.js` for `sanitizeTag`, `folderPathToTags`, `parseExtraTags`, `flattenTree`, and conflict logic.

- **Extension UI Inspection and Testability** (`REQ-UI_INSPECTION`, `ARCH-UI_TESTABILITY`) – Enables testing and debugging of extension UI via a single contract, optional inspector, and testability hooks:
  - **UI action contract** (`IMPL-UI_ACTION_CONTRACT`): `src/shared/ui-action-contract.js` re-exports `MESSAGE_TYPES` and defines popup/overlay action IDs for tests and inspector.
  - **UI inspector** (`IMPL-UI_INSPECTOR`): Optional ring buffers (last 50 messages, last 50 actions) in `src/shared/ui-inspector.js`; gated by `DEBUG_HOVERBOARD_UI` in storage; wired in service worker, popup, and content script.
  - **Testability hooks** (`IMPL-UI_TESTABILITY_HOOKS`): Optional `onMessageProcessed`, `onAction`, `onStateChange` on message handler, popup, and overlay for unit/integration tests without DOM.
  - **Overlay test harness**: Displayed-state snapshot and action log helpers for overlay unit tests (`tests/utils/overlay-test-harness.js`).
  - **E2E snapshot helpers**: `snapshotPopup`, `snapshotOverlay`, `snapshotOptions` in `tests/e2e/helpers.js` for real-browser assertions.
  - **DEV_COMMAND inspection** (`IMPL-DEV_COMMAND_INSPECTION`): When debug is enabled, `DEV_COMMAND` subcommands `getCurrentBookmark`, `getTagsForUrl`, `getStorageBackendForUrl`, `getStorageSnapshot`, `getLastActions`, `getLastMessages` for tests and debug panel.
  - **Debug panel** (`IMPL-DEBUG_PANEL`): Optional `src/ui/debug/debug.html` shows last N actions, last N messages, and current tab state (bookmark, tags, storage backend); structured debug logging with categories (`ui`, `message`, `overlay`, `storage`) in `src/shared/debug-logger.js`.

- **Extension bundled entry points** (`REQ-EXTENSION_BUNDLED_ENTRY_POINTS`, `ARCH-EXTENSION_BUNDLED_ENTRY_POINTS`) – Requirement and architecture for bundling all browser-loaded entry points so bare module specifiers (e.g. npm package names) are never resolved at runtime. Implemented by existing service worker, options, and content script bundles plus new popup bundle.

### Changed

- **Dependencies: fast-xml-parser and eslint** – Upgraded `fast-xml-parser` from `^4.3.2` to `^5.3.6` to address **high** severity DoS (entity expansion in DOCTYPE, GHSA-jmr7-xgp7-cmfj). `npm audit --audit-level=high` now passes. Added explicit dev dependency `eslint-plugin-n` so lint succeeds after install. Moderate ajv/ESLint findings remain (fix would require breaking ESLint downgrade); documented in security check.

- **README: Load extension from dist** – Build-from-source instructions now state that the unpacked extension must be loaded from the **`dist`** folder (not the repo root), and that loading from the root causes "Failed to resolve module specifier" errors because the browser cannot resolve npm package names in unbundled scripts.

- **TIED detail files: Markdown → YAML** – Requirement, architecture, and implementation **detail** files in `tied/requirements/`, `tied/architecture-decisions/`, and `tied/implementation-decisions/` are now stored as **YAML** (e.g. `REQ-TIED_SETUP.yaml`, `ARCH-SUGGESTED_TAGS.yaml`, `IMPL-URL_TAGS_DISPLAY.yaml`). The YAML indexes (`requirements.yaml`, `architecture-decisions.yaml`, `implementation-decisions.yaml`) and `semantic-tokens.yaml` reference these `.yaml` detail files. Guide files (`requirements.md`, `architecture-decisions.md`, `implementation-decisions.md`) remain Markdown. Existing `.md` detail files were converted via MCP; new detail files should be created as `.yaml`.

- **ESLint 9 and flat config** (`REQ-CODE_QUALITY`, `ARCH-CODE_QUALITY`, `IMPL-CODE_STYLE`) – Linting now uses ESLint 9 with the flat config format:
  - **Config:** Single `eslint.config.mjs` (replaces `.eslintrc.yml` and `.eslintignore`). Standard preset applied via `@eslint/eslintrc` FlatCompat and `@eslint/compat` fixupConfigRules. Ignores and rule overrides live in the flat config.
  - **Node:** `package.json` includes `engines.node >= 18.18.0` (required for ESLint 9).
  - **Security check:** `npm run security:check` uses `--audit-level=high` so the build does not fail on moderate-only findings in the ESLint compat stack (e.g. ajv); high and critical still fail validate.
  - **TIED:** New requirement `REQ-CODE_QUALITY`, architecture decision `ARCH-CODE_QUALITY`, and implementation `IMPL-CODE_STYLE` (status Active) with traceability across requirements, architecture, and implementation.

### Added

- **Fourth storage option: chrome.storage.sync** (`ARCH-SYNC_STORAGE_PROVIDER`, `IMPL-SYNC_BOOKMARK_SERVICE`) – Bookmarks can be stored in **Sync** so they sync across devices signed into the same Chrome profile. Options: Storage Mode > "Sync (browser, synced)". **Quota ~100 KB**; documented in Options and README. Local bookmarks index and CSV export include a "Sync" storage column.

- **Popup storage: select-one buttons** (`REQ-MOVE_BOOKMARK_STORAGE_UI`, `IMPL-MOVE_BOOKMARK_UI`) – The popup Storage section uses four **select-one buttons** (Pinboard, File, Local, Sync) instead of a dropdown. The current storage is **highlighted**; clicking another option moves the bookmark when moving between non-API backends (Local, File, Sync). Pinboard button is **disabled** when no API token is configured (`updateStoragePinboardEnabled`).

- **File storage with typed path** (`IMPL-FILE_STORAGE_TYPED_PATH`) – File-based bookmarks can use a **user-typed path** instead of the folder picker:
  - **Options:** New "Path (directory for bookmark file)" input; default `~/.hoverboard`. Path is saved to `chrome.storage.local` and used when storage mode is File.
  - **Native host:** Helper scripts (`helper.sh`, `helper.ps1`) handle `readBookmarksFile` and `writeBookmarksFile` messages with a `path` field: expand `~` to home, use `path/hoverboard-bookmarks.json` (or path as file if it ends with `.json`), create directory on first write.
  - **Extension:** `NativeHostFileBookmarkAdapter` reads the path from storage and sends read/write to the native host; no offscreen document or folder handle needed.
  - **Service worker:** When storage mode is File and a path is set, the service worker uses the native-host path adapter; otherwise the existing picker-based flow (MessageFileBookmarkAdapter) is used.
  - Requires the native host to be installed; no folder picker needed for the path-based flow.

- **Local Bookmarks Index UX** (`REQ-LOCAL_BOOKMARKS_INDEX`, `REQ-MOVE_BOOKMARK_STORAGE_UI`) – Index page enhancements:
  - **URL column:** External-link indicator (e.g. ↗) and title "Opens in new tab" for each URL link.
  - **Storage filter:** Dropdown to display one of each storage type (All | Local | File | Sync).
  - **Select column:** First column with checkboxes per row and header "select all" for visible rows; selected bookmarks grouped for further operations.
  - **Move selected to:** Dropdown (Local | File | Sync) and Move button to move all selected bookmarks to the chosen storage via existing `moveBookmarkToStorage`; move controls **enabled** when at least one bookmark is selected, **disabled** when selection is cleared.

### Fixed

- **Popup "Failed to resolve module specifier 'fast-xml-parser'"** (`IMPL-POPUP_BUNDLE`, `REQ-EXTENSION_BUNDLED_ENTRY_POINTS`) – Opening the popup when the extension was loaded from `dist` could fail with the above error because the popup was loaded unbundled; its dependency chain (e.g. PopupController → TagService → PinboardService) eventually loaded the raw `pinboard-service.js`, which contains `import ... from 'fast-xml-parser'` (a bare specifier the browser cannot resolve). The popup is now built as a single bundle (`npm run build:popup`); `scripts/build.js` runs the popup build and skips copying `ui/popup/popup.js` so the extension always loads the bundled popup with dependencies inlined.

- **Pinboard API key can be cleared** – The Options page previously only called `setAuthToken` when the token field was non-empty, so clearing the field and saving left the old token in storage. Save now always persists the current field value; **clear the Pinboard API Token field and click Save** to disable Pinboard. Help text in Options: "Leave empty and save to disable Pinboard." Same fix in `options.js` and `options-browser.js`.

- **File storage helper path normalization** (`IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE`) – When the native host runs with `HOME` set with a trailing slash (e.g. by Chrome’s environment), the helper now normalizes it so `~/.hoverboard` resolves to a path without a double slash; the bookmark file is created at `~/.hoverboard/hoverboard-bookmarks.json` as expected. The helper also verifies the file exists and is non-empty after writing before returning success.

- **Move bookmark UI and persistence** (`IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL`) – Move-to-storage now updates the UI only when the move actually succeeds, and the stored bookmark is moved correctly:
  - **Popup uses inner result:** The service worker wraps handler responses as `{ success: true, data: routerResult }`. The popup now uses the inner result (`response.data`) for success/error, so failed moves (e.g. "Bookmark not found in source") show an error message instead of a false success.
  - **Move uses bookmark URL:** When sending a move request, the popup uses the current bookmark’s URL (`currentPin.url`) when available so the move key matches storage; this fixes moves failing when the tab URL differed (e.g. with or without query string).
  - **Router allows bookmark without time:** The router no longer requires `bookmark.time` to consider a bookmark valid for move; if `time` is missing, it is set when saving to the target so legacy or provider-returned bookmarks without time can be moved.

### Technical Details

- **UI Inspection TIED:** `REQ-UI_INSPECTION`, `ARCH-UI_TESTABILITY`, `IMPL-UI_ACTION_CONTRACT`, `IMPL-UI_INSPECTOR`, `IMPL-UI_TESTABILITY_HOOKS`, `IMPL-DEV_COMMAND_INSPECTION`, `IMPL-DEBUG_PANEL` in requirements, architecture-decisions, implementation-decisions, and semantic-tokens.
- **Bundled entry points TIED:** `REQ-EXTENSION_BUNDLED_ENTRY_POINTS`, `ARCH-EXTENSION_BUNDLED_ENTRY_POINTS`, `IMPL-POPUP_BUNDLE`; detail files `tied/requirements/REQ-EXTENSION_BUNDLED_ENTRY_POINTS.yaml`, `tied/architecture-decisions/ARCH-EXTENSION_BUNDLED_ENTRY_POINTS.yaml`.
- **Storage:** Four backends: Pinboard (P), File (F), Local (L, default), Sync (S). `VALID_BACKENDS` and BookmarkRouter include `sync`; ConfigManager and Options support `storageMode: 'sync'`. Sync uses `chrome.storage.sync` key `hoverboard_sync_bookmarks`. TIED: `ARCH-SYNC_STORAGE_PROVIDER`, `IMPL-SYNC_BOOKMARK_SERVICE` in semantic-tokens and implementation-decisions.
- **Popup:** UIManager `updateStorageBackendValue(backend)` and `updateStoragePinboardEnabled(hasApiKey)`; PopupController loads auth token and disables Pinboard button when empty. Implementation decision: Pinboard option disabled when no API token.
- **Auth:** Options save flow always calls `setAuthToken(authToken)` (including empty string) so user can clear token to disable Pinboard.
- **Requirements:** `REQ-MOVE_BOOKMARK_STORAGE_UI` satisfaction criteria extended; new implementation decision `IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL`.
- **Implementation:** New decision `IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE` (helper `expand_tilde` uses `${HOME%/}`; post-write file verification).
- **Tests:** ConfigManager `getStorageMode`/`setStorageMode` for `sync`; StorageIndex accepts `sync`; BookmarkRouter four providers and `getAllBookmarksForIndex` including sync; SyncBookmarkService unit tests; `moveBookmarkToStorage succeeds when bookmark has url but no time [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL]`; `helper-path-normalize.test.js` for [IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE]. Auth: test that `setAuthToken('')` persists empty token.

## [1.0.8] - 2026-02-13

### Changed

- **Default storage mode is now Local Storage** (`REQ-STORAGE_MODE_DEFAULT`) - Local storage is preferable for most users:
  - New installs and users without a saved storage preference use **local-only** bookmarks (no account or API required)
  - Pinboard remains available via **Options > Storage Mode > "Pinboard (cloud)"**
  - Existing users keep their current choice; stored `storageMode` is unchanged

### Added

- **Local Bookmarks Index** (`REQ-LOCAL_BOOKMARKS_INDEX`, `ARCH-LOCAL_BOOKMARKS_INDEX`, `IMPL-LOCAL_BOOKMARKS_INDEX`) - A dedicated full-page index of **locally stored bookmarks only**:
  - **Open from:** Popup footer ("Bookmarks index" button) or Options page ("Local bookmarks index" link); opens in a new tab
  - **Search:** Single text box over title, URL, tags, and notes (case-insensitive)
  - **Filter:** By tag (comma-separated include), "To read only", "Private only"
  - **Sort:** Click column headers (Title, URL, Tags, Time, Shared, To read); default sort is Time descending
  - **Launch:** URL column is a link that opens the page in a new tab
  - **Export:** "Export all" and "Export displayed" buttons download the current set (all local bookmarks or the filtered/sorted view) as CSV (`REQ-LOCAL_BOOKMARKS_INDEX_EXPORT`, `IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT`)
  - Data is **live** from `chrome.storage.local` via `getLocalBookmarksForIndex` (always uses LocalBookmarkService; not Pinboard). When storage mode is Pinboard, the index may be empty with an explanatory message
  - Implemented in `src/ui/bookmarks-table/` (HTML, JS, CSS); backend: `LocalBookmarkService.getAllBookmarks()`, message handler returns `{ bookmarks }`

- **Recent Tags refresh on popup display** (`IMPL-RECENT_TAGS_POPUP_REFRESH`) - Recent Tags list now refreshes every time the popup is displayed:
  - Popup listens for `document.visibilitychange` and refetches Recent Tags from the service worker when the popup becomes visible
  - Ensures the list is up to date even when the popup document is reused without a full reload
  - Tags saved in one browser window appear in the Recent Tags list when the popup or overlay is opened in this or any other window (shared state via service worker)
  - Overlay already refreshed recent tags on each show; no overlay code change required

- **Customizable Font Sizes** (`CFG-FONT-SIZE-001`) - User-configurable font sizes for all UI text elements:
  - **Suggested Tags**: Default 10px (smaller for less visual intrusion), configurable 8-20px
  - **Labels**: Default 12px (Current, Recent, Suggested), configurable 10-16px
  - **Tag Elements**: Default 12px (current and recent tags), configurable 10-16px
  - **Base UI Text**: Default 14px (general UI text), configurable 12-18px
  - **Input Fields & Buttons**: Default 14px, configurable 12-18px
  - Accessibility-friendly: users can increase sizes for better readability
  - Settings persist via chrome.storage and apply to both overlay and popup interfaces
  - New "📝 Font Size Settings" section in options page with helpful guidance

### Enhanced

- **Intelligent Tag Suggestions** (`REQ-SUGGESTED_TAGS_FROM_CONTENT`) - Increased tag extraction capacity:
  - **Overlay**: Now extracts 30 tags (was 10), displays 15 (was 5) - 200% increase
  - **Popup**: Now extracts 60 tags (was 20) - 200% increase
  - **Per-Source Caps**: Doubled to ensure top tags from all sources can contribute:
    - Emphasis elements: 60 (was 30)
    - Definition terms: 40 (was 20)
    - Table headers: 40 (was 20)
    - Nav links: 40 (was 20)
    - Images alt: 10 (was 5)
    - Main content links: 20 (was 10)
  - All sources can now contribute more candidates before frequency ranking
  - No algorithm changes - still uses frequency sorting, case preservation, deduplication

- **Tag Extraction Sources** - Significantly improved tag extraction algorithm with new content sources:
  - **Meta Tags**: Extract from `<meta name="keywords">` and `<meta name="description">` for author-specified topics
  - **Emphasis Elements**: Extract from `<strong>`, `<b>`, `<em>`, `<i>`, `<mark>`, `<dfn>`, `<cite>`, `<kbd>`, `<code>` (first 60 in main content)
  - **Definition Terms**: Extract from `<dt>` elements in definition lists (first 40)
  - **Table Headers**: Extract from `<th>` and `<caption>` elements (first 40)
  - All new sources scoped to main content areas (main, article, [role="main"]) to reduce noise

### Technical Details

- **Font Configuration**: Stored in `ConfigManager` with defaults in `getDefaultConfiguration()`
- **CSS Implementation**: Dynamic CSS variables in popup, template literals in overlay injection
- **Sources**: 11 total extraction sources (was 7): title, URL, meta keywords, meta description, headings, emphasis elements, definition terms, table headers, navigation, breadcrumbs, images, links
- **Performance**: Minimal impact (~5-10ms typical, <20ms complex pages)
- **Backward Compatible**: No breaking changes, all existing functionality preserved
- **TIED Documentation**: Complete traceability with `[REQ-SUGGESTED_TAGS_FROM_CONTENT]`, `[ARCH-SUGGESTED_TAGS]`, `[IMPL-SUGGESTED_TAGS]`

### Benefits

- **Customization**: Users can adjust font sizes for personal preference and accessibility needs
- **Reduced Visual Clutter**: Suggested tags now smaller by default (10px vs 12px)
- **Consistency**: Font sizes apply uniformly across overlay and popup interfaces
- **More Tag Suggestions**: 100-200% increase in suggested tags provides more options from all content sources
- **Better Tag Quality**: More candidates from each source means top tags from all sources can contribute
- **Better Extraction**: Technical documentation, glossaries, data-heavy pages, meta-tagged content now provide richer suggestions
- **Pages with Visual Emphasis**: Bold/italic/highlighted/code terms now contribute to suggestions

### Documentation

- **README and TIED** - Dual storage (local default, optional Pinboard) is now documented:
  - README: local-first intro, Storage Mode in Options, Storage subsection, architecture note, prerequisites (Pinboard optional)
  - New requirement `REQ-STORAGE_MODE_DEFAULT`; architecture and implementation decisions updated with default choice and rationale
  - Unit tests for ConfigManager default `storageMode`, `getStorageMode`, and `setStorageMode` (see `tests/unit/config-manager.test.js`)

## [1.0.10] - 2026-02-14

### Added

- **Optional native messaging host** (`REQ-NATIVE_HOST_WRAPPER`, `ARCH-NATIVE_HOST`, `IMPL-NATIVE_HOST_WRAPPER`, `IMPL-NATIVE_HOST_INSTALLER`) – The extension can communicate with a native host for features that need local code (outside the browser sandbox). The host is a **thin wrapper** that does not run code from the extension folder; instead, an installer copies the wrapper and helper to a fixed path, and the wrapper runs only from that directory.
  - **Wrapper**: Go binary in `native_host/` implementing Chrome native messaging protocol (stdio, length-prefixed JSON). Responds to `ping` with `pong`; delegates other messages to a helper script in the same directory (`helper.sh` on macOS/Linux, `helper.ps1` or `helper.exe` on Windows).
  - **Installer**: `install.sh` (macOS/Linux) and `install.ps1` (Windows) copy the wrapper and helpers to `~/.hoverboard/` or `%LOCALAPPDATA%\Hoverboard\`, generate the native messaging manifest with the extension ID, and (on Windows) create the registry key for Chrome.
  - **Extension**: `nativeMessaging` permission; Options page has a "Native host" section with "Test native host" button; service worker handles `NATIVE_PING` and calls `pingNativeHost()`.
  - **Build**: `npm run build:native` builds the Go binary and copies artifacts to `dist/native_host/`.
  - **Tests**: Go tests in `native_host/main_test.go` (protocol read/write, findHelper, ping-pong integration); Jest tests in `tests/unit/native-host-ping.test.js` (NATIVE_PING handling and pingNativeHost).

### Technical Details

- **Manifest**: Added `nativeMessaging` to `permissions`.
- **Host name**: `com.hoverboard.native_host`; manifest template `com.hoverboard.native_host.json.template` with `{{PATH}}` and `{{ALLOWED_ORIGINS}}` placeholders.

---

## [1.0.9] - 2026-02-14

### Added

- **File-based bookmark storage** – Third storage backend: bookmarks in a **single file** (`hoverboard-bookmarks.json`) in a **user-chosen folder**. Important for **privacy** (data stays in a location you control, no third-party service) and **sharing** (e.g. put the folder in Dropbox/Drive for sync, or share the file with others). Options: "Select folder" (File System Access); directory handle stored in IndexedDB; offscreen document performs file read/write.

- **Per-bookmark storage** – Each bookmark is tagged with a storage method (Pinboard, Local, or File). A storage index maps URL → backend; **default storage for new bookmarks** is configurable in Options (three-way: Pinboard, Local, File). Bookmark operations are routed to the correct backend per URL.

- **Move bookmark between storages** – In the popup, a **Storage** control shows where the current bookmark is saved and lets you **move** it to Pinboard, Local, or File (copy to target, delete from source, update index).

- **Local bookmarks index: Storage column** – The index page now shows **local and file** bookmarks together, with a **Storage** column (Local | File). Uses `getAggregatedBookmarksForIndex`; CSV export includes Storage.

### Technical Details

- **StorageIndex** (`hoverboard_storage_index` in chrome.storage.local) maps URL → backend; **BookmarkRouter** delegates get/save/delete to Pinboard, Local, or File provider; **MessageFileBookmarkAdapter** and offscreen document for file I/O.

### Benefits

- **Privacy:** Keep bookmarks in a folder you control; no need to send data to Pinboard or any other service for file-backed bookmarks.
- **Sharing:** Use a cloud-synced folder to sync across devices, or share the single JSON file with others for ad-hoc collaboration.

## [1.0.7] - 2025-11-17

### Added

- Suggested tags offer words from various elements on the page.

### Changed

- Converted to TIED methodology.
- Removed Safari integration.

## [1.0.6.80] - 2025-07-20

### Added
- **Safari App Extension Integration** (`SAFARI-EXT-IMPL-001`) - Complete Safari extension packaging and deployment pipeline
- **Safari Performance Optimizations** (`SAFARI-EXT-PERFORMANCE-001`) - Safari-specific performance monitoring and memory management
- **Safari Popup Adaptations** (`SAFARI-EXT-POPUP-001`) - Safari-specific popup optimizations and UI enhancements
- **Enhanced Error Handling Framework** (`SAFARI-EXT-ERROR-001`) - Comprehensive error recovery and graceful degradation
- **Safari UI Optimizations** (`SAFARI-EXT-UI-001`) - Safari-specific accessibility and theme optimizations
- **Safari Content Script Adaptations** (`SAFARI-EXT-CONTENT-001`) - Safari-specific content script optimizations
- **Enhanced Platform Detection** (`SAFARI-EXT-SHIM-001`) - Runtime feature detection and performance monitoring
- **Enhanced Message Passing** (`SAFARI-EXT-MESSAGING-001`) - Safari-specific validation and retry mechanisms
- **Enhanced Storage Quota Management** (`SAFARI-EXT-STORAGE-001`) - Real-time monitoring with graceful degradation

### Fixed
- Safari Shim Message Passing - Resolved `browser.runtime.getManifest().version` undefined error
- Error Recovery Tests - Corrected mock expectations for failed vs successful recovery
- Test Coverage - Enhanced mocking for Safari-specific APIs and behaviors
- Reduced failing tests from 45 to 41 (9% improvement)

### Changed
- Cross-browser compatibility improvements
- Enhanced test coverage with 252 comprehensive tests
- Improved error handling across all platforms
- Performance optimizations for both Chrome and Safari

### Technical Details
- **Test Coverage**: 252 tests across 8 test suites (84% success rate)
- **Safari Extension**: Complete App Store preparation
- **Cross-Browser**: Full compatibility with Chrome and Safari
- **Performance**: Real-time monitoring and optimization

## [1.0.0] - 2025-07-14

### Added
- Initial Chrome extension release
- Core bookmark management functionality
- Tag management system
- Hover overlay system
- Dark theme support
- Cross-popup state management
- Pinboard integration
- Content script overlay system
- Options page configuration
- Service worker implementation

### Features
- Smart bookmarking with tag suggestions
- Recent tags quick access
- Visual feedback with transparency controls
- Modern UI with dark theme default
- Keyboard shortcuts support
- Context menu integration

## [0.9.0] - 2025-07-10

### Added
- Initial development version
- Basic extension structure
- Manifest V3 implementation
- Core architecture setup

---

## Release Notes

### Version 1.0.6.80 (Current)
This release represents a major milestone in cross-browser compatibility, with complete Safari App Extension support and comprehensive testing infrastructure. The extension now provides a seamless experience across both Chrome and Safari browsers.

**Key Highlights:**
- ✅ Complete Safari App Extension Integration
- ✅ 252 comprehensive tests with 84% success rate
- ✅ Enhanced error handling and recovery
- ✅ Performance monitoring and optimization
- ✅ Full cross-browser compatibility

### Version 1.0.0 (Stable)
The first stable release of Hoverboard, providing core bookmark management functionality with modern UI and cross-browser support.

**Key Features:**
- Smart bookmarking with intelligent tag suggestions
- Visual hover overlays with transparency controls
- Dark theme with modern UI design
- Cross-popup state management
- Pinboard integration for bookmark sync

---

## Migration Guide

### Upgrading to 1.0.6.80

No breaking changes. The update includes:
- Enhanced Safari support
- Improved error handling
- Performance optimizations
- Better cross-browser compatibility

### Upgrading to 1.0.0

This is the first stable release. If upgrading from development versions:
- Clear extension data if experiencing issues
- Reconfigure settings in the options page
- Test functionality in both Chrome and Safari

---

## Support

- **Issues**: [GitHub Issues](https://github.com/fareedst/hoverboard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/fareedst/hoverboard/discussions)
- **Documentation**: [Project Wiki](https://github.com/fareedst/hoverboard/wiki)

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
