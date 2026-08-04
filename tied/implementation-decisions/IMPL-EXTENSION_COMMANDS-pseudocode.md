# [IMPL-EXTENSION_COMMANDS] [ARCH-QUICK_ACCESS_ENTRY] [REQ-QUICK_ACCESS_ENTRY] — Extension commands for quick access; SW owns command handling. Contract: shortcut in; one of four targets opens.

## MANIFEST_JSON

- [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-EXTENSION_COMMANDS] How: Manifest: four commands so Chrome shows them in chrome://extensions/shortcuts; user can reassign.
- Contract:
  - INPUT: user presses assigned shortcut (or default Ctrl+Shift+B/O/M/I)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: side panel opens, or options page opens, or bookmarks index tab opens, or import page tab opens
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: command names (open-side-panel, open-options, open-bookmarks-index, open-import); SW onCommand handler
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: State
  - TERMINATION: total
- PROCEDURE: MANIFEST_JSON
  - "commands": {
  - "open-side-panel": { "suggested_key": { "default": "Ctrl+Shift+B" }, "description": "Open Hoverboard side panel" },
  - "open-options": { "suggested_key": { "default": "Ctrl+Shift+O" }, "description": "Open Hoverboard options" },
  - "open-bookmarks-index": { "suggested_key": { "default": "Ctrl+Shift+M" }, "description": "Open bookmarks index" },
  - "open-import": { "suggested_key": { "default": "Ctrl+Shift+I" }, "description": "Open browser bookmark import" }
  - }

## HANDLE_COMMAND

- [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-EXTENSION_COMMANDS] How: SW onCommand: handle each command; side panel via _sidePanelWindowId; openOptionsPage and tabs.create for options, index, import.
- Contract:
  - INPUT: user presses assigned shortcut (or default Ctrl+Shift+B/O/M/I)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: side panel opens, or options page opens, or bookmarks index tab opens, or import page tab opens
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: command names (open-side-panel, open-options, open-bookmarks-index, open-import); SW onCommand handler
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: HANDLE_COMMAND
  - SWITCH command:
  - "open-side-panel": windowId = this._sidePanelWindowId; IF windowId != null AND chrome.sidePanel?.open THEN chrome.sidePanel.open({ windowId })
  - "open-side-panel-bookmark": chrome.storage.local.set({ hoverboard_sidepanel_active_tab: 'bookmark' }); THEN sidePanel.open({ windowId })
  - "open-side-panel-tags-tree": chrome.storage.local.set({ hoverboard_sidepanel_active_tab: 'tagsTree' }); THEN sidePanel.open({ windowId })
  - "open-side-panel-browser-tabs": chrome.storage.local.set({ hoverboard_sidepanel_active_tab: 'browserTabs' }); THEN sidePanel.open({ windowId })
  - "open-options": chrome.runtime.openOptionsPage()
  - "open-bookmarks-index": OPEN_BOOKMARKS_INDEX_TAB  # tabs.create + REQUEST_SIDE_PANEL_CLOSE [IMPL-LOCAL_BOOKMARKS_INDEX]
  - "open-import": chrome.tabs.create({ url: ... bookmarks-table.html?source=browser })
  - How (sub-block): Side panel: storage.onChanged for SIDE_PANEL_TAB_STORAGE_KEY → switchTab(newValue) when panel already open.
