# [IMPL-DEMO_OVERLAY] [PROC-DEMO_RECORDING] [REQ-SIDE_PANEL_BROWSER_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SIDE_PANEL_TAGS_TREE] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [REQ-BOOKMARK_USAGE_TRACKING] — Provide shared overlay, highlight, capture-timing, and GIF-building logic for current side-panel and standalone-tool demos.

## SET_OVERLAY

- [IMPL-DEMO_OVERLAY] [PROC-DEMO_RECORDING] [REQ-SIDE_PANEL_BROWSER_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SIDE_PANEL_TAGS_TREE] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [REQ-BOOKMARK_USAGE_TRACKING] How: Render the current demo step as a colored, top-aligned annotation without changing product state.
- Contract:
  - INPUT: browser page; action text; achievement text; text class
  - PRE: page has a document body; text class is one of `intro`, `navigation`, `state`, `action`, or `result`
  - OUTPUT: overlay element `#__demo_overlay__` containing the supplied text
  - POST:
    - success => overlay exists with the selected class color and `rgba(0,0,0,0.78)` header background
  - EFFECTS: DOM state
  - FAILURE_MODES: missing document body; unknown text class falls back to `intro`
  - DATA_TRANSITION: create or update `#__demo_overlay__`; do not mutate product data
  - TERMINATION: total
- PROCEDURE: SET_OVERLAY
  - Select `OVERLAY_CLASSES[textClass]`, or select the `intro` class when the requested class is unknown.
  - Find `#__demo_overlay__`; create and append a fixed, pointer-transparent element when absent.
  - Set the top, full-width, 18px system-font layout and `rgba(0,0,0,0.78)` background.
  - Render escaped-equivalent action and achievement text using the selected color.

## APPLY_DEMO_HIGHLIGHT

- [IMPL-DEMO_OVERLAY] [PROC-DEMO_RECORDING] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SIDE_PANEL_BROWSER_TABS] [REQ-SIDE_PANEL_TAGS_TREE] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [REQ-BOOKMARK_USAGE_TRACKING] How: Apply one visible outline inside the requested product root and remove the previous outline before every capture.
- Contract:
  - INPUT: browser page; CSS selector; optional root element id
  - PRE: selector is valid CSS; root id is null or identifies a loaded element
  - OUTPUT: selected element has `data-demo-highlight="1"` and the blue outline
  - POST:
    - success => at most one element is highlighted; a missing root or selector leaves the page unchanged
  - EFFECTS: DOM state
  - FAILURE_MODES: missing root; selector does not match
  - DATA_TRANSITION: clear prior highlight styles; set outline and box shadow on the selected element
  - TERMINATION: total
- PROCEDURE: APPLY_DEMO_HIGHLIGHT
  - Resolve `root = rootId ? getElementById(rootId) : document`.
  - Find the first element matching `selector` inside `root`.
  - Clear `data-demo-highlight`, `outline`, and `boxShadow` from the previous highlighted element.
  - If the target exists, set `data-demo-highlight="1"`, `outline=3px solid #42a5f5`, and the blue glow.

## CAPTURE_SIDE_PANEL_DEMO

- [IMPL-DEMO_OVERLAY] [PROC-DEMO_RECORDING] [REQ-SIDE_PANEL_BROWSER_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SIDE_PANEL_TAGS_TREE] How: Capture This Page, By Tag, or Tabs at the real side-panel viewport with one unannotated opening frame, annotated steps, and one end-card frame.
- Contract:
  - INPUT: extension id; side-panel URL; active-tab storage key/value when needed; panel root id; ordered step actions; frame directory; `RATE=1.25`
  - PRE: built extension is loaded; panel root becomes visible; each step selector is valid or explicitly optional
  - OUTPUT: ordered PNG frames with frame 0 unannotated and the final frame showing the Hoverboard end card
  - POST:
    - success => every required step has a captured frame and no highlight remains before the end card
  - EFFECTS: browser navigation, DOM state, filesystem IO, asynchronous waits
  - FAILURE_MODES: extension id unavailable; panel timeout; optional content absent; screenshot failure
  - DATA_TRANSITION: persist the requested active side-panel tab before navigation; mutate only demo overlay/highlight/end-card DOM
  - TERMINATION: total
- PROCEDURE: CAPTURE_SIDE_PANEL_DEMO
  - Persist `hoverboard_sidepanel_active_tab` when the selected side-panel surface must be visible in frame 0.
  - Open the side-panel URL and wait for the selected panel root to be visible.
  - Remove overlay and highlight; wait `1000*RATE` milliseconds; capture frame 0.
  - For each ordered step: clear the previous highlight; call `SET_OVERLAY`; call `APPLY_DEMO_HIGHLIGHT` for the step root and selector; perform the described UI action; wait the step duration multiplied by `RATE`; capture one or more frames.
  - After the final content step: clear highlight and overlay; wait `500*RATE` milliseconds; inject `__demo_end_card__` with the centered Hoverboard icon; capture the final frame.

## CAPTURE_BROWSER_BOOKMARKS_DEMO

- [IMPL-DEMO_OVERLAY] [PROC-DEMO_RECORDING] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] How: Seed a native Chrome bookmark folder, open the standalone Browser Bookmarks page, and highlight only `#browserBookmarksPanel` while presenting search, folder, sort, count, and URL behavior.
- Contract:
  - INPUT: extension id; Chromium context with `chrome.bookmarks`; medium-complexity bookmark records; frame directory; `docs/demo-browser-bookmarks.gif` output
  - PRE: extension is loaded; bookmark permission is available; Browser Bookmarks page is reachable
  - OUTPUT: Browser Bookmarks PNG frames and `docs/demo-browser-bookmarks.gif`
  - POST:
    - success => output frames show the standalone page and the GIF uses the shared three-part timing
  - EFFECTS: native bookmark state, browser navigation, DOM state, filesystem IO
  - FAILURE_MODES: bookmark seed failure; page timeout; missing optional row; ffmpeg failure
  - DATA_TRANSITION: create the demo folder and child bookmarks; mutate only capture annotations after the page loads
  - TERMINATION: total
- PROCEDURE: CAPTURE_BROWSER_BOOKMARKS_DEMO
  - Create one `Hoverboard Demo` folder and 5–10 stable bookmark records under the bookmarks bar.
  - Navigate to `browser-bookmarks.html`; wait for `#browserBookmarksPanel`.
  - Capture frame 0 without an overlay, then run the ordered steps for list, search, folder, sort, count, and URL actions using root `browserBookmarksPanel`.
  - Clear annotations, capture the end card, and pass all frames to `BUILD_DEMO_GIF`.

## CAPTURE_VISIT_HISTORY_DEMO

- [IMPL-DEMO_OVERLAY] [PROC-DEMO_RECORDING] [REQ-BOOKMARK_USAGE_TRACKING] [IMPL-BOOKMARK_USAGE_TRACKING_UI] How: Seed usage and navigation-edge records, open the standalone Visit History page, and highlight only `#visitHistoryPanel` while presenting its current sections.
- Contract:
  - INPUT: extension id; deterministic local usage and navigation-edge records; frame directory; `docs/demo-visit-history.gif` output
  - PRE: local storage writes are awaited; Visit History page is reachable; usage and edge fixtures contain stable timestamps
  - OUTPUT: Visit History PNG frames and `docs/demo-visit-history.gif`
  - POST:
    - success => frames show Most Visited, Recently Visited, Refresh, and Navigation Graph from the supplied fixtures
  - EFFECTS: extension storage state, browser navigation, DOM state, filesystem IO
  - FAILURE_MODES: seed write failure; page timeout; empty section; ffmpeg failure
  - DATA_TRANSITION: replace only the temporary profile's usage and edge seed; mutate only capture annotations after page load
  - TERMINATION: total
- PROCEDURE: CAPTURE_VISIT_HISTORY_DEMO
  - Write `hoverboard_bookmark_usage` and `hoverboard_bookmark_nav_edges` to temporary local storage and await completion.
  - Navigate to `visit-history.html`; wait for `#visitHistoryPanel`.
  - Capture frame 0 without an overlay, then run the ordered steps for the page introduction, Most Visited, Recently Visited, Refresh, and Navigation Graph using root `visitHistoryPanel`.
  - Clear annotations, capture the end card, and pass all frames to `BUILD_DEMO_GIF`.

## BUILD_DEMO_GIF

- [IMPL-DEMO_OVERLAY] [PROC-DEMO_RECORDING] [REQ-SIDE_PANEL_BROWSER_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SIDE_PANEL_TAGS_TREE] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [REQ-BOOKMARK_USAGE_TRACKING] How: Convert captured frames into a loop-friendly GIF with a useful static first frame, one-second overlay steps, and a half-second end interstitial.
- Contract:
  - INPUT: ordered PNG frames; palette path; GIF output path; ffmpeg
  - PRE: frame 0 and final end-card frame exist; ffmpeg is executable; at least one content frame exists
  - OUTPUT: GIF containing no-overlay, main, and end segments in order
  - POST:
    - success => output is re-encoded with the concat filter and does not use concat demuxer with `-c copy`
  - EFFECTS: filesystem IO; subprocess execution
  - FAILURE_MODES: missing frame; palette generation failure; ffmpeg concat failure
  - DATA_TRANSITION: create intermediate palette and segment GIFs; write the final GIF; preserve source PNGs
  - TERMINATION: total
- PROCEDURE: BUILD_DEMO_GIF
  - Generate one palette from all frames.
  - Build a no-overlay segment from frame 0 for one second.
  - Build the main segment from frames 1 through `N-2` at one frame per second.
  - Build the end segment from frame `N-1` for 0.5 seconds.
  - Concatenate the available segments with an ffmpeg concat filter and `-c:v gif`; never use concat demuxer `-c copy`.
