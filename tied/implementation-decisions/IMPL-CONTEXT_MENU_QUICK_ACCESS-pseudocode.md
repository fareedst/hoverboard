# [IMPL-CONTEXT_MENU_QUICK_ACCESS] [ARCH-QUICK_ACCESS_ENTRY] [REQ-QUICK_ACCESS_ENTRY] — This block defines context menu for quick access. Implements REQ "context menu" with same four actions as commands; implements ARCH by having SW own context menu.

## SETUP_CONTEXT_MENUS

- [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-CONTEXT_MENU_QUICK_ACCESS] How: setupContextMenus: creates parent and four children so REQ "context menu with parent Hoverboard and four items" is satisfied. Call on install (handleInstall) so menus appear after install.
- Contract:
  - INPUT: user right-clicks (any context); user selects one of four Hoverboard menu items
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: same as extension commands (side panel, options, bookmarks index, or import opens)
  - POST:
    - success => block outputs match OUTPUT shape
  - EFFECTS: Http, IO, State
  - TERMINATION: total
- PROCEDURE: SETUP_CONTEXT_MENUS
  - api = browser.contextMenus || chrome.contextMenus
  - IF !api THEN RETURN
  - api.removeAll(() => {  // idempotent: clear then create so update does not duplicate
  - api.create({ id: 'hoverboard-root', title: 'Hoverboard', contexts: ['all'] })
  - api.create({ id: 'hoverboard-open-side-panel', parentId: 'hoverboard-root', title: 'Open side panel', contexts: ['all'] })
  - api.create({ id: 'hoverboard-open-options', parentId: 'hoverboard-root', title: 'Open options', contexts: ['all'] })
  - api.create({ id: 'hoverboard-open-bookmarks-index', parentId: 'hoverboard-root', title: 'Open bookmarks index', contexts: ['all'] })
  - api.create({ id: 'hoverboard-open-import', parentId: 'hoverboard-root', title: 'Open browser bookmark import', contexts: ['all'] })
  - })

## BLOCK_2

- [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-CONTEXT_MENU_QUICK_ACCESS] How: onClicked: implements same four actions as command handler so REQ and ARCH are satisfied (single behavior, multiple entry points).
- Contract:
  - INPUT: user right-clicks (any context); user selects one of four Hoverboard menu items
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: same as extension commands (side panel, options, bookmarks index, or import opens)
  - POST:
    - success => block outputs match OUTPUT shape
  - EFFECTS: Http, IO
  - TERMINATION: total
- PROCEDURE: BLOCK_2
  - 1. api.onClicked.addListener((info, tab) => {
  - 2.   SWITCH info.menuItemId:
  - 3.     "hoverboard-open-side-panel": same as open-side-panel command (chrome.sidePanel.open({ windowId: this._sidePanelWindowId }))
  - 4.     "hoverboard-open-options": chrome.runtime.openOptionsPage()
  - 5.     "hoverboard-open-bookmarks-index": OPEN_BOOKMARKS_INDEX_TAB  # [IMPL-LOCAL_BOOKMARKS_INDEX]
  - 6.     "hoverboard-open-import": chrome.tabs.create({ url: chrome.runtime.getURL('src/ui/bookmarks-table/bookmarks-table.html?source=browser') })
  - 7. })
