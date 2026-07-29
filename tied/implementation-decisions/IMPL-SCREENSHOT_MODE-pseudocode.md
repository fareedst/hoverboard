# [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX]
# Placeholder screenshot flow: seed storage, fake tab params, data-screenshot-ready, handleGetCurrentBookmark prefers data.url.
# Contract: URL params and seed; placeholder UI and script capture.
INPUT: ?screenshot=1&url=...&title=... (popup/side panel); seed JSON (local bookmarks, storage index, theme); optional --seed=path
OUTPUT: popup/index/side panel rendered with placeholder data; data-screenshot-ready attribute; script can capture screenshot
DATA: PopupController._screenshotMode; handleGetCurrentBookmark prefers data.url when http(s); placeholderStorageSeed

# [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX]
# Rich placeholder data: 15+ bookmarks so index and By Tag tree look robust; hero Pinboard entry with 6+ tags and non-empty extended for This Page view.
localBookmarks: BUILD object keyed by URL; Pinboard entry HAS tags.length >= 6, extended non-empty, toread 'yes'; total entries >= 15; mix of toread yes/no; storageIndex one key per localBookmarks URL, value 'local'

# Await seed; open popup/index; wait for ready; check store-local for index; capture.
Script: SEED chrome.storage.local/sync (await set); optional LOAD seed from file; OPEN popup or index; WAIT for [data-screenshot-ready="true"]; CHECK #store-local for index; CAPTURE screenshot

# Use URL params as fake tab; set data-screenshot-ready in finally.
Popup load: IF screenshot=1 and url param: USE param as fake tab url/title; SKIP getCurrentTab; IN finally SET data-screenshot-ready on #mainInterface

# Prefer data.url as targetUrl when http(s) so popup-as-tab gets correct bookmark.
handleGetCurrentBookmark: IF data.url present and http(s): USE as targetUrl so popup-as-tab gets bookmark for screenshot URL

# [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX]
# Side panel: open with ?screenshot=1&url=screenshotPopupUrl&title=screenshotPopupTitle so Bookmark tab shows Pinboard bookmark (same doc, PopupController reads window.location.search).
Side panel URL: GOTO side-panel.html?screenshot=1&url=encode(screenshotPopupUrl)&title=encode(screenshotPopupTitle); SET viewport width 360 (or 240); WAIT for tab content; CAPTURE screenshot (This Page, then By Tag, Tabs, etc.); output side-panel-bookmark.png, side-panel-tags-tree.png, side-panel-tabs.png

# [IMPL-SCREENSHOT_MODE] [PROC-DEMO_RECORDING] Demo GIF script: seed storage then open side panel with same screenshot params so GIF shows rich This Page state.
record-demo-side-panel-this-page: SEED chrome.storage.local with placeholderStorageSeed via options page; GOTO side-panel.html?screenshot=1&url=...&title=...; record frames; assemble GIF

# [IMPL-SCREENSHOT_MODE] [REQ-SUGGESTED_TAGS_FROM_CONTENT] Demo suggested tags overlay: in screenshot/demo mode Suggested Tags are empty (no tab.id for injection). Seed hoverboard_demo_suggested_tags (array of strings) in placeholderStorageSeed; PopupController in loadInitialData when _screenshotMode after loadSuggestedTags() reads chrome.storage.local.get('hoverboard_demo_suggested_tags') and if non-empty array calls this.uiManager.updateSuggestedTags(value) so screenshots and demo GIF show sample Suggested Tags.

# [IMPL-SCREENSHOT_MODE] [REQ-RECENT_TAGS_SYSTEM] Demo recent tags overlay: in screenshot/demo mode Recent Tags are empty (SW in-memory empty). Seed hoverboard_demo_recent_tags (array of strings) in placeholderStorageSeed; placeholderRecentTags exported; PopupController in loadRecentTags() when _screenshotMode calls loadDemoRecentTagsIfScreenshotMode() which reads chrome.storage.local.get('hoverboard_demo_recent_tags'), filters out current bookmark tags, and calls this.uiManager.updateRecentTags(filtered) so side-panel-bookmark.png shows all three tag sections (Current, Recent, Suggested). Script waits for suggestedTagsContainer .tag before capture.
