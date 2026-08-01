# [IMPL-NON_WEB_TOOLS_TOOLBAR] [ARCH-NON_WEB_TOOLS_TOOLBAR] [REQ-NON_WEB_TOOLS_TOOLBAR] — Non-web: close side panel; badge opens tools toolbar; Browser Bookmarks is standalone.

## IS_WEB_PROTOCOL_URL

- [IMPL-NON_WEB_TOOLS_TOOLBAR] [ARCH-NON_WEB_TOOLS_TOOLBAR] [REQ-NON_WEB_TOOLS_TOOLBAR] How: Allowlist http/https only for web-protocol routing (distinct from script inject classifier).
- Contract:
  - INPUT: url (string | unknown)
  - PRE: none
  - OUTPUT: boolean
  - POST: true iff trimmed lower starts with http:// or https://
  - EFFECTS: none
  - TERMINATION: total
- PROCEDURE: IS_WEB_PROTOCOL_URL
  - IF typeof url !== 'string' RETURN false
  - lower = trim(url).toLowerCase()
  - IF lower === '' RETURN false
  - RETURN lower.startsWith('http://') OR lower.startsWith('https://')

## DISMISS_SIDE_PANEL_IF_NON_WEB

- [IMPL-NON_WEB_TOOLS_TOOLBAR] [ARCH-NON_WEB_TOOLS_TOOLBAR] [REQ-NON_WEB_TOOLS_TOOLBAR] How: On active tab activate/navigate-complete, if URL non-web send REQUEST_SIDE_PANEL_CLOSE.
- Contract:
  - INPUT: tab.url
  - PRE: SW runtime available
  - OUTPUT: message sent when non-web
  - POST: web URLs do not send dismiss for protocol reason
  - EFFECTS: IO (runtime.sendMessage)
  - TERMINATION: total
- PROCEDURE: DISMISS_SIDE_PANEL_IF_NON_WEB
  - IF NOT IS_WEB_PROTOCOL_URL(tab.url): runtime.sendMessage({ type: REQUEST_SIDE_PANEL_CLOSE })

## SYNC_ACTION_POPUP_FOR_TAB

- [IMPL-NON_WEB_TOOLS_TOOLBAR] [ARCH-NON_WEB_TOOLS_TOOLBAR] [REQ-NON_WEB_TOOLS_TOOLBAR] How: setPopup tools-toolbar on non-web; clear or popup.html on web per iconClickOpensSidePanel.
- Contract:
  - INPUT: tab, _iconClickOpensSidePanel
  - PRE: action.setPopup available
  - OUTPUT: popup path synced for tabId
  - POST: non-web → tools-toolbar.html; web + side-panel preference → empty popup; web + popup preference → popup.html
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: SYNC_ACTION_POPUP_FOR_TAB
  - IF NOT IS_WEB_PROTOCOL_URL(tab.url): action.setPopup({ tabId, popup: 'src/ui/tools-toolbar/tools-toolbar.html' }); RETURN
  - IF _iconClickOpensSidePanel === false: action.setPopup({ tabId, popup: 'src/ui/popup/popup.html' }); RETURN
  - action.setPopup({ tabId, popup: '' })

## OPEN_BROWSER_BOOKMARKS_PAGE

- [IMPL-NON_WEB_TOOLS_TOOLBAR] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] How: tabs.create standalone Browser Bookmarks page (no longer side-panel tab).
- Contract:
  - INPUT: none
  - PRE: runtime.getURL
  - OUTPUT: new tab with browser-bookmarks.html
  - POST: does not switch a side-panel tab (Bookmarks is not a side-panel surface)
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: OPEN_BROWSER_BOOKMARKS_PAGE
  - tabs.create({ url: runtime.getURL('src/ui/browser-bookmarks/browser-bookmarks.html') })

## HANDLE_OPEN_SIDE_PANEL_WHEN_NON_WEB

- [IMPL-NON_WEB_TOOLS_TOOLBAR] [IMPL-ICON_CLICK_BEHAVIOR] [REQ-NON_WEB_TOOLS_TOOLBAR] How: open-side-panel / OPEN_SIDE_PANEL / handleActionClick on non-web must not sidePanel.open; ensure tools popup then openPopup.
- Contract:
  - INPUT: active tab url
  - PRE: user gesture when openPopup
  - OUTPUT: tools toolbar shown
  - POST: non-web path never calls sidePanel.open
  - EFFECTS: IO
  - FAILURE_MODES: openPopup unavailable after setPopup (best-effort)
  - TERMINATION: total
- PROCEDURE: HANDLE_OPEN_SIDE_PANEL_WHEN_NON_WEB
  - IF IS_WEB_PROTOCOL_URL(url): existing side panel / popup path; RETURN
  - SYNC_ACTION_POPUP_FOR_TAB(tab)
  - action.openPopup()

## TOOLS_TOOLBAR_PAGE

- [IMPL-NON_WEB_TOOLS_TOOLBAR] [ARCH-NON_WEB_TOOLS_TOOLBAR] [REQ-NON_WEB_TOOLS_TOOLBAR] [REQ-EXTENSION_BUNDLED_ENTRY_POINTS] [REQ-BOOKMARK_USAGE_TRACKING] How: Unbundled tools-toolbar.js must not import message-handler (pulls pinboard/fast-xml-parser bare specifier); use OPEN_BOOKMARKS_INDEX string literal; wire five launchers including Visit History.
- Contract:
  - INPUT: toolbar button clicks
  - PRE: tools-toolbar.html buttons present in document (action popup or test root)
  - OUTPUT: Index via sendMessage OPEN_BOOKMARKS_INDEX; Import/Browser Bookmarks/Visit History via tabs.create; Options via openOptionsPage
  - POST: no bare npm module specifiers in tools-toolbar.js import graph
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: TOOLS_TOOLBAR_PAGE
  - OPEN_BOOKMARKS_INDEX = 'OPEN_BOOKMARKS_INDEX'  # do not import MESSAGE_TYPES from message-handler.js
  - IF typeof document === 'undefined': skip auto-bind (import-safe for composition tests)
  - ON btn-bookmarks-index: runtime.sendMessage({ type: OPEN_BOOKMARKS_INDEX })
  - ON btn-browser-import: tabs.create(getURL(browser-bookmark-import.html))
  - ON btn-options: runtime.openOptionsPage()
  - ON btn-browser-bookmarks: tabs.create(getURL(browser-bookmarks.html))
  - ON btn-visit-history: tabs.create(getURL(visit-history.html))
