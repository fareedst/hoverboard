# [IMPL-SIDE_PANEL_SNAPSHOT] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SIDE_PANEL_TAGS_TREE] — Side panel snapshot helper for This Page / By Tag / Tabs. Browser Bookmarks is an absence check because it is a standalone page ([IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]).

## MAIN

- [IMPL-SIDE_PANEL_SNAPSHOT] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_BOOKMARK] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] How: Collect the Bookmark, By Tag, and Tabs panel shapes; represent Browser Bookmarks as an explicit absence check on side-panel.html because its UI is standalone.
- Contract:
  - INPUT: page (Playwright/Puppeteer page navigated to side-panel.html)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: { bookmarkTab: {...}, tagsTreeTab: {...}, browserTabsTab: {...}, browserBookmarksTab: { panelPresent: false } } on side-panel.html | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: document in page context
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: MAIN
  - Locate #bookmarkPanel and return panelPresent, screen, visibility flags, and error text.
  - Locate #tagsTreePanel and return presence of tag selector, tree, search, config, count, empty, and error elements.
  - Locate #browserTabsPanel and return presence of scope, layout, filter, action, list, and section elements.
  - Locate #browserBookmarksPanel.
  - IF #browserBookmarksPanel is absent: return browserBookmarksTab.panelPresent = false.
  - IF #browserBookmarksPanel is present: return its standalone-page controls without treating it as a side-panel tab.
  - RETURN { bookmarkTab, tagsTreeTab, browserTabsTab, browserBookmarksTab }.
