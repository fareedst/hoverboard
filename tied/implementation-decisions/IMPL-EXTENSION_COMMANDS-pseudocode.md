# [IMPL-EXTENSION_COMMANDS] [ARCH-QUICK_ACCESS_ENTRY] [REQ-QUICK_ACCESS_ENTRY]
# Extension commands for quick access; SW owns command handling.
# Contract: shortcut in; one of four targets opens.
INPUT: user presses assigned shortcut (or default Ctrl+Shift+B/O/M/I)
OUTPUT: side panel opens, or options page opens, or bookmarks index tab opens, or import page tab opens
DATA: command names (open-side-panel, open-options, open-bookmarks-index, open-import); SW onCommand handler

# [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-EXTENSION_COMMANDS]
# Manifest: four commands so Chrome shows them in chrome://extensions/shortcuts; user can reassign.
manifest.json:
  "commands": {
    "open-side-panel": { "suggested_key": { "default": "Ctrl+Shift+B" }, "description": "Open Hoverboard side panel" },
    "open-options": { "suggested_key": { "default": "Ctrl+Shift+O" }, "description": "Open Hoverboard options" },
    "open-bookmarks-index": { "suggested_key": { "default": "Ctrl+Shift+M" }, "description": "Open bookmarks index" },
    "open-import": { "suggested_key": { "default": "Ctrl+Shift+I" }, "description": "Open browser bookmark import" }
  }

# [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-EXTENSION_COMMANDS]
# SW onCommand: handle each command; side panel via _sidePanelWindowId; openOptionsPage and tabs.create for options, index, import.
SW setupEventListeners (or init):
  IF chrome.commands THEN chrome.commands.onCommand.addListener((command) => handleCommand(command))
handleCommand(command):
  SWITCH command:
    "open-side-panel": windowId = this._sidePanelWindowId; IF windowId != null AND chrome.sidePanel?.open THEN chrome.sidePanel.open({ windowId })
    "open-side-panel-bookmark": chrome.storage.local.set({ hoverboard_sidepanel_active_tab: 'bookmark' }); THEN sidePanel.open({ windowId })
    "open-side-panel-tags-tree": chrome.storage.local.set({ hoverboard_sidepanel_active_tab: 'tagsTree' }); THEN sidePanel.open({ windowId })
    "open-side-panel-browser-tabs": chrome.storage.local.set({ hoverboard_sidepanel_active_tab: 'browserTabs' }); THEN sidePanel.open({ windowId })
    "open-options": chrome.runtime.openOptionsPage()
    "open-bookmarks-index": OPEN_BOOKMARKS_INDEX_TAB  # tabs.create + REQUEST_SIDE_PANEL_CLOSE [IMPL-LOCAL_BOOKMARKS_INDEX]
    "open-import": chrome.tabs.create({ url: ... browser-bookmark-import.html })
# Side panel: storage.onChanged for SIDE_PANEL_TAB_STORAGE_KEY → switchTab(newValue) when panel already open.
