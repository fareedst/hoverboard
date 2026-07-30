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
import { parseTagsInput, buildAddTagsPayload } from '../bookmarks-table/bookmarks-table-filter.js'

/** [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Search scope: tabInfo = title/url/referrer; pageText = body text; importantTags = alt, h1–h3, meta, etc. */
export const SEARCH_SCOPE_TAB_INFO = 'tabInfo'
export const SEARCH_SCOPE_PAGE_TEXT = 'pageText'
export const SEARCH_SCOPE_IMPORTANT_TAGS = 'importantTags'

/** [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Default DOM source names for Important tags search (comma-separated); used when user has not set custom list. */
export const DEFAULT_IMPORTANT_TAG_SOURCES = 'title, meta description, og:title, h1, h2, h3, img alt, a title'

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Parse comma-separated important-tag sources string into normalized array (trim, filter empty). Applied on GET_TABS_IMPORTANT_TAGS.
 * @param {string} str - Raw input (e.g. from text control)
 * @returns {string[]}
 */
export function parseImportantTagSources (str) {
  if (str == null || typeof str !== 'string') return []
  return str.trim().split(',').map((s) => s.trim()).filter(Boolean)
}

/**
 * [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [ARCH-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS]
 * Normalize chrome.sessions Session[] to tab-like objects. Flattens window sessions into individual tab entries.
 * @param {{ tab?: { sessionId: string, title?: string, url?: string }, window?: { tabs: Array<{ sessionId: string, title?: string, url?: string }> }, lastModified: number }[]} sessions
 * @returns {{ id: string, sessionId: string, title: string, url: string, lastModified: number, isClosed: boolean, referrer: string, pageText: string, importantTags: string }[]}
 */
export function normalizeClosedSessions (sessions) {
  if (!Array.isArray(sessions)) return []
  const result = []
  for (const s of sessions) {
    if (s.tab) {
      const t = s.tab
      result.push({
        id: t.sessionId,
        sessionId: t.sessionId,
        title: (t.title ?? '').toString(),
        url: (t.url ?? '').toString(),
        lastModified: s.lastModified ?? 0,
        isClosed: true,
        referrer: '',
        pageText: '',
        importantTags: ''
      })
    }
    if (s.window && Array.isArray(s.window.tabs)) {
      const lastMod = s.lastModified ?? 0
      for (const t of s.window.tabs) {
        result.push({
          id: t.sessionId,
          sessionId: t.sessionId,
          title: (t.title ?? '').toString(),
          url: (t.url ?? '').toString(),
          lastModified: lastMod,
          isClosed: true,
          referrer: '',
          pageText: '',
          importantTags: ''
        })
      }
    }
  }
  return result
}

/** [IMPL-SIDE_PANEL_BROWSER_TABS] Storage key for persisted important-tag sources list */
const STORAGE_KEY_IMPORTANT_TAG_SOURCES = 'hoverboard_tabs_important_tag_sources'

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Filter tabs by query (case-insensitive substring). Scope: tabInfo = title/url/referrer; pageText = tab.pageText; importantTags = tab.importantTags. Empty/whitespace returns all.
 * @param {{ id: number, title?: string, url?: string, referrer?: string, pageText?: string, importantTags?: string }[]} tabs
 * @param {string} query
 * @param {string} [scope] - 'tabInfo' (default), 'pageText', or 'importantTags'
 * @returns {typeof tabs}
 */
export function filterBrowserTabs (tabs, query, scope) {
  const q = (query == null ? '' : String(query)).trim().toLowerCase()
  if (q === '') return tabs
  const s = scope === SEARCH_SCOPE_PAGE_TEXT ? SEARCH_SCOPE_PAGE_TEXT : scope === SEARCH_SCOPE_IMPORTANT_TAGS ? SEARCH_SCOPE_IMPORTANT_TAGS : SEARCH_SCOPE_TAB_INFO
  if (s === SEARCH_SCOPE_PAGE_TEXT) {
    return tabs.filter((t) => (t.pageText ?? '').toLowerCase().includes(q))
  }
  if (s === SEARCH_SCOPE_IMPORTANT_TAGS) {
    return tabs.filter((t) => (t.importantTags ?? '').toLowerCase().includes(q))
  }
  return tabs.filter((t) => {
    const title = (t.title ?? '').toLowerCase()
    const url = (t.url ?? '').toLowerCase()
    const referrer = (t.referrer ?? '').toLowerCase()
    return title.includes(q) || url.includes(q) || referrer.includes(q)
  })
}

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Build newline-separated URL list from visible tabs for clipboard copy.
 * @param {{ url?: string }[]} visibleTabs
 * @returns {string}
 */
export function buildUrlListForCopy (visibleTabs) {
  return (visibleTabs || []).map((t) => t.url ?? '').filter(Boolean).join('\n')
}

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Build YAML string of full tab records (id, windowId, title, url, referrer) for clipboard copy.
 * @param {{ id: number, windowId?: number, title?: string, url?: string, referrer?: string }[]} visibleTabs
 * @returns {string}
 */
export function buildRecordsYamlForCopy (visibleTabs) {
  if (!visibleTabs || visibleTabs.length === 0) return ''
  const lines = []
  for (const tab of visibleTabs) {
    lines.push('- id: ' + (tab.isClosed ? yamlQuoted(String(tab.id ?? '')) : Number(tab.id)))
    lines.push('  windowId: ' + (tab.windowId != null ? Number(tab.windowId) : ''))
    lines.push('  title: ' + yamlQuoted(String(tab.title ?? '')))
    lines.push('  url: ' + yamlQuoted(String(tab.url ?? '')))
    lines.push('  referrer: ' + yamlQuoted(String(tab.referrer ?? '')))
    // [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [ARCH-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] Closed tabs: include sessionId and lastModified
    if (tab.isClosed) {
      if (tab.sessionId != null) lines.push('  sessionId: ' + yamlQuoted(String(tab.sessionId)))
      if (tab.lastModified != null) lines.push('  lastModified: ' + Number(tab.lastModified))
    }
  }
  return lines.join('\n')
}

function yamlQuoted (s) {
  if (s.includes('"') || s.includes('\n') || s.includes('\\') || s.includes(':')) {
    return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"'
  }
  return '"' + s + '"'
}

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] [IMPL-URL_TAGS_DISPLAY]
 * How: shared trim+lowercase compare used by mergeBookmarkReplyIntoTab for getCurrentBookmark toread/shared (padded API strings).
 */
function bookmarkApiStringIs (value, defaultWhenMissing, expectedLowercase) {
  return String(value ?? defaultWhenMissing).trim().toLowerCase() === expectedLowercase
}

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] [IMPL-URL_TAGS_DISPLAY]
 * Apply getCurrentBookmark reply to tab list row: tags, to-read flag, private (shared === 'no' after trim + case-insensitive compare).
 * Implements mergeBookmarkReplyIntoTab in IMPL essence_pseudocode; bookmark field shape from getCurrentBookmark ([IMPL-URL_TAGS_DISPLAY]).
 * @param {{ bookmarkTags?: string[], bookmarkToread?: boolean, bookmarkPrivate?: boolean }} tab
 * @param {{ success?: boolean, data?: { blocked?: boolean, tags?: unknown, exists?: boolean, toread?: string, shared?: string } } | null} reply
 */
export function mergeBookmarkReplyIntoTab (tab, reply) {
  if (!reply || !reply.success || !reply.data || reply.data.blocked) {
    tab.bookmarkTags = []
    tab.bookmarkToread = false
    tab.bookmarkPrivate = false
    return
  }
  const d = reply.data
  tab.bookmarkTags = Array.isArray(d.tags) ? d.tags : []
  const exists = !!d.exists
  tab.bookmarkToread = exists && bookmarkApiStringIs(d.toread, 'no', 'yes')
  tab.bookmarkPrivate = exists && bookmarkApiStringIs(d.shared, 'yes', 'no')
}

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Inline markers for to-read and private bookmark state (shown when true).
 * @param {{ bookmarkToread?: boolean, bookmarkPrivate?: boolean }} tab
 * @returns {string}
 */
function buildBookmarkTogglesMarkup (tab) {
  const parts = []
  if (tab.bookmarkToread) {
    parts.push('<span class="browser-tabs-card-toggle browser-tabs-card-toggle-toread" title="To read" role="img" aria-label="To read">📖</span>')
  }
  if (tab.bookmarkPrivate) {
    parts.push('<span class="browser-tabs-card-toggle browser-tabs-card-toggle-private" title="Private" role="img" aria-label="Private">🔒</span>')
  }
  if (parts.length === 0) return ''
  return `<span class="browser-tabs-card-toggles" role="group" aria-label="Bookmark flags">${parts.join('')}</span>`
}

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Return the string to display for a tab's referrer: '—' for null, undefined, empty, or the literal "null"; else the referrer URL.
 * @param {string | null | undefined} referrer
 * @returns {string}
 */
export function getReferrerDisplayText (referrer) {
  if (referrer == null || referrer === '' || referrer === 'null') return '—'
  return referrer
}

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Initialize the browser Tabs panel: load tabs, optionally referrers, render list, bind filter/copy/close.
 * Uses global document and chrome when doc/api not passed (e.g. from side-panel.js).
 * @param {Document | { getElementById: (id: string) => HTMLElement | null }} [doc]
 * @param {{ query: (opts: object) => Promise<object[]>, remove: (id: number) => Promise<void> }} [chromeTabs]
 * @param {{ executeScript?: (opts: object) => Promise<object[]> }} [chromeScripting] - unused; referrer is fetched via GET_TAB_REFERRERS from SW
 * @param {(tabs: { id?: number, url?: string }[]) => Promise<Record<number, string>>} [getReferrers] - optional for tests; when provided, used instead of sendMessage
 * @param {{ update: (windowId: number, opts: object) => Promise<unknown> }} [chromeWindows] - optional for tests; when provided, used for focus-on-click
 */
export function initBrowserTabsTab (doc, chromeTabs, chromeScripting, getReferrers, chromeWindows) {
  const document = doc || (typeof globalThis.document !== 'undefined' ? globalThis.document : null)
  if (!document) return
  const panel = document.getElementById('browserTabsPanel')
  if (!panel) return

  // [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [ARCH-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] Sessions API check: hide Recently closed and Both when chrome.sessions unavailable
  const sessionsApi = typeof chrome !== 'undefined' && chrome.sessions ? chrome.sessions : (typeof browser !== 'undefined' && browser.sessions ? browser.sessions : null)
  const hasSessionsApi = !!(sessionsApi && typeof sessionsApi.getRecentlyClosed === 'function')
  const tabSourceWrap = panel.querySelector('#browserTabsSourceWrap')
  if (tabSourceWrap) {
    const closedLabel = tabSourceWrap.querySelector('#browserTabsSourceClosedLabel') || tabSourceWrap.querySelector('.browser-tabs-source-closed')
    const bothLabel = tabSourceWrap.querySelector('#browserTabsSourceBothLabel') || tabSourceWrap.querySelector('.browser-tabs-source-both')
    if (!hasSessionsApi && closedLabel) closedLabel.style.display = 'none'
    if (!hasSessionsApi && bothLabel) bothLabel.style.display = 'none'
  }

  const filterInput = panel.querySelector('#browserTabsFilterInput')
  const listEl = panel.querySelector('#browserTabsList') || panel.querySelector('.browser-tabs-list')
  const copyBtn = panel.querySelector('[data-action="copyUrls"]') || panel.querySelector('#browserTabsCopyBtn')
  const copyRecordsBtn = panel.querySelector('[data-action="copyRecords"]') || panel.querySelector('#browserTabsCopyRecordsBtn')
  const closeBtn = panel.querySelector('[data-action="closeTabs"]') || panel.querySelector('#browserTabsCloseBtn')
  const closeTaggedBtn = panel.querySelector('[data-action="closeTabsWithTag"]') || panel.querySelector('#browserTabsCloseTaggedBtn')
  const closeUntaggedBtn = panel.querySelector('[data-action="closeTabsWithoutTag"]') || panel.querySelector('#browserTabsCloseUntaggedBtn')
  const refreshBtn = panel.querySelector('[data-action="refreshTabs"]') || panel.querySelector('#browserTabsRefreshBtn')
  const messageEl = panel.querySelector('#browserTabsMessage')
  const scopeRadios = panel.querySelectorAll && panel.querySelectorAll('input[name="browserTabsWindowScope"]')
  const tabSourceRadios = panel.querySelectorAll && panel.querySelectorAll('input[name="browserTabsTabSource"]')
  const tabSourceClosedLabel = panel.querySelector('#browserTabsSourceClosedLabel') || panel.querySelector('.browser-tabs-source-closed')
  const tabSourceBothLabel = panel.querySelector('#browserTabsSourceBothLabel') || panel.querySelector('.browser-tabs-source-both')
  const searchScopeRadios = panel.querySelectorAll && panel.querySelectorAll('input[name="browserTabsSearchScope"]')
  // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] List display mode: title | url | block (default block)
  const listDisplayModeRadios = panel.querySelectorAll && panel.querySelectorAll('input[name="browserTabsListDisplayMode"]')
  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] batch bookmark UI
  const tagsInput = panel.querySelector('#browserTabsTagsInput')
  const addTagsBtn = panel.querySelector('[data-action="addTags"]') || panel.querySelector('#browserTabsAddTagsBtn')
  const setToReadBtn = panel.querySelector('[data-action="setToRead"]') || panel.querySelector('#browserTabsSetToReadBtn')
  const clearToReadBtn = panel.querySelector('[data-action="clearToRead"]') || panel.querySelector('#browserTabsClearToReadBtn')
  const importantTagSourcesInput = panel.querySelector('#browserTabsImportantTagSources')
  const gatherBtn = panel.querySelector('[data-action="gatherTabs"]') || panel.querySelector('#browserTabsGatherBtn')
  const distributeBtn = panel.querySelector('[data-action="distributeTabs"]') || panel.querySelector('#browserTabsDistributeBtn')
  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Stats line: display windows/tabs vs total (above batch bookmark section)
  const statsEl = panel.querySelector('#browserTabsStats')

  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] windowScope: currentWindow (default) or all; searchScope: tabInfo (default), pageText, or importantTags
  let windowScope = 'currentWindow'
  let searchScope = SEARCH_SCOPE_TAB_INFO
  // [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] tabSource: open (default), recentlyClosed, or both
  let tabSource = 'open'
  // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] listDisplayMode: title | url | block (default block); hiddenTabIds: session-scoped set of tab IDs (number for open, string sessionId for closed)
  let listDisplayMode = 'block'
  /** @type {Set<number|string>} */
  const hiddenTabIds = new Set()

  /** @type {{ id: number, windowId?: number, title?: string, url?: string, referrer?: string, pageText?: string, importantTags?: string, bookmarkTags?: string[], bookmarkToread?: boolean, bookmarkPrivate?: boolean }[]} */
  let allTabs = []
  /** @type {{ id: number, windowId?: number, title?: string, url?: string, referrer?: string, pageText?: string, importantTags?: string, bookmarkTags?: string[], bookmarkToread?: boolean, bookmarkPrivate?: boolean }[]} */
  let visibleTabs = []
  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Total windows and tabs (browser-wide) for stats line; set in loadTabs from chrome.windows.getAll and chrome.tabs.query({})
  let totalWindows = 0
  let totalTabs = 0

  function getWindowScope () {
    if (scopeRadios && scopeRadios.length) {
      for (let i = 0; i < scopeRadios.length; i++) {
        if (scopeRadios[i].checked) return scopeRadios[i].value
      }
    }
    return 'currentWindow'
  }

  // [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [ARCH-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] Tab source: open | recentlyClosed | both
  function getTabSource () {
    if (tabSourceRadios && tabSourceRadios.length) {
      for (let i = 0; i < tabSourceRadios.length; i++) {
        if (tabSourceRadios[i].checked) return tabSourceRadios[i].value
      }
    }
    return 'open'
  }

  function getSearchScope () {
    if (searchScopeRadios && searchScopeRadios.length) {
      for (let i = 0; i < searchScopeRadios.length; i++) {
        if (searchScopeRadios[i].checked) return searchScopeRadios[i].value
      }
    }
    return SEARCH_SCOPE_TAB_INFO
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Tabs currently shown in the list (visibleTabs minus hiddenTabIds); copy/close act on this list
  function getDisplayedTabs () {
    return visibleTabs.filter((t) => !hiddenTabIds.has(t.id))
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] List display mode: title | url | block (default block)
  function getListDisplayMode () {
    if (listDisplayModeRadios && listDisplayModeRadios.length) {
      for (let i = 0; i < listDisplayModeRadios.length; i++) {
        if (listDisplayModeRadios[i].checked) return listDisplayModeRadios[i].value
      }
    }
    return 'block'
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Focus window and tab on click (ids line clickable)
  function focusWindowAndTab (windowId, tabId) {
    const w = Number(windowId)
    const t = Number(tabId)
    if (Number.isNaN(w) || Number.isNaN(t)) return
    const apiTabs = chromeTabs || (typeof chrome !== 'undefined' && chrome.tabs ? chrome.tabs : null) || (typeof browser !== 'undefined' && browser.tabs ? browser.tabs : null)
    const apiWindows = chromeWindows || (typeof chrome !== 'undefined' && chrome.windows ? chrome.windows : null) || (typeof browser !== 'undefined' && browser.windows ? browser.windows : null)
    if (apiWindows && typeof apiWindows.update === 'function') {
      apiWindows.update(w, { focused: true }).catch(() => {})
    }
    if (apiTabs && typeof apiTabs.update === 'function') {
      apiTabs.update(t, { active: true }).catch(() => {})
    }
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Favicon src: use tab.favIconUrl or 1x1 transparent data URI so img never breaks layout
  const FAVICON_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  function getFaviconSrc (tab) {
    const url = (tab && tab.favIconUrl) ? String(tab.favIconUrl).trim() : ''
    return url || FAVICON_PLACEHOLDER
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Stats line: display windows/total windows, display tabs/total tabs; call after render and after loadTabs
  function updateStatsLine () {
    if (!statsEl) return
    const displayed = visibleTabs.filter((t) => !hiddenTabIds.has(t.id))
    const displayWindows = new Set(displayed.map((t) => t.windowId).filter((id) => id != null)).size
    const displayTabs = displayed.length
    statsEl.textContent = `Windows: ${displayWindows} / ${totalWindows} · Tabs: ${displayTabs} / ${totalTabs}`
  }

  // [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] Hide Gather/Distribute when tabSource is recentlyClosed or all displayed are closed
  function updateGatherDistributeVisibility () {
    const displayed = getDisplayedTabs()
    const allClosed = tabSource === 'recentlyClosed' || (displayed.length > 0 && displayed.every((t) => t.isClosed))
    if (gatherBtn) gatherBtn.style.display = allClosed ? 'none' : ''
    if (distributeBtn) distributeBtn.style.display = allClosed ? 'none' : ''
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Display list = visibleTabs minus hiddenTabIds; render per listDisplayMode (title | url | block); favicon before title/url in all modes; non-block: clickable text + remove icon after; block view includes remove icon before Tags
  function renderList () {
    if (!listEl) return
    listDisplayMode = getListDisplayMode()
    const displayList = visibleTabs.filter((t) => !hiddenTabIds.has(t.id))
    listEl.innerHTML = ''
    displayList.forEach((tab) => {
      const card = document.createElement('div')
      card.className = 'browser-tabs-card' + (tab.isClosed ? ' browser-tabs-card-closed' : '')
      const windowId = tab.windowId != null ? String(tab.windowId) : ''
      const tabId = tab.id != null ? String(tab.id) : ''
      const sessionId = tab.sessionId != null ? String(tab.sessionId) : tabId
      const idsDisplay = tab.isClosed ? `Closed · Session ${escapeHtml(sessionId.slice(0, 12))}${sessionId.length > 12 ? '…' : ''}` : `Window ${escapeHtml(windowId)} · Tab ${escapeHtml(tabId)}`
      const hasValidIds = !tab.isClosed && windowId !== '' && tabId !== ''
      const tagsArr = Array.isArray(tab.bookmarkTags) ? tab.bookmarkTags : []
      const tagsDisplay = tagsArr.length > 0 ? escapeHtml(tagsArr.join(', ')) : '—'
      // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Per-row bookmark flags: to-read and private icons when true (all display modes)
      const togglesMarkup = buildBookmarkTogglesMarkup(tab)
      const removeBtn = `<button type="button" class="browser-tabs-card-remove" data-action="removeFromDisplay" data-tab-id="${escapeHtml(tabId)}" aria-label="Remove from list" title="Remove from list">×</button>`
      // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Per-row close-tab for open; [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] Restore for closed
      const closeTabBtn = tab.isClosed
        ? `<button type="button" class="browser-tabs-card-restore" data-action="restoreTab" data-session-id="${escapeHtml(sessionId)}" aria-label="Restore tab" title="Restore tab">↺</button>`
        : `<button type="button" class="browser-tabs-card-close-tab" data-action="closeTab" data-tab-id="${escapeHtml(tabId)}" aria-label="Close tab" title="Close tab">✕</button>`
      const faviconSrc = getFaviconSrc(tab)
      const faviconImg = `<img class="browser-tabs-card-favicon" src="${escapeHtml(faviconSrc)}" alt="" width="16" height="16">`
      if (listDisplayMode === 'title') {
        const titleText = escapeHtml(tab.title || '(no title)')
        const focusBtn = hasValidIds
          ? `<button type="button" class="browser-tabs-card-title browser-tabs-card-focus-link" data-window-id="${escapeHtml(windowId)}" data-tab-id="${escapeHtml(tabId)}">${titleText}</button>`
          : `<div class="browser-tabs-card-title">${titleText}</div>`
        card.innerHTML = `${faviconImg}${togglesMarkup} ${closeTabBtn} ${focusBtn} ${removeBtn}`
      } else if (listDisplayMode === 'url') {
        const urlText = escapeHtml(tab.url || '')
        const focusBtn = hasValidIds
          ? `<button type="button" class="browser-tabs-card-url browser-tabs-card-focus-link" data-window-id="${escapeHtml(windowId)}" data-tab-id="${escapeHtml(tabId)}">${urlText}</button>`
          : `<div class="browser-tabs-card-url">${urlText}</div>`
        card.innerHTML = `${faviconImg}${togglesMarkup} ${closeTabBtn} ${focusBtn} ${removeBtn}`
      } else {
        const idsMarkup = hasValidIds
          ? `<button type="button" class="browser-tabs-card-ids browser-tabs-card-ids-link" data-window-id="${escapeHtml(windowId)}" data-tab-id="${escapeHtml(tabId)}">${idsDisplay}</button>`
          : `<div class="browser-tabs-card-ids">${idsDisplay}</div>`
        card.innerHTML = `
        <div class="browser-tabs-card-title-row">${faviconImg}${togglesMarkup}<span class="browser-tabs-card-title">${escapeHtml(tab.title || '(no title)')}</span></div>
        <div class="browser-tabs-card-url">${escapeHtml(tab.url || '')}</div>
        <div class="browser-tabs-card-referrer">${escapeHtml(getReferrerDisplayText(tab.referrer))}</div>
        ${closeTabBtn}
        ${idsMarkup}
        ${removeBtn}
        <div class="browser-tabs-card-tags">Tags: ${tagsDisplay}</div>
      `
      }
      listEl.appendChild(card)
    })
    updateStatsLine()
    updateGatherDistributeVisibility()
  }

  function applyFilter () {
    const query = filterInput ? filterInput.value : ''
    searchScope = getSearchScope()
    visibleTabs = filterBrowserTabs(allTabs, query, searchScope)
    renderList()
  }

  function setFilterPlaceholder () {
    if (!filterInput) return
    if (searchScope === SEARCH_SCOPE_PAGE_TEXT) filterInput.placeholder = 'Filter by page text…'
    else if (searchScope === SEARCH_SCOPE_IMPORTANT_TAGS) filterInput.placeholder = 'Filter by headings, alt, meta…'
    else filterInput.placeholder = 'Filter by title, URL, referrer…'
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Fetch page text or important tags from SW and merge into allTabs; show loading state.
  async function loadExtraForScope () {
    const scope = getSearchScope()
    if (scope !== SEARCH_SCOPE_PAGE_TEXT && scope !== SEARCH_SCOPE_IMPORTANT_TAGS) return
    const runtime = typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime : (typeof browser !== 'undefined' && browser.runtime ? browser.runtime : null)
    if (!runtime || !runtime.sendMessage || allTabs.length === 0) return
    if (listEl) listEl.innerHTML = '<div class="browser-tabs-loading">Loading…</div>'
    const msgType = scope === SEARCH_SCOPE_PAGE_TEXT ? 'getTabsPageText' : 'getTabsImportantTags'
    const msgData = { tabs: allTabs.map((t) => ({ id: t.id, url: t.url })) }
    if (scope === SEARCH_SCOPE_IMPORTANT_TAGS) {
      const raw = importantTagSourcesInput ? importantTagSourcesInput.value : ''
      const sources = parseImportantTagSources(raw)
      msgData.importantTagSources = sources.length > 0 ? sources : parseImportantTagSources(DEFAULT_IMPORTANT_TAG_SOURCES)
    }
    const msg = { type: msgType, data: msgData }
    try {
      const reply = await new Promise((resolve, reject) => {
        runtime.sendMessage(msg, (r) => { if (chrome.runtime?.lastError) reject(new Error(chrome.runtime.lastError?.message)); else resolve(r) })
      })
      const data = reply && typeof reply === 'object' && reply.success && reply.data && typeof reply.data === 'object' ? reply.data : {}
      for (let i = 0; i < allTabs.length; i++) {
        const id = allTabs[i].id
        if (scope === SEARCH_SCOPE_PAGE_TEXT) allTabs[i] = { ...allTabs[i], pageText: data[id] !== undefined ? data[id] : '' }
        else allTabs[i] = { ...allTabs[i], importantTags: data[id] !== undefined ? data[id] : '' }
      }
    } catch (_) {
      for (let i = 0; i < allTabs.length; i++) {
        if (scope === SEARCH_SCOPE_PAGE_TEXT) allTabs[i] = { ...allTabs[i], pageText: '' }
        else allTabs[i] = { ...allTabs[i], importantTags: '' }
      }
    }
    applyFilter()
  }

  async function loadTabs () {
    const api = chromeTabs || (typeof chrome !== 'undefined' && chrome.tabs ? chrome.tabs : null) || (typeof browser !== 'undefined' && browser.tabs ? browser.tabs : null)
    const runtime = typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime : (typeof browser !== 'undefined' && browser.runtime ? browser.runtime : null)
    const windowsApi = chromeWindows || (typeof chrome !== 'undefined' && chrome.windows ? chrome.windows : null) || (typeof browser !== 'undefined' && browser.windows ? browser.windows : null)
    tabSource = getTabSource()
    windowScope = getWindowScope()

    // [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [ARCH-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] When tab source includes closed, force searchScope to tabInfo and disable Page text/Elements
    if (tabSource !== 'open' && searchScopeRadios && searchScopeRadios.length) {
      searchScope = SEARCH_SCOPE_TAB_INFO
      for (let i = 0; i < searchScopeRadios.length; i++) {
        const r = searchScopeRadios[i]
        if (r.value === SEARCH_SCOPE_TAB_INFO) r.checked = true
        r.disabled = (r.value === SEARCH_SCOPE_PAGE_TEXT || r.value === SEARCH_SCOPE_IMPORTANT_TAGS)
      }
    } else if (searchScopeRadios && searchScopeRadios.length) {
      for (let i = 0; i < searchScopeRadios.length; i++) searchScopeRadios[i].disabled = false
    }

    try {
      if (tabSource === 'recentlyClosed') {
        // [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] Load only recently closed tabs
        if (!runtime || !runtime.sendMessage) {
          allTabs = []
        } else {
          try {
            const reply = await new Promise((resolve, reject) => {
              runtime.sendMessage({ type: 'getRecentlyClosedTabs' }, (r) => { if (chrome.runtime?.lastError) reject(new Error(chrome.runtime.lastError?.message)); else resolve(r) })
            })
            const sessions = reply && typeof reply === 'object' && reply.success && Array.isArray(reply.data) ? reply.data : []
            allTabs = normalizeClosedSessions(sessions)
          } catch (_) {
            allTabs = []
          }
        }
        totalWindows = 0
        totalTabs = allTabs.length
        if (runtime && typeof runtime.sendMessage === 'function') {
          await Promise.all(allTabs.map(async (tab) => {
            const url = (tab.url ?? '').trim()
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
              mergeBookmarkReplyIntoTab(tab, { success: false })
              return
            }
            try {
              const reply = await new Promise((resolve, reject) => {
                runtime.sendMessage({ type: 'getCurrentBookmark', data: { url: tab.url, title: tab.title } }, (r) => { if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError?.message)); else resolve(r) })
              })
              mergeBookmarkReplyIntoTab(tab, reply)
            } catch (_) {
              mergeBookmarkReplyIntoTab(tab, { success: false })
            }
          }))
        } else { allTabs.forEach((t) => { mergeBookmarkReplyIntoTab(t, { success: false }) }) }
        searchScope = SEARCH_SCOPE_TAB_INFO
        setFilterPlaceholder()
        visibleTabs = filterBrowserTabs(allTabs, filterInput ? filterInput.value : '', searchScope)
        renderList()
        return
      }

      if (!api) return
      // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Stats line denominators: total windows and total tabs (browser-wide)
      if (windowsApi && typeof windowsApi.getAll === 'function') {
        try { const wins = await windowsApi.getAll(); totalWindows = Array.isArray(wins) ? wins.length : 0 } catch (_) { totalWindows = 0 }
      } else { totalWindows = 0 }
      if (api && typeof api.query === 'function') {
        try { const all = await api.query({}); totalTabs = Array.isArray(all) ? all.length : 0 } catch (_) { totalTabs = 0 }
      } else { totalTabs = 0 }
      const queryOpts = windowScope === 'currentWindow' ? { currentWindow: true } : {}
      const list = await api.query(queryOpts)
      // [REQ-SIDE_PANEL_BROWSER_TABS] Get referrers from service worker so executeScript runs in tab context (side panel context cannot inject into tabs).
      let referrersMap = /** @type {Record<number, string>} */ ({})
      if (typeof getReferrers === 'function') {
        referrersMap = await getReferrers(list) || {}
      } else if (runtime && runtime.sendMessage) {
        try {
          const msg = { type: 'getTabReferrers', data: { tabs: list.map((t) => ({ id: t.id, url: t.url })) } }
          const reply = await new Promise((resolve, reject) => { runtime.sendMessage(msg, (r) => { if (chrome.runtime?.lastError) reject(new Error(chrome.runtime.lastError?.message)); else resolve(r) }) })
          const data = reply && typeof reply === 'object' && reply.success && reply.data && typeof reply.data === 'object' ? reply.data : {}
          referrersMap = data
        } catch (_) { referrersMap = {} }
      }
      let withReferrer = list.map((tab) => ({
        id: tab.id,
        windowId: tab.windowId,
        title: tab.title ?? '',
        url: tab.url ?? '',
        referrer: (tab.id != null && referrersMap[tab.id] !== undefined) ? referrersMap[tab.id] : '',
        favIconUrl: tab.favIconUrl ?? ''
      }))
      // [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] When both: merge open tabs with recently closed
      if (tabSource === 'both' && runtime && runtime.sendMessage) {
        try {
          const reply = await new Promise((resolve, reject) => { runtime.sendMessage({ type: 'getRecentlyClosedTabs' }, (r) => { if (chrome.runtime?.lastError) reject(new Error(chrome.runtime.lastError?.message)); else resolve(r) }) })
          const sessions = reply && typeof reply === 'object' && reply.success && Array.isArray(reply.data) ? reply.data : []
          const closedTabs = normalizeClosedSessions(sessions)
          withReferrer = withReferrer.concat(closedTabs)
        } catch (_) { /* keep only open */ }
      }
      allTabs = withReferrer
      // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Fetch bookmark tags per tab (same source as popup)
      if (runtime && typeof runtime.sendMessage === 'function') {
        try {
          await Promise.all(allTabs.map(async (tab) => {
            const url = (tab.url ?? '').trim()
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
              mergeBookmarkReplyIntoTab(tab, { success: false })
              return
            }
            try {
              const reply = await new Promise((resolve, reject) => {
                runtime.sendMessage({ type: 'getCurrentBookmark', data: { url: tab.url, title: tab.title } }, (r) => {
                  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError?.message))
                  else resolve(r)
                })
              })
              mergeBookmarkReplyIntoTab(tab, reply)
            } catch (_) {
              mergeBookmarkReplyIntoTab(tab, { success: false })
            }
          }))
        } catch (_) {
          allTabs.forEach((t) => {
            t.bookmarkTags = t.bookmarkTags ?? []
            t.bookmarkToread = t.bookmarkToread ?? false
            t.bookmarkPrivate = t.bookmarkPrivate ?? false
          })
        }
      } else {
        allTabs.forEach((t) => { mergeBookmarkReplyIntoTab(t, { success: false }) })
      }
      searchScope = getSearchScope()
      setFilterPlaceholder()
      if (searchScope === SEARCH_SCOPE_PAGE_TEXT || searchScope === SEARCH_SCOPE_IMPORTANT_TAGS) {
        await loadExtraForScope()
      } else {
        visibleTabs = filterBrowserTabs(allTabs, filterInput ? filterInput.value : '', searchScope)
        renderList()
      }
    } catch (e) {
      if (listEl) listEl.innerHTML = `<div class="browser-tabs-error">Failed to load tabs: ${escapeHtml(String((e && e.message) || e))}</div>`
    }
  }

  function showMessage (text) {
    if (messageEl) {
      messageEl.textContent = text
      messageEl.classList.remove('hidden')
      if (messageEl.dataset) messageEl.dataset.visible = 'true'
      setTimeout(() => {
        messageEl.classList.add('hidden')
        if (messageEl.dataset) messageEl.dataset.visible = 'false'
      }, 3000)
    }
  }

  if (scopeRadios && scopeRadios.length) {
    for (let i = 0; i < scopeRadios.length; i++) {
      scopeRadios[i].addEventListener('change', () => { windowScope = getWindowScope(); loadTabs() })
    }
  }
  // [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] Tab source change: reload
  if (tabSourceRadios && tabSourceRadios.length) {
    for (let i = 0; i < tabSourceRadios.length; i++) {
      tabSourceRadios[i].addEventListener('change', () => { tabSource = getTabSource(); loadTabs() })
    }
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] On search-scope change: fetch page text or important tags if needed, then re-apply filter.
  if (searchScopeRadios && searchScopeRadios.length) {
    for (let i = 0; i < searchScopeRadios.length; i++) {
      searchScopeRadios[i].addEventListener('change', async () => {
        searchScope = getSearchScope()
        setFilterPlaceholder()
        if (searchScope === SEARCH_SCOPE_PAGE_TEXT || searchScope === SEARCH_SCOPE_IMPORTANT_TAGS) {
          await loadExtraForScope()
        } else {
          applyFilter()
        }
      })
    }
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] List display mode change: re-render so each card shows title only, URL only, or full block
  if (listDisplayModeRadios && listDisplayModeRadios.length) {
    for (let i = 0; i < listDisplayModeRadios.length; i++) {
      listDisplayModeRadios[i].addEventListener('change', () => {
        listDisplayMode = getListDisplayMode()
        renderList()
      })
    }
  }

  if (filterInput) {
    filterInput.addEventListener('input', applyFilter)
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Delegated click: close tab (closeTab); remove from display (removeFromDisplay); focus window and tab when ids or focus link clicked
  if (listEl) {
    listEl.addEventListener('click', async (e) => {
      const closeTabBtnEl = e.target && e.target.closest && e.target.closest('[data-action="closeTab"]')
      if (closeTabBtnEl) {
        const tabId = closeTabBtnEl.getAttribute('data-tab-id')
        if (tabId != null) {
          const id = Number(tabId)
          if (!Number.isNaN(id)) {
            const api = chromeTabs || (typeof chrome !== 'undefined' && chrome.tabs ? chrome.tabs : null) || (typeof browser !== 'undefined' && browser.tabs ? browser.tabs : null)
            if (api && typeof api.remove === 'function') {
              try {
                await api.remove(id)
                allTabs = allTabs.filter((t) => t.id !== id)
                applyFilter()
              } catch (_) {
                showMessage('Failed to close tab')
              }
            }
          }
        }
        return
      }
      const removeBtn = e.target && e.target.closest && e.target.closest('[data-action="removeFromDisplay"]')
      if (removeBtn) {
        const tabId = removeBtn.getAttribute('data-tab-id')
        if (tabId != null) {
          const num = Number(tabId)
          hiddenTabIds.add(Number.isNaN(num) ? tabId : num)
          renderList()
        }
        return
      }
      // [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] Restore closed tab via chrome.sessions.restore
      const restoreBtn = e.target && e.target.closest && e.target.closest('[data-action="restoreTab"]')
      if (restoreBtn) {
        const sessionId = restoreBtn.getAttribute('data-session-id')
        if (sessionId) {
          const sessionsApi = typeof chrome !== 'undefined' && chrome.sessions ? chrome.sessions : (typeof browser !== 'undefined' && browser.sessions ? browser.sessions : null)
          if (sessionsApi && typeof sessionsApi.restore === 'function') {
            try {
              await sessionsApi.restore(sessionId)
              showMessage('Tab restored')
              await loadTabs()
            } catch (_) {
              showMessage('Failed to restore tab')
            }
          }
        }
        return
      }
      const btn = e.target && e.target.closest && (e.target.closest('.browser-tabs-card-ids-link') || e.target.closest('.browser-tabs-card-focus-link'))
      if (!btn) return
      const windowId = btn.getAttribute('data-window-id')
      const tabId = btn.getAttribute('data-tab-id')
      if (windowId != null && tabId != null) focusWindowAndTab(windowId, tabId)
    })
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const displayed = getDisplayedTabs()
      const urls = buildUrlListForCopy(displayed)
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(urls)
          const count = displayed.length
          showMessage(`Copied ${count} URL${count !== 1 ? 's' : ''}`)
        } else {
          showMessage('Clipboard not available')
        }
      } catch (_) {
        showMessage('Copy failed')
      }
    })
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Copy Records: full tab records as YAML to clipboard (displayed list only)
  if (copyRecordsBtn) {
    copyRecordsBtn.addEventListener('click', async () => {
      const displayed = getDisplayedTabs()
      const yamlString = buildRecordsYamlForCopy(displayed)
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(yamlString)
          const count = displayed.length
          showMessage(`Copied ${count} record${count !== 1 ? 's' : ''}`)
        } else {
          showMessage('Clipboard not available')
        }
      } catch (_) {
        showMessage('Copy failed')
      }
    })
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', async () => {
      const displayed = getDisplayedTabs()
      const toClose = displayed.filter((t) => !t.isClosed)
      if (toClose.length === 0) {
        showMessage('No open tabs to close')
        return
      }
      if (!confirm(`Close ${toClose.length} tab${toClose.length !== 1 ? 's' : ''}?`)) return
      const api = (typeof chrome !== 'undefined' && chrome.tabs ? chrome.tabs : null) || (typeof browser !== 'undefined' && browser.tabs ? browser.tabs : null) || chromeTabs
      if (!api || typeof api.remove !== 'function') return
      let closed = 0
      for (const tab of toClose) {
        try {
          await api.remove(tab.id)
          closed++
        } catch (_) { /* skip */ }
      }
      showMessage(`Closed ${closed} tab${closed !== 1 ? 's' : ''}`)
      await loadTabs()
    })
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Close only displayed tabs that have at least one bookmark tag.
  if (closeTaggedBtn) {
    closeTaggedBtn.addEventListener('click', async () => {
      const displayed = getDisplayedTabs()
      const toClose = displayed.filter((t) => !t.isClosed && Array.isArray(t.bookmarkTags) && t.bookmarkTags.length > 0)
      if (toClose.length === 0) {
        showMessage('No tagged tabs to close')
        return
      }
      if (!confirm(`Close ${toClose.length} tab${toClose.length !== 1 ? 's' : ''} with tag(s)?`)) return
      const api = (typeof chrome !== 'undefined' && chrome.tabs ? chrome.tabs : null) || (typeof browser !== 'undefined' && browser.tabs ? browser.tabs : null) || chromeTabs
      let closed = 0
      for (const tab of toClose) {
        try {
          await api.remove(tab.id)
          closed++
        } catch (_) { /* skip */ }
      }
      showMessage(`Closed ${closed} tab${closed !== 1 ? 's' : ''}`)
      await loadTabs()
    })
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Close only displayed tabs that have no bookmark tags.
  if (closeUntaggedBtn) {
    closeUntaggedBtn.addEventListener('click', async () => {
      const displayed = getDisplayedTabs()
      const toClose = displayed.filter((t) => !t.isClosed && (!Array.isArray(t.bookmarkTags) || t.bookmarkTags.length === 0))
      if (toClose.length === 0) {
        showMessage('No untagged tabs to close')
        return
      }
      if (!confirm(`Close ${toClose.length} tab${toClose.length !== 1 ? 's' : ''} without tags?`)) return
      const api = (typeof chrome !== 'undefined' && chrome.tabs ? chrome.tabs : null) || (typeof browser !== 'undefined' && browser.tabs ? browser.tabs : null) || chromeTabs
      let closed = 0
      for (const tab of toClose) {
        try {
          await api.remove(tab.id)
          closed++
        } catch (_) { /* skip */ }
      }
      showMessage(`Closed ${closed} tab${closed !== 1 ? 's' : ''}`)
      await loadTabs()
    })
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Refresh: clear hidden set and reload tab list so all tabs can reappear.
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      hiddenTabIds.clear()
      loadTabs()
    })
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Gather: move all displayed tabs into the current window.
  if (gatherBtn) {
    gatherBtn.addEventListener('click', async () => {
      const displayed = getDisplayedTabs()
      if (displayed.length === 0) {
        showMessage('No tabs to gather')
        return
      }
      const apiWindows = chromeWindows || (typeof chrome !== 'undefined' && chrome.windows ? chrome.windows : null) || (typeof browser !== 'undefined' && browser.windows ? browser.windows : null)
      const apiTabs = chromeTabs || (typeof chrome !== 'undefined' && chrome.tabs ? chrome.tabs : null) || (typeof browser !== 'undefined' && browser.tabs ? browser.tabs : null)
      if (!apiWindows || !apiTabs) {
        showMessage('Window API not available')
        return
      }
      try {
        const currentWin = await apiWindows.getCurrent()
        const currentWindowId = currentWin && currentWin.id != null ? currentWin.id : null
        if (currentWindowId == null) {
          showMessage('Could not get current window')
          return
        }
        let moved = 0
        for (const tab of displayed) {
          if (tab.windowId !== currentWindowId) {
            try {
              await apiTabs.move(tab.id, { windowId: currentWindowId, index: -1 })
              moved++
            } catch (_) { /* skip */ }
          }
        }
        if (moved > 0) showMessage(`Gathered ${moved} tab${moved !== 1 ? 's' : ''}`)
        else showMessage('All visible tabs already in this window')
        await loadTabs()
      } catch (e) {
        showMessage('Gather failed')
      }
    })
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Distribute: move each displayed tab into its own window (skip if already only tab in window).
  if (distributeBtn) {
    distributeBtn.addEventListener('click', async () => {
      const displayed = getDisplayedTabs()
      if (displayed.length === 0) {
        showMessage('No tabs to distribute')
        return
      }
      const apiWindows = chromeWindows || (typeof chrome !== 'undefined' && chrome.windows ? chrome.windows : null) || (typeof browser !== 'undefined' && browser.windows ? browser.windows : null)
      const apiTabs = chromeTabs || (typeof chrome !== 'undefined' && chrome.tabs ? chrome.tabs : null) || (typeof browser !== 'undefined' && browser.tabs ? browser.tabs : null)
      if (!apiWindows || !apiTabs) {
        showMessage('Window API not available')
        return
      }
      try {
        let distributed = 0
        for (const tab of displayed) {
          try {
            const tabsInWindow = await apiTabs.query({ windowId: tab.windowId })
            if (tabsInWindow && tabsInWindow.length > 1) {
              await apiWindows.create({ tabId: tab.id })
              distributed++
            }
          } catch (_) { /* skip */ }
        }
        if (distributed > 0) showMessage(`Distributed ${distributed} tab${distributed !== 1 ? 's' : ''}`)
        else showMessage('All visible tabs already in their own window')
        await loadTabs()
      } catch (_) {
        showMessage('Distribute failed')
      }
    })
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Persist important-tag sources on blur; load from storage on init; always use textbox value (or default when empty)
  const storage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local ? chrome.storage.local : (typeof browser !== 'undefined' && browser.storage && browser.storage.local ? browser.storage.local : null)
  if (storage) {
    storage.get([STORAGE_KEY_IMPORTANT_TAG_SOURCES]).then((obj) => {
      if (importantTagSourcesInput) {
        const val = obj && obj[STORAGE_KEY_IMPORTANT_TAG_SOURCES]
        if (typeof val === 'string' && val.trim() !== '') importantTagSourcesInput.value = val.trim()
        else importantTagSourcesInput.value = DEFAULT_IMPORTANT_TAG_SOURCES
      }
    }).catch(() => {
      if (importantTagSourcesInput) importantTagSourcesInput.value = DEFAULT_IMPORTANT_TAG_SOURCES
    })
    if (importantTagSourcesInput) {
      importantTagSourcesInput.addEventListener('blur', () => {
        const val = importantTagSourcesInput.value.trim()
        storage.set({ [STORAGE_KEY_IMPORTANT_TAG_SOURCES]: val || DEFAULT_IMPORTANT_TAG_SOURCES }).catch(() => {})
      })
    }
  } else {
    if (importantTagSourcesInput) importantTagSourcesInput.value = DEFAULT_IMPORTANT_TAG_SOURCES
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Batch bookmark actions: set to-read (create if missing), clear to-read (skip if no bookmark), add tags (create if missing).
  const runtime = typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime : (typeof browser !== 'undefined' && browser.runtime ? browser.runtime : null)
  function sendMessage (msg) {
    if (!runtime || !runtime.sendMessage) return Promise.reject(new Error('No runtime'))
    return new Promise((resolve, reject) => {
      runtime.sendMessage(msg, (r) => {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError?.message))
        else resolve(r)
      })
    })
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] After batch bookmark actions, re-query getCurrentBookmark for each tab so tags and to-read/private icons match storage
  async function refreshBookmarkDisplayForAllTabs () {
    if (!runtime || !runtime.sendMessage) {
      applyFilter()
      return
    }
    await Promise.all(allTabs.map(async (tab) => {
      const url = (tab.url ?? '').trim()
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        mergeBookmarkReplyIntoTab(tab, { success: false })
        return
      }
      try {
        const reply = await sendMessage({ type: 'getCurrentBookmark', data: { url: tab.url, title: tab.title } })
        mergeBookmarkReplyIntoTab(tab, reply)
      } catch (_) {
        mergeBookmarkReplyIntoTab(tab, { success: false })
      }
    }))
    applyFilter()
  }

  if (setToReadBtn) {
    setToReadBtn.addEventListener('click', async () => {
      const displayed = getDisplayedTabs()
      if (displayed.length === 0) return
      const buttons = [setToReadBtn, clearToReadBtn, addTagsBtn].filter(Boolean)
      buttons.forEach(b => { b.disabled = true })
      let ok = 0
      for (const tab of displayed) {
        const tabUrl = (tab.url ?? '').trim()
        if (!tabUrl.startsWith('http://') && !tabUrl.startsWith('https://')) continue
        try {
          const reply = await sendMessage({ type: 'getCurrentBookmark', data: { url: tabUrl, title: tab.title } })
          if (!reply || !reply.success || !reply.data || reply.data.blocked) continue
          if (reply.data.exists && reply.data.url) {
            // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Preserve existing tags (and other fields); API may replace bookmark if we only send toread.
            const res = await sendMessage({
              type: 'saveBookmark',
              data: { ...reply.data, toread: 'yes' }
            })
            if (res && res.success) ok++
          } else {
            const urlToSave = (reply.data && reply.data.url) || tabUrl
            if (!urlToSave) continue
            const res = await sendMessage({
              type: 'saveBookmark',
              data: {
                url: urlToSave,
                description: (tab.title ?? '').trim() || urlToSave,
                tags: [],
                toread: 'yes',
                preferredBackend: 'local'
              }
            })
            if (res && res.success) ok++
          }
        } catch (_) { /* skip */ }
      }
      await refreshBookmarkDisplayForAllTabs()
      buttons.forEach(b => { b.disabled = false })
      showMessage(`Set to-read for ${ok} tab${ok !== 1 ? 's' : ''}`)
    })
  }

  if (clearToReadBtn) {
    clearToReadBtn.addEventListener('click', async () => {
      const displayed = getDisplayedTabs()
      if (displayed.length === 0) return
      const buttons = [setToReadBtn, clearToReadBtn, addTagsBtn].filter(Boolean)
      buttons.forEach(b => { b.disabled = true })
      let ok = 0
      for (const tab of displayed) {
        try {
          const reply = await sendMessage({ type: 'getCurrentBookmark', data: { url: tab.url, title: tab.title } })
          if (reply && reply.success && reply.data && !reply.data.blocked && reply.data.exists) {
            const res = await sendMessage({
              type: 'saveBookmark',
              data: { ...reply.data, toread: 'no' }
            })
            if (res && res.success) ok++
          }
        } catch (_) { /* skip */ }
      }
      await refreshBookmarkDisplayForAllTabs()
      buttons.forEach(b => { b.disabled = false })
      showMessage(`Cleared to-read for ${ok} tab${ok !== 1 ? 's' : ''}`)
    })
  }

  if (addTagsBtn && tagsInput) {
    addTagsBtn.addEventListener('click', async () => {
      const newTags = parseTagsInput(tagsInput.value)
      if (newTags.length === 0) return
      const displayed = getDisplayedTabs()
      if (displayed.length === 0) return
      const buttons = [setToReadBtn, clearToReadBtn, addTagsBtn].filter(Boolean)
      buttons.forEach(b => { b.disabled = true })
      let ok = 0
      for (const tab of displayed) {
        const tabUrl = (tab.url ?? '').trim()
        if (!tabUrl.startsWith('http://') && !tabUrl.startsWith('https://')) continue
        try {
          const reply = await sendMessage({ type: 'getCurrentBookmark', data: { url: tabUrl, title: tab.title } })
          if (reply && reply.success && reply.data && !reply.data.blocked && reply.data.url) {
            if (reply.data.exists) {
              const payload = buildAddTagsPayload(reply.data, newTags)
              if (payload) {
                const res = await sendMessage({ type: 'saveBookmark', data: payload })
                if (res && res.success) ok++
              }
            } else {
              // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Use reply.data.url so we never send empty url (handler resolves targetUrl; tab.url may be empty for some tabs).
              const urlToSave = (reply.data && reply.data.url) || tabUrl
              if (!urlToSave) continue
              const res = await sendMessage({
                type: 'saveBookmark',
                data: {
                  url: urlToSave,
                  description: (tab.title ?? '').trim() || urlToSave,
                  tags: newTags,
                  preferredBackend: 'local'
                }
              })
              if (res && res.success) ok++
            }
          }
        } catch (e) {
          // ignore per-tab errors
        }
      }
      await refreshBookmarkDisplayForAllTabs()
      buttons.forEach(b => { b.disabled = false })
      tagsInput.value = ''
      showMessage(`Added tags for ${ok} tab${ok !== 1 ? 's' : ''}`)
    })
  }

  loadTabs()
}

function escapeHtml (s) {
  const div = typeof document !== 'undefined' && document.createElement ? document.createElement('div') : null
  if (div) {
    div.textContent = s
    return div.innerHTML
  }
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
