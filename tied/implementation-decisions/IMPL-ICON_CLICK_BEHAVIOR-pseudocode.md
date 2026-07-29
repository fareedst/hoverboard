# [IMPL-ICON_CLICK_BEHAVIOR] [ARCH-ICON_CLICK_BEHAVIOR] [REQ-ICON_CLICK_BEHAVIOR]
# Icon click opens side panel (default) or popup; when side panel, click toggles (close if already open).
INPUT: user clicks extension toolbar icon
OUTPUT: side panel opens or closes (toggle) when option enabled; else popup opens
DATA: SW _iconClickOpensSidePanel (cached), _sidePanelWindowId; panel _sidePanelLoadTime; MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE

# [REQ-ICON_CLICK_BEHAVIOR] [ARCH-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR]
# Manifest: no default_popup so onClicked fires.
manifest action: default_icon, default_title; no default_popup

# [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR]
# Config: iconClickOpensSidePanel default true; schema optional boolean.
getDefaultConfiguration(): iconClickOpensSidePanel: true
mergedConfigSchema: iconClickOpensSidePanel: z.boolean().optional()

# [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR]
# Options: toggle bound to iconClickOpensSidePanel; load and save with other settings.
loadSettings: set checkbox from config.iconClickOpensSidePanel
saveSettings: include iconClickOpensSidePanel from checkbox in updateConfig

# [REQ-ICON_CLICK_BEHAVIOR] [ARCH-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR]
# SW: cache preference so handler stays synchronous (user gesture required for sidePanel.open).
_seedIconClickPreferenceCache():
  getConfig().then(c => this._iconClickOpensSidePanel = c.iconClickOpensSidePanel)
  storage.onChanged.addListener(changes, areaName => IF areaName === 'local' AND changes.hoverboard_settings THEN getConfig().then(...))

# [REQ-ICON_CLICK_BEHAVIOR] [ARCH-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR]
# SW: listener passes tab from Chrome into handleActionClick(tab).
action.onClicked.addListener((tab) => handleActionClick(tab))

# [REQ-ICON_CLICK_BEHAVIOR] [ARCH-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR]
# SW handleActionClick(tab): prefer clicked window; Chrome requires sidePanel.open() in same synchronous user-gesture stack.
handleActionClick(tab):
  openSidePanel = (this._iconClickOpensSidePanel !== false)
  IF NOT openSidePanel: action.openPopup(); RETURN
  IF NOT sidePanel.open available: action.openPopup(); RETURN
  # [IMPL-ICON_CLICK_BEHAVIOR] Prefer clicked window: use tab from onClicked when provided, else cache.
  clickedWindowId = tab?.windowId != null ? tab.windowId : null
  cachedWindowId = this._sidePanelWindowId
  useWindowId = clickedWindowId != null ? clickedWindowId : cachedWindowId
  IF useWindowId != null:
    IF clickedWindowId != null AND NOT _isRestrictedForSidePanel(tab?.url): this._sidePanelWindowId = clickedWindowId
    sidePanel.open({ windowId: useWindowId }); windows.update(useWindowId, { focused: true }); sendMessage(REQUEST_SIDE_PANEL_CLOSE); RETURN
  # [IMPL-ICON_CLICK_BEHAVIOR] Cold start: no tab and no cache; do NOT call sidePanel.open in async callback (gesture would be lost). Seed cache for next click; open popup as fallback.
  tabs.query({ active: true, currentWindow: true }, (tabs) =>
    tabFromQuery = tabs?.[0]
    IF tabFromQuery?.windowId != null AND NOT _isRestrictedForSidePanel(tabFromQuery.url): this._sidePanelWindowId = tabFromQuery.windowId
  )
  action.openPopup()

# [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR]
# Side panel: on REQUEST_SIDE_PANEL_CLOSE close if visible and open long enough (toggle).
bindToggleCloseRequest():
  runtime.onMessage.addListener(message =>
    IF message?.type !== REQUEST_SIDE_PANEL_CLOSE RETURN
    IF document.visibilityState !== 'visible' RETURN
    IF (Date.now() - _sidePanelLoadTime) < 300 RETURN
    window.close())
