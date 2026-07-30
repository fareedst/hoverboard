# [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] [ARCH-SIDE_PANEL_RECENTLY_CLOSED_TABS] [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] — Tab source toggle and recently closed tabs integration. Extends IMPL-SIDE_PANEL_BROWSER_TABS with open | recentlyClosed | both.

## NORMALIZE_CLOSED_SESSIONS

- [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [ARCH-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] How: normalizeClosedSessions(sessions): pure. Flatten Session[] from getRecentlyClosed; each tab: id=sessionId, sessionId, title, url, lastModified, isClosed=true, referrer='', pageText='', importantTags=''. Window sessions: recurse into tabs.
- Contract:
  - INPUT: context / caller args
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: result
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: tabSource = 'open' | 'recentlyClosed' | 'both' (default 'open')
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: NORMALIZE_CLOSED_SESSIONS
  - result = []; FOR each s in sessions: IF s.tab: result.push({ id: s.tab.sessionId, sessionId: s.tab.sessionId, title: s.tab.title??'', url: s.tab.url??'', lastModified: s.lastModified, isClosed: true, referrer: '', pageText: '', importantTags: '' }); IF s.window && s.window.tabs: FOR each t in s.window.tabs: result.push({ id: t.sessionId, sessionId: t.sessionId, title: t.title??'', url: t.url??'', lastModified: s.lastModified, isClosed: true, referrer: '', pageText: '', importantTags: '' }); RETURN result

## BLOCK_2

- [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [ARCH-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] How: GET_RECENTLY_CLOSED_TABS (SW): sessions = chrome.sessions.getRecentlyClosed({ maxResults: 25 }); tabs = normalizeClosedSessions(sessions); RETURN { success: true, data: tabs } loadTabs: when tabSource=open: existing chrome.tabs path. When recentlyClosed: sendMessage GET_RECENTLY_CLOSED_TABS; allTabs = response.data. When both: openTabs = chrome.tabs.query; closedTabs = GET_RECENTLY_CLOSED_TABS; allTabs = openTabs.concat(closedTabs). Scope restriction: when tabSource includes recentlyClosed, searchScope forced to tabInfo; Page text and Elements disabled with note. Restore: closed tab card has data-action=restoreTab data-session-id. ON click: chrome.sessions.restore(sessionId); loadTabs(). Open tab keeps data-action=closeTab. buildRecordsYamlForCopy: for closed tabs include sessionId and lastModified; id may be sessionId string. hiddenTabIds: use tab.id (numeric for open, sessionId string for closed). getDisplayedTabs filters by !hiddenTabIds.has(t.id). Sessions API check: if !chrome.sessions: hide tab source options recentlyClosed and both; show only Open. Gather/Distribute: when tabSource=recentlyClosed or all displayed are closed, hide or disable Gather and Distribute. Close: only for open tabs. toClose = visibleTabs.filter(t => !t.isClosed); confirm; chrome.tabs.remove each; loadTabs()
- Contract:
  - INPUT: context / caller args
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: result
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: tabSource = 'open' | 'recentlyClosed' | 'both' (default 'open')
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: BLOCK_2
  - 1. ON GET_RECENTLY_CLOSED_TABS (service worker): sessions = AWAIT chrome.sessions.getRecentlyClosed({ maxResults: 25 }); tabs = normalizeClosedSessions(sessions); RETURN { success: true, data: tabs }
  - 2. ON loadTabs: IF tabSource === 'open': (existing path); IF tabSource === 'recentlyClosed': allTabs = AWAIT sendMessage(GET_RECENTLY_CLOSED_TABS).data; IF tabSource === 'both': openTabs = AWAIT chrome.tabs.query(...); closedTabs = AWAIT sendMessage(GET_RECENTLY_CLOSED_TABS).data; allTabs = openTabs.concat(closedTabs)
  - 3. IF tabSource !== 'open': searchScope = 'tabInfo'; disable pageText/importantTags radios; show note
  - 4. RENDER (closed tab): Restore button (data-action=restoreTab, data-session-id); no Close button
  - 5. ON restoreTab click: sessionId = data-session-id; AWAIT chrome.sessions.restore(sessionId); loadTabs()
  - 6. buildRecordsYamlForCopy: IF tab.isClosed: add sessionId, lastModified to YAML entry
  - 7. IF !chrome.sessions: tabSourceOptions = ['open'] only
  - 8. IF tabSource === 'recentlyClosed' OR (tabSource === 'both' AND getDisplayedTabs().every(t => t.isClosed)): hide Gather, Distribute
  - 9. ON Close: toClose = visibleTabs.filter(t => !t.isClosed); confirm; FOR each in toClose: chrome.tabs.remove(t.id); loadTabs()
