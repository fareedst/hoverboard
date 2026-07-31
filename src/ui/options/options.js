/**
 * Options Page Controller - Modern settings management
 * Handles user configuration with validation and persistence
 */

/**
 * === IMPL-FULL-BLOCK: IMPL-FILE_STORAGE_TYPED_PATH ===
 * [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] — User-typed path for file storage; Options persist path; native host read/write; initBookmarkProvider path vs picker. Contract: path input and storage; persisted path and file I/O via native host.
 *
 * ## RESOLVE_FILE_PATH
 *
 * - [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements resolveFilePath(path) behavior for IMPL-FILE_STORAGE_TYPED_PATH.
 * - Contract:
 *   - INPUT: path string (user-typed, default ~/.hoverboard); read/write requests with path
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted path in hoverboard_file_storage_path; file contents read/written via native host
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: hoverboard_file_storage_path (storage); path -> if dir then path/hoverboard-bookmarks.json else path as file
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: RESOLVE_FILE_PATH
 *   - path = expand_tilde(path)  // IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE
 *   - IF path ends with .json: RETURN path AS file
 *   - ELSE: RETURN path + "/hoverboard-bookmarks.json"
 *   - How (sub-block): Send native message to helper for read/write; return result.
 *
 * ## READ_BOOKMARKS_FILE
 *
 * - [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements readBookmarksFile(path), writeBookmarksFile(path, data) behavior for IMPL-FILE_STORAGE_TYPED_PATH.
 * - Contract:
 *   - INPUT: path string (user-typed, default ~/.hoverboard); read/write requests with path
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted path in hoverboard_file_storage_path; file contents read/written via native host
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: hoverboard_file_storage_path (storage); path -> if dir then path/hoverboard-bookmarks.json else path as file
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: READ_BOOKMARKS_FILE
 *   - path = resolveFilePath(path)
 *   - SEND native message (type, path) to helper; helper reads/writes file; RETURN result
 *   - How (sub-block): Prefer path adapter when path set; else picker adapter.
 *
 * ## INIT_BOOKMARK_PROVIDER
 *
 * - [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements initBookmarkProvider() behavior for IMPL-FILE_STORAGE_TYPED_PATH.
 * - Contract:
 *   - INPUT: path string (user-typed, default ~/.hoverboard); read/write requests with path
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted path in hoverboard_file_storage_path; file contents read/written via native host
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: hoverboard_file_storage_path (storage); path -> if dir then path/hoverboard-bookmarks.json else path as file
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: INIT_BOOKMARK_PROVIDER
 *   - IF path set in storage: USE NativeHostFileBookmarkAdapter(path)
 *   - ELSE IF picker configured: USE MessageFileBookmarkAdapter
 *
 * === END IMPL-FULL-BLOCK: IMPL-FILE_STORAGE_TYPED_PATH ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX ===
 * [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] — Index page: getAggregatedBookmarksForIndex (fallback getLocalBookmarksForIndex), filter pipeline, table with Storage column; Stores L/F/S/B. Contract: page load and user actions; displayed table and filtered list; state data.
 *
 * ## LOAD_LOCAL_BOOKMARKS_INDEX
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] How: LOAD_LOCAL_BOOKMARKS_INDEX: aggregate first; treat error/success:false as failure even when bookmarks is []; then filter.
 * - Contract:
 *   - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: LOAD_LOCAL_BOOKMARKS_INDEX
 *   - SEND getAggregatedBookmarksForIndex
 *   - IF response has error OR success is false OR bookmarks is not an array:
 *   - SEND getLocalBookmarksForIndex
 *   - SET allBookmarks = response.bookmarks with storage "local"
 *   - ELSE:
 *   - SET allBookmarks = response.bookmarks (each item has storage "local"|"file"|"sync"|"browser")
 *   - applySearchAndFilter()
 *   - 1. ON page load:
 *   - LOAD_LOCAL_BOOKMARKS_INDEX
 *
 * ## SHOULD_RELOAD_BOOKMARKS_ON_STORE_CHANGE
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: Store checkbox change refilters; if cache empty and at least one store checked, reload (cold SW recovery).
 * - Contract:
 *   - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SHOULD_RELOAD_BOOKMARKS_ON_STORE_CHANGE
 *   - RETURN allBookmarksLength == 0 AND allowedStoresSize > 0
 *
 * ## GET_ALLOWED_STORES
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] How: getAllowedStores includes browser when #store-browser checked; Move/Import-to targets include browser.
 * - Contract:
 *   - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_ALLOWED_STORES
 *   - SET from checked #store-local|#store-file|#store-sync|#store-browser → { local, file, sync, browser }
 *   - How (sub-block): Apply stores filter, search, show-only, exclude tags; sort and render.
 *
 * ## APPLY_SEARCH_AND_FILTER
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] How: Implements applySearchAndFilter() behavior for IMPL-LOCAL_BOOKMARKS_INDEX.
 * - Contract:
 *   - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_SEARCH_AND_FILTER
 *   - filteredBookmarks = allBookmarks
 *   - APPLY stores filter (matchStoresFilter, getAllowedStores)
 *   - APPLY search (text)
 *   - APPLY show-only (tags, toread, private, time range; getShowOnlyDefaultState for Clear)
 *   - APPLY exclude tags (matchExcludeTags)
 *   - SORT by sortKey (e.g. time desc)
 *   - renderTableBody(filteredBookmarks); updateRowCount()
 *
 * ## BULK_DELETE
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-BOOKMARK_ROUTER] How: Bulk Delete uses row Storage column as preferredBackend; pending/final #delete-result mirrors Import status UX. Orchestrator: runBulkDelete (bookmarks-table-bulk-delete.js) for composition-testable wiring.
 * - Contract:
 *   - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: BULK_DELETE
 *   - IF selectedUrls empty: RETURN
 *   - runBulkDelete(urls, bookmarksByUrl, sendMessage, confirmFn, #delete-result, onAfterDelete):
 *   - titles = descriptions for selected URLs from bookmarksByUrl
 *   - IF NOT confirmFn(buildDeleteConfirmMessage(count, titles)): RETURN cancelled
 *   - setDeleteResultPending(#delete-result)  # "Deleting…" warning color
 *   - FOR each url IN urls:
 *   - bookmark = lookup url in bookmarksByUrl
 *   - payload = buildDeletePayload(bookmark)  # { url, preferredBackend from storage }
 *   - SEND deleteBookmark with data = payload
 *   - COUNT ok / fail from response
 *   - onAfterDelete()  # CLEAR selectedUrls; loadBookmarks(); updateMoveControlsState()
 *   - setDeleteResultFinal(#delete-result, formatDeleteResultMessage({ deleted: ok, failed: fail }))
 *   - How (sub-block): buildDeletePayload(bookmark):
 *   - IF bookmark missing or no url: RETURN null
 *   - RETURN { url: bookmark.url, preferredBackend: lowercase(bookmark.storage) OR "local" }
 *
 * ## OPEN_BOOKMARKS_INDEX_TAB
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: concurrent cold-start messages share one in-flight initBookmarkProvider promise (createProviderInitMutex). OPEN_BOOKMARKS_INDEX_TAB: create index tab then dismiss already-open side panel (tab-create only; not page refresh). How: SW owns create+broadcast so popup/command/menu share one path; panel closes via REQUEST_SIDE_PANEL_CLOSE (icon-toggle semantics).
 * - Contract:
 *   - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: OPEN_BOOKMARKS_INDEX_TAB
 *   - url = runtime.getURL('src/ui/bookmarks-table/bookmarks-table.html')
 *   - tabs.create({ url })
 *   - runtime.sendMessage({ type: REQUEST_SIDE_PANEL_CLOSE })
 *   - How (sub-block): Entry points that call OPEN_BOOKMARKS_INDEX_TAB (not options href):
 *   - 1. ON OPEN_BOOKMARKS_INDEX message: OPEN_BOOKMARKS_INDEX_TAB
 *   - 2. ON command open-bookmarks-index: OPEN_BOOKMARKS_INDEX_TAB
 *   - 3. ON context menu hoverboard-open-bookmarks-index: OPEN_BOOKMARKS_INDEX_TAB
 *   - 4. Popup: bookmarksIndexBtn -> openBookmarksIndex -> SEND OPEN_BOOKMARKS_INDEX
 *   - 5. Options: bookmarks-index-link href -> extension URL (no dismiss; out of scope)
 *   - How (sub-block): Index page init must NOT send REQUEST_SIDE_PANEL_CLOSE (refresh must not re-dismiss after icon reopen).
 *
 * === END IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-AI_TAG_TEST ===
 * [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] — Minimal API request to verify key; return { ok } or { ok, error }; used by Options and Popup Test button.
 *
 * ## TEST_AI_API_KEY
 *
 * - [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] How: Implements testAiApiKey(apiKey, provider) behavior for IMPL-AI_TAG_TEST.
 * - Contract:
 *   - INPUT: apiKey (string), provider ('openai' | 'gemini')
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: { ok: boolean, error?: string } | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: Http
 *   - TERMINATION: total
 * - PROCEDURE: TEST_AI_API_KEY
 *   - IF !apiKey or !provider RETURN { ok: false, error: 'Missing key or provider' }
 *   - IF provider === 'openai':
 *   - res = fetch('https://api.openai.com/v1/models', { headers: { Authorization: 'Bearer ' + apiKey } })
 *   - IF res.ok RETURN { ok: true }
 *   - IF res.status === 401 or 403 RETURN { ok: false, error: 'Invalid API key' }
 *   - RETURN { ok: false, error: res.statusText or 'Request failed' }
 *   - IF provider === 'gemini':
 *   - res = fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey)
 *   - IF res.ok RETURN { ok: true }
 *   - IF res.status === 400 or 403 RETURN { ok: false, error: 'Invalid API key' }
 *   - RETURN { ok: false, error: res.statusText or 'Request failed' }
 *   - RETURN { ok: false, error: 'Unknown provider' }
 *
 * === END IMPL-FULL-BLOCK: IMPL-AI_TAG_TEST ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-ICON_CLICK_BEHAVIOR ===
 * [IMPL-ICON_CLICK_BEHAVIOR] [ARCH-ICON_CLICK_BEHAVIOR] [REQ-ICON_CLICK_BEHAVIOR] — Icon click opens side panel (default) or popup; when side panel, click toggles (close if already open).
 *
 * ## _SEED_ICON_CLICK_PREFERENCE_CACHE
 *
 * - [REQ-ICON_CLICK_BEHAVIOR] [ARCH-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] How: Manifest: no default_popup so onClicked fires. Config: iconClickOpensSidePanel default true; schema optional boolean. Options: toggle bound to iconClickOpensSidePanel; load and save with other settings. SW: cache preference so handler stays synchronous (user gesture required for sidePanel.open).
 * - Contract:
 *   - INPUT: user clicks extension toolbar icon
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel opens or closes (toggle) when option enabled; else popup opens
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: SW _iconClickOpensSidePanel (cached), _sidePanelWindowId; panel _sidePanelLoadTime; MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: _SEED_ICON_CLICK_PREFERENCE_CACHE
 *   - getConfig().then(c => this._iconClickOpensSidePanel = c.iconClickOpensSidePanel)
 *   - storage.onChanged.addListener(changes, areaName => IF areaName === 'local' AND changes.hoverboard_settings THEN getConfig().then(...))
 *
 * ## HANDLE_ACTION_CLICK
 *
 * - [REQ-ICON_CLICK_BEHAVIOR] [ARCH-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] How: SW: listener passes tab from Chrome into handleActionClick(tab). SW handleActionClick(tab): prefer clicked window; Chrome requires sidePanel.open() in same synchronous user-gesture stack.
 * - Contract:
 *   - INPUT: user clicks extension toolbar icon
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel opens or closes (toggle) when option enabled; else popup opens
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: SW _iconClickOpensSidePanel (cached), _sidePanelWindowId; panel _sidePanelLoadTime; MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_ACTION_CLICK
 *   - openSidePanel = (this._iconClickOpensSidePanel !== false)
 *   - IF NOT openSidePanel: action.openPopup(); RETURN
 *   - IF NOT sidePanel.open available: action.openPopup(); RETURN
 *   - How (sub-block): # [IMPL-ICON_CLICK_BEHAVIOR] Prefer clicked window: use tab from onClicked when provided, else cache.
 *   - clickedWindowId = tab?.windowId != null ? tab.windowId : null
 *   - cachedWindowId = this._sidePanelWindowId
 *   - useWindowId = clickedWindowId != null ? clickedWindowId : cachedWindowId
 *   - IF useWindowId != null:
 *   - IF clickedWindowId != null AND NOT _isRestrictedForSidePanel(tab?.url): this._sidePanelWindowId = clickedWindowId
 *   - sidePanel.open({ windowId: useWindowId }); windows.update(useWindowId, { focused: true }); sendMessage(REQUEST_SIDE_PANEL_CLOSE); RETURN
 *   - How (sub-block): # [IMPL-ICON_CLICK_BEHAVIOR] Cold start: no tab and no cache; do NOT call sidePanel.open in async callback (gesture would be lost). Seed cache for next click; open popup as fallback.
 *   - tabs.query({ active: true, currentWindow: true }, (tabs) =>
 *   - tabFromQuery = tabs?.[0]
 *   - IF tabFromQuery?.windowId != null AND NOT _isRestrictedForSidePanel(tabFromQuery.url): this._sidePanelWindowId = tabFromQuery.windowId
 *   - )
 *   - action.openPopup()
 *
 * ## BIND_TOGGLE_CLOSE_REQUEST
 *
 * - [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] How: Side panel: on REQUEST_SIDE_PANEL_CLOSE close if visible and open long enough (toggle).
 * - Contract:
 *   - INPUT: user clicks extension toolbar icon
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel opens or closes (toggle) when option enabled; else popup opens
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: SW _iconClickOpensSidePanel (cached), _sidePanelWindowId; panel _sidePanelLoadTime; MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: BIND_TOGGLE_CLOSE_REQUEST
 *   - runtime.onMessage.addListener(message =>
 *   - IF message?.type !== REQUEST_SIDE_PANEL_CLOSE RETURN
 *   - IF document.visibilityState !== 'visible' RETURN
 *   - IF (Date.now() - _sidePanelLoadTime) < 300 RETURN
 *   - window.close())
 *
 * === END IMPL-FULL-BLOCK: IMPL-ICON_CLICK_BEHAVIOR ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-AI_CONFIG_OPTIONS ===
 * [IMPL-AI_CONFIG_OPTIONS] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] — Options page exposes and persists AI API key, provider, and tag limit; load/save from config; no key = feature disabled elsewhere.
 *
 * ## LOAD_SETTINGS
 *
 * - [IMPL-AI_CONFIG_OPTIONS] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] How: Implements loadSettings() behavior for IMPL-AI_CONFIG_OPTIONS.
 * - Contract:
 *   - INPUT: user edits in options (apiKey, provider, optional limit)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted config; Test result (ok or error message) | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: LOAD_SETTINGS
 *   - settings = getStoredSettings()
 *   - SET aiApiKey input = settings.aiApiKey ?? ''
 *   - SET provider select = settings.aiProvider ?? 'openai'
 *   - SET limit input = settings.aiTagLimit ?? 64
 *   - How (sub-block): How: collect trim/number from form and persist via updateConfig.
 *
 * ## SAVE_SETTINGS
 *
 * - [IMPL-AI_CONFIG_OPTIONS] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] How: Implements saveSettings() behavior for IMPL-AI_CONFIG_OPTIONS.
 * - Contract:
 *   - INPUT: user edits in options (apiKey, provider, optional limit)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted config; Test result (ok or error message) | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_SETTINGS
 *   - settings = { aiApiKey: trim(aiApiKey input), aiProvider: provider select value, aiTagLimit: number(limit input) }
 *   - updateConfig(settings)
 *
 * ## BLOCK_3
 *
 * - [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] How: Nested block: options-page "Test API key" button; require key, call testAiApiKey(apiKey, provider), show "API key OK" or error.
 * - Contract:
 *   - INPUT: user edits in options (apiKey, provider, optional limit)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted config; Test result (ok or error message) | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_3
 *   - 1. on Test click:
 *   - 2.   apiKey = trim(aiApiKey input)
 *   - 3.   provider = provider select value
 *   - 4.   IF !apiKey THEN show error; RETURN
 *   - 5.   result = testAiApiKey(apiKey, provider)  // or send message to SW
 *   - 6.   IF result.ok THEN show success ELSE show result.error
 *
 * === END IMPL-FULL-BLOCK: IMPL-AI_CONFIG_OPTIONS ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-CONFIG_MIGRATION ===
 * [IMPL-CONFIG_MIGRATION] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] — Auth token in sync storage; getAuthToken, setAuthToken, hasAuth, getAuthParam; options save writes token.
 *
 * ## GET_AUTH_TOKEN
 *
 * - [IMPL-CONFIG_MIGRATION] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] How: Implements getAuthToken() behavior for IMPL-CONFIG_MIGRATION.
 * - Contract:
 *   - INPUT: token string (setAuthToken); none (getAuthToken, hasAuth, getAuthParam)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: token or null (getAuthToken); boolean (hasAuth); param value (getAuthParam)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: auth stored in sync storage; default config (retry settings)
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_AUTH_TOKEN
 *   - TRY LOAD auth from sync storage
 *   - RETURN token or null
 *
 * ## SET_AUTH_TOKEN
 *
 * - [IMPL-CONFIG_MIGRATION] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] How: Implements setAuthToken(token) behavior for IMPL-CONFIG_MIGRATION.
 * - Contract:
 *   - INPUT: token string (setAuthToken); none (getAuthToken, hasAuth, getAuthParam)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: token or null (getAuthToken); boolean (hasAuth); param value (getAuthParam)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: auth stored in sync storage; default config (retry settings)
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: SET_AUTH_TOKEN
 *   - WRITE token to sync storage (auth key)
 *
 * ## HAS_AUTH
 *
 * - [IMPL-CONFIG_MIGRATION] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] How: Implements hasAuth() behavior for IMPL-CONFIG_MIGRATION.
 * - Contract:
 *   - INPUT: token string (setAuthToken); none (getAuthToken, hasAuth, getAuthParam)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: token or null (getAuthToken); boolean (hasAuth); param value (getAuthParam)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: auth stored in sync storage; default config (retry settings)
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: HAS_AUTH
 *   - RETURN getAuthToken() !== null
 *
 * ## GET_AUTH_PARAM
 *
 * - [IMPL-CONFIG_MIGRATION] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] How: Implements getAuthParam(name) behavior for IMPL-CONFIG_MIGRATION.
 * - Contract:
 *   - INPUT: token string (setAuthToken); none (getAuthToken, hasAuth, getAuthParam)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: token or null (getAuthToken); boolean (hasAuth); param value (getAuthParam)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: auth stored in sync storage; default config (retry settings)
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_AUTH_PARAM
 *   - LOAD default config or stored config
 *   - RETURN value for name (e.g. retry count)
 *   - How (sub-block): Read token from UI; setAuthToken(token).
 *   - 1. on save settings (options UI):
 *   - READ token from UI
 *   - setAuthToken(token)
 *
 * === END IMPL-FULL-BLOCK: IMPL-CONFIG_MIGRATION ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-LOCAL_QUERY_API ===
 * [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] — Localhost HTTP API over File bookmarks + optional aggregate-snapshot; bearer token; 127.0.0.1 only; extension REFRESH_API_SNAPSHOT.
 *
 * ## Auth and bind
 *
 * - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: Bind loopback only; require Bearer token from api-token file.
 * - Contract:
 *   - INPUT: installDir, port, request Authorization header
 *   - PRE: token file exists or generated on first start
 *   - OUTPUT: authorized request proceeds | { error: Unauthorized | ForbiddenBind }
 *   - POST:
 *     - success => listen address is 127.0.0.1:port
 *     - error Unauthorized => HTTP 401
 *   - FAILURE_MODES: Unauthorized, ForbiddenBind
 *   - EFFECTS: IO, Http
 *   - TERMINATION: may_diverge (HTTP server loop — intentional)
 * - PROCEDURE: ENSURE_TOKEN_AND_LISTEN
 *   - 1. IF api-token missing THEN generate random token; WRITE installDir/api-token
 *   - 2. LISTEN only on 127.0.0.1:port
 *   - 3. ON each request: IF Authorization != "Bearer "+token THEN 401
 *
 * ## Load bookmarks (File or snapshot)
 *
 * - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: Prefer aggregate-snapshot.json when present; else hoverboard-bookmarks.json version-1 shape.
 * - Contract:
 *   - INPUT: bookmarksFilePath, snapshotFilePath
 *   - PRE: paths may be missing
 *   - OUTPUT: list of bookmark objects | empty list
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: LOAD_BOOKMARKS
 *   - 1. IF aggregate-snapshot.json exists THEN TRY PARSE snapshot.bookmarks; RETURN list
 *   - 2. IF hoverboard-bookmarks.json missing THEN RETURN []
 *   - 3. PARSE JSON { version, bookmarks: map url -> pin }
 *   - 4. RETURN values as array (default storage "file")
 *
 * ## List and filter
 *
 * - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: GET /v1/bookmarks with q, tag, url filters.
 * - Contract:
 *   - INPUT: bookmarks[], query params q, tag, url
 *   - PRE: auth passed
 *   - OUTPUT: JSON { bookmarks: [...], count }
 *   - EFFECTS: pure (filter) + Http
 *   - TERMINATION: total
 * - PROCEDURE: FILTER_BOOKMARKS
 *   - 1. IF url set THEN keep exact url match
 *   - 2. IF tag set THEN keep bookmarks whose tags contain tag (case-insensitive)
 *   - 3. IF q set THEN keep substring match on description, url, tags, extended (case-insensitive)
 *   - 4. RETURN filtered
 *
 * ## File write and delete
 *
 * - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: POST/PATCH merge pin into File JSON; DELETE by url query (File only, not snapshot).
 * - Contract:
 *   - INPUT: pin JSON (POST/PATCH) or url query (DELETE)
 *   - PRE: auth passed; url required
 *   - OUTPUT: { ok, bookmark|deleted } | HTTP 400/500
 *   - FAILURE_MODES: MissingUrl, InvalidJSON, IO
 *   - EFFECTS: IO, Http
 *   - TERMINATION: total
 * - PROCEDURE: WRITE_OR_DELETE_FILE_BOOKMARK
 *   - 1. POST/PATCH: Decode pin; IF url empty THEN 400; MERGE into hoverboard-bookmarks.json; RETURN ok
 *   - 2. DELETE: IF url query empty THEN 400; REMOVE url from File map; RETURN ok
 *
 * ## Health
 *
 * - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: GET /v1/health returns ok, source file|snapshot, bind.
 * - Contract:
 *   - INPUT: none (auth required)
 *   - OUTPUT: { ok: true, source, bind, port }
 *   - EFFECTS: Http, IO (stat snapshot)
 *   - TERMINATION: total
 * - PROCEDURE: HEALTH
 *   - 1. source = IF snapshot exists THEN "snapshot" ELSE "file"
 *   - 2. RETURN { ok: true, source, bind: "127.0.0.1", port }
 *
 * ## Build aggregate snapshot payload
 *
 * - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: Pure map from aggregated Index rows to snapshot JSON.
 * - Contract:
 *   - INPUT: bookmarks[] from getAggregatedBookmarksForIndex
 *   - OUTPUT: { version: 1, updatedAt, bookmarks: [...] }
 *   - EFFECTS: pure (clock for updatedAt)
 *   - TERMINATION: total
 * - PROCEDURE: BUILD_AGGREGATE_SNAPSHOT_PAYLOAD
 *   - 1. MAP each row to pin fields + storage; DROP rows without url
 *   - 2. RETURN { version: 1, updatedAt: now ISO, bookmarks }
 *
 * ## Refresh API snapshot (extension)
 *
 * - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: REFRESH_API_SNAPSHOT aggregates providers and writes aggregate-snapshot.json via native host.
 * - Contract:
 *   - INPUT: none (message from Index/Options)
 *   - PRE: BookmarkRouter ready; native messaging available
 *   - OUTPUT: { success, count } | { success: false, error }
 *   - FAILURE_MODES: RouterNotReady, NativeUnavailable, WriteFailed
 *   - EFFECTS: IO, Async, State
 *   - TERMINATION: total
 * - PROCEDURE: REFRESH_API_SNAPSHOT
 *   - 1. agg = handleGetAggregatedBookmarksForIndex()
 *   - 2. payload = BUILD_AGGREGATE_SNAPSHOT_PAYLOAD(agg.bookmarks)
 *   - 3. SEND native writeBookmarksFile path ~/.hoverboard/aggregate-snapshot.json data payload
 *   - 4. ON success RETURN { success: true, count: payload.bookmarks.length }
 *   - 5. ON failure RETURN { success: false, error }
 *
 * ## Index Refresh API snapshot UI
 *
 * - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: Index orchestrator runRefreshApiSnapshot (bookmarks-table-api-snapshot.js) for composition tests.
 * - Contract:
 *   - INPUT: sendMessage; resultEl
 *   - PRE: sendMessage available
 *   - OUTPUT: status text with count or error
 *   - POST:
 *     - success => resultEl shows Snapshot updated (N bookmarks)
 *     - failure => resultEl shows error; no throw to caller
 *   - FAILURE_MODES: SnapshotFailed, SendThrow
 *   - EFFECTS: Async
 *   - TERMINATION: total
 * - PROCEDURE: RUN_REFRESH_API_SNAPSHOT_UI
 *   - 1. CALL runRefreshApiSnapshot({ sendMessage, resultEl })
 *   - 2. sendMessage REFRESH_API_SNAPSHOT → SW REFRESH_API_SNAPSHOT
 *
 * === END IMPL-FULL-BLOCK: IMPL-LOCAL_QUERY_API ===
 */
import { ConfigManager } from '../../config/config-manager.js'
import { PinboardService } from '../../features/pinboard/pinboard-service.js'
import { testAiApiKey } from '../../features/ai/ai-api-test.js'

export class OptionsController {
  /**
   * @param {{ skipInit?: boolean, configManager?: ConfigManager, pinboardService?: PinboardService }} [opts]
   */
  constructor (opts = {}) {
    this.configManager = opts.configManager || new ConfigManager()
    this.pinboardService = opts.pinboardService || new PinboardService()
    this.elements = {}
    this.isLoading = false

    if (!opts.skipInit) {
      this.init()
    }
  }

  async init () {
    this.bindElements()
    if (this.elements.bookmarksIndexLink && typeof chrome !== 'undefined' && chrome.runtime) {
      this.elements.bookmarksIndexLink.href = chrome.runtime.getURL('src/ui/bookmarks-table/bookmarks-table.html')
    }
    if (this.elements.browserBookmarkImportLink && typeof chrome !== 'undefined' && chrome.runtime) {
      this.elements.browserBookmarkImportLink.href = chrome.runtime.getURL('src/ui/browser-bookmark-import/browser-bookmark-import.html')
    }
    this.attachEventListeners()
    await this.loadSettings()
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local') return
        if (changes.hoverboard_file_storage_configured || changes.hoverboard_file_storage_name) {
          this.loadFileStorageFolderName()
        }
        if (changes.hoverboard_file_storage_path && this.elements.fileStoragePath) {
          this.elements.fileStoragePath.value = changes.hoverboard_file_storage_path.newValue || '~/.hoverboard'
        }
      })
    }
  }

  bindElements () {
    // [ARCH-LOCAL_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] Storage mode
    this.elements.storageModePinboard = document.getElementById('storage-mode-pinboard')
    this.elements.storageModeLocal = document.getElementById('storage-mode-local')
    this.elements.storageModeFile = document.getElementById('storage-mode-file')
    this.elements.storageModeSync = document.getElementById('storage-mode-sync')
    this.elements.storageModeBrowser = document.getElementById('storage-mode-browser')
    this.elements.selectFileStorageFolder = document.getElementById('select-file-storage-folder')
    this.elements.fileStorageFolderName = document.getElementById('file-storage-folder-name')
    this.elements.fileStoragePath = document.getElementById('file-storage-path')
    this.elements.authSection = document.getElementById('auth-section')

    // Authentication
    this.elements.authToken = document.getElementById('auth-token')
    this.elements.testAuth = document.getElementById('test-auth')

    // [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] Single click on icon: side panel vs popup
    this.elements.iconClickOpensSidePanel = document.getElementById('icon-click-opens-side-panel')
    // [REQ-LINK_HEALTH] [IMPL-LINK_HEALTH]
    this.elements.linkHealthChecksEnabled = document.getElementById('link-health-checks-enabled')

    // Display settings
    this.elements.showHoverOnLoad = document.getElementById('show-hover-on-load')
    this.elements.hoverShowTooltips = document.getElementById('hover-show-tooltips')
    this.elements.recentPostsCount = document.getElementById('recent-posts-count')
    this.elements.showSectionLabels = document.getElementById('show-section-labels')

    // Visibility defaults
    this.elements.defaultThemeToggle = document.getElementById('default-theme-toggle')
    this.elements.defaultTransparencyEnabled = document.getElementById('default-transparency-enabled')
    this.elements.defaultBackgroundOpacity = document.getElementById('default-background-opacity')
    this.elements.visibilityPreview = document.getElementById('visibility-preview')
    this.elements.opacityValue = document.querySelector('.opacity-value')
    this.elements.opacitySetting = document.querySelector('.opacity-setting')

    // Font size settings
    this.elements.fontSizeSuggestedTags = document.getElementById('font-size-suggested-tags')
    this.elements.fontSizeLabels = document.getElementById('font-size-labels')
    this.elements.fontSizeTags = document.getElementById('font-size-tags')
    this.elements.fontSizeBase = document.getElementById('font-size-base')
    this.elements.fontSizeInputs = document.getElementById('font-size-inputs')

    // Badge settings
    this.elements.badgeNotBookmarked = document.getElementById('badge-not-bookmarked')
    this.elements.badgeNoTags = document.getElementById('badge-no-tags')
    this.elements.badgePrivate = document.getElementById('badge-private')
    this.elements.badgeToRead = document.getElementById('badge-to-read')

    // Site management
    this.elements.inhibitUrls = document.getElementById('inhibit-urls')

    // Advanced settings
    this.elements.stripUrlHash = document.getElementById('strip-url-hash')
    this.elements.autoCloseTimeout = document.getElementById('auto-close-timeout')

    // Actions
    this.elements.saveSettings = document.getElementById('save-settings')
    this.elements.resetSettings = document.getElementById('reset-settings')
    this.elements.exportSettings = document.getElementById('export-settings')
    this.elements.importSettings = document.getElementById('import-settings')
    this.elements.importFile = document.getElementById('import-file')

    // Status
    this.elements.statusMessage = document.getElementById('status-message')

    // [REQ-LOCAL_BOOKMARKS_INDEX] Local bookmarks index link
    this.elements.bookmarksIndexLink = document.getElementById('bookmarks-index-link')
    // [REQ-BROWSER_BOOKMARK_IMPORT] Browser bookmark import link
    this.elements.browserBookmarkImportLink = document.getElementById('browser-bookmark-import-link')

    // [REQ-NATIVE_HOST_WRAPPER] Native host test
    this.elements.testNativeHost = document.getElementById('test-native-host')
    this.elements.nativeHostStatus = document.getElementById('native-host-status')
    // [REQ-LOCAL_QUERY_API]
    this.elements.refreshApiSnapshotOptions = document.getElementById('refresh-api-snapshot-options')
    this.elements.apiSnapshotOptionsStatus = document.getElementById('api-snapshot-options-status')

    // [REQ-AI_TAGGING_CONFIG] [ARCH-AI_TAGGING_CONFIG] [IMPL-AI_CONFIG_OPTIONS] AI Tagging: bind API key, provider, limit, Test button, status elements.
    this.elements.aiApiKey = document.getElementById('ai-api-key')
    this.elements.aiProvider = document.getElementById('ai-provider')
    this.elements.aiTagLimit = document.getElementById('ai-tag-limit')
    // [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] Test button and status span for Options-page API key test.
    this.elements.testAiApi = document.getElementById('test-ai-api')
    this.elements.aiTestStatus = document.getElementById('ai-test-status')
  }

  attachEventListeners () {
    // [ARCH-LOCAL_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] Storage mode change: save and notify service worker
    this.elements.storageModePinboard.addEventListener('change', () => this.onStorageModeChange('pinboard'))
    this.elements.storageModeLocal.addEventListener('change', () => this.onStorageModeChange('local'))
    this.elements.storageModeFile.addEventListener('change', () => this.onStorageModeChange('file'))
    this.elements.storageModeSync?.addEventListener('change', () => this.onStorageModeChange('sync'))
    this.elements.storageModeBrowser?.addEventListener('change', () => this.onStorageModeChange('browser'))
    if (this.elements.selectFileStorageFolder) {
      this.elements.selectFileStorageFolder.addEventListener('click', () => this.selectFileStorageFolder())
    }
    if (this.elements.fileStoragePath) {
      this.elements.fileStoragePath.addEventListener('blur', () => this.persistFileStoragePath())
    }

    // Authentication
    this.elements.testAuth.addEventListener('click', () => this.testAuthentication())

    // [REQ-AI_TAGGING_CONFIG] [ARCH-AI_TAGGING_CONFIG] [IMPL-AI_CONFIG_OPTIONS] [IMPL-AI_TAG_TEST] Options-page Test button wires to testAiApiKey handler.
    if (this.elements.testAiApi) {
      this.elements.testAiApi.addEventListener('click', () => this.testAiApiKey())
    }

    // [REQ-NATIVE_HOST_WRAPPER] Native host ping test
    if (this.elements.testNativeHost) {
      this.elements.testNativeHost.addEventListener('click', () => this.testNativeHost())
    }

    // [REQ-LOCAL_QUERY_API] [IMPL-LOCAL_QUERY_API]
    if (this.elements.refreshApiSnapshotOptions) {
      this.elements.refreshApiSnapshotOptions.addEventListener('click', () => this.refreshApiSnapshot())
    }

    // Visibility defaults
    this.elements.defaultThemeToggle.addEventListener('click', () => this.toggleDefaultTheme())
    this.elements.defaultTransparencyEnabled.addEventListener('change', () => this.updateTransparencyState())
    this.elements.defaultBackgroundOpacity.addEventListener('input', () => this.updateOpacityDisplay())

    // Actions
    this.elements.saveSettings.addEventListener('click', () => this.saveSettings())
    this.elements.resetSettings.addEventListener('click', () => this.resetSettings())
    this.elements.exportSettings.addEventListener('click', () => this.exportSettings())
    this.elements.importSettings.addEventListener('click', () => this.elements.importFile.click())
    this.elements.importFile.addEventListener('change', (e) => this.importSettings(e))

    // Auto-save on input changes (debounced)
    const inputs = document.querySelectorAll('input, textarea')
    inputs.forEach(input => {
      input.addEventListener('input', this.debounce(() => this.autoSave(), 1000))
    })
  }

  async loadSettings () {
    try {
      this.setLoading(true)

      // Ensure defaults are initialized (helps with existing installations)
      await this.configManager.initializeDefaults()

      // Load configuration
      const config = await this.configManager.getConfig()
      const authToken = await this.configManager.getAuthToken()
      const inhibitUrls = await this.configManager.getInhibitUrls()

      // [ARCH-LOCAL_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-BROWSER_BOOKMARK_STORAGE] Storage mode (pinboard | local | file | sync | browser)
      const storageMode = (['local', 'file', 'sync', 'browser'].includes(config.storageMode)) ? config.storageMode : 'pinboard'
      this.elements.storageModePinboard.checked = (storageMode === 'pinboard')
      this.elements.storageModeLocal.checked = (storageMode === 'local')
      this.elements.storageModeFile.checked = (storageMode === 'file')
      if (this.elements.storageModeSync) this.elements.storageModeSync.checked = (storageMode === 'sync')
      if (this.elements.storageModeBrowser) this.elements.storageModeBrowser.checked = (storageMode === 'browser')
      this.updateAuthSectionVisibility(storageMode)
      await this.loadFileStorageFolderName()
      // [IMPL-FILE_STORAGE_TYPED_PATH] Path-based file storage: load path from storage, default ~/.hoverboard
      const pathResult = await chrome.storage.local.get('hoverboard_file_storage_path')
      if (this.elements.fileStoragePath) {
        this.elements.fileStoragePath.value = (pathResult.hoverboard_file_storage_path && pathResult.hoverboard_file_storage_path.trim()) || '~/.hoverboard'
      }

      // Populate form fields
      this.elements.authToken.value = authToken
      this.elements.showHoverOnLoad.checked = config.showHoverOnPageLoad
      this.elements.hoverShowTooltips.checked = config.hoverShowTooltips
      this.elements.recentPostsCount.value = config.initRecentPostsCount
      this.elements.showSectionLabels.checked = config.uxShowSectionLabels

      this.elements.badgeNotBookmarked.value = config.badgeTextIfNotBookmarked
      this.elements.badgeNoTags.value = config.badgeTextIfBookmarkedNoTags
      this.elements.badgePrivate.value = config.badgeTextIfPrivate
      this.elements.badgeToRead.value = config.badgeTextIfQueued

      this.elements.inhibitUrls.value = inhibitUrls.join('\n')

      this.elements.stripUrlHash.checked = config.uxUrlStripHash
      this.elements.autoCloseTimeout.value = config.uxAutoCloseTimeout

      // Load visibility defaults
      this.elements.defaultTransparencyEnabled.checked = config.defaultTransparencyEnabled
      this.elements.defaultBackgroundOpacity.value = config.defaultBackgroundOpacity

      // Load font size settings
      this.elements.fontSizeSuggestedTags.value = config.fontSizeSuggestedTags || 10
      this.elements.fontSizeLabels.value = config.fontSizeLabels || 12
      this.elements.fontSizeTags.value = config.fontSizeTags || 12
      this.elements.fontSizeBase.value = config.fontSizeBase || 14
      this.elements.fontSizeInputs.value = config.fontSizeInputs || 14

      // [REQ-AI_TAGGING_CONFIG] [ARCH-AI_TAGGING_CONFIG] [IMPL-AI_CONFIG_OPTIONS] Load aiApiKey, aiProvider, aiTagLimit from config into form (populate from stored config).
      if (this.elements.aiApiKey) this.elements.aiApiKey.value = config.aiApiKey || ''
      if (this.elements.aiProvider) this.elements.aiProvider.value = config.aiProvider || 'openai'
      if (this.elements.aiTagLimit) this.elements.aiTagLimit.value = config.aiTagLimit || 64

      // [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] Load icon click behavior; default true (side panel)
      if (this.elements.iconClickOpensSidePanel) {
        this.elements.iconClickOpensSidePanel.checked = config.iconClickOpensSidePanel !== false
      }
      // [REQ-LINK_HEALTH] [IMPL-LINK_HEALTH] Load opt-in; default false
      if (this.elements.linkHealthChecksEnabled) {
        this.elements.linkHealthChecksEnabled.checked = config.linkHealthChecksEnabled === true
      }

      // Update visibility UI
      this.currentTheme = config.defaultVisibilityTheme
      this.updateThemeDisplay()
      this.updateTransparencyState()
      this.updateOpacityDisplay()
      this.updateVisibilityPreview()

      this.showStatus('Settings loaded successfully', 'success')
    } catch (error) {
      console.error('Failed to load settings:', error)
      this.showStatus('Failed to load settings: ' + error.message, 'error')
    } finally {
      this.setLoading(false)
    }
  }

  async saveSettings () {
    try {
      this.setLoading(true)

      // Validate inputs
      const validation = this.validateInputs()
      if (!validation.valid) {
        this.showStatus(validation.message, 'error')
        return
      }

      // Collect settings [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-BROWSER_BOOKMARK_STORAGE] pinboard | local | file | sync | browser
      const storageMode = this.getSelectedStorageModeFromRadios()
      const settings = {
        storageMode,
        showHoverOnPageLoad: this.elements.showHoverOnLoad.checked,
        hoverShowTooltips: this.elements.hoverShowTooltips.checked,
        initRecentPostsCount: parseInt(this.elements.recentPostsCount.value),
        uxShowSectionLabels: this.elements.showSectionLabels.checked,

        badgeTextIfNotBookmarked: this.elements.badgeNotBookmarked.value,
        badgeTextIfBookmarkedNoTags: this.elements.badgeNoTags.value,
        badgeTextIfPrivate: this.elements.badgePrivate.value,
        badgeTextIfQueued: this.elements.badgeToRead.value,

        uxUrlStripHash: this.elements.stripUrlHash.checked,
        uxAutoCloseTimeout: parseInt(this.elements.autoCloseTimeout.value),

        // Visibility defaults
        defaultVisibilityTheme: this.currentTheme,
        defaultTransparencyEnabled: this.elements.defaultTransparencyEnabled.checked,
        defaultBackgroundOpacity: parseInt(this.elements.defaultBackgroundOpacity.value),

        // Font size settings
        fontSizeSuggestedTags: parseInt(this.elements.fontSizeSuggestedTags.value),
        fontSizeLabels: parseInt(this.elements.fontSizeLabels.value),
        fontSizeTags: parseInt(this.elements.fontSizeTags.value),
        fontSizeBase: parseInt(this.elements.fontSizeBase.value),
        fontSizeInputs: parseInt(this.elements.fontSizeInputs.value),

        // [REQ-AI_TAGGING_CONFIG] [ARCH-AI_TAGGING_CONFIG] [IMPL-AI_CONFIG_OPTIONS] Persist trimmed apiKey, provider, clamped aiTagLimit via updateConfig.
        aiApiKey: this.elements.aiApiKey ? this.elements.aiApiKey.value.trim() : '',
        aiProvider: this.elements.aiProvider ? this.elements.aiProvider.value : 'openai',
        aiTagLimit: this.elements.aiTagLimit ? Math.min(128, Math.max(1, parseInt(this.elements.aiTagLimit.value) || 64)) : 64,

        // [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] Single click on icon: side panel (true) or popup (false)
        iconClickOpensSidePanel: this.elements.iconClickOpensSidePanel ? this.elements.iconClickOpensSidePanel.checked : true,
        // [REQ-LINK_HEALTH] [IMPL-LINK_HEALTH] Privacy-first opt-in for Index link checks
        linkHealthChecksEnabled: this.elements.linkHealthChecksEnabled
          ? this.elements.linkHealthChecksEnabled.checked
          : false
      }

      // Save configuration
      await this.configManager.updateConfig(settings)

      // [IMPL-CONFIG_MIGRATION] Save auth token (empty value clears token and disables Pinboard)
      const authToken = this.elements.authToken.value.trim()
      await this.configManager.setAuthToken(authToken)

      // Save inhibit URLs
      const inhibitUrls = this.elements.inhibitUrls.value
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0)

      // Save the inhibit URLs using ConfigManager
      await this.configManager.setInhibitUrls(inhibitUrls)

      // [IMPL-FILE_STORAGE_TYPED_PATH] Persist file storage path and set configured when file mode and path non-empty
      const path = this.elements.fileStoragePath ? this.elements.fileStoragePath.value.trim() : ''
      const pathToSave = path || '~/.hoverboard'
      await chrome.storage.local.set({
        hoverboard_file_storage_path: pathToSave,
        ...(storageMode === 'file' && pathToSave ? { hoverboard_file_storage_configured: true } : {})
      })

      this.showStatus('Settings saved successfully!', 'success')
    } catch (error) {
      console.error('Failed to save settings:', error)
      this.showStatus('Failed to save settings: ' + error.message, 'error')
    } finally {
      this.setLoading(false)
    }
  }

  async resetSettings () {
    if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      return
    }

    try {
      this.setLoading(true)

      await this.configManager.resetToDefaults()
      await this.loadSettings()

      this.showStatus('Settings reset to defaults', 'success')
    } catch (error) {
      console.error('Failed to reset settings:', error)
      this.showStatus('Failed to reset settings: ' + error.message, 'error')
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * [ARCH-LOCAL_STORAGE_PROVIDER] Update auth section visibility based on storage mode.
   * @param {string} mode - 'pinboard' or 'local'
   */
  async loadFileStorageFolderName () {
    if (!this.elements.fileStorageFolderName) return
    try {
      const result = await chrome.storage.local.get(['hoverboard_file_storage_configured', 'hoverboard_file_storage_name'])
      if (result.hoverboard_file_storage_configured && result.hoverboard_file_storage_name) {
        this.elements.fileStorageFolderName.textContent = result.hoverboard_file_storage_name
      } else {
        this.elements.fileStorageFolderName.textContent = ''
      }
    } catch {
      this.elements.fileStorageFolderName.textContent = ''
    }
  }

  /**
   * [IMPL-FILE_STORAGE_TYPED_PATH] Persist typed path to chrome.storage.local and set file storage configured when in file mode.
   */
  async persistFileStoragePath () {
    if (!this.elements.fileStoragePath) return
    const path = this.elements.fileStoragePath.value.trim() || '~/.hoverboard'
    const storageMode = this.getSelectedStorageModeFromRadios()
    await chrome.storage.local.set({
      hoverboard_file_storage_path: path,
      ...(storageMode === 'file' && path ? { hoverboard_file_storage_configured: true } : {})
    })
  }

  /** [REQ-BROWSER_BOOKMARK_STORAGE] Read checked storage-mode radio. */
  getSelectedStorageModeFromRadios () {
    if (this.elements.storageModeFile?.checked) return 'file'
    if (this.elements.storageModeSync?.checked) return 'sync'
    if (this.elements.storageModeBrowser?.checked) return 'browser'
    if (this.elements.storageModeLocal?.checked) return 'local'
    return 'pinboard'
  }

  async selectFileStorageFolder () {
    // Chrome often blocks or aborts showDirectoryPicker on extension options pages; open dedicated picker tab for reliable behavior.
    const pickerUrl = typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.getURL('src/ui/options/folder-picker.html') : ''
    if (pickerUrl) {
      this.showStatus('Opening folder picker in a new tab…', 'info')
      try {
        await chrome.tabs.create({ url: pickerUrl })
        this.showStatus('Use the new tab to choose the folder. After selecting, return here—the folder name will update.', 'info')
      } catch (e) {
        this.showStatus('Could not open folder picker: ' + (e.message || 'Unknown error'), 'error')
      }
      return
    }
    this.showStatus('Folder picker is not available in this context.', 'error')
  }

  updateAuthSectionVisibility (mode) {
    if (!this.elements.authSection) return
    if (mode === 'local' || mode === 'file' || mode === 'sync' || mode === 'browser') {
      this.elements.authSection.classList.add('auth-section--disabled')
    } else {
      this.elements.authSection.classList.remove('auth-section--disabled')
    }
  }

  /**
   * [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] Handle storage mode radio change: persist and notify service worker.
   * @param {string} mode - 'pinboard' | 'local' | 'file' | 'sync' | 'browser'
   */
  async onStorageModeChange (mode) {
    try {
      await this.configManager.setStorageMode(mode)
      this.updateAuthSectionVisibility(mode)
      chrome.runtime.sendMessage({ type: 'switchStorageMode' }).catch(() => {})
      const labels = { local: 'local storage', file: 'file storage', sync: 'sync storage', browser: 'browser bookmarks', pinboard: 'Pinboard' }
      const modeLabel = labels[mode] || mode
      this.showStatus('Storage mode updated. Default for new bookmarks: ' + modeLabel + '.', 'success')
    } catch (error) {
      console.error('Storage mode change failed:', error)
      this.showStatus('Failed to update storage mode: ' + error.message, 'error')
    }
  }

  async testAuthentication () {
    const authToken = this.elements.authToken.value.trim()

    if (!authToken) {
      this.showStatus('Please enter an API token first', 'warning')
      return
    }

    try {
      this.setLoading(true)
      this.showStatus('Testing connection...', 'info')

      // Temporarily set the token for testing
      await this.configManager.setAuthToken(authToken)

      // Test the connection
      console.log('Testing Pinboard connection...')
      const isValid = await this.pinboardService.testConnection()
      console.log('Connection test result:', isValid)

      if (isValid) {
        this.showStatus('Authentication successful! ✓', 'success')
      } else {
        this.showStatus('Authentication failed. Please check your token.', 'error')
      }
    } catch (error) {
      console.error('Authentication test failed:', error)
      this.showStatus('Authentication test failed: ' + error.message, 'error')
    } finally {
      this.setLoading(false)
    }
  }

  /** [REQ-LOCAL_QUERY_API] [IMPL-LOCAL_QUERY_API] Ask SW to write aggregate-snapshot.json. */
  async refreshApiSnapshot () {
    if (!this.elements.apiSnapshotOptionsStatus) return
    this.elements.apiSnapshotOptionsStatus.textContent = 'Writing snapshot…'
    try {
      const response = await chrome.runtime.sendMessage({ type: 'REFRESH_API_SNAPSHOT' })
      if (response?.success) {
        this.elements.apiSnapshotOptionsStatus.textContent = `Snapshot updated (${response.count ?? 0} bookmarks)`
      } else {
        this.elements.apiSnapshotOptionsStatus.textContent = response?.error || 'Snapshot failed'
      }
    } catch (e) {
      this.elements.apiSnapshotOptionsStatus.textContent = `Error: ${e.message}`
    }
  }

  /** [REQ-NATIVE_HOST_WRAPPER] Send NATIVE_PING to service worker and show result. */
  async testNativeHost () {
    if (!this.elements.nativeHostStatus) return
    this.elements.nativeHostStatus.textContent = 'Testing…'
    try {
      const response = await chrome.runtime.sendMessage({ type: 'NATIVE_PING' })
      if (response?.success && response?.data) {
        if (response.data.error) {
          this.elements.nativeHostStatus.textContent = `Error: ${response.data.error}`
        } else if (response.data.type === 'pong') {
          this.elements.nativeHostStatus.textContent = 'Native host OK (pong)'
        } else {
          this.elements.nativeHostStatus.textContent = JSON.stringify(response.data)
        }
      } else {
        this.elements.nativeHostStatus.textContent = response?.error || 'No response'
      }
    } catch (e) {
      this.elements.nativeHostStatus.textContent = `Error: ${e.message}`
    }
  }

  /**
   * [REQ-AI_TAGGING_CONFIG] [ARCH-AI_TAGGING_CONFIG] [IMPL-AI_CONFIG_OPTIONS] [IMPL-AI_TAG_TEST] Options-page Test handler: validate key via testAiApiKey(apiKey, provider); show "API key OK" or error in aiTestStatus.
   */
  async testAiApiKey () {
    if (!this.elements.aiTestStatus) return
    const apiKey = this.elements.aiApiKey?.value?.trim()
    const provider = this.elements.aiProvider?.value || 'openai'
    if (!apiKey) {
      this.elements.aiTestStatus.textContent = 'Enter an API key first'
      return
    }
    // [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] Call testAiApiKey and set aiTestStatus to "API key OK" or error.
    this.elements.aiTestStatus.textContent = 'Testing…'
    try {
      const result = await testAiApiKey(apiKey, provider)
      if (result.ok) {
        this.elements.aiTestStatus.textContent = 'API key OK'
      } else {
        this.elements.aiTestStatus.textContent = result.error || 'Failed'
      }
    } catch (e) {
      this.elements.aiTestStatus.textContent = `Error: ${e.message}`
    }
  }

  async exportSettings () {
    try {
      const config = await this.configManager.exportConfig()

      const blob = new Blob([JSON.stringify(config, null, 2)], {
        type: 'application/json'
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hoverboard-settings-${new Date().toISOString().split('T')[0]}.json`
      a.click()

      URL.revokeObjectURL(url)

      this.showStatus('Settings exported successfully', 'success')
    } catch (error) {
      console.error('Failed to export settings:', error)
      this.showStatus('Failed to export settings: ' + error.message, 'error')
    }
  }

  async importSettings (event) {
    const file = event.target.files[0]
    if (!file) return

    try {
      this.setLoading(true)

      const text = await file.text()
      const config = JSON.parse(text)

      await this.configManager.importConfig(config)
      await this.loadSettings()

      this.showStatus('Settings imported successfully', 'success')
    } catch (error) {
      console.error('Failed to import settings:', error)
      this.showStatus('Failed to import settings: ' + error.message, 'error')
    } finally {
      this.setLoading(false)
      // Clear the file input
      event.target.value = ''
    }
  }

  async autoSave () {
    if (this.isLoading) return

    try {
      await this.saveSettings()
    } catch (error) {
      // Silent fail for auto-save
      console.warn('Auto-save failed:', error)
    }
  }

  validateInputs () {
    // Validate recent posts count
    const recentPostsCount = parseInt(this.elements.recentPostsCount.value)
    if (isNaN(recentPostsCount) || recentPostsCount < 5 || recentPostsCount > 50) {
      return {
        valid: false,
        message: 'Recent posts count must be between 5 and 50'
      }
    }

    // Validate auto-close timeout
    const autoCloseTimeout = parseInt(this.elements.autoCloseTimeout.value)
    if (isNaN(autoCloseTimeout) || autoCloseTimeout < 0) {
      return {
        valid: false,
        message: 'Auto-close timeout must be 0 or greater'
      }
    }

    // Validate badge text lengths
    const badgeFields = [
      this.elements.badgeNotBookmarked,
      this.elements.badgeNoTags,
      this.elements.badgePrivate,
      this.elements.badgeToRead
    ]

    for (const field of badgeFields) {
      if (field.value.length > 4) {
        return {
          valid: false,
          message: 'Badge text must be 4 characters or less'
        }
      }
    }

    return { valid: true }
  }

  setLoading (loading) {
    this.isLoading = loading

    const buttons = document.querySelectorAll('.btn')
    const inputs = document.querySelectorAll('input, textarea')

    buttons.forEach(btn => {
      btn.disabled = loading
      btn.classList.toggle('loading', loading)
    })

    inputs.forEach(input => {
      input.disabled = loading
    })
  }

  showStatus (message, type = 'info') {
    this.elements.statusMessage.textContent = message
    this.elements.statusMessage.className = `status ${type}`

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        this.elements.statusMessage.textContent = ''
        this.elements.statusMessage.className = 'status'
      }, 5000)
    }

    // Auto-hide info messages after 3 seconds
    if (type === 'info') {
      setTimeout(() => {
        this.elements.statusMessage.textContent = ''
        this.elements.statusMessage.className = 'status'
      }, 3000)
    }
  }

  debounce (func, wait) {
    let timeout
    return function executedFunction (...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  // Visibility controls methods
  toggleDefaultTheme () {
    this.currentTheme = this.currentTheme === 'light-on-dark' ? 'dark-on-light' : 'light-on-dark'
    this.updateThemeDisplay()
    this.updateVisibilityPreview()
  }

  updateThemeDisplay () {
    const themeIcon = this.elements.defaultThemeToggle.querySelector('.theme-icon')
    const themeText = this.elements.defaultThemeToggle.querySelector('.theme-text')

    if (themeIcon && themeText) {
      const isLightOnDark = this.currentTheme === 'light-on-dark'
      themeIcon.textContent = isLightOnDark ? '🌙' : '☀️'
      themeText.textContent = isLightOnDark ? 'Dark' : 'Light'
    }
  }

  updateTransparencyState () {
    const isEnabled = this.elements.defaultTransparencyEnabled.checked
    this.elements.opacitySetting.classList.toggle('disabled', !isEnabled)
    this.elements.defaultBackgroundOpacity.disabled = !isEnabled
    this.updateVisibilityPreview()
  }

  updateOpacityDisplay () {
    const opacity = this.elements.defaultBackgroundOpacity.value
    this.elements.opacityValue.textContent = `${opacity}%`
    this.updateVisibilityPreview()
  }

  updateVisibilityPreview () {
    const preview = this.elements.visibilityPreview
    const isTransparent = this.elements.defaultTransparencyEnabled.checked
    const opacity = parseInt(this.elements.defaultBackgroundOpacity.value) / 100

    // Remove existing theme classes
    preview.classList.remove('theme-light-on-dark', 'theme-dark-on-light')
    preview.classList.add(`theme-${this.currentTheme}`)

    // Apply transparency and opacity
    if (isTransparent) {
      if (this.currentTheme === 'light-on-dark') {
        preview.style.background = `rgba(44, 62, 80, ${opacity})`
      } else {
        preview.style.background = `rgba(255, 255, 255, ${opacity})`
      }
      preview.style.backdropFilter = 'blur(2px)'
    } else {
      preview.style.background = ''
      preview.style.backdropFilter = 'none'
    }
  }
}

// Initialize when DOM is ready (skip under Jest so unit tests can import OptionsController)
const isJest = typeof process !== 'undefined' && process.env?.JEST_WORKER_ID != null
if (!isJest) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // eslint-disable-next-line no-new
      new OptionsController()
    })
  } else {
    // eslint-disable-next-line no-new
    new OptionsController()
  }
}
