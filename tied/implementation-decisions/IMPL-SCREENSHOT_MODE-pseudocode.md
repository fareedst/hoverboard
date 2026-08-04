# [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] — Placeholder screenshot flow: seed storage, fake tab params, data-screenshot-ready, handleGetCurrentBookmark prefers data.url. Contract: URL params and seed; placeholder UI and script capture.

## MAIN

- [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] How: Rich placeholder data: 15+ bookmarks so index and By Tag tree look robust; hero Pinboard entry with 6+ tags and non-empty extended for This Page view. Side panel: open with ?screenshot=1&url=screenshotPopupUrl&title=screenshotPopupTitle so Bookmark tab shows Pinboard bookmark (same doc, PopupController reads window.location.search).
- Contract:
  - INPUT: ?screenshot=1&url=...&title=... (popup/side panel); seed JSON (local bookmarks, storage index, theme); optional --seed=path
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: popup/index/side panel rendered with placeholder data; data-screenshot-ready attribute; script can capture screenshot
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: PopupController._screenshotMode; handleGetCurrentBookmark prefers data.url when http(s); placeholderStorageSeed
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Async, Http, IO, State
  - TERMINATION: total
- PROCEDURE: MAIN
  - 1. localBookmarks: BUILD object keyed by URL; Pinboard entry HAS tags.length >= 6, extended non-empty, toread 'yes'; total entries >= 15; mix of toread yes/no; storageIndex one key per localBookmarks URL, value 'local'
  - How (sub-block): Await seed; open popup/index; wait for ready; check store-local for index; capture.
  - 2. Script: SEED chrome.storage.local/sync (await set); optional LOAD seed from file; OPEN popup or index; WAIT for [data-screenshot-ready="true"]; CHECK #store-local for index; CAPTURE screenshot
  - How (sub-block): Use URL params as fake tab; set data-screenshot-ready in finally.
  - 3. Popup load: IF screenshot=1 and url param: USE param as fake tab url/title; SKIP getCurrentTab; IN finally SET data-screenshot-ready on #mainInterface
  - How (sub-block): Prefer data.url as targetUrl when http(s) so popup-as-tab gets correct bookmark.
  - 4. handleGetCurrentBookmark: IF data.url present and http(s): USE as targetUrl so popup-as-tab gets bookmark for screenshot URL
  - 5. Side panel URL: GOTO side-panel.html?screenshot=1&url=encode(screenshotPopupUrl)&title=encode(screenshotPopupTitle); SET viewport width 360 (or 240); WAIT for tab content; CAPTURE screenshot (This Page, then By Tag, Tabs, etc.); output side-panel-bookmark.png, side-panel-tags-tree.png, side-panel-tabs.png
  - 6. record-demo-side-panel-this-page: SEED chrome.storage.local with placeholderStorageSeed via options page; GOTO side-panel.html?screenshot=1&url=...&title=...; record frames; assemble GIF

## SCREENSHOT_THEME_CONTRACT

- [IMPL-SCREENSHOT_MODE] [IMPL-POPUP_THEME_CSS] [ARCH-THEME] [REQ-DARK_THEME] How: Connects screenshot seed theme selection to the popup stylesheet contract before browser capture.
- Contract:
  - INPUT: screenshot seed, selected theme, popup stylesheet
  - PRE: screenshot seed and popup stylesheet are readable
  - OUTPUT: screenshot capture configuration with a supported theme
  - POST:
    - success => selected/default theme has a matching popup CSS rule
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: SCREENSHOT_THEME_CONTRACT
  - Read selected/default theme from screenshot seed
  - Read theme selectors from popup stylesheet
  - ASSERT selected/default theme is supported
