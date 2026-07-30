/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_BROWSER_TABS ===
 * [IMPL-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [REQ-SIDE_PANEL_BROWSER_TABS] — This block defines the browser tabs panel: data fetch, search scope, filter, UI, copy URLs, close with confirm. Implements REQ by listing tabs with title/URL/referrer and optional pageText/importantTags; scope-aware filter; implements ARCH by chrome.tabs + scripting and visible-list actions.
 * 
 * ## FILTER_BROWSER_TABS
 * 
 * - [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] How: Data fetch: panel queries chrome.tabs; windowScope selects query. Referrer via GET_TAB_REFERRERS (SW executeScript per tab). When searchScope is pageText or importantTags, panel sends GET_TABS_PAGE_TEXT or GET_TABS_IMPORTANT_TAGS with tab list; SW executeScript per tab returns tabId→string map; panel merges into allTabs. Show loading state during pageText/importantTags fetch. Implements "list from current or all windows", "collect referrer", "search in page text or important tags". filterBrowserTabs(tabs, query, scope): pure function. Empty query returns all. scope tabInfo → match title, url, referrer; scope pageText → match tab.pageText; scope importantTags → match tab.importantTags. Case-insensitive substring. Implements "filter by search term" and "search in selected scope".
 * - Contract:
 *   - INPUT: windowScope (currentWindow | all), searchScope (tabInfo | pageText | importantTags), searchQuery (string), tabs list from chrome.tabs
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: visible tabs (filtered), copy URLs to clipboard with count, close visible tabs after confirm with count
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: tabs = [{ id, windowId, title, url, referrer, pageText?, importantTags? }], visibleTabs = filterBrowserTabs(tabs, searchQuery, searchScope)
 *   - EFFECTS: Async, Http, IO
 *   - TERMINATION: total
 * - PROCEDURE: FILTER_BROWSER_TABS
 *   - q = String(query).trim().toLowerCase()
 *   - IF q === '' RETURN tabs
 *   - IF scope === 'tabInfo': RETURN tabs WHERE (t.title??'').toLowerCase().includes(q) OR (t.url??'').toLowerCase().includes(q) OR (t.referrer??'').toLowerCase().includes(q)
 *   - IF scope === 'pageText': RETURN tabs WHERE (t.pageText??'').toLowerCase().includes(q)
 *   - IF scope === 'importantTags': RETURN tabs WHERE (t.importantTags??'').toLowerCase().includes(q)
 *   - RETURN tabs
 * 
 * ## MERGE_BOOKMARK_REPLY_INTO_TAB
 * 
 * - [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] How: UI: window scope toggle; search-scope control (Tab info | Page text | Elements, default Tab info); control groups with very narrow margins; Title/URL/Block above filter textbox; on searchScope change, if pageText or importantTags fetch that data and merge; search input; on input visibleTabs = filterBrowserTabs(allTabs, searchQuery, searchScope); re-render. Multi-row card per tab. Implements "search scope selection", "filter by selected scope". List display mode: user chooses what each list item shows (title only, URL only, or full block). Default block. In non-block mode text is clickable to focus window/tab; remove icon after text. Implements "choose how each tab is shown" and "clickable text in title/url mode". Remove from display: session-scoped hidden set; remove icon in all modes (after text in title/url, before Tags in block). Refresh clears. Implements "remove from displayed list". Close single tab: per-row close-tab button before window id (block: before ids line; title/url: before focus link). Remove button unchanged (after tab id / after link). ON click (data-action=closeTab): chrome.tabs.remove(tabId); then remove from allTabs and re-render or loadTabs(). Focus on click: in block mode ids line (.browser-tabs-card-ids-link); in title/url mode the text (.browser-tabs-card-focus-link). Both have data-window-id and data-tab-id. On click (delegated): read ids; if valid, chrome.windows.update(windowId, { focused: true }); chrome.tabs.update(tabId, { active: true }). Bookmark tags + row flags: after allTabs built (referrers merged), FOR each tab WHERE url is http(s): reply = getCurrentBookmark({ url, title }); mergeBookmarkReplyIntoTab(tab, reply). In RENDER show "Tags: " + join(tab.bookmarkTags) or "—" plus to-read/private indicators when flags are true. How: apply getCurrentBookmark reply to a tab row — tags array plus boolean bookmarkToread / bookmarkPrivate from toread/shared (trim + case-insensitive; defaults toread=no, shared=yes). Clear all three when reply missing, unsuccessful, or blocked.
 * - Contract:
 *   - INPUT: windowScope (currentWindow | all), searchScope (tabInfo | pageText | importantTags), searchQuery (string), tabs list from chrome.tabs
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: visible tabs (filtered), copy URLs to clipboard with count, close visible tabs after confirm with count
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: listDisplayMode = 'block' | 'title' | 'url' (default 'block')
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MERGE_BOOKMARK_REPLY_INTO_TAB
 *   - IF NOT reply OR NOT reply.success OR NOT reply.data OR reply.data.blocked:
 *   - tab.bookmarkTags = []; tab.bookmarkToread = false; tab.bookmarkPrivate = false; RETURN
 *   - d = reply.data
 *   - tab.bookmarkTags = Array.isArray(d.tags) ? d.tags : []
 *   - exists = !!d.exists
 *   - tab.bookmarkToread = exists AND (trim+lower(d.toread ?? 'no') === 'yes')
 *   - tab.bookmarkPrivate = exists AND (trim+lower(d.shared ?? 'yes') === 'no')
 * 
 * ## BUILD_BOOKMARK_TOGGLES_MARKUP
 * 
 * - [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] How: render inline to-read indicator and private indicator when tab.bookmarkToread / tab.bookmarkPrivate are true (classes browser-tabs-card-toggle-toread / -private inside .browser-tabs-card-toggles).
 * - Contract:
 *   - INPUT: windowScope (currentWindow | all), searchScope (tabInfo | pageText | importantTags), searchQuery (string), tabs list from chrome.tabs
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: visible tabs (filtered), copy URLs to clipboard with count, close visible tabs after confirm with count
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: tabs = [{ id, windowId, title, url, referrer, pageText?, importantTags? }], visibleTabs = filterBrowserTabs(tabs, searchQuery, searchScope)
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: BUILD_BOOKMARK_TOGGLES_MARKUP
 *   - parts = []
 *   - IF tab.bookmarkToread: parts.push span.browser-tabs-card-toggle-toread (title/aria "To read")
 *   - IF tab.bookmarkPrivate: parts.push span.browser-tabs-card-toggle-private (title/aria "Private")
 *   - IF parts empty: RETURN ''
 *   - RETURN span.browser-tabs-card-toggles wrapping parts
 *   - 1. RENDER (per card, with tags): include buildBookmarkTogglesMarkup(tab) near Tags line
 * 
 * ## REFRESH_BOOKMARK_DISPLAY_FOR_ALL_TABS
 * 
 * - [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] How: post-batch bookmark refresh — after Set/Clear to-read or Add tags, re-query getCurrentBookmark for every tab in allTabs and mergeBookmarkReplyIntoTab so tags and indicators match storage; then applyFilter().
 * - Contract:
 *   - INPUT: windowScope (currentWindow | all), searchScope (tabInfo | pageText | importantTags), searchQuery (string), tabs list from chrome.tabs
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: visible tabs (filtered), copy URLs to clipboard with count, close visible tabs after confirm with count | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: tabs = [{ id, windowId, title, url, referrer, pageText?, importantTags? }], visibleTabs = filterBrowserTabs(tabs, searchQuery, searchScope)
 *   - EFFECTS: Async, Http, IO
 *   - TERMINATION: total
 * - PROCEDURE: REFRESH_BOOKMARK_DISPLAY_FOR_ALL_TABS
 *   - FOR each tab in allTabs:
 *   - IF tab.url is not http(s): mergeBookmarkReplyIntoTab(tab, { success: false }); CONTINUE
 *   - reply = AWAIT getCurrentBookmark({ url: tab.url, title: tab.title })
 *   - mergeBookmarkReplyIntoTab(tab, reply)  // on error: merge with { success: false }
 *   - applyFilter()
 * 
 * ## BLOCK_5
 * 
 * - [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] How: Copy URLs / Copy Records / Close: unchanged; act on visibleTabs. Close tabs with tag(s): from visibleTabs take those with Array.isArray(tab.bookmarkTags) && tab.bookmarkTags.length > 0; confirm; chrome.tabs.remove each; then loadTabs(). Close tabs without tags: from visibleTabs take those with !tab.bookmarkTags || !Array.isArray(tab.bookmarkTags) || tab.bookmarkTags.length === 0; confirm; remove each; then loadTabs(). Refresh: clear hidden set then loadTabs() so list repopulates and all tabs can reappear. Batch bookmark actions: Set to-read (fetch then merge to preserve tags; create if missing), Clear to-read (skip if no bookmark), Add tags (create if missing; use reply.data.url). Only http(s) URLs. After each batch, AWAIT refreshBookmarkDisplayForAllTabs() so row tags and to-read/private indicators match storage. SW returns handler response as-is; handler getCurrentBookmark returns plain dataOut. Panel structure: same scroll behavior as Tags tree. Panel (#browserTabsPanel) is the scroll container. First child .browser-tabs-above-list (flex: none): header, window scope, search scope, filter, message, stats line (#browserTabsStats), batch bookmark, actions. Second child .browser-tabs-list-section (min-height: 100%, overflow-y: auto): Title/URL/Block control row immediately above #browserTabsList. Above block scrolls off; list section fills visible height and scrolls list. Implements "Title/URL/Block above list" and "stats line above Tags". Stats line: above batch bookmark (Tags) section, element #browserTabsStats. Display counts from getDisplayedTabs(): displayWindows = unique windowIds in getDisplayedTabs(), displayTabs = getDisplayedTabs().length. Totals from loadTabs: totalWindows = (await chrome.windows.getAll()).length, totalTabs = (await chrome.tabs.query({})).length. Update stats on renderList() and after loadTabs(). Format e.g. "Windows: displayWindows / totalWindows · Tabs: displayTabs / totalTabs". When APIs unavailable (e.g. tests) use 0 or fallback. Implements "stats line showing display group vs all open". Sections and tooltips: controls grouped into sections (Scope, Filter & display, Batch bookmark, List actions, Window actions). Stats line above Batch bookmark. Title/URL/Block in list section above #browserTabsList. Every control has title and where helpful aria-label. Implements "sections for UI controls" and "tooltips on controls". Favicon: allTabs preserve favIconUrl from chrome.tabs. RENDER: each card shows img.browser-tabs-card-favicon with src=tab.favIconUrl (fallback when empty to avoid broken img). Block mode: favicon before title; title/url mode: favicon before the clickable text. Elements: label + textbox only; always use textbox value (parseImportantTagSources); when empty use default list. Textbox persisted in chrome.storage.local on blur; on load populate from storage or default. Control groups: narrow margins (browser-tabs-control-group). Gather: move displayed tabs into current window. currentWindowId = (await chrome.windows.getCurrent()).id; FOR each tab in getDisplayedTabs(): IF tab.windowId !== currentWindowId THEN chrome.tabs.move(tab.id, { windowId: currentWindowId, index: -1 }); show "Gathered N tabs" or "All visible tabs already in this window"; loadTabs(). Distribute: each displayed tab in its own window; skip if already only tab in window. FOR each tab in getDisplayedTabs(): tabsInWindow = await chrome.tabs.query({ windowId: tab.windowId }); IF tabsInWindow.length > 1: chrome.windows.create({ tabId: tab.id }); show "Distributed N tabs"; loadTabs().
 * - Contract:
 *   - INPUT: windowScope (currentWindow | all), searchScope (tabInfo | pageText | importantTags), searchQuery (string), tabs list from chrome.tabs
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: visible tabs (filtered), copy URLs to clipboard with count, close visible tabs after confirm with count
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: tab.favIconUrl from query
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_5
 *   - 1. ON Copy button click: urls = visibleTabs.map(t => t.url); navigator.clipboard.writeText(urls.join('\n')); showToastOrMessage("Copied " + urls.length + " URLs")
 *   - 2. ON Copy Records button click: yamlString = buildRecordsYamlForCopy(visibleTabs); navigator.clipboard.writeText(yamlString); showToastOrMessage("Copied " + visibleTabs.length + " record(s)")
 *   - 3. ON Close button click: IF visibleTabs.length === 0 return; IF NOT confirm("Close " + visibleTabs.length + " tabs?") return; FOR each tab in visibleTabs: chrome.tabs.remove(tab.id); show "Closed N tabs"
 *   - 4. ON Close tagged button click: toClose = visibleTabs.filter(t => Array.isArray(t.bookmarkTags) && t.bookmarkTags.length > 0); IF toClose.length === 0 show message and return; IF NOT confirm("Close N tab(s) with tag(s)?") return; FOR each tab in toClose: chrome.tabs.remove(tab.id); await loadTabs(); show "Closed N tabs"
 *   - 5. ON Close untagged button click: toClose = visibleTabs.filter(t => !Array.isArray(t.bookmarkTags) || t.bookmarkTags.length === 0); IF toClose.length === 0 show message and return; IF NOT confirm("Close N tab(s) without tags?") return; FOR each tab in toClose: chrome.tabs.remove(tab.id); await loadTabs(); show "Closed N tabs"
 *   - 6. ON Refresh button click: hiddenTabIds.clear(); loadTabs()
 *   - 7. ON Set to-read button click: FOR each tab in getDisplayedTabs() WHERE tab.url is http(s): reply = getCurrentBookmark({ url: tab.url, title: tab.title }); IF reply.data.exists AND reply.data.url: saveBookmark({ ...reply.data, toread: 'yes' }); ELSE: urlToSave = reply.data.url || tab.url; saveBookmark({ url: urlToSave, description: tab.title ?? '', tags: [], toread: 'yes', preferredBackend: 'local' }); AWAIT refreshBookmarkDisplayForAllTabs(); show "Set to-read for N tabs"
 *   - 8. ON Clear to-read button click: FOR each tab in getDisplayedTabs(): reply = getCurrentBookmark({ url: tab.url, title: tab.title }); IF reply.success AND reply.data AND NOT reply.data.blocked AND reply.data.exists: saveBookmark({ ...reply.data, toread: 'no' }); ELSE skip; AWAIT refreshBookmarkDisplayForAllTabs(); show "Cleared to-read for N tabs"
 *   - 9. ON Add tags button click: newTags = parseTagsInput(tagsInput.value); IF newTags.length === 0 return; FOR each tab in getDisplayedTabs() WHERE tab.url is http(s): reply = getCurrentBookmark({ url: tab.url, title: tab.title }); IF reply.success AND reply.data AND reply.data.url AND NOT reply.data.blocked: IF reply.data.exists: payload = buildAddTagsPayload(reply.data, newTags); saveBookmark(payload); ELSE: urlToSave = reply.data.url || tab.url; saveBookmark({ url: urlToSave, description: tab.title ?? '', tags: newTags, preferredBackend: 'local' }); AWAIT refreshBookmarkDisplayForAllTabs(); clear tagsInput; show "Added tags for N tabs"
 *   - 10. PANEL LAYOUT: browserTabsPanel = scroll container (overflow-y: auto); browser-tabs-above-list = flex none (contains stats line above batch bookmark section); browser-tabs-list-section = min-height 100% overflow-y auto; first child of list-section = Title|URL|Block radio row; second child = #browserTabsList.
 *   - 11. DATA (in loadTabs): totalWindows, totalTabs from chrome.windows.getAll and chrome.tabs.query({})
 *   - 12. updateStatsLine(): displayed = getDisplayedTabs(); displayW = new Set(displayed.map(t => t.windowId)).size; displayT = displayed.length; set #browserTabsStats text to "Windows: displayW / totalWindows · Tabs: displayT / totalTabs"; call from renderList and after loadTabs
 *   - 13. SECTIONS: section.browser-tabs-section-scope, section.browser-tabs-section-filter, stats line (above bookmark section), section.browser-tabs-section-bookmark, section.browser-tabs-section-actions, section.browser-tabs-section-window. Within sections use .browser-tabs-control-group with margin 0.125rem 0 for tight grouping. Order in Filter & display: (1) filter textbox, (2) Elements (label + textbox). In list section: (1) Title | URL | Block row, (2) #browserTabsList.
 *   - 14. TOOLTIPS: title attribute (and aria-label) on each button, input, label group describing use
 *   - 15. RENDER: <img class="browser-tabs-card-favicon" src="..." alt=""> before title/url in all modes; fallback src or hide when no favicon
 *   - 16. parseImportantTagSources(str): return str.trim().split(',').map(s => s.trim()).filter(Boolean)
 *   - 17. ON load: read storage for textbox; populate input or default
 *   - 18. ON GET_TABS_IMPORTANT_TAGS: data.tabs; data.importantTagSources = parseImportantTagSources(textboxValue); IF empty THEN default list (DEFAULT_IMPORTANT_TAG_SOURCES)
 *   - 19. ON Gather button click: displayed = getDisplayedTabs(); currentWin = await chrome.windows.getCurrent(); moved = 0; FOR each tab in displayed: IF tab.windowId !== currentWin.id: await chrome.tabs.move(tab.id, { windowId: currentWin.id, index: -1 }); moved++; show message; loadTabs()
 *   - 20. ON Distribute button click: displayed = getDisplayedTabs(); distributed = 0; FOR each tab in displayed: list = await chrome.tabs.query({ windowId: tab.windowId }); IF list.length > 1: await chrome.windows.create({ tabId: tab.id }); distributed++; show message; loadTabs()
 * 
 * ## TABS_CREATE_PREFERRED_BACKEND
 * 
 * - [IMPL-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [REQ-SIDE_PANEL_BROWSER_TABS] How: Product rule — batch/create from Tabs panel uses preferredBackend local (not Options defaultStorageMode); changing this needs dedicated CITDP.
 * - Contract:
 *   - INPUT: create payload for missing bookmark from tab URL
 *   - PRE: tab url is http(s)
 *   - OUTPUT: saveBookmark payload with preferredBackend local
 *   - POST:
 *     - success => new bookmarks from Tabs land in Local store unless an existing bookmark was updated in place
 *   - CONTROL: preferredBackend fixed to local for create-from-tabs; Options defaultStorageMode is not consulted on this path
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: TABS_CREATE_PREFERRED_BACKEND
 *   - 1. WHEN creating a bookmark because none exists for tab URL: SET preferredBackend = 'local'
 *   - 2. WHEN updating an existing bookmark (exists): preserve existing backend via saveBookmark merge (no preferredBackend override required)
 * 
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_BROWSER_TABS ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS ===
 * [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] [ARCH-SIDE_PANEL_RECENTLY_CLOSED_TABS] [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] — Tab source toggle and recently closed tabs integration. Extends IMPL-SIDE_PANEL_BROWSER_TABS with open | recentlyClosed | both.
 * 
 * ## NORMALIZE_CLOSED_SESSIONS
 * 
 * - [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [ARCH-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] How: normalizeClosedSessions(sessions): pure. Flatten Session[] from getRecentlyClosed; each tab: id=sessionId, sessionId, title, url, lastModified, isClosed=true, referrer='', pageText='', importantTags=''. Window sessions: recurse into tabs.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: tabSource = 'open' | 'recentlyClosed' | 'both' (default 'open')
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: NORMALIZE_CLOSED_SESSIONS
 *   - result = []; FOR each s in sessions: IF s.tab: result.push({ id: s.tab.sessionId, sessionId: s.tab.sessionId, title: s.tab.title??'', url: s.tab.url??'', lastModified: s.lastModified, isClosed: true, referrer: '', pageText: '', importantTags: '' }); IF s.window && s.window.tabs: FOR each t in s.window.tabs: result.push({ id: t.sessionId, sessionId: t.sessionId, title: t.title??'', url: t.url??'', lastModified: s.lastModified, isClosed: true, referrer: '', pageText: '', importantTags: '' }); RETURN result
 * 
 * ## BLOCK_2
 * 
 * - [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [ARCH-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] How: GET_RECENTLY_CLOSED_TABS (SW): sessions = chrome.sessions.getRecentlyClosed({ maxResults: 25 }); tabs = normalizeClosedSessions(sessions); RETURN { success: true, data: tabs } loadTabs: when tabSource=open: existing chrome.tabs path. When recentlyClosed: sendMessage GET_RECENTLY_CLOSED_TABS; allTabs = response.data. When both: openTabs = chrome.tabs.query; closedTabs = GET_RECENTLY_CLOSED_TABS; allTabs = openTabs.concat(closedTabs). Scope restriction: when tabSource includes recentlyClosed, searchScope forced to tabInfo; Page text and Elements disabled with note. Restore: closed tab card has data-action=restoreTab data-session-id. ON click: chrome.sessions.restore(sessionId); loadTabs(). Open tab keeps data-action=closeTab. buildRecordsYamlForCopy: for closed tabs include sessionId and lastModified; id may be sessionId string. hiddenTabIds: use tab.id (numeric for open, sessionId string for closed). getDisplayedTabs filters by !hiddenTabIds.has(t.id). Sessions API check: if !chrome.sessions: hide tab source options recentlyClosed and both; show only Open. Gather/Distribute: when tabSource=recentlyClosed or all displayed are closed, hide or disable Gather and Distribute. Close: only for open tabs. toClose = visibleTabs.filter(t => !t.isClosed); confirm; chrome.tabs.remove each; loadTabs()
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: tabSource = 'open' | 'recentlyClosed' | 'both' (default 'open')
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_2
 *   - 1. ON GET_RECENTLY_CLOSED_TABS (service worker): sessions = AWAIT chrome.sessions.getRecentlyClosed({ maxResults: 25 }); tabs = normalizeClosedSessions(sessions); RETURN { success: true, data: tabs }
 *   - 2. ON loadTabs: IF tabSource === 'open': (existing path); IF tabSource === 'recentlyClosed': allTabs = AWAIT sendMessage(GET_RECENTLY_CLOSED_TABS).data; IF tabSource === 'both': openTabs = AWAIT chrome.tabs.query(...); closedTabs = AWAIT sendMessage(GET_RECENTLY_CLOSED_TABS).data; allTabs = openTabs.concat(closedTabs)
 *   - 3. IF tabSource !== 'open': searchScope = 'tabInfo'; disable pageText/importantTags radios; show note
 *   - 4. RENDER (closed tab): Restore button (data-action=restoreTab, data-session-id); no Close button
 *   - 5. ON restoreTab click: sessionId = data-session-id; AWAIT chrome.sessions.restore(sessionId); loadTabs()
 *   - 6. buildRecordsYamlForCopy: IF tab.isClosed: add sessionId, lastModified to YAML entry
 *   - 7. IF !chrome.sessions: tabSourceOptions = ['open'] only
 *   - 8. IF tabSource === 'recentlyClosed' OR (tabSource === 'both' AND getDisplayedTabs().every(t => t.isClosed)): hide Gather, Distribute
 *   - 9. ON Close: toClose = visibleTabs.filter(t => !t.isClosed); confirm; FOR each in toClose: chrome.tabs.remove(t.id); loadTabs()
 * 
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS ===
 */
import {
  filterBrowserTabs,
  buildUrlListForCopy,
  buildRecordsYamlForCopy,
  getReferrerDisplayText,
  initBrowserTabsTab,
  mergeBookmarkReplyIntoTab,
  parseImportantTagSources,
  normalizeClosedSessions,
  DEFAULT_IMPORTANT_TAG_SOURCES,
  SEARCH_SCOPE_TAB_INFO,
  SEARCH_SCOPE_PAGE_TEXT,
  SEARCH_SCOPE_IMPORTANT_TAGS
} from '../../src/ui/side-panel/browser-tabs-panel.js'

const tabs = [
  { id: 1, title: 'Google', url: 'https://google.com', referrer: '' },
  { id: 2, title: 'Example Page', url: 'https://example.com/page', referrer: 'https://google.com/' },
  { id: 3, title: 'GitHub Docs', url: 'https://docs.github.com', referrer: 'https://example.com' }
]

describe('[REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] [IMPL-URL_TAGS_DISPLAY] mergeBookmarkReplyIntoTab', () => {
  test('blocked or failed reply clears tags and flags', () => {
    const tab = { bookmarkTags: ['x'], bookmarkToread: true, bookmarkPrivate: true }
    mergeBookmarkReplyIntoTab(tab, { success: true, data: { blocked: true } })
    expect(tab.bookmarkTags).toEqual([])
    expect(tab.bookmarkToread).toBe(false)
    expect(tab.bookmarkPrivate).toBe(false)
    mergeBookmarkReplyIntoTab(tab, null)
    expect(tab.bookmarkTags).toEqual([])
  })

  test('exists and toread yes sets bookmarkToread; shared no sets bookmarkPrivate', () => {
    const tab = {}
    mergeBookmarkReplyIntoTab(tab, {
      success: true,
      data: { exists: true, tags: ['a'], toread: 'yes', shared: 'no' }
    })
    expect(tab.bookmarkTags).toEqual(['a'])
    expect(tab.bookmarkToread).toBe(true)
    expect(tab.bookmarkPrivate).toBe(true)
  })

  test('exists false does not show to-read or private even if payload has yes/no', () => {
    const tab = {}
    mergeBookmarkReplyIntoTab(tab, {
      success: true,
      data: { exists: false, tags: [], toread: 'yes', shared: 'no' }
    })
    expect(tab.bookmarkToread).toBe(false)
    expect(tab.bookmarkPrivate).toBe(false)
  })

  // Procedure mergeBookmarkReplyIntoTab (essence_pseudocode): map getCurrentBookmark reply into tab.bookmarkTags, bookmarkToread, bookmarkPrivate — [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] [IMPL-URL_TAGS_DISPLAY]
  describe('mergeBookmarkReplyIntoTab — padded toread/shared strings from getCurrentBookmark', () => {
    /**
     * Validates OUTPUT: exists true + semantic yes/no on toread/shared after normalizing bounded whitespace so row indicators match REQ satisfaction criteria for to-read and private.
     */
    test('recognizes toread yes and shared no with surrounding whitespace', () => {
      const tab = {}
      mergeBookmarkReplyIntoTab(tab, {
        success: true,
        data: {
          exists: true,
          tags: ['t1'],
          toread: ' yes ',
          shared: ' no '
        }
      })
      expect(tab.bookmarkTags).toEqual(['t1'])
      expect(tab.bookmarkToread).toBe(true)
      expect(tab.bookmarkPrivate).toBe(true)
    })
  })
})

describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] filterBrowserTabs', () => {
  test('empty query returns all tabs', () => {
    expect(filterBrowserTabs(tabs, '')).toEqual(tabs)
    expect(filterBrowserTabs(tabs, '   ')).toEqual(tabs)
  })

  test('case-insensitive match on title', () => {
    const googleMatch = filterBrowserTabs(tabs, 'google')
    expect(googleMatch.length).toBeGreaterThanOrEqual(1)
    expect(googleMatch.some(t => t.id === 1)).toBe(true)
    expect(filterBrowserTabs(tabs, 'GOOGLE').some(t => t.id === 1)).toBe(true)
    expect(filterBrowserTabs(tabs, 'Example').some(t => t.id === 2)).toBe(true)
    expect(filterBrowserTabs(tabs, 'example page')[0].id).toBe(2)
  })

  test('case-insensitive match on URL', () => {
    const exampleMatch = filterBrowserTabs(tabs, 'example.com')
    expect(exampleMatch.length).toBeGreaterThanOrEqual(1)
    expect(exampleMatch.some(t => t.id === 2)).toBe(true)
    expect(filterBrowserTabs(tabs, 'docs.github')).toHaveLength(1)
    expect(filterBrowserTabs(tabs, 'HTTPS://GOOGLE').some(t => t.id === 1)).toBe(true)
  })

  test('case-insensitive match on referrer', () => {
    expect(filterBrowserTabs(tabs, 'google.com')).toHaveLength(2) // title of 1, referrer of 2
    const withRef = filterBrowserTabs(tabs, 'example.com')
    expect(withRef.length).toBeGreaterThanOrEqual(1)
    expect(withRef.some(t => t.referrer && t.referrer.toLowerCase().includes('example'))).toBe(true)
  })

  test('no match returns empty array', () => {
    expect(filterBrowserTabs(tabs, 'xyznone')).toEqual([])
  })

  test('null or undefined query treated as empty (returns all)', () => {
    expect(filterBrowserTabs(tabs, null)).toEqual(tabs)
    expect(filterBrowserTabs(tabs, undefined)).toEqual(tabs)
  })

  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] scope tabInfo (default): same as no scope
  test('scope tabInfo or omitted uses title, url, referrer', () => {
    expect(filterBrowserTabs(tabs, 'google', SEARCH_SCOPE_TAB_INFO).length).toBeGreaterThanOrEqual(1)
    expect(filterBrowserTabs(tabs, 'google').some(t => t.id === 1)).toBe(true)
  })
})

describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] filterBrowserTabs scope pageText', () => {
  const tabsWithPageText = [
    { id: 1, title: 'A', url: 'https://a.com', referrer: '', pageText: 'Welcome to Alpha product page' },
    { id: 2, title: 'B', url: 'https://b.com', referrer: '', pageText: 'Beta documentation and guides' },
    { id: 3, title: 'C', url: 'https://c.com', referrer: '', pageText: 'Contact us for support' }
  ]

  test('filters by pageText when scope is pageText', () => {
    const out = filterBrowserTabs(tabsWithPageText, 'Alpha', SEARCH_SCOPE_PAGE_TEXT)
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe(1)
  })

  test('empty query returns all when scope pageText', () => {
    expect(filterBrowserTabs(tabsWithPageText, '', SEARCH_SCOPE_PAGE_TEXT)).toEqual(tabsWithPageText)
  })

  test('no match in pageText returns empty', () => {
    expect(filterBrowserTabs(tabsWithPageText, 'xyz', SEARCH_SCOPE_PAGE_TEXT)).toEqual([])
  })

  test('missing pageText treated as empty string', () => {
    const withMissing = [{ id: 1, title: 'T', url: 'https://x.com', referrer: '' }]
    expect(filterBrowserTabs(withMissing, 'anything', SEARCH_SCOPE_PAGE_TEXT)).toEqual([])
  })
})

describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] filterBrowserTabs scope importantTags', () => {
  const tabsWithTags = [
    { id: 1, title: 'A', url: 'https://a.com', referrer: '', importantTags: 'Home Page Main heading' },
    { id: 2, title: 'B', url: 'https://b.com', referrer: '', importantTags: 'Docs H1 Getting started' }
  ]

  test('filters by importantTags when scope is importantTags', () => {
    const out = filterBrowserTabs(tabsWithTags, 'Getting started', SEARCH_SCOPE_IMPORTANT_TAGS)
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe(2)
  })

  test('empty query returns all when scope importantTags', () => {
    expect(filterBrowserTabs(tabsWithTags, '', SEARCH_SCOPE_IMPORTANT_TAGS)).toEqual(tabsWithTags)
  })

  test('missing importantTags treated as empty string', () => {
    const withMissing = [{ id: 1, title: 'T', url: 'https://x.com', referrer: '' }]
    expect(filterBrowserTabs(withMissing, 'heading', SEARCH_SCOPE_IMPORTANT_TAGS)).toEqual([])
  })
})

describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] buildUrlListForCopy', () => {
  test('returns URLs joined by newline', () => {
    const list = [
      { id: 1, url: 'https://a.com', title: '', referrer: '' },
      { id: 2, url: 'https://b.com', title: '', referrer: '' }
    ]
    expect(buildUrlListForCopy(list)).toBe('https://a.com\nhttps://b.com')
  })

  test('empty array returns empty string', () => {
    expect(buildUrlListForCopy([])).toBe('')
  })

  test('single tab returns single URL without trailing newline', () => {
    expect(buildUrlListForCopy([{ id: 1, url: 'https://one.com', title: '', referrer: '' }])).toBe('https://one.com')
  })
})

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Copy Records: buildRecordsYamlForCopy returns YAML list of full tab records (id, windowId, title, url, referrer).
 */
describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] buildRecordsYamlForCopy', () => {
  test('empty array returns minimal YAML list', () => {
    const yaml = buildRecordsYamlForCopy([])
    expect(yaml).toBeDefined()
    expect(typeof yaml).toBe('string')
    expect(yaml.trim()).toBe('')
  })

  test('one record includes all five fields id windowId title url referrer', () => {
    const list = [
      { id: 1, windowId: 100, title: 'Page', url: 'https://example.com', referrer: 'https://google.com' }
    ]
    const yaml = buildRecordsYamlForCopy(list)
    expect(yaml).toContain('id: 1')
    expect(yaml).toContain('windowId: 100')
    expect(yaml).toContain('title:')
    expect(yaml).toContain('Page')
    expect(yaml).toContain('url:')
    expect(yaml).toContain('https://example.com')
    expect(yaml).toContain('referrer:')
    expect(yaml).toContain('https://google.com')
  })

  test('multiple records produce valid YAML list', () => {
    const list = [
      { id: 1, windowId: 10, title: 'A', url: 'https://a.com', referrer: '' },
      { id: 2, windowId: 10, title: 'B', url: 'https://b.com', referrer: 'https://a.com' }
    ]
    const yaml = buildRecordsYamlForCopy(list)
    expect(yaml).toContain('id: 1')
    expect(yaml).toContain('id: 2')
    expect(yaml).toContain('windowId: 10')
    expect(yaml).toContain('https://a.com')
    expect(yaml).toContain('https://b.com')
  })

  test('strings with colons or quotes are safely serialized', () => {
    const list = [
      { id: 1, windowId: 1, title: 'Title: with colon', url: 'https://example.com', referrer: '' }
    ]
    const yaml = buildRecordsYamlForCopy(list)
    expect(yaml).toContain('Title: with colon')
    expect(yaml).toContain('id: 1')
  })

  // [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [ARCH-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS]
  // Closed tabs: include sessionId and lastModified in YAML output.
  test('closed tab record includes sessionId and lastModified', () => {
    const list = [
      { id: 'sess-abc', sessionId: 'sess-abc', title: 'Closed Page', url: 'https://closed.com', isClosed: true, lastModified: 1709300000 }
    ]
    const yaml = buildRecordsYamlForCopy(list)
    expect(yaml).toContain('sessionId:')
    expect(yaml).toContain('sess-abc')
    expect(yaml).toContain('lastModified:')
    expect(yaml).toContain('1709300000')
    expect(yaml).toContain('Closed Page')
    expect(yaml).toContain('https://closed.com')
  })
})

/**
 * [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [ARCH-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS]
 * normalizeClosedSessions: pure function; flattens chrome.sessions Session[] to tab-like objects.
 */
describe('[REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] normalizeClosedSessions', () => {
  test('empty array returns empty array', () => {
    expect(normalizeClosedSessions([])).toEqual([])
  })

  test('single tab session produces one normalized entry', () => {
    const sessions = [
      { tab: { sessionId: 's1', title: 'Tab 1', url: 'https://a.com' }, lastModified: 1000 }
    ]
    const out = normalizeClosedSessions(sessions)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      id: 's1',
      sessionId: 's1',
      title: 'Tab 1',
      url: 'https://a.com',
      isClosed: true,
      lastModified: 1000,
      referrer: '',
      pageText: '',
      importantTags: ''
    })
  })

  test('window session with tabs flattens to individual tab entries', () => {
    const sessions = [
      {
        window: { tabs: [{ sessionId: 'w1t1', title: 'W1 Tab 1', url: 'https://b.com' }, { sessionId: 'w1t2', title: 'W1 Tab 2', url: 'https://c.com' }] },
        lastModified: 2000
      }
    ]
    const out = normalizeClosedSessions(sessions)
    expect(out).toHaveLength(2)
    expect(out[0]).toMatchObject({ id: 'w1t1', sessionId: 'w1t1', title: 'W1 Tab 1', url: 'https://b.com', isClosed: true, lastModified: 2000 })
    expect(out[1]).toMatchObject({ id: 'w1t2', sessionId: 'w1t2', title: 'W1 Tab 2', url: 'https://c.com', isClosed: true, lastModified: 2000 })
  })

  test('mixed tab and window sessions produce correct flat list', () => {
    const sessions = [
      { tab: { sessionId: 't1', title: 'Single', url: 'https://single.com' }, lastModified: 100 },
      { window: { tabs: [{ sessionId: 'wt1', title: 'Win Tab', url: 'https://win.com' }] }, lastModified: 200 }
    ]
    const out = normalizeClosedSessions(sessions)
    expect(out).toHaveLength(2)
    expect(out[0].sessionId).toBe('t1')
    expect(out[1].sessionId).toBe('wt1')
  })
})

/**
 * [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [ARCH-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS]
 * filterBrowserTabs with closed-tab objects: tabInfo scope matches title/url (referrer empty for closed).
 */
describe('[REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] filterBrowserTabs closed tabs', () => {
  const closedTabs = [
    { id: 's1', sessionId: 's1', title: 'Closed Google', url: 'https://google.com', isClosed: true, referrer: '', pageText: '', importantTags: '' },
    { id: 's2', sessionId: 's2', title: 'Closed Example', url: 'https://example.com', isClosed: true, referrer: '', pageText: '', importantTags: '' }
  ]

  test('filters closed tabs by title in tabInfo scope', () => {
    const out = filterBrowserTabs(closedTabs, 'Google', SEARCH_SCOPE_TAB_INFO)
    expect(out).toHaveLength(1)
    expect(out[0].sessionId).toBe('s1')
  })

  test('filters closed tabs by URL in tabInfo scope', () => {
    const out = filterBrowserTabs(closedTabs, 'example.com', SEARCH_SCOPE_TAB_INFO)
    expect(out).toHaveLength(1)
    expect(out[0].sessionId).toBe('s2')
  })

  test('empty query returns all closed tabs', () => {
    expect(filterBrowserTabs(closedTabs, '', SEARCH_SCOPE_TAB_INFO)).toEqual(closedTabs)
  })
})

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * parseImportantTagSources: comma-separated DOM sources for Elements search; applied on GET_TABS_IMPORTANT_TAGS.
 */
describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] parseImportantTagSources', () => {
  test('comma-separated string returns trimmed non-empty array', () => {
    expect(parseImportantTagSources('title, meta description, h1')).toEqual(['title', 'meta description', 'h1'])
    expect(parseImportantTagSources('  og:title , h2 , h3  ')).toEqual(['og:title', 'h2', 'h3'])
  })

  test('empty string returns empty array', () => {
    expect(parseImportantTagSources('')).toEqual([])
    expect(parseImportantTagSources('   ')).toEqual([])
  })

  test('null or undefined returns empty array', () => {
    expect(parseImportantTagSources(null)).toEqual([])
    expect(parseImportantTagSources(undefined)).toEqual([])
  })

  test('filters out empty segments', () => {
    expect(parseImportantTagSources('a,,b')).toEqual(['a', 'b'])
    expect(parseImportantTagSources('  ,  title  ,  ')).toEqual(['title'])
  })

  test('DEFAULT_IMPORTANT_TAG_SOURCES parses to expected list', () => {
    const parsed = parseImportantTagSources(DEFAULT_IMPORTANT_TAG_SOURCES)
    expect(parsed).toContain('title')
    expect(parsed).toContain('meta description')
    expect(parsed).toContain('og:title')
    expect(parsed).toContain('h1')
    expect(parsed).toContain('img alt')
    expect(parsed).toContain('a title')
  })
})

/** [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Elements: persisted in chrome.storage.local; applied on GET_TABS_IMPORTANT_TAGS. */
describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Elements persistence', () => {
  const STORAGE_KEY = 'hoverboard_tabs_important_tag_sources'

  beforeEach(() => {
    global.chrome = global.chrome || {}
    global.chrome.runtime = global.chrome.runtime || {}
    global.chrome.runtime.sendMessage = function (msg, cb) {
      if (msg.type === 'getCurrentBookmark' && typeof cb === 'function') {
        cb({ success: true, data: { url: msg.data?.url, tags: [] } })
        return
      }
      if (typeof cb === 'function') cb({})
    }
  })

  function makePanelWithImportantSourcesInput () {
    const listEl = document.createElement('div')
    listEl.id = 'browserTabsList'
    listEl.className = 'browser-tabs-list'
    const messageEl = document.createElement('div')
    messageEl.id = 'browserTabsMessage'
    const importantTagSourcesInput = document.createElement('input')
    importantTagSourcesInput.id = 'browserTabsImportantTagSources'
    importantTagSourcesInput.type = 'text'
    const panel = document.createElement('div')
    panel.id = 'browserTabsPanel'
    panel.appendChild(listEl)
    panel.appendChild(messageEl)
    panel.appendChild(importantTagSourcesInput)
    panel.querySelector = (sel) => {
      if (sel === '#browserTabsList' || sel === '.browser-tabs-list') return listEl
      if (sel === '#browserTabsMessage') return messageEl
      if (sel === '#browserTabsImportantTagSources') return importantTagSourcesInput
      return null
    }
    panel.querySelectorAll = () => []
    return {
      doc: { getElementById: (id) => (id === 'browserTabsPanel' ? panel : null), createElement: document.createElement.bind(document) },
      listEl,
      importantTagSourcesInput,
      panel
    }
  }

  test('init populates important-tag sources input from storage', async () => {
    const { doc, importantTagSourcesInput } = makePanelWithImportantSourcesInput()
    const stored = 'h1, h2, meta description'
    global.chrome.storage = {
      local: {
        get: jest.fn().mockResolvedValue({ [STORAGE_KEY]: stored }),
        set: jest.fn().mockResolvedValue(undefined)
      }
    }
    const mockTabs = { query: async () => [{ id: 1, windowId: 100, title: 'A', url: 'https://a.com' }] }
    const getReferrers = async () => ({ 1: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 150))
    expect(importantTagSourcesInput.value).toBe(stored)
  })

  test('blur on important-tag sources input saves value to storage', async () => {
    const { doc, importantTagSourcesInput } = makePanelWithImportantSourcesInput()
    const setMock = jest.fn().mockResolvedValue(undefined)
    global.chrome.storage = {
      local: {
        get: jest.fn().mockResolvedValue({}),
        set: setMock
      }
    }
    const mockTabs = { query: async () => [{ id: 1, windowId: 100, title: 'A', url: 'https://a.com' }] }
    const getReferrers = async () => ({ 1: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 150))
    importantTagSourcesInput.value = 'og:title, h1'
    importantTagSourcesInput.dispatchEvent(new Event('blur', { bubbles: true }))
    expect(setMock).toHaveBeenCalledWith({ [STORAGE_KEY]: 'og:title, h1' })
  })
})

describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] getReferrerDisplayText (referrer display)', () => {
  test('null returns placeholder (not the string "null")', () => {
    expect(getReferrerDisplayText(null)).toBe('—')
  })

  test('undefined returns placeholder', () => {
    expect(getReferrerDisplayText(undefined)).toBe('—')
  })

  test('empty string returns placeholder', () => {
    expect(getReferrerDisplayText('')).toBe('—')
  })

  test('string "null" returns placeholder (must not be shown as literal)', () => {
    expect(getReferrerDisplayText('null')).toBe('—')
  })

  test('valid referrer URL is displayed as-is', () => {
    expect(getReferrerDisplayText('https://example.com/')).toBe('https://example.com/')
  })
})

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Integration: referrer is merged from GET_TAB_REFERRERS response (SW); when getReferrers returns a map, panel displays it (not placeholder).
 */
describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] referrer from getReferrers (SW path)', () => {
  // [IMPL-SIDE_PANEL_BROWSER_TABS] loadTabs now fetches bookmark tags via getCurrentBookmark; mock so loadTabs completes
  beforeEach(() => {
    global.chrome = global.chrome || {}
    global.chrome.runtime = global.chrome.runtime || {}
    const prev = global.chrome.runtime.sendMessage
    global.chrome.runtime.sendMessage = function (msg, cb) {
      if (msg.type === 'getCurrentBookmark' && typeof cb === 'function') {
        cb({ success: true, data: { url: msg.data?.url, tags: [] } })
        return
      }
      if (typeof prev === 'function') return prev.call(this, msg, cb)
      if (typeof cb === 'function') cb({})
    }
  })

  function makePanelDoc () {
    const listEl = document.createElement('div')
    listEl.id = 'browserTabsList'
    listEl.className = 'browser-tabs-list'
    const panel = document.createElement('div')
    panel.id = 'browserTabsPanel'
    panel.appendChild(listEl)
    panel.querySelector = (sel) => {
      if (sel === '#browserTabsList' || sel === '.browser-tabs-list') return listEl
      if (sel === '#browserTabsFilterInput' || sel === '[data-action="copyUrls"]' || sel === '#browserTabsCopyBtn' ||
          sel === '[data-action="copyRecords"]' || sel === '#browserTabsCopyRecordsBtn' ||
          sel === '[data-action="closeTabs"]' || sel === '#browserTabsCloseBtn' || sel === '#browserTabsMessage') return null
      return null
    }
    return {
      doc: {
        getElementById (id) { return id === 'browserTabsPanel' ? panel : null },
        createElement: document.createElement.bind(document)
      },
      listEl,
      panel
    }
  }

  test('when getReferrers returns referrer map, card displays URL not placeholder', async () => {
    const referrerUrl = 'https://referrer.example.com/'
    const { doc, listEl } = makePanelDoc()
    const mockTabs = { query: async () => [{ id: 1, title: 'Test Tab', url: 'https://example.com' }] }
    const getReferrers = async () => ({ 1: referrerUrl })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    const card = listEl.querySelector('.browser-tabs-card')
    expect(card).toBeTruthy()
    const referrerEl = card.querySelector('.browser-tabs-card-referrer')
    expect(referrerEl).toBeTruthy()
    expect(referrerEl.textContent.trim()).toBe(referrerUrl)
  })

  test('multiple tabs get correct referrers from getReferrers map', async () => {
    const { doc, listEl } = makePanelDoc()
    const mockTabs = {
      query: async () => [
        { id: 10, title: 'A', url: 'https://a.com' },
        { id: 20, title: 'B', url: 'https://b.com' }
      ]
    }
    const getReferrers = async () => ({ 10: 'https://google.com/', 20: 'https://a.com/' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    const cards = listEl.querySelectorAll('.browser-tabs-card')
    expect(cards).toHaveLength(2)
    expect(cards[0].querySelector('.browser-tabs-card-referrer')?.textContent?.trim()).toBe('https://google.com/')
    expect(cards[1].querySelector('.browser-tabs-card-referrer')?.textContent?.trim()).toBe('https://a.com/')
  })

  test('when getReferrers is not provided and no runtime, referrer displays placeholder', async () => {
    const { doc, listEl } = makePanelDoc()
    const mockTabs = { query: async () => [{ id: 1, title: 'Test Tab', url: 'https://example.com' }] }
    const origRuntime = global.chrome.runtime
    global.chrome.runtime = null
    try {
      initBrowserTabsTab(doc, mockTabs, null)
      await new Promise(r => setTimeout(r, 100))
      const card = listEl.querySelector('.browser-tabs-card')
      expect(card).toBeTruthy()
      const referrerEl = card.querySelector('.browser-tabs-card-referrer')
      expect(referrerEl).toBeTruthy()
      expect(referrerEl.textContent.trim()).toBe('—')
    } finally {
      global.chrome.runtime = origRuntime
    }
  })

  test('when getReferrers returns empty map, referrer displays placeholder', async () => {
    const { doc, listEl } = makePanelDoc()
    const mockTabs = { query: async () => [{ id: 1, title: 'Test Tab', url: 'https://example.com' }] }
    const getReferrers = async () => ({})
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    const card = listEl.querySelector('.browser-tabs-card')
    expect(card).toBeTruthy()
    expect(card.querySelector('.browser-tabs-card-referrer')?.textContent?.trim()).toBe('—')
  })
})

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Batch bookmark actions: Set to-read sends saveBookmark with toread yes for each visible tab; Clear to-read only for existing bookmarks; Add tags merges or creates.
 */
describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] batch bookmark actions', () => {
  function makePanelDocWithBatchButtons () {
    const listEl = document.createElement('div')
    listEl.id = 'browserTabsList'
    listEl.className = 'browser-tabs-list'
    const messageEl = document.createElement('div')
    messageEl.id = 'browserTabsMessage'
    const tagsInput = document.createElement('input')
    tagsInput.id = 'browserTabsTagsInput'
    const addTagsBtn = document.createElement('button')
    addTagsBtn.setAttribute('data-action', 'addTags')
    addTagsBtn.id = 'browserTabsAddTagsBtn'
    const setToReadBtn = document.createElement('button')
    setToReadBtn.setAttribute('data-action', 'setToRead')
    setToReadBtn.id = 'browserTabsSetToReadBtn'
    const clearToReadBtn = document.createElement('button')
    clearToReadBtn.setAttribute('data-action', 'clearToRead')
    clearToReadBtn.id = 'browserTabsClearToReadBtn'
    const panel = document.createElement('div')
    panel.id = 'browserTabsPanel'
    panel.appendChild(tagsInput)
    panel.appendChild(addTagsBtn)
    panel.appendChild(setToReadBtn)
    panel.appendChild(clearToReadBtn)
    panel.appendChild(messageEl)
    panel.appendChild(listEl)
    const statsEl = document.createElement('div')
    statsEl.id = 'browserTabsStats'
    panel.appendChild(statsEl)
    panel.querySelector = (sel) => {
      if (sel === '#browserTabsList' || sel === '.browser-tabs-list') return listEl
      if (sel === '#browserTabsMessage') return messageEl
      if (sel === '#browserTabsTagsInput') return tagsInput
      if (sel === '#browserTabsStats') return statsEl
      if (sel === '[data-action="addTags"]' || sel === '#browserTabsAddTagsBtn') return addTagsBtn
      if (sel === '[data-action="setToRead"]' || sel === '#browserTabsSetToReadBtn') return setToReadBtn
      if (sel === '[data-action="clearToRead"]' || sel === '#browserTabsClearToReadBtn') return clearToReadBtn
      if (sel === '#browserTabsFilterInput' || sel === '[data-action="copyUrls"]' || sel === '[data-action="copyRecords"]' || sel === '[data-action="closeTabs"]') return null
      return null
    }
    panel.querySelectorAll = (sel) => {
      if (sel === 'input[name="browserTabsWindowScope"]') return []
      if (sel === 'input[name="browserTabsSearchScope"]') return []
      return []
    }
    return {
      doc: {
        getElementById (id) { return id === 'browserTabsPanel' ? panel : null },
        createElement: document.createElement.bind(document)
      },
      listEl,
      messageEl,
      statsEl,
      tagsInput,
      addTagsBtn,
      setToReadBtn,
      clearToReadBtn,
      panel
    }
  }

  test('Set to-read sends getCurrentBookmark then saveBookmark with toread yes for each visible tab', async () => {
    const { doc, listEl, setToReadBtn, messageEl } = makePanelDocWithBatchButtons()
    const tabList = [
      { id: 1, title: 'Tab A', url: 'https://a.com' },
      { id: 2, title: 'Tab B', url: 'https://b.com' }
    ]
    const saveCalls = []
    /** @type {Record<string, string>} */
    const toreadByUrl = { 'https://a.com': 'no', 'https://b.com': 'no' }
    const mockTabs = { query: async () => tabList }
    const getReferrers = async () => ({ 1: '', 2: '' })
    const origRuntime = global.chrome?.runtime
    global.chrome = global.chrome || {}
    global.chrome.runtime = {
      sendMessage (msg, cb) {
        if (msg.type === 'getCurrentBookmark') {
          const url = msg.data?.url ?? ''
          cb({
            success: true,
            data: {
              url,
              exists: true,
              toread: toreadByUrl[url] ?? 'no',
              shared: 'yes',
              description: '',
              tags: []
            }
          })
        } else if (msg.type === 'saveBookmark') {
          saveCalls.push(msg.data)
          if (msg.data?.url) toreadByUrl[msg.data.url] = msg.data.toread ?? 'no'
          cb({ success: true })
        } else {
          cb({ success: true })
        }
      }
    }
    try {
      initBrowserTabsTab(doc, mockTabs, null, getReferrers)
      await new Promise(r => setTimeout(r, 150))
      setToReadBtn.click()
      await new Promise(r => setTimeout(r, 350))
      expect(saveCalls.length).toBe(2)
      expect(saveCalls.every(d => d.toread === 'yes')).toBe(true)
      expect(saveCalls.map(d => d.url)).toEqual(['https://a.com', 'https://b.com'])
      expect(messageEl.textContent).toContain('Set to-read for 2 tabs')
      const cards = listEl.querySelectorAll('.browser-tabs-card-toggle-toread')
      expect(cards.length).toBe(2)
    } finally {
      if (origRuntime) global.chrome.runtime = origRuntime
    }
  })

  test('Clear to-read sends getCurrentBookmark then saveBookmark only when exists', async () => {
    const { doc, listEl, clearToReadBtn, messageEl } = makePanelDocWithBatchButtons()
    const tabList = [
      { id: 1, title: 'Tab A', url: 'https://a.com' },
      { id: 2, title: 'Tab B', url: 'https://b.com' }
    ]
    const saveCalls = []
    let aToread = 'yes'
    const mockTabs = { query: async () => tabList }
    const getReferrers = async () => ({ 1: '', 2: '' })
    const origRuntime = global.chrome?.runtime
    global.chrome = global.chrome || {}
    global.chrome.runtime = {
      sendMessage (msg, cb) {
        if (msg.type === 'getCurrentBookmark') {
          const url = msg.data?.url
          const exists = url === 'https://a.com'
          cb({
            success: true,
            data: {
              url: msg.data?.url,
              title: msg.data?.title,
              exists,
              tags: [],
              shared: 'yes',
              toread: exists ? aToread : 'no'
            }
          })
        } else if (msg.type === 'saveBookmark') {
          saveCalls.push(msg.data)
          if (msg.data?.url === 'https://a.com') aToread = msg.data.toread ?? 'no'
          cb({ success: true })
        } else cb({ success: true })
      }
    }
    try {
      initBrowserTabsTab(doc, mockTabs, null, getReferrers)
      await new Promise(r => setTimeout(r, 150))
      expect(listEl.querySelectorAll('.browser-tabs-card-toggle-toread').length).toBe(1)
      clearToReadBtn.click()
      await new Promise(r => setTimeout(r, 350))
      expect(saveCalls.length).toBe(1)
      expect(saveCalls[0].url).toBe('https://a.com')
      expect(saveCalls[0].toread).toBe('no')
      expect(messageEl.textContent).toContain('Cleared to-read for 1 tab')
      expect(listEl.querySelectorAll('.browser-tabs-card-toggle-toread').length).toBe(0)
    } finally {
      if (origRuntime) global.chrome.runtime = origRuntime
    }
  })

  test('Add tags with empty input does nothing', async () => {
    const { doc, addTagsBtn } = makePanelDocWithBatchButtons()
    const mockTabs = { query: async () => [{ id: 1, title: 'T', url: 'https://x.com' }] }
    const getReferrers = async () => ({ 1: '' })
    const messages = []
    const origRuntime = global.chrome?.runtime
    global.chrome = global.chrome || {}
    global.chrome.runtime = {
      sendMessage (msg, cb) {
        messages.push(msg.type)
        if (msg.type === 'getCurrentBookmark') cb({ success: true, data: { url: msg.data?.url, tags: [] } })
        else cb({ success: true })
      }
    }
    try {
      initBrowserTabsTab(doc, mockTabs, null, getReferrers)
      await new Promise(r => setTimeout(r, 150))
      const getCurrentBookmarkCountAfterInit = messages.filter(t => t === 'getCurrentBookmark').length
      const saveBookmarkCountAfterInit = messages.filter(t => t === 'saveBookmark').length
      addTagsBtn.click()
      await new Promise(r => setTimeout(r, 50))
      expect(messages.filter(t => t === 'saveBookmark').length).toBe(saveBookmarkCountAfterInit)
      expect(messages.filter(t => t === 'getCurrentBookmark').length).toBe(getCurrentBookmarkCountAfterInit)
    } finally {
      if (origRuntime) global.chrome.runtime = origRuntime
    }
  })

  test('Add tags with input sends getCurrentBookmark then saveBookmark (create or merge)', async () => {
    const { doc, listEl, tagsInput, addTagsBtn, messageEl } = makePanelDocWithBatchButtons()
    const tabList = [{ id: 1, title: 'Tab One', url: 'https://one.com' }]
    const saveCalls = []
    let bookmarkCreated = false
    const mockTabs = { query: async () => tabList }
    const getReferrers = async () => ({ 1: '' })
    const origRuntime = global.chrome?.runtime
    global.chrome = global.chrome || {}
    global.chrome.runtime = {
      sendMessage (msg, cb) {
        if (msg.type === 'getCurrentBookmark') {
          if (bookmarkCreated) {
            cb({
              success: true,
              data: {
                url: msg.data?.url,
                exists: true,
                tags: ['foo', 'bar'],
                toread: 'no',
                shared: 'yes'
              }
            })
          } else {
            cb({ success: true, data: { url: msg.data?.url, exists: false, tags: [] } })
          }
        } else if (msg.type === 'saveBookmark') {
          saveCalls.push(msg.data)
          bookmarkCreated = true
          cb({ success: true })
        } else cb({ success: true })
      }
    }
    try {
      initBrowserTabsTab(doc, mockTabs, null, getReferrers)
      await new Promise(r => setTimeout(r, 150))
      tagsInput.value = 'foo, bar'
      tagsInput.dispatchEvent(new Event('input', { bubbles: true }))
      addTagsBtn.click()
      await new Promise(r => setTimeout(r, 350))
      expect(saveCalls.length).toBe(1)
      expect(saveCalls[0].url).toBe('https://one.com')
      expect(saveCalls[0].tags).toEqual(['foo', 'bar'])
      expect(saveCalls[0].preferredBackend).toBe('local')
      expect(messageEl.textContent).toContain('Added tags for 1 tab')
      const tagsLine = listEl.querySelector('.browser-tabs-card-tags')
      expect(tagsLine && tagsLine.textContent).toContain('foo')
      expect(tagsLine && tagsLine.textContent).toContain('bar')
    } finally {
      if (origRuntime) global.chrome.runtime = origRuntime
    }
  })

  test('Add tags with existing bookmark merges tags via buildAddTagsPayload', async () => {
    const { doc, tagsInput, addTagsBtn, messageEl } = makePanelDocWithBatchButtons()
    const tabList = [{ id: 1, title: 'Tab One', url: 'https://one.com' }]
    const saveCalls = []
    const mockTabs = { query: async () => tabList }
    const getReferrers = async () => ({ 1: '' })
    const origRuntime = global.chrome?.runtime
    global.chrome = global.chrome || {}
    global.chrome.runtime = {
      sendMessage (msg, cb) {
        if (msg.type === 'getCurrentBookmark') {
          cb({ success: true, data: { url: 'https://one.com', exists: true, tags: ['existing'], storage: 'local' } })
        } else if (msg.type === 'saveBookmark') {
          saveCalls.push(msg.data)
          cb({ success: true })
        } else cb({ success: true })
      }
    }
    try {
      initBrowserTabsTab(doc, mockTabs, null, getReferrers)
      await new Promise(r => setTimeout(r, 150))
      tagsInput.value = 'newTag'
      addTagsBtn.click()
      await new Promise(r => setTimeout(r, 150))
      expect(saveCalls.length).toBe(1)
      expect(saveCalls[0].tags).toContain('existing')
      expect(saveCalls[0].tags).toContain('newTag')
      expect(messageEl.textContent).toContain('Added tags for 1 tab')
    } finally {
      if (origRuntime) global.chrome.runtime = origRuntime
    }
  })
})

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Stats line: display windows/total windows, display tabs/total tabs (above batch bookmark section).
 */
describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] stats line', () => {
  beforeEach(() => {
    global.chrome = global.chrome || {}
    global.chrome.runtime = global.chrome.runtime || {}
    const prev = global.chrome.runtime.sendMessage
    global.chrome.runtime.sendMessage = function (msg, cb) {
      if (msg.type === 'getCurrentBookmark' && typeof cb === 'function') {
        cb({ success: true, data: { url: msg.data?.url, tags: [] } })
        return
      }
      if (typeof prev === 'function') return prev.call(this, msg, cb)
      if (typeof cb === 'function') cb({})
    }
  })

  test('stats line shows display windows/total windows and display tabs/total tabs after loadTabs', async () => {
    const listEl = document.createElement('div')
    listEl.id = 'browserTabsList'
    listEl.className = 'browser-tabs-list'
    const statsEl = document.createElement('div')
    statsEl.id = 'browserTabsStats'
    const messageEl = document.createElement('div')
    messageEl.id = 'browserTabsMessage'
    const panel = document.createElement('div')
    panel.id = 'browserTabsPanel'
    panel.appendChild(statsEl)
    panel.appendChild(listEl)
    panel.appendChild(messageEl)
    const allTabsForScope = [
      { id: 1, windowId: 100, title: 'A', url: 'https://a.com', referrer: '' },
      { id: 2, windowId: 100, title: 'B', url: 'https://b.com', referrer: '' },
      { id: 3, windowId: 100, title: 'C', url: 'https://c.com', referrer: '' }
    ]
    const allTabsTotal = [
      ...allTabsForScope,
      { id: 4, windowId: 101, title: 'D', url: 'https://d.com', referrer: '' },
      { id: 5, windowId: 101, title: 'E', url: 'https://e.com', referrer: '' }
    ]
    const mockTabs = {
      query: async (opts) => (opts && opts.currentWindow ? allTabsForScope : allTabsTotal)
    }
    const mockWindows = { getAll: async () => [{ id: 100 }, { id: 101 }] }
    const getReferrers = async (list) => Object.fromEntries((list || []).map((t) => [t.id, '']))
    panel.querySelector = (sel) => {
      if (sel === '#browserTabsList' || sel === '.browser-tabs-list') return listEl
      if (sel === '#browserTabsStats') return statsEl
      if (sel === '#browserTabsMessage') return messageEl
      return null
    }
    panel.querySelectorAll = () => []
    const doc = { getElementById: (id) => (id === 'browserTabsPanel' ? panel : null), createElement: document.createElement.bind(document) }
    initBrowserTabsTab(doc, mockTabs, null, getReferrers, mockWindows)
    await new Promise(r => setTimeout(r, 200))
    expect(statsEl.textContent).toContain('Windows: 1 / 2')
    expect(statsEl.textContent).toContain('Tabs: 3 / 5')
  })

  test('stats line renders without throw when windows API unavailable (totalWindows 0)', async () => {
    const listEl = document.createElement('div')
    listEl.id = 'browserTabsList'
    listEl.className = 'browser-tabs-list'
    const statsEl = document.createElement('div')
    statsEl.id = 'browserTabsStats'
    const messageEl = document.createElement('div')
    messageEl.id = 'browserTabsMessage'
    const panel = document.createElement('div')
    panel.id = 'browserTabsPanel'
    panel.appendChild(statsEl)
    panel.appendChild(listEl)
    panel.appendChild(messageEl)
    const tabList = [{ id: 1, windowId: 1, title: 'T', url: 'https://t.com', referrer: '' }]
    const mockTabs = { query: async () => tabList }
    const getReferrers = async () => ({ 1: '' })
    panel.querySelector = (sel) => {
      if (sel === '#browserTabsList' || sel === '.browser-tabs-list') return listEl
      if (sel === '#browserTabsStats') return statsEl
      if (sel === '#browserTabsMessage') return messageEl
      return null
    }
    panel.querySelectorAll = () => []
    const doc = { getElementById: (id) => (id === 'browserTabsPanel' ? panel : null), createElement: document.createElement.bind(document) }
    initBrowserTabsTab(doc, mockTabs, null, getReferrers, null)
    await new Promise(r => setTimeout(r, 150))
    expect(statsEl.textContent).toContain('Windows: 1 / 0')
    expect(statsEl.textContent).toMatch(/Tabs: 1 \/ \d+/)
  })
})

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Gather: move displayed tabs into current window. Distribute: one window per tab.
 */
describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Gather and Distribute', () => {
  beforeEach(() => {
    global.chrome = global.chrome || {}
    global.chrome.runtime = global.chrome.runtime || {}
    const prev = global.chrome.runtime.sendMessage
    global.chrome.runtime.sendMessage = function (msg, cb) {
      if (msg.type === 'getCurrentBookmark' && typeof cb === 'function') {
        cb({ success: true, data: { url: msg.data?.url, tags: [] } })
        return
      }
      if (typeof prev === 'function') return prev.call(this, msg, cb)
      if (typeof cb === 'function') cb({})
    }
  })

  function makePanelDocWithGatherDistribute () {
    const listEl = document.createElement('div')
    listEl.id = 'browserTabsList'
    listEl.className = 'browser-tabs-list'
    const messageEl = document.createElement('div')
    messageEl.id = 'browserTabsMessage'
    const gatherBtn = document.createElement('button')
    gatherBtn.setAttribute('data-action', 'gatherTabs')
    gatherBtn.id = 'browserTabsGatherBtn'
    const distributeBtn = document.createElement('button')
    distributeBtn.setAttribute('data-action', 'distributeTabs')
    distributeBtn.id = 'browserTabsDistributeBtn'
    const panel = document.createElement('div')
    panel.id = 'browserTabsPanel'
    panel.appendChild(listEl)
    panel.appendChild(messageEl)
    panel.appendChild(gatherBtn)
    panel.appendChild(distributeBtn)
    panel.querySelector = (sel) => {
      if (sel === '#browserTabsList' || sel === '.browser-tabs-list') return listEl
      if (sel === '#browserTabsMessage') return messageEl
      if (sel === '[data-action="gatherTabs"]' || sel === '#browserTabsGatherBtn') return gatherBtn
      if (sel === '[data-action="distributeTabs"]' || sel === '#browserTabsDistributeBtn') return distributeBtn
      return null
    }
    panel.querySelectorAll = () => []
    return {
      doc: { getElementById: (id) => id === 'browserTabsPanel' ? panel : null, createElement: document.createElement.bind(document) },
      listEl,
      messageEl,
      gatherBtn,
      distributeBtn,
      panel
    }
  }

  test('Gather calls tabs.move for displayed tabs not in current window', async () => {
    const { doc, listEl, gatherBtn } = makePanelDocWithGatherDistribute()
    const moveCalls = []
    const mockTabs = {
      query: async () => [
        { id: 1, windowId: 100, title: 'A', url: 'https://a.com' },
        { id: 2, windowId: 200, title: 'B', url: 'https://b.com' }
      ],
      move: async (tabId, opts) => { moveCalls.push({ tabId, opts }) }
    }
    const mockWindows = { getCurrent: async () => ({ id: 100 }) }
    const getReferrers = async () => ({ 1: '', 2: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers, mockWindows)
    await new Promise(r => setTimeout(r, 100))
    expect(listEl.querySelectorAll('.browser-tabs-card')).toHaveLength(2)
    gatherBtn.click()
    await new Promise(r => setTimeout(r, 50))
    expect(moveCalls.length).toBe(1)
    expect(moveCalls[0].tabId).toBe(2)
    expect(moveCalls[0].opts.windowId).toBe(100)
    expect(moveCalls[0].opts.index).toBe(-1)
  })

  test('Distribute calls windows.create for tabs in windows that have more than one tab', async () => {
    const { doc, listEl, distributeBtn } = makePanelDocWithGatherDistribute()
    const createCalls = []
    const mockTabs = {
      query: async (opts) => {
        if (opts.windowId !== undefined) {
          if (opts.windowId === 100) return [{ id: 1 }, { id: 2 }]
          if (opts.windowId === 200) return [{ id: 3 }]
          return []
        }
        return [
          { id: 1, windowId: 100, title: 'A', url: 'https://a.com' },
          { id: 2, windowId: 100, title: 'B', url: 'https://b.com' },
          { id: 3, windowId: 200, title: 'C', url: 'https://c.com' }
        ]
      },
      move: async () => {}
    }
    const mockWindows = {
      getCurrent: async () => ({ id: 100 }),
      create: async (opts) => { createCalls.push(opts) }
    }
    const getReferrers = async () => ({ 1: '', 2: '', 3: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers, mockWindows)
    await new Promise(r => setTimeout(r, 100))
    distributeBtn.click()
    await new Promise(r => setTimeout(r, 150))
    expect(createCalls.length).toBeGreaterThanOrEqual(1)
    expect(createCalls.some(c => c.tabId === 1 || c.tabId === 2)).toBe(true)
  })
})

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Referrer + Copy Records + card ids (continued from referrer from getReferrers).
 */
describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] referrer and Copy Records', () => {
  beforeEach(() => {
    global.chrome = global.chrome || {}
    global.chrome.runtime = global.chrome.runtime || {}
    const prev = global.chrome.runtime.sendMessage
    global.chrome.runtime.sendMessage = function (msg, cb) {
      if (msg.type === 'getCurrentBookmark' && typeof cb === 'function') {
        cb({ success: true, data: { url: msg.data?.url, tags: [] } })
        return
      }
      if (typeof prev === 'function') return prev.call(this, msg, cb)
      if (typeof cb === 'function') cb({})
    }
  })

  function makePanelDoc () {
    const listEl = document.createElement('div')
    listEl.id = 'browserTabsList'
    listEl.className = 'browser-tabs-list'
    const panel = document.createElement('div')
    panel.id = 'browserTabsPanel'
    panel.appendChild(listEl)
    panel.querySelector = (sel) => {
      if (sel === '#browserTabsList' || sel === '.browser-tabs-list') return listEl
      if (sel === '#browserTabsFilterInput' || sel === '[data-action="copyUrls"]' || sel === '#browserTabsCopyBtn' ||
          sel === '[data-action="copyRecords"]' || sel === '#browserTabsCopyRecordsBtn' ||
          sel === '[data-action="closeTabs"]' || sel === '#browserTabsCloseBtn' || sel === '#browserTabsMessage' ||
          sel === '#browserTabsTagsInput' || sel === '[data-action="addTags"]' || sel === '[data-action="setToRead"]' || sel === '[data-action="clearToRead"]') return null
      return null
    }
    panel.querySelectorAll = () => []
    return {
      doc: {
        getElementById (id) { return id === 'browserTabsPanel' ? panel : null },
        createElement: document.createElement.bind(document)
      },
      listEl,
      panel
    }
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Copy Records button writes YAML to clipboard
  test('Copy Records button writes full tab records as YAML to clipboard', async () => {
    const listEl = document.createElement('div')
    listEl.id = 'browserTabsList'
    listEl.className = 'browser-tabs-list'
    const copyRecordsBtn = document.createElement('button')
    copyRecordsBtn.setAttribute('data-action', 'copyRecords')
    copyRecordsBtn.id = 'browserTabsCopyRecordsBtn'
    const messageEl = document.createElement('div')
    messageEl.id = 'browserTabsMessage'
    const panel = document.createElement('div')
    panel.id = 'browserTabsPanel'
    panel.appendChild(listEl)
    panel.appendChild(copyRecordsBtn)
    panel.appendChild(messageEl)
    panel.querySelector = (sel) => {
      if (sel === '#browserTabsList' || sel === '.browser-tabs-list') return listEl
      if (sel === '[data-action="copyRecords"]' || sel === '#browserTabsCopyRecordsBtn') return copyRecordsBtn
      if (sel === '#browserTabsMessage') return messageEl
      if (sel === '#browserTabsFilterInput' || sel === '[data-action="copyUrls"]' || sel === '#browserTabsCopyBtn' ||
          sel === '[data-action="closeTabs"]' || sel === '#browserTabsCloseBtn') return null
      return null
    }
    const doc = { getElementById: (id) => (id === 'browserTabsPanel' ? panel : null), createElement: document.createElement.bind(document) }
    let clipboardText = null
    const mockClipboard = { writeText: (text) => { clipboardText = text; return Promise.resolve() } }
    Object.defineProperty(global, 'navigator', { value: { clipboard: mockClipboard }, writable: true })
    const mockTabs = {
      query: async () => [
        { id: 5, windowId: 20, title: 'YAML Tab', url: 'https://yaml.example.com', referrer: '' }
      ]
    }
    const getReferrers = async () => ({ 5: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    copyRecordsBtn.click()
    await new Promise(r => setTimeout(r, 50))
    expect(clipboardText).toBeTruthy()
    expect(clipboardText).toContain('id: 5')
    expect(clipboardText).toContain('windowId: 20')
    expect(clipboardText).toContain('title:')
    expect(clipboardText).toContain('YAML Tab')
    expect(clipboardText).toContain('url:')
    expect(clipboardText).toContain('https://yaml.example.com')
    expect(clipboardText).toContain('referrer:')
  })

  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Copy URLs button writes visible tab URLs to clipboard
  test('Copy URLs button writes URLs of visible tabs to clipboard', async () => {
    const listEl = document.createElement('div')
    listEl.id = 'browserTabsList'
    listEl.className = 'browser-tabs-list'
    const copyUrlsBtn = document.createElement('button')
    copyUrlsBtn.setAttribute('data-action', 'copyUrls')
    copyUrlsBtn.id = 'browserTabsCopyBtn'
    const messageEl = document.createElement('div')
    messageEl.id = 'browserTabsMessage'
    const panel = document.createElement('div')
    panel.id = 'browserTabsPanel'
    panel.appendChild(listEl)
    panel.appendChild(copyUrlsBtn)
    panel.appendChild(messageEl)
    panel.querySelector = (sel) => {
      if (sel === '#browserTabsList' || sel === '.browser-tabs-list') return listEl
      if (sel === '[data-action="copyUrls"]' || sel === '#browserTabsCopyBtn') return copyUrlsBtn
      if (sel === '#browserTabsMessage') return messageEl
      if (sel === '#browserTabsFilterInput' || sel === '[data-action="copyRecords"]' || sel === '#browserTabsCopyRecordsBtn' ||
          sel === '[data-action="closeTabs"]' || sel === '#browserTabsCloseBtn') return null
      return null
    }
    const doc = { getElementById: (id) => (id === 'browserTabsPanel' ? panel : null), createElement: document.createElement.bind(document) }
    let clipboardText = null
    const mockClipboard = { writeText: (text) => { clipboardText = text; return Promise.resolve() } }
    Object.defineProperty(global, 'navigator', { value: { clipboard: mockClipboard }, writable: true })
    const url1 = 'https://first.example.com'
    const url2 = 'https://second.example.com'
    const mockTabs = {
      query: async () => [
        { id: 10, windowId: 1, title: 'First', url: url1, referrer: '' },
        { id: 11, windowId: 1, title: 'Second', url: url2, referrer: '' }
      ]
    }
    const getReferrers = async () => ({ 10: '', 11: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    copyUrlsBtn.click()
    await new Promise(r => setTimeout(r, 50))
    expect(clipboardText).toBeTruthy()
    expect(clipboardText).toContain(url1)
    expect(clipboardText).toContain(url2)
    expect(clipboardText.trim().split('\n')).toHaveLength(2)
    const messageText = (messageEl.textContent || '').trim()
    const hasFeedback = /Copied \d+ URL/.test(messageText) || messageText.includes('Clipboard not available')
    expect(hasFeedback).toBe(true)
  })

  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Each tab row displays window id and tab id
  test('card displays window id and tab id', async () => {
    const { doc, listEl } = makePanelDoc()
    const mockTabs = {
      query: async () => [
        { id: 42, windowId: 100, title: 'Tab A', url: 'https://a.com' }
      ]
    }
    const getReferrers = async () => ({ 42: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    const card = listEl.querySelector('.browser-tabs-card')
    expect(card).toBeTruthy()
    const idsEl = card.querySelector('.browser-tabs-card-ids')
    expect(idsEl).toBeTruthy()
    const text = idsEl.textContent.trim()
    expect(text).toContain('100')
    expect(text).toContain('42')
  })

  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Favicon: each card shows img.browser-tabs-card-favicon (tab.favIconUrl or placeholder)
  test('card displays favicon img element', async () => {
    const { doc, listEl } = makePanelDoc()
    const mockTabs = {
      query: async () => [{ id: 42, windowId: 100, title: 'Tab A', url: 'https://a.com' }]
    }
    const getReferrers = async () => ({ 42: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    const card = listEl.querySelector('.browser-tabs-card')
    expect(card).toBeTruthy()
    const favicon = card.querySelector('.browser-tabs-card-favicon')
    expect(favicon).toBeTruthy()
    expect(favicon.tagName).toBe('IMG')
    expect(favicon.getAttribute('src')).toBeTruthy()
  })

  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Favicon fallback: when tab has no favIconUrl, img src is placeholder data URI
  const FAVICON_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  test('card favicon uses placeholder when tab has no favIconUrl', async () => {
    const { doc, listEl } = makePanelDoc()
    const mockTabs = {
      query: async () => [{ id: 43, windowId: 100, title: 'No favicon', url: 'https://b.com' }]
    }
    const getReferrers = async () => ({ 43: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    const card = listEl.querySelector('.browser-tabs-card')
    expect(card).toBeTruthy()
    const favicon = card.querySelector('.browser-tabs-card-favicon')
    expect(favicon).toBeTruthy()
    expect(favicon.getAttribute('src')).toBe(FAVICON_PLACEHOLDER)
  })
})

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Clickable window/tab id: ids line is a button; on click calls chrome.windows.update and chrome.tabs.update.
 */
describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] clickable window/tab id (focus on click)', () => {
  beforeEach(() => {
    global.chrome = global.chrome || {}
    global.chrome.runtime = global.chrome.runtime || {}
    const prev = global.chrome.runtime.sendMessage
    global.chrome.runtime.sendMessage = function (msg, cb) {
      if (msg.type === 'getCurrentBookmark' && typeof cb === 'function') {
        cb({ success: true, data: { url: msg.data?.url, tags: [] } })
        return
      }
      if (typeof prev === 'function') return prev.call(this, msg, cb)
      if (typeof cb === 'function') cb({})
    }
  })

  function makePanelDoc () {
    const listEl = document.createElement('div')
    listEl.id = 'browserTabsList'
    listEl.className = 'browser-tabs-list'
    const panel = document.createElement('div')
    panel.id = 'browserTabsPanel'
    panel.appendChild(listEl)
    panel.querySelector = (sel) => {
      if (sel === '#browserTabsList' || sel === '.browser-tabs-list') return listEl
      return null
    }
    panel.querySelectorAll = () => []
    return {
      doc: {
        getElementById (id) { return id === 'browserTabsPanel' ? panel : null },
        createElement: document.createElement.bind(document)
      },
      listEl,
      panel
    }
  }

  test('card has clickable element with data-window-id and data-tab-id when windowId and tabId present', async () => {
    const { doc, listEl } = makePanelDoc()
    const mockTabs = {
      query: async () => [{ id: 42, windowId: 100, title: 'Tab A', url: 'https://a.com' }]
    }
    const getReferrers = async () => ({ 42: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    const link = listEl.querySelector('.browser-tabs-card-ids-link')
    expect(link).toBeTruthy()
    expect(link.getAttribute('data-window-id')).toBe('100')
    expect(link.getAttribute('data-tab-id')).toBe('42')
  })

  test('clicking ids button calls windows.update and tabs.update with correct args', async () => {
    const { doc, listEl } = makePanelDoc()
    const windowsUpdate = jest.fn().mockResolvedValue(undefined)
    const tabsUpdate = jest.fn().mockResolvedValue(undefined)
    const mockTabs = {
      query: async () => [{ id: 7, windowId: 3, title: 'T', url: 'https://x.com' }],
      update: tabsUpdate
    }
    const mockWindows = { update: windowsUpdate }
    const getReferrers = async () => ({ 7: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers, mockWindows)
    await new Promise(r => setTimeout(r, 100))
    const link = listEl.querySelector('.browser-tabs-card-ids-link')
    expect(link).toBeTruthy()
    link.click()
    expect(windowsUpdate).toHaveBeenCalledWith(3, { focused: true })
    expect(tabsUpdate).toHaveBeenCalledWith(7, { active: true })
  })
})

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Bookmark tags: each tab row displays bookmark tags for that URL; — when none.
 */
describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] bookmark tags display', () => {
  function makePanelDoc () {
    const listEl = document.createElement('div')
    listEl.id = 'browserTabsList'
    listEl.className = 'browser-tabs-list'
    const panel = document.createElement('div')
    panel.id = 'browserTabsPanel'
    panel.appendChild(listEl)
    panel.querySelector = (sel) => {
      if (sel === '#browserTabsList' || sel === '.browser-tabs-list') return listEl
      return null
    }
    panel.querySelectorAll = () => []
    return {
      doc: {
        getElementById (id) { return id === 'browserTabsPanel' ? panel : null },
        createElement: document.createElement.bind(document)
      },
      listEl,
      panel
    }
  }

  test('card displays bookmark tags when tab has bookmarkTags', async () => {
    const { doc, listEl } = makePanelDoc()
    const mockTabs = {
      query: async () => [
        { id: 1, windowId: 10, title: 'A', url: 'https://a.com' }
      ]
    }
    const getReferrers = async () => ({ 1: '' })
    global.chrome = global.chrome || {}
    global.chrome.runtime = {
      sendMessage (msg, cb) {
        if (msg.type === 'getCurrentBookmark') {
          cb({ success: true, data: { url: msg.data?.url, tags: ['work', 'read-later'] } })
        } else cb({ success: true })
      }
    }
    try {
      initBrowserTabsTab(doc, mockTabs, null, getReferrers)
      await new Promise(r => setTimeout(r, 150))
      const card = listEl.querySelector('.browser-tabs-card')
      expect(card).toBeTruthy()
      const tagsEl = card.querySelector('.browser-tabs-card-tags')
      expect(tagsEl).toBeTruthy()
      expect(tagsEl.textContent).toContain('work')
      expect(tagsEl.textContent).toContain('read-later')
    } finally {
      if (global.chrome?.runtime) delete global.chrome.runtime
    }
  })

  test('card shows — for tags when no bookmark or empty tags', async () => {
    const { doc, listEl } = makePanelDoc()
    const mockTabs = {
      query: async () => [
        { id: 1, windowId: 10, title: 'B', url: 'https://b.com' }
      ]
    }
    const getReferrers = async () => ({ 1: '' })
    global.chrome = global.chrome || {}
    global.chrome.runtime = {
      sendMessage (msg, cb) {
        if (msg.type === 'getCurrentBookmark') {
          cb({ success: true, data: { url: msg.data?.url, tags: [] } })
        } else cb({ success: true })
      }
    }
    try {
      initBrowserTabsTab(doc, mockTabs, null, getReferrers)
      await new Promise(r => setTimeout(r, 150))
      const card = listEl.querySelector('.browser-tabs-card')
      expect(card).toBeTruthy()
      const tagsEl = card.querySelector('.browser-tabs-card-tags')
      expect(tagsEl).toBeTruthy()
      expect(tagsEl.textContent).toContain('Tags:')
      expect(tagsEl.textContent).toContain('—')
    } finally {
      if (global.chrome?.runtime) delete global.chrome.runtime
    }
  })
})

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Window scope: default current window, toggle to all windows
 */
describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] window scope (current vs all)', () => {
  function makePanelDocWithScopeToggle () {
    const listEl = document.createElement('div')
    listEl.id = 'browserTabsList'
    listEl.className = 'browser-tabs-list'
    const scopeCurrent = document.createElement('input')
    scopeCurrent.type = 'radio'
    scopeCurrent.name = 'browserTabsWindowScope'
    scopeCurrent.value = 'currentWindow'
    scopeCurrent.id = 'browserTabsScopeCurrent'
    const scopeAll = document.createElement('input')
    scopeAll.type = 'radio'
    scopeAll.name = 'browserTabsWindowScope'
    scopeAll.value = 'all'
    scopeAll.id = 'browserTabsScopeAll'
    const panel = document.createElement('div')
    panel.id = 'browserTabsPanel'
    panel.appendChild(scopeCurrent)
    panel.appendChild(scopeAll)
    panel.appendChild(listEl)
    panel.querySelector = (sel) => {
      if (sel === '#browserTabsList' || sel === '.browser-tabs-list') return listEl
      if (sel === '#browserTabsFilterInput' || sel === '[data-action="copyUrls"]' || sel === '#browserTabsCopyBtn' ||
          sel === '[data-action="closeTabs"]' || sel === '#browserTabsMessage') return null
      if (sel === '#browserTabsScopeCurrent' || sel === 'input[name="browserTabsWindowScope"][value="currentWindow"]') return scopeCurrent
      if (sel === '#browserTabsScopeAll' || sel === 'input[name="browserTabsWindowScope"][value="all"]') return scopeAll
      return null
    }
    panel.querySelectorAll = (sel) => {
      if (sel === 'input[name="browserTabsWindowScope"]') return [scopeCurrent, scopeAll]
      return []
    }
    return {
      doc: {
        getElementById (id) { return id === 'browserTabsPanel' ? panel : null },
        createElement: document.createElement.bind(document)
      },
      listEl,
      panel,
      scopeCurrent,
      scopeAll
    }
  }

  test('default scope calls query with currentWindow true', async () => {
    let capturedOpts = null
    const { doc } = makePanelDocWithScopeToggle()
    const mockTabs = {
      query: async (opts) => {
        capturedOpts = opts
        return []
      }
    }
    initBrowserTabsTab(doc, mockTabs, null, async () => ({}))
    await new Promise(r => setTimeout(r, 100))
    expect(capturedOpts).toEqual({ currentWindow: true })
  })

  test('when All windows selected, query called with empty object', async () => {
    let capturedOpts = null
    const { doc, scopeAll } = makePanelDocWithScopeToggle()
    const mockTabs = {
      query: async (opts) => {
        capturedOpts = opts
        return []
      }
    }
    initBrowserTabsTab(doc, mockTabs, null, async () => ({}))
    await new Promise(r => setTimeout(r, 50))
    capturedOpts = null
    scopeAll.checked = true
    scopeAll.dispatchEvent(new Event('change', { bubbles: true }))
    await new Promise(r => setTimeout(r, 100))
    expect(capturedOpts).toEqual({})
  })
})

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Search scope: when scope is Page text, panel fetches getTabsPageText and merges into tabs; filter uses pageText.
 */
describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] search scope Page text (merge and filter)', () => {
  function makePanelDocWithSearchScope () {
    const listEl = document.createElement('div')
    listEl.id = 'browserTabsList'
    listEl.className = 'browser-tabs-list'
    const filterInput = document.createElement('input')
    filterInput.id = 'browserTabsFilterInput'
    const scopeTabInfo = document.createElement('input')
    scopeTabInfo.type = 'radio'
    scopeTabInfo.name = 'browserTabsSearchScope'
    scopeTabInfo.value = 'tabInfo'
    scopeTabInfo.id = 'browserTabsSearchScopeTabInfo'
    const scopePageText = document.createElement('input')
    scopePageText.type = 'radio'
    scopePageText.name = 'browserTabsSearchScope'
    scopePageText.value = 'pageText'
    scopePageText.id = 'browserTabsSearchScopePageText'
    const scopeImportantTags = document.createElement('input')
    scopeImportantTags.type = 'radio'
    scopeImportantTags.name = 'browserTabsSearchScope'
    scopeImportantTags.value = 'importantTags'
    scopeImportantTags.id = 'browserTabsSearchScopeImportantTags'
    scopePageText.checked = true
    const panel = document.createElement('div')
    panel.id = 'browserTabsPanel'
    panel.appendChild(scopeTabInfo)
    panel.appendChild(scopePageText)
    panel.appendChild(scopeImportantTags)
    panel.appendChild(filterInput)
    panel.appendChild(listEl)
    panel.querySelector = (sel) => {
      if (sel === '#browserTabsList' || sel === '.browser-tabs-list') return listEl
      if (sel === '#browserTabsFilterInput') return filterInput
      if (sel === '#browserTabsMessage' || sel === '[data-action="copyUrls"]' || sel === '#browserTabsCopyBtn' ||
          sel === '[data-action="copyRecords"]' || sel === '#browserTabsCopyRecordsBtn' ||
          sel === '[data-action="closeTabs"]' || sel === '#browserTabsCloseBtn') return null
      return null
    }
    panel.querySelectorAll = (sel) => {
      if (sel === 'input[name="browserTabsSearchScope"]') return [scopeTabInfo, scopePageText, scopeImportantTags]
      if (sel === 'input[name="browserTabsWindowScope"]') return []
      return []
    }
    return {
      doc: {
        getElementById (id) { return id === 'browserTabsPanel' ? panel : null },
        createElement: document.createElement.bind(document)
      },
      listEl,
      filterInput,
      scopePageText
    }
  }

  test('when scope Page text and sendMessage returns pageText map, filter matches pageText', async () => {
    const { doc, listEl, filterInput } = makePanelDocWithSearchScope()
    const tabList = [
      { id: 1, title: 'Tab One', url: 'https://one.com' },
      { id: 2, title: 'Tab Two', url: 'https://two.com' }
    ]
    const pageTextMap = { 1: 'Content about bananas', 2: 'Content about apples' }
    let sentType = null
    const mockTabs = { query: async () => tabList }
    const getReferrers = async () => ({ 1: '', 2: '' })
    const origRuntime = global.chrome?.runtime
    global.chrome = global.chrome || {}
    global.chrome.runtime = {
      sendMessage (msg, cb) {
        sentType = msg?.type
        cb({ success: true, data: pageTextMap })
      }
    }
    try {
      initBrowserTabsTab(doc, mockTabs, null, getReferrers)
      await new Promise(r => setTimeout(r, 150))
      expect(sentType).toBe('getTabsPageText')
      filterInput.value = 'bananas'
      filterInput.dispatchEvent(new Event('input', { bubbles: true }))
      await new Promise(r => setTimeout(r, 50))
      const cards = listEl.querySelectorAll('.browser-tabs-card')
      expect(cards).toHaveLength(1)
      expect(cards[0].querySelector('.browser-tabs-card-title')?.textContent?.trim()).toBe('Tab One')
    } finally {
      if (origRuntime) global.chrome.runtime = origRuntime
    }
  })
})

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Close tagged / close untagged / refresh buttons.
 */
describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] close tagged, close untagged, refresh', () => {
  beforeEach(() => {
    global.chrome = global.chrome || {}
    global.chrome.runtime = global.chrome.runtime || {}
    const prev = global.chrome.runtime.sendMessage
    global.chrome.runtime.sendMessage = function (msg, cb) {
      if (msg.type === 'getCurrentBookmark' && typeof cb === 'function') {
        const url = msg.data?.url ?? ''
        const tags = url === 'https://tagged.com' ? ['work'] : []
        cb({ success: true, data: { url, tags } })
        return
      }
      if (typeof prev === 'function') return prev.call(this, msg, cb)
      if (typeof cb === 'function') cb({})
    }
  })

  function makePanelDocWithCloseAndRefresh () {
    const listEl = document.createElement('div')
    listEl.id = 'browserTabsList'
    listEl.className = 'browser-tabs-list'
    const messageEl = document.createElement('div')
    messageEl.id = 'browserTabsMessage'
    const closeTaggedBtn = document.createElement('button')
    closeTaggedBtn.setAttribute('data-action', 'closeTabsWithTag')
    closeTaggedBtn.id = 'browserTabsCloseTaggedBtn'
    const closeUntaggedBtn = document.createElement('button')
    closeUntaggedBtn.setAttribute('data-action', 'closeTabsWithoutTag')
    closeUntaggedBtn.id = 'browserTabsCloseUntaggedBtn'
    const refreshBtn = document.createElement('button')
    refreshBtn.setAttribute('data-action', 'refreshTabs')
    refreshBtn.id = 'browserTabsRefreshBtn'
    const panel = document.createElement('div')
    panel.id = 'browserTabsPanel'
    panel.appendChild(messageEl)
    panel.appendChild(closeTaggedBtn)
    panel.appendChild(closeUntaggedBtn)
    panel.appendChild(refreshBtn)
    panel.appendChild(listEl)
    panel.querySelector = (sel) => {
      if (sel === '#browserTabsList' || sel === '.browser-tabs-list') return listEl
      if (sel === '#browserTabsMessage') return messageEl
      if (sel === '[data-action="closeTabsWithTag"]' || sel === '#browserTabsCloseTaggedBtn') return closeTaggedBtn
      if (sel === '[data-action="closeTabsWithoutTag"]' || sel === '#browserTabsCloseUntaggedBtn') return closeUntaggedBtn
      if (sel === '[data-action="refreshTabs"]' || sel === '#browserTabsRefreshBtn') return refreshBtn
      if (sel === '#browserTabsFilterInput' || sel === '[data-action="copyUrls"]' || sel === '[data-action="closeTabs"]') return null
      return null
    }
    panel.querySelectorAll = () => []
    return {
      doc: {
        getElementById (id) { return id === 'browserTabsPanel' ? panel : null },
        createElement: document.createElement.bind(document)
      },
      listEl,
      messageEl,
      closeTaggedBtn,
      closeUntaggedBtn,
      refreshBtn,
      panel
    }
  }

  test('Close tagged button closes only tabs with non-empty bookmarkTags [REQ-SIDE_PANEL_BROWSER_TABS]', async () => {
    const { doc, listEl, closeTaggedBtn, messageEl } = makePanelDocWithCloseAndRefresh()
    const tabList = [
      { id: 10, title: 'Tagged', url: 'https://tagged.com' },
      { id: 20, title: 'Untagged', url: 'https://untagged.com' }
    ]
    const removedIds = []
    const mockTabs = {
      query: async () => tabList,
      remove: async (id) => { removedIds.push(id) }
    }
    const getReferrers = async () => ({ 10: '', 20: '' })
    global.chrome.tabs = mockTabs
    const confirmSpy = jest.spyOn(global, 'confirm').mockImplementation(() => true)
    try {
      initBrowserTabsTab(doc, mockTabs, null, getReferrers)
      await new Promise(r => setTimeout(r, 250))
      expect(listEl.querySelectorAll('.browser-tabs-card').length).toBe(2)
      const taggedCard = listEl.querySelector('.browser-tabs-card-tags')
      expect(taggedCard && taggedCard.textContent).toContain('work')
      removedIds.length = 0
      closeTaggedBtn.click()
      await new Promise(r => setTimeout(r, 350))
      expect(confirmSpy).toHaveBeenCalled()
      expect(removedIds).toEqual([10])
      expect(messageEl.textContent).toContain('Closed 1 tab')
    } finally {
      confirmSpy.mockRestore()
      delete global.chrome.tabs
    }
  })

  test('Close untagged button closes only tabs with no or empty bookmarkTags [REQ-SIDE_PANEL_BROWSER_TABS]', async () => {
    const { doc, listEl, closeUntaggedBtn, messageEl } = makePanelDocWithCloseAndRefresh()
    const tabList = [
      { id: 10, title: 'Tagged', url: 'https://tagged.com' },
      { id: 20, title: 'Untagged', url: 'https://untagged.com' }
    ]
    const removedIds = []
    const mockTabs = {
      query: async () => tabList,
      remove: async (id) => { removedIds.push(id) }
    }
    const getReferrers = async () => ({ 10: '', 20: '' })
    global.chrome.tabs = mockTabs
    const confirmSpy = jest.spyOn(global, 'confirm').mockImplementation(() => true)
    try {
      initBrowserTabsTab(doc, mockTabs, null, getReferrers)
      await new Promise(r => setTimeout(r, 250))
      expect(listEl.querySelectorAll('.browser-tabs-card').length).toBe(2)
      removedIds.length = 0
      closeUntaggedBtn.click()
      await new Promise(r => setTimeout(r, 350))
      expect(confirmSpy).toHaveBeenCalled()
      expect(removedIds).toEqual([20])
      expect(messageEl.textContent).toContain('Closed 1 tab')
    } finally {
      confirmSpy.mockRestore()
      delete global.chrome.tabs
    }
  })

  test('Refresh button calls loadTabs (query invoked again) [REQ-SIDE_PANEL_BROWSER_TABS]', async () => {
    const { doc, refreshBtn } = makePanelDocWithCloseAndRefresh()
    let queryCount = 0
    const mockTabs = {
      query: async () => {
        queryCount++
        return [{ id: 1, title: 'T', url: 'https://x.com' }]
      }
    }
    const getReferrers = async () => ({ 1: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 150))
    expect(queryCount).toBeGreaterThanOrEqual(1)
    const before = queryCount
    refreshBtn.click()
    await new Promise(r => setTimeout(r, 150))
    expect(queryCount).toBeGreaterThan(before)
  })
})

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * List display mode: Title | URL | Block (default). Each card shows only title, only URL, or full block with remove icon.
 */
describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] list display mode (title | url | block)', () => {
  beforeEach(() => {
    global.chrome = global.chrome || {}
    global.chrome.runtime = global.chrome.runtime || {}
    const prev = global.chrome.runtime.sendMessage
    global.chrome.runtime.sendMessage = function (msg, cb) {
      if (msg.type === 'getCurrentBookmark' && typeof cb === 'function') {
        cb({ success: true, data: { url: msg.data?.url, tags: [] } })
        return
      }
      if (typeof prev === 'function') return prev.call(this, msg, cb)
      if (typeof cb === 'function') cb({})
    }
  })

  function makePanelDocWithDisplayMode () {
    const listEl = document.createElement('div')
    listEl.id = 'browserTabsList'
    listEl.className = 'browser-tabs-list'
    const radioTitle = document.createElement('input')
    radioTitle.type = 'radio'
    radioTitle.name = 'browserTabsListDisplayMode'
    radioTitle.value = 'title'
    const radioUrl = document.createElement('input')
    radioUrl.type = 'radio'
    radioUrl.name = 'browserTabsListDisplayMode'
    radioUrl.value = 'url'
    const radioBlock = document.createElement('input')
    radioBlock.type = 'radio'
    radioBlock.name = 'browserTabsListDisplayMode'
    radioBlock.value = 'block'
    radioBlock.checked = true
    const panel = document.createElement('div')
    panel.id = 'browserTabsPanel'
    panel.appendChild(radioTitle)
    panel.appendChild(radioUrl)
    panel.appendChild(radioBlock)
    panel.appendChild(listEl)
    panel.querySelector = (sel) => {
      if (sel === '#browserTabsList' || sel === '.browser-tabs-list') return listEl
      return null
    }
    panel.querySelectorAll = (sel) => {
      if (sel === 'input[name="browserTabsListDisplayMode"]') return [radioTitle, radioUrl, radioBlock]
      if (sel === 'input[name="browserTabsWindowScope"]') return []
      if (sel === 'input[name="browserTabsSearchScope"]') return []
      return []
    }
    return {
      doc: {
        getElementById (id) { return id === 'browserTabsPanel' ? panel : null },
        createElement: document.createElement.bind(document)
      },
      listEl,
      radioTitle,
      radioUrl,
      radioBlock,
      panel
    }
  }

  test('default block mode: card has title, url, referrer, ids, tags and remove control', async () => {
    const { doc, listEl } = makePanelDocWithDisplayMode()
    const mockTabs = {
      query: async () => [{ id: 1, windowId: 10, title: 'My Tab', url: 'https://example.com', referrer: '' }]
    }
    const getReferrers = async () => ({ 1: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    const card = listEl.querySelector('.browser-tabs-card')
    expect(card).toBeTruthy()
    expect(card.querySelector('.browser-tabs-card-title')?.textContent?.trim()).toBe('My Tab')
    expect(card.querySelector('.browser-tabs-card-url')?.textContent?.trim()).toBe('https://example.com')
    expect(card.querySelector('.browser-tabs-card-referrer')).toBeTruthy()
    expect(card.querySelector('.browser-tabs-card-ids')).toBeTruthy()
    expect(card.querySelector('.browser-tabs-card-tags')).toBeTruthy()
    expect(card.querySelector('[data-action="removeFromDisplay"]')).toBeTruthy()
    // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Per-row close-tab button before window id
    const closeTabBtn = card.querySelector('[data-action="closeTab"]')
    expect(closeTabBtn).toBeTruthy()
    expect(closeTabBtn.getAttribute('data-tab-id')).toBe('1')
    expect(closeTabBtn.getAttribute('title')).toBe('Close tab')
  })

  test('clicking close-tab button calls chrome.tabs.remove with tab id [IMPL-SIDE_PANEL_BROWSER_TABS]', async () => {
    const { doc, listEl } = makePanelDocWithDisplayMode()
    const removeMock = jest.fn().mockResolvedValue(undefined)
    const mockTabs = {
      query: async () => [
        { id: 101, windowId: 1, title: 'First', url: 'https://first.com', referrer: '' },
        { id: 102, windowId: 1, title: 'Second', url: 'https://second.com', referrer: '' }
      ],
      remove: removeMock
    }
    const getReferrers = async () => ({ 101: '', 102: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    const firstCard = listEl.querySelector('.browser-tabs-card')
    const closeTabBtn = firstCard.querySelector('[data-action="closeTab"]')
    expect(closeTabBtn).toBeTruthy()
    closeTabBtn.click()
    await new Promise(r => setTimeout(r, 50))
    expect(removeMock).toHaveBeenCalledWith(101)
    expect(removeMock).toHaveBeenCalledTimes(1)
  })

  test('display mode title: card contains only .browser-tabs-card-title', async () => {
    const { doc, listEl, radioTitle } = makePanelDocWithDisplayMode()
    const mockTabs = {
      query: async () => [{ id: 1, windowId: 10, title: 'Only Title', url: 'https://x.com', referrer: '' }]
    }
    const getReferrers = async () => ({ 1: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    radioTitle.checked = true
    radioTitle.dispatchEvent(new Event('change', { bubbles: true }))
    await new Promise(r => setTimeout(r, 20))
    const card = listEl.querySelector('.browser-tabs-card')
    expect(card).toBeTruthy()
    expect(card.querySelector('.browser-tabs-card-title')?.textContent?.trim()).toBe('Only Title')
    expect(card.querySelector('.browser-tabs-card-url')).toBeFalsy()
    expect(card.querySelector('.browser-tabs-card-referrer')).toBeFalsy()
    expect(card.querySelector('.browser-tabs-card-tags')).toBeFalsy()
  })

  test('display mode url: card contains only .browser-tabs-card-url', async () => {
    const { doc, listEl, radioUrl } = makePanelDocWithDisplayMode()
    const mockTabs = {
      query: async () => [{ id: 2, windowId: 20, title: 'Any', url: 'https://url-only.example.com', referrer: '' }]
    }
    const getReferrers = async () => ({ 2: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    radioUrl.checked = true
    radioUrl.dispatchEvent(new Event('change', { bubbles: true }))
    await new Promise(r => setTimeout(r, 20))
    const card = listEl.querySelector('.browser-tabs-card')
    expect(card).toBeTruthy()
    expect(card.querySelector('.browser-tabs-card-url')?.textContent?.trim()).toBe('https://url-only.example.com')
    expect(card.querySelector('.browser-tabs-card-title')).toBeFalsy()
    expect(card.querySelector('.browser-tabs-card-tags')).toBeFalsy()
  })

  test('switching display mode re-renders list with correct content', async () => {
    const { doc, listEl, radioTitle, radioBlock } = makePanelDocWithDisplayMode()
    const mockTabs = {
      query: async () => [{ id: 1, windowId: 1, title: 'Tab', url: 'https://t.com', referrer: '' }]
    }
    const getReferrers = async () => ({ 1: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    expect(listEl.querySelector('.browser-tabs-card-tags')).toBeTruthy()
    radioTitle.checked = true
    radioTitle.dispatchEvent(new Event('change', { bubbles: true }))
    await new Promise(r => setTimeout(r, 20))
    expect(listEl.querySelector('.browser-tabs-card-tags')).toBeFalsy()
    radioBlock.checked = true
    radioBlock.dispatchEvent(new Event('change', { bubbles: true }))
    await new Promise(r => setTimeout(r, 20))
    expect(listEl.querySelector('.browser-tabs-card-tags')).toBeTruthy()
  })

  test('in title mode, text is clickable (focus link) and remove icon appears after text', async () => {
    const { doc, listEl, radioTitle } = makePanelDocWithDisplayMode()
    const mockTabs = {
      query: async () => [{ id: 42, windowId: 10, title: 'Click Me', url: 'https://x.com', referrer: '' }]
    }
    const getReferrers = async () => ({ 42: '' })
    const windowsUpdate = jest.fn().mockResolvedValue(undefined)
    const tabsUpdate = jest.fn().mockResolvedValue(undefined)
    const mockWindows = { update: windowsUpdate }
    const mockTabsWithUpdate = { ...mockTabs, update: tabsUpdate }
    initBrowserTabsTab(doc, mockTabsWithUpdate, null, getReferrers, mockWindows)
    await new Promise(r => setTimeout(r, 100))
    radioTitle.checked = true
    radioTitle.dispatchEvent(new Event('change', { bubbles: true }))
    await new Promise(r => setTimeout(r, 20))
    const card = listEl.querySelector('.browser-tabs-card')
    const focusLink = card.querySelector('.browser-tabs-card-focus-link')
    const removeBtn = card.querySelector('[data-action="removeFromDisplay"]')
    expect(focusLink).toBeTruthy()
    expect(focusLink.getAttribute('data-window-id')).toBe('10')
    expect(focusLink.getAttribute('data-tab-id')).toBe('42')
    expect(removeBtn).toBeTruthy()
    focusLink.click()
    expect(windowsUpdate).toHaveBeenCalledWith(10, { focused: true })
    expect(tabsUpdate).toHaveBeenCalledWith(42, { active: true })
  })

  test('in url mode, text is clickable and remove icon appears after text', async () => {
    const { doc, listEl, radioUrl } = makePanelDocWithDisplayMode()
    const mockTabs = {
      query: async () => [{ id: 99, windowId: 5, title: 'T', url: 'https://url.example.com', referrer: '' }]
    }
    const getReferrers = async () => ({ 99: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    radioUrl.checked = true
    radioUrl.dispatchEvent(new Event('change', { bubbles: true }))
    await new Promise(r => setTimeout(r, 20))
    const card = listEl.querySelector('.browser-tabs-card')
    const focusLink = card.querySelector('.browser-tabs-card-focus-link')
    const removeBtn = card.querySelector('[data-action="removeFromDisplay"]')
    expect(focusLink).toBeTruthy()
    expect(focusLink.textContent?.trim()).toBe('https://url.example.com')
    expect(removeBtn).toBeTruthy()
  })

  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Title mode: card has close-tab button before focus link; remove unchanged after.
  test('in title mode card has close-tab button with correct data-tab-id [IMPL-SIDE_PANEL_BROWSER_TABS]', async () => {
    const { doc, listEl, radioTitle } = makePanelDocWithDisplayMode()
    const mockTabs = {
      query: async () => [{ id: 7, windowId: 1, title: 'Title Only', url: 'https://t.com', referrer: '' }]
    }
    const getReferrers = async () => ({ 7: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    radioTitle.checked = true
    radioTitle.dispatchEvent(new Event('change', { bubbles: true }))
    await new Promise(r => setTimeout(r, 20))
    const card = listEl.querySelector('.browser-tabs-card')
    const closeTabBtn = card.querySelector('[data-action="closeTab"]')
    const removeBtn = card.querySelector('[data-action="removeFromDisplay"]')
    expect(closeTabBtn).toBeTruthy()
    expect(closeTabBtn.getAttribute('data-tab-id')).toBe('7')
    expect(removeBtn).toBeTruthy()
  })

  test('in url mode, clicking URL focus link calls windows.update and tabs.update', async () => {
    const { doc, listEl, radioUrl } = makePanelDocWithDisplayMode()
    const windowsUpdate = jest.fn().mockResolvedValue(undefined)
    const tabsUpdate = jest.fn().mockResolvedValue(undefined)
    const mockTabs = {
      query: async () => [{ id: 88, windowId: 12, title: 'U', url: 'https://focus-url.com', referrer: '' }],
      update: tabsUpdate
    }
    const mockWindows = { update: windowsUpdate }
    const getReferrers = async () => ({ 88: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers, mockWindows)
    await new Promise(r => setTimeout(r, 100))
    radioUrl.checked = true
    radioUrl.dispatchEvent(new Event('change', { bubbles: true }))
    await new Promise(r => setTimeout(r, 20))
    const focusLink = listEl.querySelector('.browser-tabs-card-focus-link')
    expect(focusLink).toBeTruthy()
    focusLink.click()
    expect(windowsUpdate).toHaveBeenCalledWith(12, { focused: true })
    expect(tabsUpdate).toHaveBeenCalledWith(88, { active: true })
  })
})

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Remove from display: icon in block view removes card from list; Refresh clears hidden set and tabs reappear.
 */
describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] remove from display', () => {
  beforeEach(() => {
    global.chrome = global.chrome || {}
    global.chrome.runtime = global.chrome.runtime || {}
    const prev = global.chrome.runtime.sendMessage
    global.chrome.runtime.sendMessage = function (msg, cb) {
      if (msg.type === 'getCurrentBookmark' && typeof cb === 'function') {
        cb({ success: true, data: { url: msg.data?.url, tags: [] } })
        return
      }
      if (typeof prev === 'function') return prev.call(this, msg, cb)
      if (typeof cb === 'function') cb({})
    }
  })

  function makePanelDocWithRemoveAndRefresh () {
    const listEl = document.createElement('div')
    listEl.id = 'browserTabsList'
    listEl.className = 'browser-tabs-list'
    const radioBlock = document.createElement('input')
    radioBlock.type = 'radio'
    radioBlock.name = 'browserTabsListDisplayMode'
    radioBlock.value = 'block'
    radioBlock.checked = true
    const refreshBtn = document.createElement('button')
    refreshBtn.setAttribute('data-action', 'refreshTabs')
    refreshBtn.id = 'browserTabsRefreshBtn'
    const panel = document.createElement('div')
    panel.id = 'browserTabsPanel'
    panel.appendChild(radioBlock)
    panel.appendChild(refreshBtn)
    panel.appendChild(listEl)
    panel.querySelector = (sel) => {
      if (sel === '#browserTabsList' || sel === '.browser-tabs-list') return listEl
      if (sel === '[data-action="refreshTabs"]' || sel === '#browserTabsRefreshBtn') return refreshBtn
      return null
    }
    panel.querySelectorAll = (sel) => {
      if (sel === 'input[name="browserTabsListDisplayMode"]') return [radioBlock]
      if (sel === 'input[name="browserTabsWindowScope"]') return []
      if (sel === 'input[name="browserTabsSearchScope"]') return []
      return []
    }
    return {
      doc: {
        getElementById (id) { return id === 'browserTabsPanel' ? panel : null },
        createElement: document.createElement.bind(document)
      },
      listEl,
      refreshBtn,
      panel
    }
  }

  test('clicking remove icon removes that card from the list', async () => {
    const { doc, listEl } = makePanelDocWithRemoveAndRefresh()
    const tabList = [
      { id: 101, windowId: 1, title: 'First', url: 'https://first.com', referrer: '' },
      { id: 102, windowId: 1, title: 'Second', url: 'https://second.com', referrer: '' }
    ]
    const mockTabs = { query: async () => tabList }
    const getReferrers = async () => ({ 101: '', 102: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    expect(listEl.querySelectorAll('.browser-tabs-card').length).toBe(2)
    const firstCard = listEl.querySelector('.browser-tabs-card')
    const removeBtn = firstCard.querySelector('[data-action="removeFromDisplay"]')
    expect(removeBtn).toBeTruthy()
    expect(removeBtn.getAttribute('data-tab-id')).toBe('101')
    removeBtn.click()
    await new Promise(r => setTimeout(r, 20))
    expect(listEl.querySelectorAll('.browser-tabs-card').length).toBe(1)
    expect(listEl.querySelector('.browser-tabs-card-title')?.textContent?.trim()).toBe('Second')
  })

  test('after Refresh previously hidden tab reappears', async () => {
    const { doc, listEl, refreshBtn } = makePanelDocWithRemoveAndRefresh()
    const tabList = [
      { id: 201, windowId: 2, title: 'A', url: 'https://a.com', referrer: '' },
      { id: 202, windowId: 2, title: 'B', url: 'https://b.com', referrer: '' }
    ]
    let queryCount = 0
    const mockTabs = {
      query: async () => {
        queryCount++
        return tabList
      }
    }
    const getReferrers = async () => ({ 201: '', 202: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    expect(listEl.querySelectorAll('.browser-tabs-card').length).toBe(2)
    const removeBtn = listEl.querySelector('.browser-tabs-card [data-action="removeFromDisplay"]')
    removeBtn.click()
    await new Promise(r => setTimeout(r, 20))
    expect(listEl.querySelectorAll('.browser-tabs-card').length).toBe(1)
    refreshBtn.click()
    await new Promise(r => setTimeout(r, 150))
    expect(listEl.querySelectorAll('.browser-tabs-card').length).toBe(2)
  })
})
