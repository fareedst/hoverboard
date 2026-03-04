# Changelog

All notable changes to the Hoverboard Browser Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **By Tag tab demo GIF: align with demo_gif_standard** ([IMPL-DEMO_OVERLAY], [PROC-DEMO_RECORDING], [REQ-SIDE_PANEL_TAGS_TREE], [IMPL-SIDE_PANEL_TAGS_TREE], [PROC-TIED_DEV_CYCLE]) – The By Tag tab demo ([docs/demo-side-panel-by-tag.gif](docs/demo-side-panel-by-tag.gif)) now follows the same standard as Bookmarks, Tabs, This Page, and Usage: **starts** with the By Tag tab already visible (script persists `hoverboard_sidepanel_active_tab=tagsTree` before opening the panel), 1 s no-overlay static frame (frame 0), overlay header rgba(0,0,0,0.78), overlay descriptions 30–50% longer, RATE=1.25, per-step highlights scoped to `#tagsTreePanel` (Viewing By Tag, Filtering by tag, Tree updated, Search bookmarks, Match count, Opening URL), **ends** with a 0.5 s frame showing the Hoverboard icon; GIF build uses 3-part ffmpeg concat (no-overlay 1 s, main 1 fps, end 0.5 s). E2E: new test in `extension-messaging.spec.js` asserts the panel opens on the By Tag tab when storage is set to `tagsTree`. Script: `scripts/record-demo-side-panel-by-tag.js`. TIED: IMPL-DEMO_OVERLAY code_locations, essence_pseudocode, and traceability.tests updated for By Tag demo; README By Tag subsection updated.

- **This Page tab demo GIF: align with demo_gif_standard** ([IMPL-DEMO_OVERLAY], [PROC-DEMO_RECORDING], [REQ-SIDE_PANEL_POPUP_EQUIVALENT], [IMPL-SIDE_PANEL_BOOKMARK], [PROC-TIED_DEV_CYCLE]) – The This Page tab demo ([docs/demo-side-panel-this-page.gif](docs/demo-side-panel-this-page.gif)) now follows the same standard as Bookmarks, Tabs, and Usage: **starts** with a 1 s no-overlay static frame (frame 0) after the panel is ready, overlay header rgba(0,0,0,0.78), overlay descriptions 30–50% longer, RATE=1.25, per-step highlights scoped to `#bookmarkPanel`, **ends** with a 0.5 s frame showing the Hoverboard icon (end card); GIF build uses 3-part ffmpeg concat (no-overlay 1 s, main 1 fps, end 0.5 s). Script: `scripts/record-demo-side-panel-this-page.js`. TIED: IMPL-DEMO_OVERLAY code_locations, essence_pseudocode, and traceability.tests updated for This Page demo; README This Page subsection updated.

- **Usage tab demo GIF: align with demo_gif_standard** ([IMPL-DEMO_OVERLAY], [PROC-DEMO_RECORDING], [REQ-BOOKMARK_USAGE_TRACKING], [IMPL-BOOKMARK_USAGE_TRACKING_UI], [PROC-TIED_DEV_CYCLE]) – The Usage tab demo ([docs/demo-side-panel-usage.gif](docs/demo-side-panel-usage.gif)) now follows the same standard as Bookmarks and Tabs: **starts** with the Usage tab already visible (script persists `hoverboard_sidepanel_active_tab=usage` before opening the panel), 1 s no-overlay static frame (frame 0), overlay header rgba(0,0,0,0.78), overlay descriptions 30–50% longer, RATE=1.25, per-step highlights scoped to `#usagePanel` (toolbar, Most Visited, Recently Visited, Refresh, Navigation Graph), **ends** with a 0.5 s frame showing the Hoverboard icon; GIF build uses 3-part ffmpeg concat (no-overlay 1 s, main 1 fps, end 0.5 s). E2E: new test in `extension-usage-tracking.spec.js` asserts the panel opens on the Usage tab when storage is set. Side panel: `loadPersistedTab()` and storage-change listener now accept `usage` so the persisted Usage tab is restored on load. TIED: IMPL-DEMO_OVERLAY code_locations, essence_pseudocode, traceability.tests, and cross_references updated for Usage demo.

- **Tabs tab demo GIF: updated per demo_gif_standard; script audit and regeneration** ([IMPL-DEMO_OVERLAY], [PROC-DEMO_RECORDING], [REQ-SIDE_PANEL_BROWSER_TABS], [PROC-TIED_DEV_CYCLE]) – The Tabs tab demo GIF ([docs/demo-side-panel-tabs.gif](docs/demo-side-panel-tabs.gif)) was regenerated following the full PROC-TIED_DEV_CYCLE. Script `record-demo-side-panel-tabs.js` audited against [demo_gif_standard](docs/development/demo-gif-standard.md); semantic token comments added to steps 5a/5b and 8a/8b. E2E: new test in `extension-demo-tabs.spec.js` asserts Tabs panel shows filter and Copy Records when opened with `hoverboard_sidepanel_active_tab=browserTabs`; token comments aligned in demo specs. TIED: IMPL-DEMO_OVERLAY traceability.tests updated with both extension-demo-tabs tests; README Tabs subsection mentions `npm run record:demo:tabs`.

- **Tabs tab demo GIF: align with demo_gif_standard** ([IMPL-DEMO_OVERLAY], [PROC-DEMO_RECORDING], [REQ-SIDE_PANEL_BROWSER_TABS]) – The Tabs tab demo ([docs/demo-side-panel-tabs.gif](docs/demo-side-panel-tabs.gif)) now follows the same standard as the Bookmarks demo: **starts** with a 1 s static frame (script persists `hoverboard_sidepanel_active_tab=browserTabs` before opening so the Tabs tab is visible from frame 0), presentation rate 25% slower (RATE=1.25), overlay header background rgba(0,0,0,0.78), overlay descriptions 30–50% longer, **ends** with a 0.5 s frame showing the Hoverboard icon (interstitial). GIF build uses 3-part ffmpeg concat (no-overlay 1 s, main 1 fps, end 0.5 s). E2E test asserts the panel opens on the Tabs tab when storage is set. TIED: IMPL-DEMO_OVERLAY essence_pseudocode and code_locations updated for Tabs demo; README Tabs subsection updated.

- **Bookmarks demo GIF: start on tab, end card, slower and clearer** ([IMPL-DEMO_OVERLAY], [PROC-DEMO_RECORDING], [REQ-SIDE_PANEL_BROWSER_BOOKMARKS]) – The Bookmarks tab demo ([docs/demo-side-panel-bookmarks.gif](docs/demo-side-panel-bookmarks.gif)) now **starts** with the Bookmarks tab already visible (script sets `hoverboard_sidepanel_active_tab` before opening the side panel). The GIF **ends** with a 0.5 s frame showing the Hoverboard icon centered on screen. Overlay descriptions are 30–50% longer; presentation rate is 25% slower (RATE=1.25); overlay header background is slightly more opaque (rgba 0.78). E2E test asserts the panel opens on the Bookmarks tab when storage is set. TIED: IMPL-DEMO_OVERLAY essence_pseudocode and code_locations updated.

### Added

- **Demo scripts: By Tag and Tabs highlights; Bookmarks tab demo GIF** ([IMPL-DEMO_OVERLAY], [PROC-DEMO_RECORDING], [REQ-SIDE_PANEL_TAGS_TREE], [REQ-SIDE_PANEL_BROWSER_BOOKMARKS], [REQ-SIDE_PANEL_BROWSER_TABS]) – **By Tag** ([docs/demo-side-panel-by-tag.gif](docs/demo-side-panel-by-tag.gif)): added highlights for **Bookmarks under selected tags** (#treeContainer) and **Opens in new tab** (first .tree-bookmark-link), plus an extra beat at the end of the animation. **Tabs** ([docs/demo-side-panel-tabs.gif](docs/demo-side-panel-tabs.gif)): every step now has an element highlight (tab bar for steps 1–3, then #browserTabsPanel elements: list, display mode, filter, Copy Records/URLs, etc.). **Bookmarks**: new script `scripts/record-demo-side-panel-bookmarks.js` seeds Chrome bookmarks (folder + 5–10 items) and records the Bookmarks tab (search, folder, sort, count, click URL); output [docs/demo-side-panel-bookmarks.gif](docs/demo-side-panel-bookmarks.gif). TIED: IMPL-DEMO_OVERLAY and PROC-DEMO_RECORDING updated; README documents all three demos.

- **By Tag demo GIF: Filtering by tag and # matches highlights** ([IMPL-DEMO_OVERLAY], [PROC-DEMO_RECORDING], [REQ-SIDE_PANEL_TAGS_TREE], [REQ-SIDE_PANEL_BOOKMARK_SEARCH]) – The By Tag / Tags tree demo ([docs/demo-side-panel-by-tag.gif](docs/demo-side-panel-by-tag.gif)) now highlights and explains **Filtering by tag** (tag selector section with overlay: only bookmarks that have at least one selected tag are shown in the tree) and the **# matches** count (Search bookmarks input and count element; overlay explains that the count updates as you type). The demo script uses `highlightElement` / `clearHighlight` scoped to `#tagsTreePanel`, same pattern as the This Page demo. E2E test asserts that typing in Search bookmarks updates `#searchCount` (N matches / No matches). TIED: IMPL-DEMO_OVERLAY essence_pseudocode and code_locations updated; IMPL-SIDE_PANEL_TAGS_TREE code_locations note for demo search count.

- **Richer data for By Tag demo GIF** ([IMPL-SIDE_PANEL_TAGS_TREE], [PROC-DEMO_RECORDING], [REQ-SIDE_PANEL_TAGS_TREE]) – The By Tag / Tags tree demo ([docs/demo-side-panel-by-tag.gif](docs/demo-side-panel-by-tag.gif)) now uses a rich placeholder dataset (`tagsTreePlaceholderBookmarks` in `tags-tree-demo-data.js`): 25+ bookmarks, 15+ tags, overlapping tags, and `time`/`updated_at`/`extended` so the GIF demonstrates tag selector, tree, time/domain filters, and search. Unit tests in `tests/unit/tags-tree-demo-data.test.js` assert shape and minimum size; E2E test in `extension-messaging.spec.js` asserts demo=1 shows many tag checkboxes and tree sections with links. TIED: IMPL-SIDE_PANEL_TAGS_TREE and IMPL-DEMO_OVERLAY updated; README notes rich placeholder data for the By Tag demo.

- **Screenshot/demo: all three tag sections in This Page tab** ([IMPL-SCREENSHOT_MODE], [REQ-RECENT_TAGS_SYSTEM], [REQ-SUGGESTED_TAGS_FROM_CONTENT]) – Placeholder screenshots and demo GIF now populate **Current Tags** (from seeded bookmark), **Recent Tags** (seeded `hoverboard_demo_recent_tags` in screenshot mode), and **Suggested Tags** (seeded `hoverboard_demo_suggested_tags`) so `side-panel-bookmark.png` shows all three sections. Added `placeholderRecentTags` and `hoverboard_demo_recent_tags` to the seed; PopupController in screenshot mode calls `loadDemoRecentTagsIfScreenshotMode()` and filters out current bookmark tags. Screenshot script waits for Suggested Tags container to have a tag (timeout 3s) before capturing. Seed-from-file adds default demo tag keys when missing. Unit tests: `loadDemoRecentTagsIfScreenshotMode`, `placeholderStorageSeed.hoverboard_demo_recent_tags`, `placeholderRecentTags`. TIED: IMPL-SCREENSHOT_MODE demo recent tags overlay and REQ-RECENT_TAGS_SYSTEM.

- **Bookmark tab screenshot and demo: sample Suggested Tags, Tag with AI highlight** ([IMPL-SCREENSHOT_MODE], [IMPL-DEMO_OVERLAY], [REQ-SUGGESTED_TAGS_FROM_CONTENT], [REQ-AI_TAGGING_POPUP], [PROC-TIED_DEV_CYCLE]) – In screenshot/demo mode the This Page tab now shows **sample Suggested Tags** (seeded via `hoverboard_demo_suggested_tags` in placeholder storage) so the Suggested Tags section is visible in static screenshots and the demo GIF. The demo script highlights and describes the **Tag with AI** button (get AI-suggested tags for this page; set API key in Options). Placeholder data exports `placeholderSuggestedTags` and `placeholderStorageSeed` includes `hoverboard_demo_suggested_tags`; PopupController in screenshot mode reads that key and calls `updateSuggestedTags` after load. Unit tests: `loadDemoSuggestedTagsIfScreenshotMode` (popup-suggested-tags.test.js), seed shape and `placeholderSuggestedTags` (screenshot-placeholder-data.test.js). TIED: IMPL-DEMO_OVERLAY step order and REQ-AI_TAGGING_POPUP; IMPL-SCREENSHOT_MODE demo suggested tags overlay and traceability.tests.

- **Bookmark demo GIF: section highlights and descriptions** ([IMPL-DEMO_OVERLAY], [PROC-DEMO_RECORDING], [REQ-SIDE_PANEL_POPUP_EQUIVALENT], [REQ-MOVE_BOOKMARK_STORAGE_UI], [REQ-RECENT_TAGS_SYSTEM], [REQ-SUGGESTED_TAGS_FROM_CONTENT]) – The This Page tab demo script (`scripts/record-demo-side-panel-this-page.js`) now highlights and describes each major section: Quick Actions row, Save to (Storage), Recent Tags, Suggested (recommended) Tags, Search Tabs, and footer buttons. Element highlight helpers (`highlightElement` / `clearHighlight`) apply an outline to the active section; the add-tag flow populates Recent Tags so they appear in the GIF. E2E test in `extension-usage-tracking.spec.js` asserts This Page panel has Quick Actions, Storage, tag sections, Search Tabs, and footer. TIED: IMPL-DEMO_OVERLAY essence_pseudocode and code_locations updated; README documents the demo sections and script.

- **Richer placeholder data for Bookmark tab screenshot and demo GIF** ([IMPL-SCREENSHOT_MODE], [REQ-LOCAL_BOOKMARKS_INDEX], [PROC-DEMO_RECORDING]) – Placeholder bookmark data used for README/docs media is expanded to 15+ entries with varied tags, descriptions, and to-read state. The Pinboard entry is a “hero” bookmark (6+ tags, extended note, read-later on) so the **This Page** tab screenshot and [docs/demo-side-panel-this-page.gif](docs/demo-side-panel-this-page.gif) show a robust use case. The screenshot script opens the side panel with `?screenshot=1&url=...&title=...` so the Bookmark tab displays the Pinboard bookmark; the demo script seeds storage and uses the same URL params so the GIF shows the same rich state. Unit tests in `tests/unit/screenshot-placeholder-data.test.js` assert seed shape, Pinboard hero entry, and storageIndex consistency. TIED: IMPL-SCREENSHOT_MODE essence_pseudocode and traceability.tests updated; IMPL-BOOKMARK_USAGE_TRACKING detail YAML parse fix (quoted summary).

- **Usage tracking UX: This Page inline stats, Index columns, Usage tab** ([REQ-BOOKMARK_USAGE_TRACKING], [ARCH-BOOKMARK_USAGE_TRACKING_UI], [IMPL-BOOKMARK_USAGE_TRACKING_UI], [PROC-TIED_DEV_CYCLE]) – Three surfaces for bookmark visit data. **This Page:** In the side panel This Page tab, a **Usage** section appears when the current bookmark has visit data (visit count, last visited time, top referrer). **Bookmarks Index:** Table has sortable **Visits** and **Last Visited** columns; data merged from `getBookmarkUsage()` after loading bookmarks. **Usage tab:** New side panel tab with **Most Visited** (top 10 by count), **Recently Visited** (top 10 by recency), and **Navigation Graph** (referrer → URL edges); Refresh button. Message `getBookmarkInboundLinks` added for This Page referrer line. Unit tests: `mergeUsageIntoBookmarks`, `buildMostVisitedList`, `buildRecentlyVisitedList`, `buildNavigationGraphGroups`, side-panel tab state (TAB_USAGE, usageVisible). TIED: REQ satisfaction criteria, ARCH-BOOKMARK_USAGE_TRACKING_UI, IMPL-BOOKMARK_USAGE_TRACKING_UI with essence_pseudocode.

### Fixed

- **Extension icon click opened side panel in wrong window** ([REQ-ICON_CLICK_BEHAVIOR], [ARCH-ICON_CLICK_BEHAVIOR], [IMPL-ICON_CLICK_BEHAVIOR]) – Clicking the extension icon in one window could open or close the side panel in a different (previously focused) window. The handler now uses the tab Chrome passes to `action.onClicked` and opens the panel in that tab’s window; the cache is updated from the clicked tab when the tab URL is not restricted. Unit tests added for tab-from-onClicked and restricted-URL cache behavior. TIED: REQ/ARCH/IMPL and essence_pseudocode updated.

- **Extension icon click fails immediately after load (cold start)** ([REQ-ICON_CLICK_BEHAVIOR], [ARCH-ICON_CLICK_BEHAVIOR], [IMPL-ICON_CLICK_BEHAVIOR], [IMPL-EXTENSION_COMMANDS], [IMPL-CONTEXT_MENU_QUICK_ACCESS]) – Clicking the extension icon right after browser or extension load no longer fails. The service worker previously relied on `_sidePanelWindowId` from async `_seedSidePanelWindowCache()`, which had not completed yet. A cold-start fallback now uses `chrome.tabs.query({ active: true, currentWindow: true }, callback)` to resolve the active tab and open the side panel in the callback, preserving the user gesture (Chrome requires `sidePanel.open()` within ~1ms of the gesture; await loses it). The same fallback applies to extension commands, context menu, and OPEN_SIDE_PANEL message when opening the side panel. New helper `_openSidePanelWithFallback()` used by handleCommand, context menu, and OPEN_SIDE_PANEL handler. Unit tests: handleActionClick, handleCommand, and context menu with `_sidePanelWindowId` null. E2E: `tests/playwright/extension-icon-click.spec.js` validates popup OPEN_SIDE_PANEL, Open Tags tree button, and direct side panel load. TIED: IMPL-ICON_CLICK_BEHAVIOR essence_pseudocode and implementation_approach updated; e2e cold-start recommendation added.

### Added

- **Side panel Tabs tab: recently closed tabs as searchable page activity** ([REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS], [ARCH-SIDE_PANEL_RECENTLY_CLOSED_TABS], [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS]) – A tab source control lets you list **Open** tabs (default), **Recently closed** tabs (Chrome only), or **Both**. Recently closed tabs are fetched via `chrome.sessions.getRecentlyClosed` and normalized to the same format as open tabs. **Restore** reopens a closed tab. **Copy Records** for closed tabs includes `sessionId` and `lastModified`. When the tab source includes closed tabs, **Page text** and **Elements** search scopes are disabled (only **Tab info** applies). Gather and Distribute are hidden when the list contains only closed tabs. When `chrome.sessions` is unavailable (e.g. Safari), the Recently closed and Both options are hidden. Unit tests: `normalizeClosedSessions`, `filterBrowserTabs` with closed tabs, `buildRecordsYamlForCopy` with sessionId/lastModified, GET_RECENTLY_CLOSED_TABS in service worker. TIED: REQ/ARCH/IMPL with essence_pseudocode.

### Changed

- **Side panel header: single line (title+version left, build time right)** ([IMPL-SIDE_PANEL_TABS], [REQ-SIDE_PANEL_POPUP_EQUIVALENT]) – The side panel header is now one line: "Hoverboard vX.Y.Z" on the left and the build timestamp (UTC) on the right, instead of two lines. Unit tests: `setSidePanelVersion` in `side-panel-initial-tab-init.test.js` assert left and right elements. E2E: `extension-messaging.spec.js` asserts header row has left text matching `Hoverboard v*` and right text matching `YYYY-MM-DD HH:mm`. TIED: IMPL-SIDE_PANEL_TABS implementation_approach, essence_pseudocode, and code_locations updated.

- **Extension icon click opens side panel in clicked window** ([REQ-ICON_CLICK_BEHAVIOR], [ARCH-ICON_CLICK_BEHAVIOR], [IMPL-ICON_CLICK_BEHAVIOR]) – The icon click handler uses the **tab** Chrome passes to `action.onClicked`; that tab’s `windowId` is used so the panel opens in the window where the user clicked. When the tab is not provided (e.g. programmatic call), the handler falls back to cached `_sidePanelWindowId`. Extension commands, context menu, and OPEN_SIDE_PANEL from the popup use `_openSidePanelWithFallback()` (cached or cold-start). TIED: REQ/ARCH/IMPL essence_pseudocode and implementation_approach updated.

- **Side panel Tabs tab: labels "Important elements" and "Important tag sources" → "Elements"** ([REQ-SIDE_PANEL_BROWSER_TABS], [ARCH-SIDE_PANEL_BROWSER_TABS], [IMPL-SIDE_PANEL_BROWSER_TABS]) – In the **Tabs** tab the search scope option and the DOM sources textbox label are both now **Elements** (was "Important elements" and "Important tag sources"). TIED: REQ/ARCH/IMPL updated; README and tests updated.

- **Side panel tab labels: Bookmark → This Page, Tags tree → By Tag** ([REQ-SIDE_PANEL_POPUP_EQUIVALENT], [IMPL-SIDE_PANEL_TABS], [PROC-TIED_DEV_CYCLE]) – The first two side panel tabs are now labeled **This Page** (was "Bookmark") and **By Tag** (was "Tags tree"). The **Tabs** and **Bookmarks** tab labels are unchanged. Footer button in the This Page panel that switches to the tag tree is labeled "By Tag". Scripts (`screenshots-placeholder.js`, `record-demo-side-panel-this-page.js`, `record-demo-side-panel-by-tag.js`, `record-demo-side-panel-tabs.js`), tests (`extension-messaging.spec.js`), README, `tied/processes.md`, and IMPL-DEMO_OVERLAY/IMPL-SCREENSHOT_MODE/IMPL-SIDE_PANEL_SNAPSHOT updated to use the new labels.

- **TIED sync: side panel tab labels in REQ/ARCH/IMPL** ([REQ-SIDE_PANEL_POPUP_EQUIVALENT], [IMPL-SIDE_PANEL_TABS], [PROC-TIED_DEV_CYCLE]) – IMPL-SIDE_PANEL_TABS updated with display labels (This Page, By Tag) throughout rationale, implementation_approach, code_locations, and essence_pseudocode; every pseudo-code block has semantic-token comments. New unit test `tests/unit/side-panel-html.test.js` asserts tab button labels in side-panel.html (This Page, By Tag, Tabs, Bookmarks). Unit test describe in `side-panel-tabs.test.js` renamed to "refresh when switching to This Page tab". Recommended E2E: assert tab bar buttons have visible text "This Page", "By Tag", "Tabs", "Bookmarks" after loading side panel.

### Added

- **Side panel Bookmarks tab: Chrome browser bookmarks** ([REQ-SIDE_PANEL_BROWSER_BOOKMARKS], [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS], [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS], [PROC-TIED_DEV_CYCLE]) – A new **Bookmarks** tab in the side panel lists Chrome browser bookmarks from `chrome.bookmarks.getTree`. **Core:** flat list with title, URL, favicon, folder path; real-time search (case-insensitive) across title, URL, and folder path; folder dropdown to filter by folder; match count; click URL to open in new tab; Refresh. **Sort:** Date (newest/oldest), Name (A–Z/Z–A), Chrome default order; preference persisted in chrome.storage.local. **Bulk:** checkbox per row; Select all / Deselect all; Open in tabs, Open in window; Copy URLs; Move to folder; Delete (with confirmation); Export selected as HTML (Netscape format) or CSV; Export all as HTML or CSV. **Undo:** session-scoped undo stack for deleted bookmarks; "Deleted N bookmarks. Undo" message with 10s auto-dismiss. **Import:** HTML (Netscape) or CSV into selected folder; conflict resolution (skip duplicates or overwrite); progress indicator. **Polish:** inline edit (double-click title or URL); keyboard shortcuts (Ctrl+F focus search, Escape clear selection); manifest command `open-side-panel-browser-bookmarks` for direct access. Layout matches Tags tree and Tabs. Unit tests: `flattenBookmarkTree`, `filterBrowserBookmarks`, `buildFolderTree`, `sortBrowserBookmarks`, `buildBookmarksHtml`, `buildBookmarksCsv`, `parseBookmarksHtml`, `parseBookmarksCsv`, `getFaviconSrc`. TIED: REQ/ARCH/IMPL with essence_pseudocode.

- **Side panel Bookmark and Tags tree: demo GIFs** ([PROC-DEMO_RECORDING], [IMPL-DEMO_OVERLAY], [REQ-SIDE_PANEL_POPUP_EQUIVALENT], [REQ-SIDE_PANEL_TAGS_TREE], [IMPL-SIDE_PANEL_BOOKMARK], [IMPL-SIDE_PANEL_TAGS_TREE], [PROC-TIED_DEV_CYCLE]) – Animated demos for the **Bookmark** tab ([docs/demo-side-panel-this-page.gif](docs/demo-side-panel-this-page.gif)) and **Tags tree** tab ([docs/demo-side-panel-by-tag.gif](docs/demo-side-panel-by-tag.gif)), same look and feel as the Tabs demo (overlay, viewport, ffmpeg two-pass GIF). Scripts: `scripts/record-demo-side-panel-this-page.js`, `scripts/record-demo-side-panel-by-tag.js`. [PROC-DEMO_RECORDING] and [IMPL-DEMO_OVERLAY] updated in `tied/processes.md` and `tied/implementation-decisions/IMPL-DEMO_OVERLAY.yaml`.

- **Side panel Tabs tab: demo GIF (find and export)** ([PROC-DEMO_RECORDING], [REQ-SIDE_PANEL_BROWSER_TABS], [IMPL-SIDE_PANEL_BROWSER_TABS], [PROC-TIED_DEV_CYCLE]) – A brief animated demo at [docs/demo-side-panel-tabs.gif](docs/demo-side-panel-tabs.gif) shows opening the side panel, switching to the **Tabs** tab, and exporting visible tab records (Copy Records). Recorded via Playwright E2E and converted to GIF. Process [PROC-DEMO_RECORDING] documented in `tied/processes.md`; script `scripts/record-demo-side-panel-tabs.js` and spec `tests/playwright/extension-demo-tabs.spec.js` for future demos.

- **Side panel header: version and compile time (UTC)** ([IMPL-SIDE_PANEL_TABS], [REQ-SIDE_PANEL_POPUP_EQUIVALENT]) – After the "Hoverboard" title in the side panel, the extension version (from the manifest) and build compile time in UTC (YYYY-MM-DD HH:mm) are shown. Compile time is injected at build via `scripts/build.js` writing `src/ui/side-panel/build-info.js` before the side-panel bundle. Unit test: `setSidePanelVersion` in `side-panel-initial-tab-init.test.js`.

- **Side panel Tabs tab: per-row close-tab button** ([REQ-SIDE_PANEL_BROWSER_TABS], [ARCH-SIDE_PANEL_BROWSER_TABS], [IMPL-SIDE_PANEL_BROWSER_TABS]) – In the **Tabs** tab each tab row has a **Close tab** button (✕) before the window/tab id line (in Block mode) or before the title/URL link (in Title/URL mode). Clicking it closes that single tab via `chrome.tabs.remove` and refreshes the list. The existing remove-from-display button (×) remains after the tab id. Unit tests: card has `[data-action="closeTab"]`; clicking it calls `chrome.tabs.remove` with the tab id. TIED: IMPL-SIDE_PANEL_BROWSER_TABS detail and essence_pseudocode updated.

### Changed

- **Demo GIF: three more Tabs features** ([PROC-DEMO_RECORDING], [REQ-SIDE_PANEL_BROWSER_TABS]) – The Tabs demo GIF now also shows **list display mode** (Title view then back to Block), **remove from list** (hide a tab from the list without closing it), and **Refresh** (reload list; hidden tab reappears). Script `scripts/record-demo-side-panel-tabs.js` updated with steps 5a/5b and 8a/8b; GIF re-generated at [docs/demo-side-panel-tabs.gif](docs/demo-side-panel-tabs.gif).

- **Demo overlay: top position, larger text, five text classes with colors** ([PROC-DEMO_RECORDING], [IMPL-DEMO_OVERLAY], [PROC-TIED_DEV_CYCLE]) – The Tabs demo recording overlay is now at the **top** of the window (was bottom), uses **larger text** (18px), and five **overlay text classes** with distinct colors: intro (neutral), navigation (blue), state (amber), action (cyan), result (green). Each of the 12 demo steps is mapped to a class. GIF re-generated at [docs/demo-side-panel-tabs.gif](docs/demo-side-panel-tabs.gif). TIED: [IMPL-DEMO_OVERLAY] added; [PROC-DEMO_RECORDING] updated in `tied/processes.md`.

- **Side panel Tabs tab: always use Important tag sources textbox** ([REQ-SIDE_PANEL_BROWSER_TABS], [ARCH-SIDE_PANEL_BROWSER_TABS], [IMPL-SIDE_PANEL_BROWSER_TABS]) – The "Use custom DOM sources" checkbox next to the Important tag sources textbox has been removed. The textbox list is always used when the search scope is **Important elements**; an empty textbox falls back to the default list. Label for the textbox is now "Important tag sources". TIED: REQ/ARCH/IMPL updated; E2E snapshot no longer includes `hasImportantElementsCheckbox`.

### Added

- **Extension icon single-click opens side panel; options toggle for popup** ([REQ-ICON_CLICK_BEHAVIOR], [ARCH-ICON_CLICK_BEHAVIOR], [IMPL-ICON_CLICK_BEHAVIOR]) – Single click on the extension toolbar icon now opens the **side panel** by default (previously the icon opened the popup). In **Options** → **Extension icon**, a new toggle **Single click on extension icon opens side panel** (checked by default) lets you switch to opening the **popup** instead when unchecked. Implemented by removing `action.default_popup` from the manifest and handling `chrome.action.onClicked` in the service worker; config key `iconClickOpensSidePanel` is persisted via ConfigManager.

- **Keyboard shortcuts for each side panel tab and four suggested shortcuts** ([REQ-QUICK_ACCESS_ENTRY], [IMPL-EXTENSION_COMMANDS]) – Three extension commands open the side panel on a specific tab: **Ctrl+Shift+1** (Bookmark tab), **Ctrl+Shift+2** (Tags tree tab), **Ctrl+Shift+3** (Tabs tab). Chrome allows at most four suggested shortcuts per extension; the extension uses those four for the three tab commands plus **Ctrl+Shift+B** (bookmarks index). Other commands (open side panel, options, import) have no default shortcut and can be assigned in `chrome://extensions/shortcuts`. When the panel is already open, triggering a tab shortcut updates the visible tab via `storage.onChanged`.

- **Side panel Tabs tab: layout (Title/URL/Block above list) and stats line** ([REQ-SIDE_PANEL_BROWSER_TABS], [ARCH-SIDE_PANEL_BROWSER_TABS], [IMPL-SIDE_PANEL_BROWSER_TABS], [PROC-TIED_DEV_CYCLE]) – In the **Tabs** tab the **Show: Title | URL | Block** control is now placed immediately above the tab list (inside the list section). A stats line above the **Tags** batch bookmark section shows: number of windows in the display group / total windows open, and number of tabs in the display group / total tabs open (display group = tabs currently shown in the list; totals from `chrome.windows.getAll` and `chrome.tabs.query({})`). Unit tests: stats line shows correct display/total after loadTabs; stats line renders when windows API unavailable. E2E snapshot: `hasDisplayModeAboveList`, `hasStatsLine`. TIED: REQ/ARCH/IMPL satisfaction criteria and essence_pseudocode updated.

- **Side panel Tabs tab: control groups, Important elements, checkbox + DOM sources** ([REQ-SIDE_PANEL_BROWSER_TABS], [ARCH-SIDE_PANEL_BROWSER_TABS], [IMPL-SIDE_PANEL_BROWSER_TABS], [PROC-TIED_DEV_CYCLE]) – In the **Tabs** tab: control groups with very narrow margins group UI controls; search scope label **Important tags** renamed to **Important elements**; a checkbox **Important elements** is now adjacent to the DOM sources textbox (when checked, the textbox list is used for Important elements search; when unchecked, the default list is used; checkbox state persisted). Title / URL / Block line remains above the filter textbox. E2E snapshot: `hasImportantElementsCheckbox`, `hasControlGroups`. TIED: REQ/ARCH/IMPL updated with control groups, Important elements naming, and checkbox semantics.

- **Side panel Tabs tab: sections, tooltips, favicon, important-tag sources, Gather, Distribute** ([REQ-SIDE_PANEL_BROWSER_TABS], [ARCH-SIDE_PANEL_BROWSER_TABS], [IMPL-SIDE_PANEL_BROWSER_TABS], [PROC-TIED_DEV_CYCLE]) – In the **Tabs** tab: controls are grouped into sections (Scope, Filter & display, Batch bookmark, List actions, Window actions); each control has a short tooltip (`title`/`aria-label`). Each list item shows the tab’s favicon (before title/URL in all display modes; placeholder when missing). A text input **Important tag sources** (comma-separated, e.g. `title, meta description, og:title, h1, h2, h3, img alt, a title`) configures which DOM sources are collected when filtering by **Important tags**; the list is persisted (saved on blur to chrome.storage.local) and applied on subsequent searches and refresh. **Gather into this window** moves all visible tabs into the current window; **One window per tab** moves each visible tab into its own window (tabs already alone are unchanged). Unit tests: `parseImportantTagSources`, favicon img and favicon placeholder in card, important-tag sources persistence (storage read on init, save on blur), Gather (tabs.move for tabs not in current window), Distribute (windows.create when window has >1 tab), GET_TABS_IMPORTANT_TAGS with `importantTagSources` args. E2E snapshot: `browserTabsTab` includes `hasGatherButton`, `hasDistributeButton`, `hasImportantTagSourcesInput`, `hasSections`. TIED: REQ/ARCH/IMPL satisfaction criteria, code_locations (getFaviconSrc), and essence_pseudocode updated.

- **Side panel Tabs tab: clickable title/URL in non-block mode, remove icon placement** ([REQ-SIDE_PANEL_BROWSER_TABS], [ARCH-SIDE_PANEL_BROWSER_TABS], [IMPL-SIDE_PANEL_BROWSER_TABS]) – In Title or URL display mode the displayed text is now clickable to switch to that window and tab (same focus behavior as the ids line in Block). The remove icon (×) appears after the text in Title/URL mode and before the Tags line in Block mode. Unit tests: focus link and remove icon in title/url mode, clicking title or URL calls windows.update and tabs.update. TIED: REQ/ARCH/IMPL updated with new satisfaction criteria, essence_pseudocode, and recommended E2E; getDisplayedTabs in code_locations.

- **Side panel Tabs tab: list display mode (Title | URL | Block) and remove from display** ([REQ-SIDE_PANEL_BROWSER_TABS], [ARCH-SIDE_PANEL_BROWSER_TABS], [IMPL-SIDE_PANEL_BROWSER_TABS], [PROC-TIED_DEV_CYCLE]) – In the side panel **Tabs** tab: a 3-state control **Show: Title | URL | Block** (default Block) chooses what each list item shows (title only, URL only, or full card). In Block view, each card has a clickable remove icon (×) before the Tags line that removes that tab from the displayed list for the session; **Refresh** clears the hidden set and reloads the tab list so all tabs can reappear. Copy, close, and batch bookmark actions act on the currently displayed list only. Unit tests: display mode (title/url/block), remove-from-display, Refresh restores hidden tabs. TIED: REQ/ARCH/IMPL satisfaction criteria and essence_pseudocode updated.

- **Commit message guidelines and project scopes** – CONTRIBUTING.md now includes a full Commit Message Guidelines section (Angular-style format: type(scope): subject, body, footer). Lists supported scopes (core, ui, features, shared, config, offscreen, safari, tied, docs, tests, build, ci, changelog), types (build, ci, chore, docs, feat, fix, perf, refactor, style, test), revert format, and a TIED note for optional REQ/ARCH/IMPL references. Development guide links to CONTRIBUTING for the full format and scopes.

- **Side panel Tabs tab: Close tagged, Close untagged, Refresh** ([REQ-SIDE_PANEL_BROWSER_TABS], [ARCH-SIDE_PANEL_BROWSER_TABS], [IMPL-SIDE_PANEL_BROWSER_TABS], [PROC-TIED_DEV_CYCLE]) – In the side panel **Tabs** tab: **Close tagged** closes only the displayed tabs that have at least one bookmark tag (after confirmation); **Close untagged** closes only the displayed tabs that have no bookmark tags (after confirmation); **Refresh** reloads the tab list (and window/tabs used) so the list reflects current state when tabs are closed outside the panel. Unit tests: close tagged/untagged filter by `bookmarkTags`, refresh invokes loadTabs. TIED: REQ satisfaction criteria and IMPL essence_pseudocode updated.

### Fixed

- **Side panel Tabs: Add tags on URL without bookmark reported "0 tabs modified"** ([REQ-SIDE_PANEL_BROWSER_TABS], [ARCH-SIDE_PANEL_BROWSER_TABS], [IMPL-SIDE_PANEL_BROWSER_TABS]) – The service worker was double-wrapping the getCurrentBookmark handler response as `{ success: true, data: response }`, so the panel received the bookmark at `reply.data.data` and `reply.data.url` was undefined. The service worker now returns the handler response as-is. The message handler’s getCurrentBookmark returns a plain `dataOut` object (url, exists, tags, etc.) so these fields survive structured clone to the panel. Add tags (and set to-read) now correctly see `reply.data.url` and can create or update bookmarks.

- **Side panel Tabs: Set to-read was clearing existing tags** ([REQ-SIDE_PANEL_BROWSER_TABS], [ARCH-SIDE_PANEL_BROWSER_TABS], [IMPL-SIDE_PANEL_BROWSER_TABS]) – The panel now fetches the current bookmark first via getCurrentBookmark; when a bookmark exists, it sends saveBookmark with `{ ...reply.data, toread: 'yes' }` so tags and other fields are preserved. When no bookmark exists, a new one is created with toread: 'yes'. Only http(s) URLs are processed for Set to-read.

### Added

- **Side panel Tabs tab: clickable window/tab id and bookmark tags** ([REQ-SIDE_PANEL_BROWSER_TABS], [ARCH-SIDE_PANEL_BROWSER_TABS], [IMPL-SIDE_PANEL_BROWSER_TABS], [PROC-TIED_DEV_CYCLE]) – In the side panel **Tabs** tab, the window id and tab id line in each tab row is now clickable; clicking it focuses the window and activates the tab (`chrome.windows.update` and `chrome.tabs.update`). Each tab row also displays the bookmark tags for that tab’s URL (from the same source as the popup); if there is no bookmark or no tags, "—" is shown. Tags are fetched via getCurrentBookmark when the list loads. Unit tests: clickable ids (data attributes, windows.update/tabs.update on click), bookmark tags display (with and without tags). TIED: REQ/ARCH/IMPL satisfaction criteria and essence_pseudocode updated.

- **Side panel Tabs tab: batch bookmark actions (to-read and tags)** ([REQ-SIDE_PANEL_BROWSER_TABS], [ARCH-SIDE_PANEL_BROWSER_TABS], [IMPL-SIDE_PANEL_BROWSER_TABS], [PROC-TIED_DEV_CYCLE]) – In the side panel **Tabs** tab, above the tab list: **Set to-read** sets the to-read flag for all visible (filtered) tabs’ bookmarks (creates a bookmark if the URL has none); **Clear to-read** clears the to-read flag for existing bookmarks only (URLs with no bookmark are skipped); **Tags** textbox and **Add tags** button add comma-separated tag(s) to all visible tabs’ bookmarks (create bookmark with those tags if missing). Uses existing getCurrentBookmark and saveBookmark messaging; getCurrentBookmark response now includes `exists` so the panel does not create bookmarks when only clearing to-read. Unit tests: batch set to-read, clear to-read (only when exists), add tags (create vs merge). TIED: REQ/ARCH/IMPL extended with batch bookmark criteria and essence_pseudocode.

- **Side panel Tabs tab: layout and scroll like Tags tree** ([REQ-SIDE_PANEL_BROWSER_TABS], [ARCH-SIDE_PANEL_BROWSER_TABS], [IMPL-SIDE_PANEL_BROWSER_TABS], [PROC-TIED_DEV_CYCLE]) – In the side panel **Tabs** tab, the layout now matches **Tags tree**: selection UI (header, window scope, search scope, filter, message, actions) is in an above-list block that scrolls off; the tab list sits in a list section that fills the remaining height and scrolls its contents. Panel is the scroll container so the header and controls can scroll away and the list uses full visible height. E2E snapshot includes `hasAboveList` and `hasListSection`. TIED: IMPL-SIDE_PANEL_BROWSER_TABS updated with panel layout detail and essence_pseudocode block.

- **Tags tree tab: scroll content above list so list fills height** ([REQ-SIDE_PANEL_POPUP_EQUIVALENT], [ARCH-SIDE_PANEL_TABS], [IMPL-SIDE_PANEL_TAGS_TREE], [PROC-TIED_DEV_CYCLE]) – In the side panel **Tags tree** tab, the header/filters/search/tag selector can now scroll out of the way so the bookmarks list can use the full visible height; the list still scrolls independently for long results. Same behavior in standalone `tags-tree.html` for consistency.

- **Side panel README and screenshots** ([IMPL-SCREENSHOT_MODE]) – Side panel section in README now lists all three tabs (Bookmark, Tags tree, Tabs) with subsections and images. Screenshot script extended to capture the Tabs tab (`side-panel-tabs.png` at 240px width). Section retitled to "Side Panel – Bookmark, Tags Tree, and Tabs"; README Screenshots section updated to mention all three side panel images.

- **Side panel Tabs tab: search scope (Tab info / Page text / Important tags)** ([REQ-SIDE_PANEL_BROWSER_TABS], [ARCH-SIDE_PANEL_BROWSER_TABS], [IMPL-SIDE_PANEL_BROWSER_TABS], [PROC-TIED_DEV_CYCLE]) – In the side panel **Tabs** tab you can choose what the filter searches: **Tab info** (default: title, URL, referrer), **Page text** (page body text), or **Important tags** (concatenated text from document title, meta description, og:title, h1–h3, img alt, link titles). When **Page text** or **Important tags** is selected, the panel fetches that data from each tab via the service worker (executeScript per tab) and merges it; a loading state is shown during fetch. Filter is scope-aware and uses the same search box. New message types: `getTabsPageText` and `getTabsImportantTags`. Unit tests: scope-aware `filterBrowserTabs`, pageText/importantTags filter, panel merge and filter when scope is Page text; SW messaging tests for the new message types. TIED: REQ/ARCH/IMPL extended with search-scope criteria and essence_pseudocode.

- **Test coverage review and minimization** ([PROC-TEST_STRATEGY], [IMPL-TESTING], [REQ-MODULE_VALIDATION]) – Coverage gates, gap report, test strategy, integration tests, and targeted unit tests to minimize untested code (Chrome extension `src/` only; Safari excluded). **Coverage and gates:** Jest `coverageThreshold` (global 28% line/branch/function/statement) in `jest.config.js` so CI fails on regressions; `json-summary` reporter for tooling; `scripts/coverage-gap-report.js` lists `src/` files at or below a line-coverage threshold and IMPLs with empty `traceability.tests`; `npm run coverage:gap-report` (optional arg: threshold %). **Test strategy:** New `[PROC-TEST_STRATEGY]` in `tied/processes.md` (E2E for critical journeys; unit+integration cover IMPL/ARCH/REQ; coverage gates and gap report); registered in `semantic-tokens.yaml`. **IMPL traceability:** Test paths added for IMPL-SYNC_BOOKMARK_SERVICE, IMPL-UI_ACTION_CONTRACT, IMPL-CONFIG_MIGRATION, IMPL-MESSAGE_HANDLING, IMPL-BOOKMARK_ROUTER, IMPL-STORAGE_INDEX, IMPL-DOM_UTILITIES, IMPL-BOOKMARK_STATE_SYNC, IMPL-POPUP_BUNDLE; `test_coverage_note` added for 22+ IMPLs with no unit tests (E2E/manual or indirect coverage documented). **Integration tests:** `tests/integration/message-handler-router-storage.integration.test.js` (MessageHandler + BookmarkRouter + StorageIndex + LocalBookmarkService, minimal mocks); `tests/integration/config-manager-load.integration.test.js` (ConfigManager auth and storage mode). **Unit tests:** `message-service.test.js`, `badge-manager.test.js`, `dom-utils.test.js` (newPin, minEmpty), `popup-error-message.test.js`. **Refactor:** Popup error classification extracted to `src/ui/popup/popup-error-message.js` (`getPopupErrorMessage`, `normalizePopupErrorInput`); `popup.js` `handleError` delegates to it. README: coverage script, test strategy, integration tests; CHANGELOG: this entry.

- **Side panel Tabs tab: Copy Records** ([REQ-SIDE_PANEL_BROWSER_TABS], [ARCH-SIDE_PANEL_BROWSER_TABS], [IMPL-SIDE_PANEL_BROWSER_TABS], [PROC-TIED_DEV_CYCLE]) – A **Copy Records** button in the side panel **Tabs** tab copies the full list of visible (filtered) tab records as YAML to the clipboard, including `id`, `windowId`, `title`, `url`, and `referrer` for each tab, and shows a success count. Unit tests: `buildRecordsYamlForCopy` (empty list, one/multiple records, string escaping) and Copy Records button writes YAML to clipboard in `tests/unit/browser-tabs-panel.test.js`.

- **Side panel Tabs tab: window scope toggle and window/tab ids** ([REQ-SIDE_PANEL_BROWSER_TABS], [ARCH-SIDE_PANEL_BROWSER_TABS], [IMPL-SIDE_PANEL_BROWSER_TABS]) – The side panel **Tabs** tab now has a **Current window / All windows** toggle (default: current window). Each tab row displays **window id** and **tab id** for identification. Unit tests: window scope (query with `currentWindow: true` vs `{}`), card displays window and tab ids; E2E snapshot includes `hasWindowScopeToggle`. TIED: REQ satisfaction criterion and IMPL essence_pseudocode updated; [PROC-TIED_DEV_CYCLE].

- **Side panel Tabs tab** ([REQ-SIDE_PANEL_BROWSER_TABS], [ARCH-SIDE_PANEL_BROWSER_TABS], [IMPL-SIDE_PANEL_BROWSER_TABS]) – A new **Tabs** tab in the side panel lists all browser tabs (current window) with title, URL, and page referrer (multi-row per tab; referrer is best-effort via scripting). A search box filters the list by title, URL, or referrer (case-insensitive). **Copy URLs** copies the URLs of visible (filtered) tabs to the clipboard and shows a success count. **Close visible tabs** prompts for confirmation, then closes the visible tabs and shows a success count. Unit tests: `tests/unit/browser-tabs-panel.test.js`, `tests/unit/side-panel-tabs.test.js`. E2E: side panel snapshot includes `browserTabsTab`; tab bar asserts three panels. TIED: REQ/ARCH/IMPL and IMPL-SIDE_PANEL_TABS, IMPL-SIDE_PANEL_SNAPSHOT extended; [PROC-TIED_DEV_CYCLE].

- **Pinboard.in with side panel (Bookmark tab) screenshot** ([IMPL-SCREENSHOT_MODE], [REQ-SIDE_PANEL_POPUP_EQUIVALENT], [IMPL-SIDE_PANEL_BOOKMARK]) – The placeholder screenshot script now produces a composite image **pinboard-side-panel-bookmark.png** showing pinboard.in in the main content area with the Hoverboard side panel open and the Bookmark tab visible. Script sets a fixed Pinboard viewport (1024×600), saves a “pinboard only” copy before compositing the popup, reuses that copy after the side panel Bookmark tab is captured, and composites both into one image (1264×600) so the README can show the real layout. README “Side Panel – Bookmark and Tags Tree” section uses this image as the primary figure; “Screenshots” section notes the script output.

- **Tab search no-match: button border feedback instead of error message** ([REQ-TAB_SEARCH_NO_MATCH_UX], [ARCH-TAB_SEARCH_NO_MATCH_FEEDBACK], [IMPL-TAB_SEARCH_NO_MATCH_UI]) – When tab search (popup or side panel) is processed and no tab matches, the "No matching tabs found" error message is no longer shown. Instead, the search button border turns bright red and fades back to the default color within 2 seconds; no new tab is displayed. Other failures (e.g. "Already on last match") still show an error message. Side panel scroll position is preserved when Search is clicked (no jump). Search button uses `type="button"` and preventDefault on click/Enter so the overlay/page does not reload or jump. Unit tests: `tests/unit/tab-search-no-match-ui.test.js`.

- **TIED token validation in pipeline and code/test quality notes** ([PROC-TOKEN_VALIDATION]) – Token validation is now part of the pre-push and CI pipeline. **Pipeline:** `npm run validate` includes `npm run validate:tokens`, which runs `scripts/validate_tokens.sh` to ensure every `[REQ-*]` / `[ARCH-*]` / `[IMPL-*]` referenced in `src/` and `tests/` is registered in `tied/semantic-tokens.yaml`. CI (`.github/workflows/ci.yml`) runs token validation in the test job after lint and before unit tests. **Quality analysis:** Code and tests are TIED-aligned: requirements → architecture → implementation are documented in `tied/` before implementation; source and tests carry semantic tokens; unit tests use mocks and reference REQ/IMPL in describe/test names; messaging and contract tests cover extension protocols. Token validation was run and passes. README updated with a "Code and test quality (TIED)" subsection and the validate script description; CHANGELOG documents this addition.

- **IMPL essence_pseudocode aligned with standard** – All 76 Active implementation decision (IMPL) detail files now have `essence_pseudocode` and metadata aligned with the documented standard in `tied/implementation-decisions.md`: contract block (INPUT/OUTPUT/DATA, CONTROL when relevant), preferred vocabulary (AWAIT, ON error/ON failure, FOR … IN, etc.), one action per step, and sub-block token comments. High-impact IMPLs (MESSAGE_HANDLING, BOOKMARK_ROUTER, STORAGE_INDEX, LOCAL_BOOKMARK_SERVICE, URL_TAGS_DISPLAY, EXTENSION_COMMANDS, SIDE_PANEL_TABS) received targeted edits (split prose, AWAIT keyword, Contract/DATA, sub-block comments); the remaining Active IMPLs received metadata-only updates. Template-status IMPLs (IMPL-EXAMPLE_IMPLEMENTATION, IMPL-TESTING, IMPL-ERROR_HANDLING, IMPL-CONFIG_STRUCT) were left unchanged. No behavior or code changes; documentation and collision-detection clarity only.

- **Quick access: extension commands, context menu, and in-popup/panel shortcuts** ([REQ-QUICK_ACCESS_ENTRY], [ARCH-QUICK_ACCESS_ENTRY], [IMPL-EXTENSION_COMMANDS], [IMPL-CONTEXT_MENU_QUICK_ACCESS], [IMPL-POPUP_PANEL_KEYBOARD_QUICK_ACCESS]) – Users can open the side panel, options page, bookmarks index, or browser bookmark import page without using footer links. **Extension commands:** Four manifest commands with suggested shortcuts (Ctrl+Shift+B, O, M, I) open the side panel, options, bookmarks index, and import page; shortcuts are configurable in `chrome://extensions/shortcuts`. **Context menu:** Right-click → Hoverboard submenu with four items that perform the same four actions. **In-popup/panel keyboard shortcuts:** When the popup or side panel Bookmark tab has focus, Ctrl+Shift+B/O/M/I trigger the same actions (openTagsTree, openOptions, openBookmarksIndex, openBrowserBookmarkImport). Options page is explicitly one of the four targets. Unit tests: `tests/unit/service-worker-quick-access.test.js`, `tests/unit/keyboard-manager-quick-access.test.js`.

- **Side panel README screenshots at 240px width** ([IMPL-SCREENSHOT_MODE]) – Placeholder screenshot script now captures the side panel (Bookmark and Tags tree tabs) with a 240px-wide viewport so README images match real Chrome side panel proportions instead of full-screen width. `scripts/screenshots-placeholder.js` sets `SIDE_PANEL_VIEWPORT` (240×600) before loading side-panel.html; outputs `side-panel-bookmark.png` and `side-panel-tags-tree.png` at 240px width. IMPL-SCREENSHOT_MODE detail and index updated with essence_pseudocode block and details for side panel capture.

- **Side panel snapshot E2E** ([IMPL-SIDE_PANEL_SNAPSHOT], [REQ-UI_INSPECTION], [REQ-SIDE_PANEL_POPUP_EQUIVALENT], [REQ-SIDE_PANEL_TAGS_TREE]) – E2E snapshot helper `snapshotSidePanel(page)` in `tests/e2e/helpers.js` returns two serializable state shapes: `bookmarkTab` (panelPresent, screen, loadingVisible, errorVisible, mainVisible, errorMessage) and `tagsTreeTab` (panelPresent, hasTagSelector, hasTreeContainer, hasSearchInput, hasConfigToggle, hasSearchCount, hasEmptyState, hasLoadError). Playwright test in `extension-messaging.spec.js` loads the side panel and asserts both shapes. Shape contract test in `tests/e2e/popup-snapshot.e2e.test.js` documents the return structure. REQ-UI_INSPECTION and ARCH-UI_TESTABILITY updated with side panel snapshot criteria; IMPL-SIDE_PANEL_SNAPSHOT detail file and semantic-tokens registry added.

- **Side panel tab content fills vertical space** ([REQ-SIDE_PANEL_POPUP_EQUIVALENT], [ARCH-SIDE_PANEL_TABS], [IMPL-SIDE_PANEL_TABS], [IMPL-SIDE_PANEL_TAGS_TREE]) – Tab content in the side panel now uses the full viewport height and panel width instead of popup dimensions (350px width, 450px max-height). Page body is overridden with `max-height: none` and `width: 100%`; `.side-panel-content` is a flex column so children can fill space; the Tags tree panel (`#tagsTreePanel`) uses `min-height: 0` and `overflow: hidden` so the tree section scrolls and fills the remaining space. E2E test in `extension-messaging.spec.js` asserts body is not capped at 450px and content area has flex layout.

- **Side panel Tags tree tab sync with current bookmark tags** ([REQ-SIDE_PANEL_POPUP_EQUIVALENT], [IMPL-SIDE_PANEL_TAGS_TREE], [IMPL-SIDE_PANEL_TABS]) – When you switch to the Tags tree tab in the side panel, the tag selector checked state is set to the current bookmark's tags (from the Bookmark tab), and the tree displays only bookmarks that have at least one of those tags. Unit tests: `tests/unit/tags-tree-data.test.js` (intersectionTagOrder).

- **Side panel both tabs refresh on browser tab focus** ([REQ-SIDE_PANEL_POPUP_EQUIVALENT], [IMPL-SIDE_PANEL_TABS], [IMPL-SIDE_PANEL_TAGS_TREE]) – When the side panel is open, both the Bookmark and Tags tree tabs now update to show the DB record for the current tab's URL when the active browser tab changes or the tab's page completes (same trigger as the badge). The Tags tree tab's tag selector and tree now refresh to reflect the current tab's bookmark tags, matching the Bookmark tab behavior.

- **Side panel Bookmark tab refresh on select** ([REQ-SIDE_PANEL_POPUP_EQUIVALENT], [IMPL-SIDE_PANEL_BOOKMARK], [IMPL-SIDE_PANEL_TABS]) – When you switch to the Bookmark tab in the side panel, it refreshes so the displayed bookmark matches the current browser tab. The Bookmark tab also refreshes promptly when the active browser tab changes or the tab's page completes (like the badge).

- **Side panel popup equivalent with tabs** ([REQ-SIDE_PANEL_POPUP_EQUIVALENT], [ARCH-SIDE_PANEL_TABS], [IMPL-SIDE_PANEL_TABS], [IMPL-SIDE_PANEL_BOOKMARK], [IMPL-UIManager_SCOPED_ROOT]) – The side panel is now a single tabbed page with **Bookmark** and **Tags tree** tabs. **Bookmark** tab provides the same UI as the popup (quick actions, storage selector, tag management including Tag with AI, search tabs, footer). **Tags tree** tab shows the existing hierarchical tags-and-bookmarks view. User switches between tabs inside the panel; the last-selected tab is persisted. Opening the panel from the popup (Tags tree button) opens this tabbed panel. UIManager supports an optional scoped root (container) and `data-popup-ref` so the Bookmark tab reuses PopupController and UIManager without duplicate document IDs. Build: `build:side-panel` bundles the side-panel entry; manifest `side_panel.default_path` is `side-panel.html`. Unit tests: `tests/unit/ui-manager-scoped-root.test.js`, `tests/unit/side-panel-tabs.test.js`. E2E: side panel test asserts tab bar and switching to Tags tree tab.

- **Side panel compact tag selector and all/checked toggle** ([REQ-SIDE_PANEL_TAGS_TREE], [ARCH-SIDE_PANEL_TAGS_TREE], [IMPL-SIDE_PANEL_TAGS_TREE]) – The side panel tag list uses a compact layout (reduced gap and font size). A **Show all tags** checkbox toggles between displaying all tags and only the selected (checked) tags; the choice is persisted in panel config. Pure helper `getTagsToDisplay(allTags, selectedTagOrder, showAllTags)` in `tags-tree-data.js` drives the visible list; when "only checked", stale tags not in `allTags` are omitted. Unit tests: `tests/unit/tags-tree-ui.test.js`.

- **Extension messaging protocol tests** ([IMPL-MESSAGE_HANDLING], [ARCH-MESSAGE_HANDLING], [IMPL-RUNTIME_VALIDATION], [IMPL-FILE_BOOKMARK_SERVICE]) – Unit and E2E tests for detailed validation of messaging protocols, channels, and processes: **MessageHandler contracts** (`message-handler-contracts.test.js`) – processMessage returns a plain object for all critical types; unknown type throws; sender context for GET_TAB_ID and GET_CURRENT_BOOKMARK. **Service worker routing** (`service-worker-messaging-routing.test.js`) – NATIVE_PING, SWITCH_STORAGE_MODE, DEV_COMMAND (debug off) handled in handleMessage without calling processMessage; GET_OPTIONS calls processMessage and wraps response; handler throw → `{ success: false, error }`. **Schema extension** – moveBookmarkToStorage Zod schema and validation tests in `message-schemas.test.js` and `message-handler-runtime-validation.test.js`. **Content script contracts** (`content-messaging-contracts.test.js`) – CONTENT_MESSAGE_TYPES drift and response shape. **Popup→message contract** (`popup-message-contract.test.js`) – openTagsTree→OPEN_SIDE_PANEL, showHoverboard→TOGGLE_HOVER, etc. **Offscreen** (`offscreen-file-bookmark-messaging.test.js`) – READ_FILE_BOOKMARKS/WRITE_FILE_BOOKMARKS request/response contract; `handleOffscreenMessage` exported from `file-bookmark-io.js` for testing. **MessageClient** (`message-client.test.js`) – retry on lastError, no retry for non-retryable errors, isRetryableError. **Message-type drift** (`message-type-drift.test.js`) – CONTENT_MESSAGE_TYPES entries are MESSAGE_TYPES keys or known content-only. **E2E** – content→SW getTabId round-trip in `extension-messaging.spec.js`. **Docs** – `docs/architecture/extension-messaging-protocols.md` (SW/content/offscreen listener summary and channel table). REQ/ARCH/IMPL traceability updated (IMPL-MESSAGE_HANDLING, ARCH-MESSAGE_HANDLING, IMPL-RUNTIME_VALIDATION, IMPL-FILE_BOOKMARK_SERVICE). Recommended pre-push validation: `npm run validate && npm run test && npm run test:e2e:extension`.

- **TypeScript full utilization and validation in REQ/ARCH/IMPL** ([ARCH-LANGUAGE_SELECTION], [IMPL-TYPESCRIPT_MIGRATION], [ARCH-CONFIG_STRUCTURE], [ARCH-MESSAGE_HANDLING]) – TypeScript is fully utilized: `// @ts-check` on config-manager, message-handler, message-schemas, message-client; shared types (`MergedConfig`, `MessageEnvelope`, payload types) wired via JSDoc; `tsconfig` lib includes DOM; `z.unknown()` in message envelope schema. REQ/ARCH/IMPL updated to include validation tests: **IMPL-TYPESCRIPT_MIGRATION** and **ARCH-LANGUAGE_SELECTION** now document `npm run typecheck` and `npm run validate` as the tests that validate type-checking; ARCH recommends full pre-push validation CLI: `npm run validate && npm run test && npm run test:e2e:extension`. README: new "Validating before push" section with the recommended CLI; TypeScript bullet in Test Coverage updated. CHANGELOG: this entry.

- **Extension E2E: messaging, evaluation contexts, overlay, options, side panel** ([IMPL-PLAYWRIGHT_E2E_EXTENSION], [REQ-UI_INSPECTION], [ARCH-UI_TESTABILITY], [ARCH-MESSAGE_HANDLING]) – Playwright extension E2E expanded beyond popup structure. **Shared fixture** (`tests/playwright/extension-fixture.js`): `getExtensionId(context)`, `launchExtensionContext()`, shared `test` fixture. **Messaging** (`extension-messaging.spec.js`): popup↔background (GET_OPTIONS, GET_TAB_ID); popup→content script (GET_OVERLAY_STATE, TOGGLE_HOVER); content script↔background; options↔background (NATIVE_PING); side panel↔background (getAggregatedBookmarksForIndex); options page snapshot (snapshotOptions). **Evaluation** (`extension-evaluation.spec.js`): GET_PAGE_CONTENT (SW executeScript in tab); suggested tags (MAIN world); GET_PAGE_SELECTION; overlay visibility (snapshotOverlay). **Lower priority** (`extension-lower.spec.js`): bookmarks table, browser bookmark import, offscreen (READ_FILE_BOOKMARKS). REQ-UI_INSPECTION and ARCH-UI_TESTABILITY updated with E2E validation and IMPL-PLAYWRIGHT_E2E_EXTENSION traceability; implementation-decisions index and IMPL detail file list all specs and tests. Run: `npm run test:e2e:extension` (16 tests).

- **Side panel bookmark search** (`REQ-SIDE_PANEL_BOOKMARK_SEARCH`, `ARCH-SIDE_PANEL_BOOKMARK_SEARCH`, `IMPL-SIDE_PANEL_BOOKMARK_SEARCH`) – In the side panel, a search input filters the displayed bookmark list by text (title, URL, tags, notes). The match count is shown (e.g. "N matches" or "No matches"), and **Previous** / **Next** buttons advance through matches with scroll-into-view and highlight. Search is client-side over the list already filtered and sorted; no new backend. Unit tests: `tests/unit/tags-tree-filter.test.js` (filterBookmarksBySearch).

- **Runtime validation (Zod)** (`IMPL-RUNTIME_VALIDATION`, `ARCH-MESSAGE_HANDLING`, `ARCH-CONFIG_STRUCTURE`) – Message envelope and critical payloads (getCurrentBookmark, getTagsForUrl, saveBookmark, deleteBookmark, saveTag, deleteTag) are validated at the service worker via Zod; invalid messages return a structured error. Merged config in `ConfigManager.getConfig()` is validated with a Zod schema; on failure the extension falls back to defaults. Unit tests: `tests/unit/message-schemas.test.js`, `tests/unit/config-manager.test.js` (describe `[IMPL-RUNTIME_VALIDATION]`).

- **TypeScript incremental** (`ARCH-LANGUAGE_SELECTION`, `IMPL-TYPESCRIPT_MIGRATION`) – `tsconfig.json` (noEmit, allowJs), `npm run typecheck` in validate; shared type definitions `src/shared/message-types.d.ts` and `src/shared/config-types.d.ts`; JSDoc on `processMessage`, `sendMessage`, and popup `sendMessage`. Enables future `.ts` adoption; esbuild supports TypeScript natively.

- **Playwright extension E2E** (`IMPL-PLAYWRIGHT_E2E_EXTENSION`, `REQ-UI_INSPECTION`, `ARCH-UI_TESTABILITY`) – One E2E flow: build extension, launch Chromium with unpacked `dist/`, discover extension ID from service worker, open popup and assert structure. Config: `playwright.extension.config.js`; spec: `tests/playwright/extension-popup.spec.js`; run with `npm run test:e2e:extension`.

- **Side panel – Filters, sort/group, expandable config** (`REQ-SIDE_PANEL_TAGS_TREE`, `ARCH-SIDE_PANEL_TAGS_TREE`, `IMPL-SIDE_PANEL_TAGS_TREE`) – The side panel now supports filtering by create/update time range, tags to include (comma-separated), and domains (URL hostnames); display can be sorted by create date, update date, tag, or domain (asc/desc) and optionally grouped by the same axes. A **Filters & view** config region can be expanded to adjust filters and display options or collapsed to maximize space for the bookmarks list. Config state is persisted in `chrome.storage.local`. Unit tests: `tests/unit/tags-tree-data.test.js`, `tests/unit/tags-tree-filter.test.js`, `tests/unit/side-panel-open.test.js`.

### Fixed

- **TIED detail file YAML parse errors** ([PROC-TOKEN_VALIDATION]) – Fixed 37 REQ/ARCH/IMPL detail files that failed `tied_validate_consistency` (parse errors). **REQ:** Removed self-referential `detail_file`, normalized `cross_references` to lists, quoted `summary`/`criterion`/`coverage` values containing colons; wrapped content under top-level token key where missing (e.g. REQ-STRUCTURED_LOGGING). **ARCH:** Added top-level token key (ARCH-SHARED_UTILITIES, ARCH-STRUCTURED_LOGGING), quoted `implementation_approach.details` and `summary`/`reason` values with colons, fixed unclosed quotes in problems_solved. **IMPL:** Removed `detail_file` from detail files; quoted `summary`, `details`, `description`, and `why` scalars that contained colons or `@`; fixed invalid escape in IMPL-SELECTION_TO_TAG_INPUT. `tied_validate_consistency` now returns `ok: true` with default options. README updated with TIED consistency validation note.

- **Side panel Tags tree tab shows current URL's bookmark when panel opens with Tags tree tab visible** ([REQ-SIDE_PANEL_POPUP_EQUIVALENT], [IMPL-SIDE_PANEL_TABS]) – When the side panel was opened with the Tags tree tab as the restored tab (e.g. from storage), the Tags tree tab did not display the current URL's DB record (tag selector and tree were not filtered to the current bookmark's tags). Now on panel load, when the restored tab is Tags tree, the Bookmark tab is initialized first so the controller has current-tab data, then the Tags tree tab is initialized with `currentBookmarkTags` from the controller. Pure helper `getTagsTreeInitOptions(controller)` in `side-panel-tab-state.js`; `runInitialTabInit(activeTab)` drives the load flow. Unit tests: `tests/unit/side-panel-tabs.test.js` (getTagsTreeInitOptions), `tests/unit/side-panel-initial-tab-init.test.js` (runInitialTabInit with Tags tree).

- **getCurrentBookmark validation rejecting overlay payloads** (`IMPL-RUNTIME_VALIDATION`) – The overlay sends `getCurrentBookmark` with `data: { url, title, tabId }`. The Zod schema used `.strict()` and only allowed `url`, so validation failed. Schema updated to `.passthrough()` so extra keys (title, tabId) are allowed while still validating `url`.

## [3.0.0] - 2026-03-04

### Changed

- **Version 2.0.0 → 3.0.0** ([PROC-TIED_DEV_CYCLE]) – Extension and package version set to 3.0.0 via `scripts/set-version.sh`. Single source of truth: `manifest.json`; popup and side panel read version at runtime from `chrome.runtime.getManifest().version`. TIED: Option A (no new REQ/IMPL); version display remains documented in IMPL-SIDE_PANEL_TABS.

- **Jest test:e2e pass with no tests** – `npm run test:e2e` (Jest with `**/*.e2e.test.js`) exits with code 0 when no tests are found (e.g. when the only match is under an ignored path). Added `--passWithNoTests` so `npm run test:ci` succeeds.

### Fixed

- **IMPL-ICON_CLICK_BEHAVIOR YAML parse error** ([PROC-TOKEN_VALIDATION]) – The implementation detail file `tied/implementation-decisions/IMPL-ICON_CLICK_BEHAVIOR.yaml` had an unquoted `summary` value containing colons, which broke YAML parsing. Quoted the summary so `tied_validate_consistency` passes.

## [2.0.0] - 2026-02-21

### Fixed

- **Tag with AI failing after 8 seconds** (`REQ-AI_TAGGING_POPUP`, `ARCH-AI_TAGGING_FLOW`, `IMPL-AI_TAGGING_READABILITY`, `IMPL-AI_TAGGING_POPUP_UI`) – "Tag with AI" could fail when the content script was not present in the tab (e.g. tab opened before the extension was loaded). Page content is now obtained by the service worker via `scripting.executeScript` with an inline function (title + `document.body.innerText`, 16k character cap), so the flow no longer depends on the content script. When the content script is present, an early top-level listener still handles `GET_PAGE_CONTENT` using Readability for richer extraction. The popup now shows the service worker’s error message (e.g. "Page content unavailable. Reload the page and try again...") when extraction fails instead of a generic message.

### Changed

- **Local Bookmarks Index – Retain selection after Add tags / Delete tags** (`REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS`, `ARCH-LOCAL_BOOKMARKS_INDEX_ADD_TAGS`, `IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS`) – After Add tags or Delete tags completes, the same records remain selected in the UI. If a record is no longer displayed (e.g. filtered out after refresh), it is no longer marked. Pure helper `selectionStillVisible(selectedUrls, filteredBookmarks)` in `bookmarks-table-filter.js` returns the intersection of selected URLs and currently displayed bookmark URLs; `addTagsToSelected` and `deleteTagsFromSelected` save selection before refresh, then restore it from that intersection and re-render. Unit tests for `selectionStillVisible` in `tests/unit/bookmarks-table-index.test.js`.

- **IMPL records: full conversion to canonical YAML structure and code/test reconciliation** – All implementation decision (IMPL) records now use a single, consistent structure defined in `tied/implementation-decisions.md`, with full code and test traceability and mandatory essence pseudo-code for collision detection:
  - **Canonical object format:** Every IMPL **detail** file in `tied/implementation-decisions/` has a single root key equal to the IMPL token (e.g. `IMPL-STORAGE_INDEX`), with required fields (`name`, `status`, `cross_references`, `rationale`, `implementation_approach`, `code_locations`, `traceability`, `related_decisions`, `detail_file`, `metadata`), **mandatory** `essence_pseudocode` (see below), and optional standard fields (`related_decisions.composed_with`). Extraneous or duplicate keys were removed so each file matches the schema.
  - **Essence pseudo-code (mandatory):** `essence_pseudocode` is now a **required** field for every IMPL detail file, documented in `tied/implementation-decisions.md` (Core data object and “Mandatory essence_pseudocode” subsection). It was added or refined across all IMPL detail files (including IMPL-CONFIG_BACKUP_RESTORE, IMPL-CONFIG_MIGRATION, IMPL-DOM_UTILITIES, IMPL-FEATURE_FLAGS, IMPL-MODULE_VALIDATION, IMPL-NATIVE_HOST_*, IMPL-PINBOARD_POSTS_ADD_ENCODING, IMPL-RECENT_TAGS_POPUP_REFRESH, IMPL-SELECTION_TO_TAG_INPUT, IMPL-SUGGESTED_TAGS, IMPL-TEXT_UTILITIES, IMPL-TIME_ASYNC_UTILITIES and others). This language-agnostic, step-wise pseudo-code captures each IMPL’s core algorithm (INPUT/OUTPUT/DATA, procedure names, key branches) for deducing how IMPLs interact when composed, for guiding tests and code structure, and for **collision detection** between implementation decisions.
  - **Composition metadata:** `related_decisions.composed_with` (list of IMPL tokens) was added to record which IMPLs are routinely composed in a single algorithm or workflow.
  - **Index → detail extraction:** Every IMPL record that existed only in `tied/implementation-decisions.yaml` (or had `detail_file: null` or `.md`) was extracted into its own detail file under `tied/implementation-decisions/IMPL-*.yaml`. The index now references only `.yaml` detail files (60 total). Newly created detail files include IMPL-TIED_FILES, IMPL-PINBOARD_API, IMPL-MESSAGE_HANDLING, IMPL-OVERLAY, IMPL-TAG_SYSTEM, IMPL-POPUP_SESSION, IMPL-BOOKMARK_STATE_SYNC, IMPL-OVERLAY_CONTROLS, IMPL-SAFARI_ADAPTATION, IMPL-OVERLAY_TEST_HARNESS, IMPL-POPUP_MESSAGE_TIMEOUT, IMPL-UI_ACTION_CONTRACT, IMPL-UI_INSPECTOR, IMPL-UI_TESTABILITY_HOOKS, IMPL-DEV_COMMAND_INSPECTION, IMPL-DEBUG_PANEL, IMPL-POPUP_BUNDLE, IMPL-CONFIG_STRUCT, IMPL-EXAMPLE_IMPLEMENTATION, IMPL-ERROR_HANDLING, IMPL-TESTING, IMPL-CODE_STYLE, IMPL-SYNC_BOOKMARK_SERVICE, IMPL-FILE_STORAGE_TYPED_PATH, IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE, IMPL-SCREENSHOT_MODE, IMPL-POPUP_THEME_CSS, and the index `detail_file` and metadata were normalized for consistency.
  - **Code → ARCH/IMPL linking:** Source and test code were reviewed and linked to ARCH/IMPL (and REQ where applicable). File-level `[IMPL-*]` and `[ARCH-*]` comments were added to modules that lacked them: `src/features/content/content-script.js` (IMPL-OVERLAY, ARCH-OVERLAY), `src/features/content/tag-renderer.js` (IMPL-TAG_SYSTEM, IMPL-URL_TAGS_DISPLAY, ARCH-TAG_SYSTEM), `src/shared/ErrorHandler.js` (IMPL-ERROR_HANDLING, ARCH-ERROR_HANDLING). IMPL detail `code_locations` were corrected to match the codebase: IMPL-PINBOARD_API now points to `src/features/pinboard/pinboard-service.js` and `pinboard-service-browser.js` (replacing obsolete `src/bg/pinboard.js`); IMPL-ERROR_HANDLING now points to `src/shared/ErrorHandler.js` with real function names; IMPL-OVERLAY now includes `src/features/content/content-script.js`. The implementation-decisions index (`tied/implementation-decisions.yaml`) was updated for IMPL-PINBOARD_API code_locations so index and detail files stay in sync.
  - **Collision detection:** A new “Collision detection using essence_pseudocode” section was added to `tied/implementation-decisions.md`. It describes how to compare `essence_pseudocode` across composed IMPLs to find overlapping steps, shared data, and ordering dependencies, and includes a checklist table of key composition pairs (e.g. IMPL-STORAGE_INDEX + IMPL-BOOKMARK_ROUTER + IMPL-LOCAL_BOOKMARK_SERVICE, IMPL-MESSAGE_HANDLING + IMPL-POPUP_MESSAGE_TIMEOUT, IMPL-BADGE_REFRESH + IMPL-MESSAGE_HANDLING, IMPL-URL_TAGS_DISPLAY + IMPL-BOOKMARK_ROUTER, file-storage and config groups) with ordering/shared-data notes so future changes can avoid conflicting IMPLs.
  - **Validation:** Token validation (`./scripts/validate_tokens.sh`) was run and passes; all referenced TIED tokens in `src/` and `tests/` are registered in `tied/semantic-tokens.yaml`. Spot-checks confirmed every IMPL detail file has `essence_pseudocode` and that the updated code paths carry the intended ARCH/IMPL links.
  - **IMPL essence_pseudocode: managed-code block token comments** – Per the “Managed code and block token rules” in `tied/implementation-decisions.md` (lines 85–103), all 50 IMPL detail files in the batch now have token-aware comments inside `essence_pseudocode`: (1) a top-level preamble naming the IMPL, ARCH, and REQ tokens for the decision and a one-line summary; (2) a short “how” comment before the contract (INPUT/OUTPUT/DATA or Template); (3) a “how”-only comment before each logical sub-block (procedures, ON/WHEN sections, etc.). Token sets were taken from each file’s `traceability` (or `cross_references` when empty). No edits were made outside `essence_pseudocode`; pseudo-code text and indentation were preserved. This aligns pseudo-code with the same REQ/ARCH/IMPL naming discipline used in source and tests.

- **IMPL pseudo-code and implementation synchronization** – Managed code (source, tests, data, and popup/options HTML) is now aligned with IMPL detail files via block-level token comments. Every logical block that implements a given IMPL carries a comment naming **all** REQ, ARCH, and IMPL reflected in that block (order: `[IMPL-*] [ARCH-*] [REQ-*]`). Applied across all IMPL code locations: e.g. message-handler, config-manager, storage services, bookmark-router, overlay-manager, popup (PopupController, UIManager), tag-service, url-tags-manager, utils (url/text/time/dom/array/object), native host install scripts, screenshot scripts, and unit tests. No changes were made to `essence_pseudocode` in IMPL YAML files. Traceability is now consistent from requirements → architecture → implementation → code blocks.

### Fixed

- **Screenshot placeholder flow** (`IMPL-SCREENSHOT_MODE`) – Placeholder screenshots now show bookmarks reliably:
  - **Storage seed awaited:** The script awaits `chrome.storage.local.set` and `chrome.storage.sync.set` in the options page so the popup and bookmarks index load after data is written.
  - **Popup-as-tab URL:** When the popup is opened as a full tab (screenshot flow), the message handler now prefers `data.url` when it is an `http`/`https` URL so `getCurrentBookmark` returns the bookmark for the screenshot URL (e.g. Pinboard) instead of the extension tab URL.
  - **Wait for content:** The popup sets `data-screenshot-ready="true"` on `#mainInterface` when loading finishes in screenshot mode; the script waits for this attribute before capturing so the popup screenshot shows tags and bookmark data.
  - **Local store checked for index:** The Local Bookmarks Index shows no rows until at least one store (Local / File / Sync) is checked. The script now checks the **Local (L)** checkbox before capturing the index screenshot so seeded local bookmarks are visible.

### Added

- **Side panel – Tags and bookmarks tree** (`REQ-SIDE_PANEL_TAGS_TREE`, `ARCH-SIDE_PANEL_TAGS_TREE`, `IMPL-SIDE_PANEL_TAGS_TREE`) – A Chrome side panel shows a hierarchical view of bookmarks by tag. Open it from the popup footer via **Tags tree**. Select one or more tags and control their display order; below that, each tag is shown with a collapsible list of bookmarks (title and URL). Clicking a URL opens it in a new tab. Data comes from the same local, file, and sync bookmarks as the Local Bookmarks Index. Requires Chrome 114+ and the `sidePanel` permission. Unit tests: `tests/unit/tags-tree-data.test.js`, `tests/unit/side-panel-open.test.js`.

- **AI Tagging: Configuration and popup flow** (`REQ-AI_TAGGING_CONFIG`, `REQ-AI_TAGGING_POPUP`, `ARCH-AI_TAGGING_CONFIG`, `ARCH-AI_TAGGING_FLOW`, `IMPL-AI_CONFIG_OPTIONS`, `IMPL-AI_TAG_TEST`, `IMPL-AI_TAGGING_READABILITY`, `IMPL-AI_TAGGING_PROVIDER`, `IMPL-SESSION_TAGS`, `IMPL-AI_TAGGING_POPUP_UI`) – Options page: AI API key (optional), provider (OpenAI or Gemini), optional tag limit (default 64), and **Test API key** button; settings persisted in config; no key disables the feature. Popup: **Tag with AI** button submits the current page to the configured AI for tagging; page content is extracted with Readability.js; AI returns up to N tags; tags added to any site this session are auto-applied to the bookmark; remaining AI tags appear first in Suggested Tags; new bookmarks from this flow use the default store. Session tags use `chrome.storage.session` (MV3) or in-memory in the service worker.

- **Local Bookmarks Index – Regex find-and-replace on selected** (`REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE`, `ARCH-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE`, `IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE`) – In "Actions for selected", added a **Regex** textbox, **Replacement** textbox, checkboxes for **Title**, **URL**, **Tags**, and **Notes**, and a **Replace** button. Run a regular-expression find-and-replace on selected bookmarks for the checked fields only. Regex supports named groups, negative lookahead, and backreferences (JavaScript `RegExp` and replacement semantics: `$1`, `$<name>`, `$&`, etc.). Invalid regex shows an inline error; no save is performed. Each updated bookmark is saved via `saveBookmark` with `preferredBackend`; table refreshes and selection is retained for still-visible rows. Replace button is disabled when no bookmark is selected or when the pattern is empty. Pure helper `applyRegexReplace` in `bookmarks-table-filter.js`; `regexReplaceSelected` in `bookmarks-table.js`; unit tests in `tests/unit/bookmarks-table-index.test.js`.

- **Local Bookmarks Index – Add tags to selected** (`REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS`, `ARCH-LOCAL_BOOKMARKS_INDEX_ADD_TAGS`, `IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS`) – In "Actions for selected", added a **New tag(s):** textbox and **Add tags** button. Enter one or more tags (comma-separated); clicking Add tags merges them with existing tags on each selected bookmark (case-insensitive dedupe) and saves via `saveBookmark` with `preferredBackend` from the bookmark’s storage. Table refreshes and selection clears after apply. Button is disabled when no bookmark is selected. Pure helpers `parseTagsInput`, `mergeTags`, and `buildAddTagsPayload` in `bookmarks-table-filter.js`; unit tests in `tests/unit/bookmarks-table-index.test.js`.

- **Local Bookmarks Index – Delete tags button** (`REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS`, `ARCH-LOCAL_BOOKMARKS_INDEX_ADD_TAGS`, `IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS`) – **Delete tags** button added in the same row as Add tags, using the same textbox. Enter tags (comma-separated) and click Delete tags to remove those tags from all selected bookmarks (case-insensitive). Saves via `saveBookmark` with reduced tag list and `preferredBackend`; table refreshes and selection clears after apply. Button disabled when no selection. Pure helpers `removeTags` and `buildRemoveTagsPayload` in `bookmarks-table-filter.js`; unit tests in `tests/unit/bookmarks-table-index.test.js`.

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
