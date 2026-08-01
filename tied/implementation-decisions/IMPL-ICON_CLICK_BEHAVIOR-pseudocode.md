# [IMPL-ICON_CLICK_BEHAVIOR] [ARCH-ICON_CLICK_BEHAVIOR] [REQ-ICON_CLICK_BEHAVIOR] — Icon click opens side panel (default) or popup; non-web tabs route to tools toolbar ([IMPL-NON_WEB_TOOLS_TOOLBAR]); when side panel, click toggles (close if already open).

## _SEED_ICON_CLICK_PREFERENCE_CACHE

- [REQ-ICON_CLICK_BEHAVIOR] [ARCH-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] How: Manifest: no default_popup so onClicked fires. Config: iconClickOpensSidePanel default true; schema optional boolean. Options: toggle bound to iconClickOpensSidePanel; load and save with other settings. SW: cache preference so handler stays synchronous (user gesture required for sidePanel.open).
- Contract:
  - INPUT: user clicks extension toolbar icon
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: side panel opens or closes (toggle) when option enabled; else popup opens; non-web → tools toolbar
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: SW _iconClickOpensSidePanel (cached), _sidePanelWindowId; panel _sidePanelLoadTime; MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: _SEED_ICON_CLICK_PREFERENCE_CACHE
  - getConfig().then(c => this._iconClickOpensSidePanel = c.iconClickOpensSidePanel)
  - storage.onChanged.addListener(changes, areaName => IF areaName === 'local' AND changes.hoverboard_settings THEN getConfig().then(...))

## HANDLE_ACTION_CLICK

- [REQ-ICON_CLICK_BEHAVIOR] [ARCH-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] [IMPL-NON_WEB_TOOLS_TOOLBAR] [REQ-NON_WEB_TOOLS_TOOLBAR] How: SW: listener passes tab from Chrome into handleActionClick(tab). Non-web URL → _openToolsToolbar (setPopup tools-toolbar + openPopup); do not sidePanel.open. Web: prefer clicked window; Chrome requires sidePanel.open() in same synchronous user-gesture stack.
- Contract:
  - INPUT: user clicks extension toolbar icon; tab from onClicked
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: tools toolbar on non-web; else side panel opens or closes (toggle) when option enabled; else popup opens
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: SW _iconClickOpensSidePanel (cached), _sidePanelWindowId; panel _sidePanelLoadTime; MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
  - EFFECTS: Async, IO
  - FAILURE_MODES: openPopup unavailable (best-effort no-op after setPopup)
  - TERMINATION: total
- PROCEDURE: HANDLE_ACTION_CLICK
  - How (sub-block): # [IMPL-NON_WEB_TOOLS_TOOLBAR] Non-web: badge opens tools toolbar, not side panel.
  - IF tab?.url != null AND NOT IS_WEB_PROTOCOL_URL(tab.url): _openToolsToolbar(tab); RETURN
  - openSidePanel = (this._iconClickOpensSidePanel !== false)
  - IF NOT openSidePanel: action.openPopup(); RETURN
  - IF NOT sidePanel.open available: action.openPopup(); RETURN
  - How (sub-block): # [IMPL-ICON_CLICK_BEHAVIOR] Prefer clicked window: use tab from onClicked when provided, else cache.
  - clickedWindowId = tab?.windowId != null ? tab.windowId : null
  - cachedWindowId = this._sidePanelWindowId
  - useWindowId = clickedWindowId != null ? clickedWindowId : cachedWindowId
  - IF useWindowId != null:
  - IF clickedWindowId != null AND NOT _isRestrictedForSidePanel(tab?.url): this._sidePanelWindowId = clickedWindowId
  - sidePanel.open({ windowId: useWindowId }); windows.update(useWindowId, { focused: true }); sendMessage(REQUEST_SIDE_PANEL_CLOSE); RETURN
  - How (sub-block): # [IMPL-ICON_CLICK_BEHAVIOR] Cold start: no tab and no cache; do NOT call sidePanel.open in async callback (gesture would be lost). Seed cache for next click; open popup as fallback.
  - tabs.query({ active: true, currentWindow: true }, (tabs) =>
  - tabFromQuery = tabs?.[0]
  - IF tabFromQuery?.windowId != null AND NOT _isRestrictedForSidePanel(tabFromQuery.url): this._sidePanelWindowId = tabFromQuery.windowId
  - )
  - action.openPopup()

## BIND_TOGGLE_CLOSE_REQUEST

- [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] How: Side panel: on REQUEST_SIDE_PANEL_CLOSE close if visible and open long enough (toggle).
- Contract:
  - INPUT: user clicks extension toolbar icon
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: side panel opens or closes (toggle) when option enabled; else popup opens
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: SW _iconClickOpensSidePanel (cached), _sidePanelWindowId; panel _sidePanelLoadTime; MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: BIND_TOGGLE_CLOSE_REQUEST
  - runtime.onMessage.addListener(message =>
  - IF message?.type !== REQUEST_SIDE_PANEL_CLOSE RETURN
  - IF document.visibilityState !== 'visible' RETURN
  - IF (Date.now() - _sidePanelLoadTime) < 300 RETURN
  - window.close())
