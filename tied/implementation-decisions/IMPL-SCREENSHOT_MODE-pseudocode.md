# [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [REQ-BOOKMARK_USAGE_TRACKING] — Generate repeatable README screenshots from caller-controlled seed data across current side-panel tabs and standalone tools.

## LOAD_SCREENSHOT_SEED

- [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] How: Load the default seed or a caller-provided JSON seed while preserving valid caller-provided usage and navigation-edge fixtures.
- Contract:
  - INPUT: optional `SCREENSHOT_SEED_FILE` or `--seed=path`; default local and sync seed
  - PRE: supplied file is readable JSON with object `hoverboard_local_bookmarks`; default seed is importable
  - OUTPUT: local seed, sync seed, and optional fixture-presence flags
  - POST:
    - success => local bookmark and storage-index objects are available for extension storage
  - EFFECTS: filesystem IO
  - FAILURE_MODES: unreadable file; malformed JSON; missing local bookmark object
  - DATA_TRANSITION: normalize only seed container shape; preserve caller-provided theme, tags, usage, and edge records
  - TERMINATION: total
- PROCEDURE: LOAD_SCREENSHOT_SEED
  - Resolve the environment or command-line seed path relative to the project root.
  - Parse the file when supplied; reject an absent or array-valued `hoverboard_local_bookmarks`.
  - Build `hoverboard_storage_index` from the caller value or one `local` entry per bookmark URL.
  - Return local bookmark, theme, tag, optional usage, optional edge, and sync settings.

## BUILD_STABLE_USAGE_FIXTURES

- [IMPL-SCREENSHOT_MODE] [REQ-BOOKMARK_USAGE_TRACKING] How: Add deterministic usage and navigation-edge data only when the caller did not provide those fixtures.
- Contract:
  - INPUT: local seed; stable seed timestamp
  - PRE: stable timestamp is a finite epoch value; local seed is an object
  - OUTPUT: local seed containing `hoverboard_bookmark_usage` and `hoverboard_bookmark_nav_edges`
  - POST:
    - success => generated timestamps are reproducible across runs; caller-provided fixture objects are unchanged
  - EFFECTS: pure data construction
  - FAILURE_MODES: invalid timestamp; malformed caller fixture
  - DATA_TRANSITION: add missing fixture keys without replacing valid supplied keys
  - TERMINATION: total
- PROCEDURE: BUILD_STABLE_USAGE_FIXTURES
  - Use `placeholderSeedTimestamp = Date.parse('2025-01-20T12:00:00.000Z')` as the default base date.
  - Call `getPlaceholderUsageSeed(placeholderSeedTimestamp)` only when usage data is absent.
  - Call `getPlaceholderEdgesSeed(placeholderSeedTimestamp)` only when navigation-edge data is absent.
  - Return the merged local seed.

## SEED_EXTENSION_DATA

- [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BOOKMARK_USAGE_TRACKING] How: Await local and sync storage writes through the extension Options page before opening any capture surface.
- Contract:
  - INPUT: extension context; extension id; normalized local seed; normalized sync seed
  - PRE: Options page is reachable; `chrome.storage.local` exists
  - OUTPUT: completed seed operation
  - POST:
    - success => subsequent extension pages can read all seeded records
  - EFFECTS: asynchronous extension storage IO
  - FAILURE_MODES: Options page timeout; storage write rejection
  - DATA_TRANSITION: temporary profile storage changes from empty/default to the normalized seed
  - TERMINATION: total
- PROCEDURE: SEED_EXTENSION_DATA
  - Open `src/ui/options/options.html` in the temporary extension context.
  - Await `chrome.storage.local.set(localSeed)`.
  - Await `chrome.storage.sync.set(syncSeed)` when sync storage is available.
  - Close the Options page only after both writes resolve.

## CAPTURE_README_MEDIA

- [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [REQ-BOOKMARK_USAGE_TRACKING] How: Orchestrate a temporary Chromium profile, stable extension seed, native bookmark seed, current side-panel captures, and standalone-tool captures into the README image set.
- Contract:
  - INPUT: built `dist/` extension; optional seed file; image directory
  - PRE: `dist/manifest.json` exists; Chromium and extension permissions are available
  - OUTPUT: `local-bookmarks-index.png`, `side-panel-bookmark.png`, `side-panel-tags-tree.png`, `side-panel-tabs.png`, `browser-bookmarks.png`, and `visit-history.png`
  - POST:
    - success => every expected image exists and represents current product surfaces only
  - EFFECTS: asynchronous browser IO, native Chrome bookmark state, filesystem IO, temporary profile state
  - FAILURE_MODES: missing build; missing seed; extension startup timeout; capture timeout; screenshot failure
  - DATA_TRANSITION: create temporary profile and seed data; close profile after all captures
  - TERMINATION: total
- PROCEDURE: CAPTURE_README_MEDIA
  - Validate the build and create `images/`.
  - Load the default or caller-provided seed.
  - Run `BUILD_STABLE_USAGE_FIXTURES`, launch a temporary persistent Chromium context, and resolve the extension id.
  - Run `SEED_EXTENSION_DATA`.
  - Create one native Chrome bookmark folder for the standalone Browser Bookmarks capture.
  - Capture the Local Bookmarks Index with the Local store selected.
  - Capture This Page, By Tag, and Tabs at `360x800` side-panel viewport.
  - Run `CAPTURE_STANDALONE_TOOL` for Browser Bookmarks and Visit History at `1200x900`.
  - Close the temporary context in a `finally` path.

## CAPTURE_SIDE_PANEL_SURFACES

- [IMPL-SCREENSHOT_MODE] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SIDE_PANEL_TAGS_TREE] [REQ-SIDE_PANEL_BROWSER_TABS] How: Capture exactly the current This Page, By Tag, and Tabs side-panel surfaces at the side-panel viewport.
- Contract:
  - INPUT: extension context; extension id; side-panel viewport; screenshot URL and title
  - PRE: seeded local data is readable; side-panel document is reachable
  - OUTPUT: three side-panel PNG files
  - POST:
    - success => no removed Browser Bookmarks or Usage side-panel tab is captured
  - EFFECTS: browser navigation, asynchronous DOM state, filesystem IO
  - FAILURE_MODES: side-panel timeout; missing panel; screenshot failure
  - DATA_TRANSITION: side-panel selection changes from This Page to By Tag to Tabs; temporary page state is not persisted as product data
  - TERMINATION: total
- PROCEDURE: CAPTURE_SIDE_PANEL_SURFACES
  - Open `side-panel.html?screenshot=1&url=...&title=...` at `360x800`.
  - Wait for This Page content and capture `side-panel-bookmark.png`.
  - Select `tagsTree`, wait for its visible panel, and capture `side-panel-tags-tree.png`.
  - Select `browserTabs`, wait for its visible panel, and capture `side-panel-tabs.png`.
  - Close auxiliary pages and the side-panel page.

## CAPTURE_STANDALONE_TOOL

- [IMPL-SCREENSHOT_MODE] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [REQ-BOOKMARK_USAGE_TRACKING] How: Capture each full-page tool from its own HTML entry point, keeping Browser Bookmarks and Visit History outside the side-panel tab set.
- Contract:
  - INPUT: extension context; extension id; tool page; required root selector; output path; `1200x900` viewport
  - PRE: backing native or local data is seeded; tool root becomes visible
  - OUTPUT: one full-page PNG
  - POST:
    - success => output is a standalone tool image with its required root visible
  - EFFECTS: browser navigation, DOM state, filesystem IO
  - FAILURE_MODES: tool timeout; missing root; screenshot failure
  - DATA_TRANSITION: render only; do not add a side-panel tab or mutate product records
  - TERMINATION: total
- PROCEDURE: CAPTURE_STANDALONE_TOOL
  - For Browser Bookmarks, open `browser-bookmarks.html`, await `#browserBookmarksPanel`, and capture `browser-bookmarks.png`.
  - For Visit History, open `visit-history.html`, await `#visitHistoryPanel`, and capture `visit-history.png`.
  - Close each tool page after its screenshot is written.

## SCREENSHOT_THEME_CONTRACT

- [IMPL-SCREENSHOT_MODE] [IMPL-POPUP_THEME_CSS] [ARCH-THEME] [REQ-DARK_THEME] How: Keep the existing screenshot theme contract available to This Page and side-panel captures while the media workflow changes only capture scope.
- Contract:
  - INPUT: screenshot seed; selected theme; popup stylesheet
  - PRE: seed and stylesheet are readable
  - OUTPUT: supported screenshot theme configuration
  - POST:
    - success => selected/default theme has a matching popup CSS rule
  - EFFECTS: pure validation
  - FAILURE_MODES: unsupported theme; unreadable stylesheet
  - DATA_TRANSITION: none
  - TERMINATION: total
- PROCEDURE: SCREENSHOT_THEME_CONTRACT
  - Read the selected/default theme from the screenshot seed.
  - Read theme selectors from the popup stylesheet.
  - Assert that the selected/default theme is supported before capture.
