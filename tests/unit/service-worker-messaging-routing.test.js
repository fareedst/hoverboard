/**
 * === IMPL-FULL-BLOCK: IMPL-MESSAGE_HANDLING ===
 * [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-RECENT_TAGS_SYSTEM] [ARCH-TAG_SYSTEM] — Central message allowlist + validation + handler dispatch; recent-tag message types delegate to [IMPL-TAG_SYSTEM] TagService and SW recentTagsMemory policy per ARCH-TAG_SYSTEM. Contract: Promise result or reject on validation; recent handlers return safe shapes on internal failure.
 * 
 * ## SEND
 * 
 * - [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] How: client-side validate type/payload; dispatch to background; return Promise (path for popup/content/offscreen callers).
 * - Contract:
 *   - INPUT: message { type, payload/data }; sender (tab/popup/background)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: SEND
 *   - VALIDATE message.type in allowlist
 *   - VALIDATE payload shape
 *   - ROUTE to handler for message.type
 *   - handler(message) -> result; RETURN Promise.resolve(result)
 *   - ON error: RETURN Promise.reject; optional log
 * 
 * ## UNWRAP_MESSAGE_RESPONSE
 * 
 * - [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-UI_INSPECTION] How: shared null-tolerant unwrap for runtime replies (src/shared/message-response.js), because any extension context can win the response-channel race and answer null (Chrome 144+ promise-returning listeners / observer listeners that return promises). Callers must not dereference response.success. Observer BOOKMARK_UPDATED paths are IMPL-BOOKMARK_STATE_SYNC OBSERVER_BOOKMARK_UPDATED_APPLY_EXTERNAL and IMPL-POPUP_SESSION OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH.
 * - Contract:
 *   - INPUT: response from runtime.sendMessage — { success, data } wrapper, plain payload, or null/undefined missing response; optional type + surface for readMessageResponse
 *   - PRE: caller awaited the send and handled thrown transport errors separately
 *   - OUTPUT: unwrapMessageResponse -> payload | null; isMissingMessageResponse -> boolean; readMessageResponse -> payload | null (records messageResponseMissing when missing)
 *   - POST:
 *     - success => wrapper returns response.data; non-wrapper object returns response as-is
 *     - missing response => returns null; readMessageResponse records messageResponseMissing; caller keeps defaults
 *   - FAILURE_MODES: none (total, no throw)
 *   - DATA: src/shared/message-response.js; callers in content-main (getTabId, getOptions, getCurrentBookmark)
 *   - EFFECTS: pure for unwrap/isMissing; State when readMessageResponse records inspector action
 *   - TERMINATION: total
 * - PROCEDURE: UNWRAP_MESSAGE_RESPONSE
 *   - IF isMissingMessageResponse(response): RETURN null
 *   - IF response is object AND 'success' in response: RETURN response.success ? response.data : response
 *   - RETURN response
 *   - How (sub-block): caller guard — missing response is observable, never a crash.
 *   - 1. CALLER: actual = readMessageResponse(response, type[, surface])
 *   - 2.   # readMessageResponse = unwrap + IF missing: recordAction messageResponseMissing; debugWarn
 *   - 3.   IF actual == null: KEEP defaults; RETURN
 * 
 * ## HANDLE_GET_RECENT_BOOKMARKS
 * 
 * - How: SW entry resolves handler by message.type; missing handler → reject or structured error per router; AWAIT handler(data, senderUrl); optional BOOKMARK_UPDATED broadcast after mutating handlers ([REQ-BOOKMARK_STATE_SYNCHRONIZATION]).
 * - Contract:
 *   - INPUT: message { type, payload/data }; sender (tab/popup/background)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_GET_RECENT_BOOKMARKS
 *   - recentTags = AWAIT tagService.getUserRecentTagsExcludingCurrent(data?.currentTags OR [])
 *   - RETURN { ...data, recentTags }
 *   - How (sub-block): How: addTagToRecent — validate tagName + currentSiteUrl; tagService.addTagToUserRecentList; structured { success } / error (same REQ/ARCH/IMPL cross-IMPL set as handleGetRecentBookmarks).
 * 
 * ## HANDLE_ADD_TAG_TO_RECENT
 * 
 * - [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-RECENT_TAGS_SYSTEM] [ARCH-TAG_SYSTEM] How: Implements handleAddTagToRecent(data) behavior for IMPL-MESSAGE_HANDLING.
 * - Contract:
 *   - INPUT: message { type, payload/data }; sender (tab/popup/background)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_ADD_TAG_TO_RECENT
 *   - VALIDATE tagName AND currentSiteUrl present
 *   - success = AWAIT tagService.addTagToUserRecentList(tagName, currentSiteUrl)
 *   - RETURN { success } OR { success: false, error: message }
 *   - How (sub-block): How: getUserRecentTags message — raw policy list for diagnostics/tools; TRY/CATCH → { recentTags: [], error } on failure.
 * 
 * ## HANDLE_GET_USER_RECENT_TAGS
 * 
 * - [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-RECENT_TAGS_SYSTEM] [ARCH-TAG_SYSTEM] How: Implements handleGetUserRecentTags(data) behavior for IMPL-MESSAGE_HANDLING.
 * - Contract:
 *   - INPUT: message { type, payload/data }; sender (tab/popup/background)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_GET_USER_RECENT_TAGS
 *   - TRY: RETURN { recentTags: AWAIT tagService.getUserRecentTags() }
 *   - CATCH: LOG; RETURN { recentTags: [], error }
 * 
 * ## BLOCK_5
 * 
 * - --- Composition: composed_with [IMPL-POPUP_MESSAGE_TIMEOUT] [IMPL-BOOKMARK_STATE_SYNC] --- How: Ordering: client send may apply timeout/retry () before this IMPL’s send completes. Post successful bookmark mutations,  may broadcast; recent-tag handlers are read/mutation for user-recent only unless caller chains. Shared DATA: single MessageHandler TagService reference; no second recentTagsMemory writer.
 * - Contract:
 *   - INPUT: message { type, payload/data }; sender (tab/popup/background)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_5
 *   - How (sub-block): --- Cross-IMPL ---
 * 
 * === END IMPL-FULL-BLOCK: IMPL-MESSAGE_HANDLING ===
 */
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
/**
 * === IMPL-FULL-BLOCK: IMPL-EXT_IDENTITY ===
 * [IMPL-EXT_IDENTITY] [ARCH-EXT_IDENTITY] [REQ-EXTENSION_IDENTITY] — How: present Hoverboard as a Chromium extension with content-script injection and Pinboard-compatible UX surfaces.
 * 
 * ## BOOTSTRAP_EXTENSION
 * 
 * - [IMPL-EXT_IDENTITY] [ARCH-EXT_IDENTITY] [REQ-EXTENSION_IDENTITY] How: MV3 entry points register once; content script bootstraps page UI when URL allowed.
 * - Contract:
 *   - INPUT: extension install/load; manifest entry points (service worker, content scripts, popup, options, side panel)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: loaded extension identity (name, permissions, entry points); content scripts on matching pages
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: manifest.json; src/core/service-worker.js; content script entry; browser API shim (IMPL-CROSS_BROWSER)
 *   - EFFECTS: Http, IO
 *   - TERMINATION: total
 * - PROCEDURE: BOOTSTRAP_EXTENSION
 *   - REGISTER service worker message listeners
 *   - ON content script load: IF URL not inhibited THEN init overlay/hover surface
 *   - EXPOSE popup / side panel / options as user-facing surfaces
 *   - RETURN
 * 
 * === END IMPL-FULL-BLOCK: IMPL-EXT_IDENTITY ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-MV3_MIGRATION ===
 * [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION] — How: keep store-compatible Manifest V3: service worker replaces background page; preserve messaging and APIs.
 * 
 * ## MV3_BACKGROUND_RUNTIME
 * 
 * - [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION] How: service worker owns listeners; async message replies use return true / Promise patterns.
 * - Contract:
 *   - INPUT: extension lifecycle events; chrome.runtime / chrome.storage / chrome.action calls
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: service-worker-backed background behavior equivalent to prior MV2 background page contracts
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: manifest_version 3; src/core/service-worker.js; ARCH-SERVICE_WORKER lifecycle patterns
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: MV3_BACKGROUND_RUNTIME
 *   - ON install/activate: init shared managers (config, tags memory, badge)
 *   - ON message: DELEGATE to MessageHandler; KEEP channel alive until AWAIT completes
 *   - ON alarm/idle as needed: wake worker for deferred work
 *   - RETURN
 * 
 * === END IMPL-FULL-BLOCK: IMPL-MV3_MIGRATION ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-SERVICE_WORKER ===
 * [IMPL-SERVICE_WORKER] [ARCH-SERVICE_WORKER] [REQ-MANIFEST_V3_MIGRATION] — How: MV3 service worker owns messaging, badge, recent-tags memory, and lifecycle wake/sleep.
 * 
 * ## SERVICE_WORKER_MAIN
 * 
 * - [IMPL-SERVICE_WORKER] [ARCH-SERVICE_WORKER] [REQ-MANIFEST_V3_MIGRATION] How: wire listeners once; delegate business logic to validated modules.
 * - Contract:
 *   - INPUT: chrome.runtime.onMessage; install/activate; alarms; port connections
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: routed handler results; badge updates; persisted recent-tags snapshot; keep-alive while async work runs
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: src/core/service-worker.js; MessageHandler; RecentTagsMemoryManager; updateBadgeForTab
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SERVICE_WORKER_MAIN
 *   - ON install/activate: AWAIT initManagers()
 *   - ON message (msg, sender, sendResponse):
 *   - result = AWAIT handleMessage(msg, sender)
 *   - sendResponse(result); RETURN true
 *   - ON alarm: AWAIT runDeferredTasks()
 *   - RETURN
 *   - How (sub-block): How: after processMessage success for bookmark/tag mutations, refresh badge.
 * 
 * ## HANDLE_MESSAGE
 * 
 * - [IMPL-SERVICE_WORKER] [ARCH-SERVICE_WORKER] [REQ-MANIFEST_V3_MIGRATION] How: Implements handleMessage(msg, sender) behavior for IMPL-SERVICE_WORKER.
 * - Contract:
 *   - INPUT: chrome.runtime.onMessage; install/activate; alarms; port connections
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: routed handler results; badge updates; persisted recent-tags snapshot; keep-alive while async work runs
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: src/core/service-worker.js; MessageHandler; RecentTagsMemoryManager; updateBadgeForTab
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_MESSAGE
 *   - result = AWAIT messageHandler.processMessage(msg, sender)
 *   - IF result.ok AND isMutation(msg.type): AWAIT updateBadgeForTab(resolveTab(sender, msg))
 *   - RETURN result
 * 
 * === END IMPL-FULL-BLOCK: IMPL-SERVICE_WORKER ===
 */
import { HoverboardServiceWorker } from '../../src/core/service-worker.js'
import { MESSAGE_TYPES } from '../../src/core/message-handler.js'

beforeEach(() => {
  global.chrome.storage.local.get.mockImplementation((keys, cb) => {
    const key = Array.isArray(keys) ? keys[0] : keys
    const result = key ? { [key]: null } : {}
    if (cb) cb(result)
    return Promise.resolve(result)
  })
  global.chrome.storage.sync.get.mockResolvedValue({})
  global.chrome.tabs.query.mockResolvedValue([])
  global.chrome.tabs.get.mockResolvedValue({ id: 1, url: 'https://example.com' })
})

describe('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] SW handleMessage routing', () => {
  test('[REQ-SIDE_PANEL_BROWSER_TABS] MESSAGE_TYPES includes GET_TAB_REFERRERS for referrer-via-SW', () => {
    expect(MESSAGE_TYPES.GET_TAB_REFERRERS).toBe('getTabReferrers')
  })

  test('[REQ-SIDE_PANEL_BROWSER_TABS] MESSAGE_TYPES includes GET_TABS_PAGE_TEXT and GET_TABS_IMPORTANT_TAGS for search scope', () => {
    expect(MESSAGE_TYPES.GET_TABS_PAGE_TEXT).toBe('getTabsPageText')
    expect(MESSAGE_TYPES.GET_TABS_IMPORTANT_TAGS).toBe('getTabsImportantTags')
  })

  test('[REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] MESSAGE_TYPES includes GET_RECENTLY_CLOSED_TABS', () => {
    expect(MESSAGE_TYPES.GET_RECENTLY_CLOSED_TABS).toBe('getRecentlyClosedTabs')
  })

  test('NATIVE_PING returns success and data and does not call processMessage', async () => {
    const sw = new HoverboardServiceWorker()
    sw.pingNativeHost = jest.fn().mockResolvedValue({ pong: true })
    const processMessageSpy = jest.spyOn(sw.messageHandler, 'processMessage')

    const result = await sw.handleMessage({ type: 'NATIVE_PING' }, {})

    expect(result).toEqual({ success: true, data: { pong: true } })
    expect(processMessageSpy).not.toHaveBeenCalled()
    processMessageSpy.mockRestore()
  })

  test('SWITCH_STORAGE_MODE returns switched and does not call processMessage', async () => {
    const sw = new HoverboardServiceWorker()
    sw._providerInitialized = true
    sw.initBookmarkProvider = jest.fn().mockResolvedValue(undefined)
    const processMessageSpy = jest.spyOn(sw.messageHandler, 'processMessage')

    const result = await sw.handleMessage({ type: MESSAGE_TYPES.SWITCH_STORAGE_MODE }, {})

    expect(result).toEqual({ success: true, data: { switched: true } })
    expect(processMessageSpy).not.toHaveBeenCalled()
    processMessageSpy.mockRestore()
  })

  test('DEV_COMMAND when debug not enabled returns error and does not call processMessage', async () => {
    const sw = new HoverboardServiceWorker()
    global.chrome.storage.local.get.mockImplementation((keys, cb) => {
      const result = { DEBUG_HOVERBOARD_UI: false }
      if (cb) cb(result)
      return Promise.resolve(result)
    })
    sw._providerInitialized = true
    const processMessageSpy = jest.spyOn(sw.messageHandler, 'processMessage')

    const result = await sw.handleMessage({ type: MESSAGE_TYPES.DEV_COMMAND, data: { subcommand: 'getStorageSnapshot' } }, {})

    expect(result).toMatchObject({ success: false, error: 'debug not enabled' })
    expect(processMessageSpy).not.toHaveBeenCalled()
    processMessageSpy.mockRestore()
  })

  test('GET_OPTIONS calls processMessage and wraps response when missing success', async () => {
    const sw = new HoverboardServiceWorker()
    sw._providerInitialized = true
    sw.messageHandler.processMessage = jest.fn().mockResolvedValue({ someOption: true })

    const result = await sw.handleMessage({ type: MESSAGE_TYPES.GET_OPTIONS }, {})

    expect(sw.messageHandler.processMessage).toHaveBeenCalledWith({ type: 'getOptions' }, {})
    expect(result).toEqual({ success: true, data: { someOption: true } })
  })

  test('when processMessage throws handleMessage returns success false and error', async () => {
    const sw = new HoverboardServiceWorker()
    sw._providerInitialized = true
    sw.messageHandler.processMessage = jest.fn().mockRejectedValue(new Error('handler failed'))

    const result = await sw.handleMessage({ type: MESSAGE_TYPES.GET_OPTIONS }, {})

    expect(result).toEqual({ success: false, error: 'handler failed' })
  })

  // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
  // Referrer fix: GET_TAB_REFERRERS is handled in SW (executeScript in tab context); does not call processMessage.
  test('GET_TAB_REFERRERS returns success and referrer map and does not call processMessage', async () => {
    const sw = new HoverboardServiceWorker()
    const processMessageSpy = jest.spyOn(sw.messageHandler, 'processMessage')
    global.chrome.scripting.executeScript.mockResolvedValue([{ result: 'https://referrer.example.com/' }])

    const result = await sw.handleMessage({
      type: MESSAGE_TYPES.GET_TAB_REFERRERS,
      data: { tabs: [{ id: 1, url: 'https://example.com' }] }
    }, {})

    expect(processMessageSpy).not.toHaveBeenCalled()
    expect(result).toEqual({ success: true, data: { 1: 'https://referrer.example.com/' } })
    processMessageSpy.mockRestore()
  })

  test('GET_TAB_REFERRERS with non-http URL sets empty referrer for that tab', async () => {
    const sw = new HoverboardServiceWorker()
    global.chrome.scripting.executeScript.mockResolvedValue([{ result: '' }])

    const result = await sw.handleMessage({
      type: MESSAGE_TYPES.GET_TAB_REFERRERS,
      data: { tabs: [{ id: 2, url: 'chrome://extensions' }, { id: 3, url: 'https://a.com' }] }
    }, {})

    expect(result.success).toBe(true)
    expect(result.data[2]).toBe('')
    expect(result.data[3]).toBeDefined()
  })

  test('[REQ-SIDE_PANEL_BROWSER_TABS] GET_TABS_PAGE_TEXT returns success and pageText map and does not call processMessage', async () => {
    const sw = new HoverboardServiceWorker()
    const processMessageSpy = jest.spyOn(sw.messageHandler, 'processMessage')
    global.chrome.scripting.executeScript.mockResolvedValue([{ result: 'Title and body text here' }])

    const result = await sw.handleMessage({
      type: MESSAGE_TYPES.GET_TABS_PAGE_TEXT,
      data: { tabs: [{ id: 1, url: 'https://example.com' }] }
    }, {})

    expect(processMessageSpy).not.toHaveBeenCalled()
    expect(result).toEqual({ success: true, data: { 1: 'Title and body text here' } })
    processMessageSpy.mockRestore()
  })

  // [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] GET_RECENTLY_CLOSED_TABS returns sessions from chrome.sessions
  test('GET_RECENTLY_CLOSED_TABS returns success and sessions data when chrome.sessions available', async () => {
    const mockSessions = [{ tab: { sessionId: 's1', title: 'Closed', url: 'https://example.com' }, lastModified: 1000 }]
    if (!global.chrome.sessions) global.chrome.sessions = {}
    global.chrome.sessions.getRecentlyClosed = jest.fn().mockResolvedValue(mockSessions)
    const sw = new HoverboardServiceWorker()
    const processMessageSpy = jest.spyOn(sw.messageHandler, 'processMessage')

    const result = await sw.handleMessage({ type: MESSAGE_TYPES.GET_RECENTLY_CLOSED_TABS }, {})

    expect(processMessageSpy).not.toHaveBeenCalled()
    expect(result).toEqual({ success: true, data: mockSessions })
    processMessageSpy.mockRestore()
  })

  test('[REQ-SIDE_PANEL_BROWSER_TABS] GET_TABS_IMPORTANT_TAGS returns success and importantTags map and does not call processMessage', async () => {
    const sw = new HoverboardServiceWorker()
    const processMessageSpy = jest.spyOn(sw.messageHandler, 'processMessage')
    global.chrome.scripting.executeScript.mockResolvedValue([{ result: 'H1 Heading Meta description' }])

    const result = await sw.handleMessage({
      type: MESSAGE_TYPES.GET_TABS_IMPORTANT_TAGS,
      data: { tabs: [{ id: 2, url: 'https://test.com' }] }
    }, {})

    expect(processMessageSpy).not.toHaveBeenCalled()
    expect(result).toEqual({ success: true, data: { 2: 'H1 Heading Meta description' } })
    processMessageSpy.mockRestore()
  })

  test('[REQ-SIDE_PANEL_BROWSER_TABS] GET_TABS_IMPORTANT_TAGS with importantTagSources passes args to executeScript', async () => {
    const sw = new HoverboardServiceWorker()
    global.chrome.scripting.executeScript.mockResolvedValue([{ result: 'Custom title only' }])

    await sw.handleMessage({
      type: MESSAGE_TYPES.GET_TABS_IMPORTANT_TAGS,
      data: {
        tabs: [{ id: 1, url: 'https://example.com' }],
        importantTagSources: ['title', 'h1']
      }
    }, {})

    expect(global.chrome.scripting.executeScript).toHaveBeenCalled()
    const call = global.chrome.scripting.executeScript.mock.calls[0][0]
    expect(call.args).toEqual([['title', 'h1']])
  })
})
