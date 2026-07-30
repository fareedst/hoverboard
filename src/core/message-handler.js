/**
 * [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION]
 * Message routing with type validation and handler map; processMessage and handler dispatch.
 * [IMPL-RUNTIME_VALIDATION] Incremental Zod validation at processMessage entry for critical message types.
 * @ts-check
 */

/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARK_USAGE_TRACKING ===
 * [IMPL-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING] [REQ-BOOKMARK_USAGE_TRACKING] — Record visit and optional referrer; debounce; persist usage + nav edges in chrome.storage.local.
 *
 * ## RECORD_VISIT
 *
 * - [IMPL-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING] [REQ-BOOKMARK_USAGE_TRACKING] How: Implements recordVisit(url, referrer?) behavior for IMPL-BOOKMARK_USAGE_TRACKING.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: Http, IO
 *   - TERMINATION: total
 * - PROCEDURE: RECORD_VISIT
 *   - url = cleanUrl(url); if !url return
 *   - IF now - _lastRecordedVisit[url] < DEBOUNCE_MS return  // debounce
 *   - _lastRecordedVisit[url] = now
 *   - usage = read usage[url] or create { visitCount:0, firstVisitedAt:'', lastVisitedAt:'', recentVisits:[] }
 *   - usage.visitCount++; usage.lastVisitedAt = now; if !usage.firstVisitedAt then usage.firstVisitedAt = now
 *   - usage.recentVisits = [now, ...usage.recentVisits].slice(0, RECENT_VISITS_CAP)
 *   - write usage map
 *   - IF referrer: ref = cleanUrl(referrer); IF ref && ref !== url && /^https?:/.test(ref): add/increment edge ref→url; write edges map
 *   - 1. getUsage(url), getAllUsage(): read from storage; return normalized records
 *   - 2. getMostFrequent(n), getMostRecent(n): sort by visitCount / lastVisitedAt; return top n
 *   - 3. getInboundLinks(url): edges[url] or []
 *   - 4. getOutboundLinks(url): all edges where sourceUrl === url (scan edges map)
 *   - 5. getNavigationGraph(): all edges as { sourceUrl, targetUrl, count, ... }
 *   - 6. clearUsage(url): delete usage[url]; delete edges[url]; remove url from any edge as sourceUrl
 *
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_USAGE_TRACKING ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARKING ===
 * [IMPL-BOOKMARKING] [ARCH-UX_CORE] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] — How: create/update/delete bookmarks via MessageHandler without leaving the page; tag suggestions remain available.
 *
 * ## SAVE_BOOKMARK
 *
 * - [IMPL-BOOKMARKING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] How: validate envelope/data then route save through storage backend; broadcast update on success.
 * - Contract:
 *   - INPUT: saveBookmark / deleteBookmark / getCurrentBookmark messages (url, title, tags, shared, toread, description)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted bookmark on preferred backend; BOOKMARK_UPDATED broadcast; UI-facing success/error payload | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MessageHandler; BookmarkRouter / pinboard / local / file / sync / browser providers; overlay and popup callers
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_BOOKMARK
 *   - validated = validateMessageData(message)
 *   - IF invalid: RETURN error payload
 *   - result = AWAIT bookmarkRouter.save(validated)
 *   - IF result.ok: BROADCAST BOOKMARK_UPDATED
 *   - RETURN result
 *   - How (sub-block): How: load current bookmark for URL for overlay/popup display.
 *
 * ## GET_CURRENT_BOOKMARK
 *
 * - [IMPL-BOOKMARKING] [ARCH-UX_CORE] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] How: Implements GET_CURRENT_BOOKMARK(url) behavior for IMPL-BOOKMARKING.
 * - Contract:
 *   - INPUT: saveBookmark / deleteBookmark / getCurrentBookmark messages (url, title, tags, shared, toread, description)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted bookmark on preferred backend; BOOKMARK_UPDATED broadcast; UI-facing success/error payload | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MessageHandler; BookmarkRouter / pinboard / local / file / sync / browser providers; overlay and popup callers
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_CURRENT_BOOKMARK
 *   - RETURN AWAIT bookmarkRouter.get(url) OR empty bookmark view
 *   - How (sub-block): How: delete bookmark for URL and notify listeners.
 *
 * ## DELETE_BOOKMARK
 *
 * - [IMPL-BOOKMARKING] [ARCH-UX_CORE] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] How: Implements DELETE_BOOKMARK(url) behavior for IMPL-BOOKMARKING.
 * - Contract:
 *   - INPUT: saveBookmark / deleteBookmark / getCurrentBookmark messages (url, title, tags, shared, toread, description)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted bookmark on preferred backend; BOOKMARK_UPDATED broadcast; UI-facing success/error payload | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MessageHandler; BookmarkRouter / pinboard / local / file / sync / browser providers; overlay and popup callers
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: DELETE_BOOKMARK
 *   - result = AWAIT bookmarkRouter.delete(url)
 *   - IF result.ok: BROADCAST BOOKMARK_UPDATED
 *   - RETURN result
 *
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARKING ===
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
 * === IMPL-FULL-BLOCK: IMPL-URL_TAGS_DISPLAY ===
 * [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] — normalizeBookmarkForDisplay, getBookmarkForDisplay, getTagsForUrl, getBadgeDisplayValue; handler and popup use router and re-fetch. Contract: bookmark or provider+url; normalized bookmark, tags, or badge value.
 *
 * ## NORMALIZE_BOOKMARK_FOR_DISPLAY
 *
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements normalizeBookmarkForDisplay(bookmark) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: NORMALIZE_BOOKMARK_FOR_DISPLAY
 *   - IF bookmark null: RETURN null or empty shape
 *   - tags = bookmark.tags IF array ELSE (bookmark.tags split by spaces or [])
 *   - RETURN { ...bookmark, tags, ...requiredDefaults }
 *   - How (sub-block): Get raw from provider and normalize; caller sets needsAuth.
 *
 * ## GET_BOOKMARK_FOR_DISPLAY
 *
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getBookmarkForDisplay(provider, url, title) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - EFFECTS: Async
 *   - TERMINATION: total
 * - PROCEDURE: GET_BOOKMARK_FOR_DISPLAY
 *   - raw = AWAIT provider.getBookmarkForUrl(url)
 *   - RETURN normalizeBookmarkForDisplay(raw); caller sets needsAuth when !hasAuth
 *   - How (sub-block): Get bookmark for url and return tags array.
 *
 * ## GET_TAGS_FOR_URL
 *
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getTagsForUrl(provider, url) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - EFFECTS: Async
 *   - TERMINATION: total
 * - PROCEDURE: GET_TAGS_FOR_URL
 *   - bookmark = AWAIT getBookmarkForDisplay(provider, url, null)
 *   - RETURN bookmark?.tags ?? []
 *   - How (sub-block): Normalize and return text, tagCount, isPrivate, isToRead, isBookmarked, title.
 *
 * ## GET_BADGE_DISPLAY_VALUE
 *
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getBadgeDisplayValue(bookmark, config) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_BADGE_DISPLAY_VALUE
 *   - normalized = normalizeBookmarkForDisplay(bookmark)
 *   - RETURN { text, tagCount, isPrivate, isToRead, isBookmarked, title }
 *   - How (sub-block): Handler and popup and router usage (same IMPL set).
 *   - 1. Message handler: handleGetCurrentBookmark always via getBookmarkForDisplay(router)
 *   - 2. Message handler: handleGetTagsForUrl returns getTagsForUrl
 *   - 3. Popup: getBookmarkData null only when blocked; re-fetch tags before add/remove
 *   - 4. Router: _hasTags/_isEmptyBookmark use normalizeBookmarkForDisplay
 *
 * === END IMPL-FULL-BLOCK: IMPL-URL_TAGS_DISPLAY ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-AI_TAGGING_POPUP_UI ===
 * [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] [REQ-STORAGE_MODE_DEFAULT] — Popup "Tag with AI" flow: get page content, get AI tags, split by session, create/update bookmark with default backend, update suggested tags.
 *
 * ## ON_TAG_WITH_AI_CLICK
 *
 * - [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] [REQ-STORAGE_MODE_DEFAULT] How: Implements onTagWithAiClick() behavior for IMPL-AI_TAGGING_POPUP_UI.
 * - Contract:
 *   - INPUT: user click "Tag with AI"
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark updated; suggested tags updated | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: ON_TAG_WITH_AI_CLICK
 *   - IF !config.aiApiKey or !currentTab.url.startsWith('http') THEN show message; RETURN
 *   - content = await sendToSW({ type: 'GET_PAGE_CONTENT', data: { tabId } })  // SW uses scripting.executeScript in tab
 *   - IF !content?.textContent THEN show (content.error if content.success === false else generic error); RETURN
 *   - aiTags = await sendToSW({ type: 'GET_AI_TAGS', data: { text: content.textContent, limit: config.aiTagLimit } })
 *   - sessionSet = new Set(await sendToSW({ type: 'getSessionTags' }))
 *   - inSession = aiTags.filter(t => sessionSet.has(t.toLowerCase()))
 *   - suggested = aiTags.filter(t => !sessionSet.has(t.toLowerCase()))
 *   - bookmark = await getCurrentBookmark()
 *   - defaultBackend = await configManager.getStorageMode()
 *   - IF !bookmark?.time:
 *   - create bookmark with url, title, tags: inSession, preferredBackend: defaultBackend
 *   - ELSE:
 *   - merged = merge(bookmark.tags, inSession)  // dedupe case-insensitive
 *   - saveBookmark({ ...bookmark, tags: merged, preferredBackend: bookmark backend or defaultBackend })
 *   - updateSuggestedTags(suggested)  // so AI tags appear first in Suggested section
 *   - refresh bookmark state / badge
 *
 * === END IMPL-FULL-BLOCK: IMPL-AI_TAGGING_POPUP_UI ===
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
 * === IMPL-FULL-BLOCK: IMPL-SCREENSHOT_MODE ===
 * [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] — Placeholder screenshot flow: seed storage, fake tab params, data-screenshot-ready, handleGetCurrentBookmark prefers data.url. Contract: URL params and seed; placeholder UI and script capture.
 *
 * ## MAIN
 *
 * - [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] How: Rich placeholder data: 15+ bookmarks so index and By Tag tree look robust; hero Pinboard entry with 6+ tags and non-empty extended for This Page view. Side panel: open with ?screenshot=1&url=screenshotPopupUrl&title=screenshotPopupTitle so Bookmark tab shows Pinboard bookmark (same doc, PopupController reads window.location.search).
 * - Contract:
 *   - INPUT: ?screenshot=1&url=...&title=... (popup/side panel); seed JSON (local bookmarks, storage index, theme); optional --seed=path
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: popup/index/side panel rendered with placeholder data; data-screenshot-ready attribute; script can capture screenshot
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: PopupController._screenshotMode; handleGetCurrentBookmark prefers data.url when http(s); placeholderStorageSeed
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - 1. localBookmarks: BUILD object keyed by URL; Pinboard entry HAS tags.length >= 6, extended non-empty, toread 'yes'; total entries >= 15; mix of toread yes/no; storageIndex one key per localBookmarks URL, value 'local'
 *   - How (sub-block): Await seed; open popup/index; wait for ready; check store-local for index; capture.
 *   - 2. Script: SEED chrome.storage.local/sync (await set); optional LOAD seed from file; OPEN popup or index; WAIT for [data-screenshot-ready="true"]; CHECK #store-local for index; CAPTURE screenshot
 *   - How (sub-block): Use URL params as fake tab; set data-screenshot-ready in finally.
 *   - 3. Popup load: IF screenshot=1 and url param: USE param as fake tab url/title; SKIP getCurrentTab; IN finally SET data-screenshot-ready on #mainInterface
 *   - How (sub-block): Prefer data.url as targetUrl when http(s) so popup-as-tab gets correct bookmark.
 *   - 4. handleGetCurrentBookmark: IF data.url present and http(s): USE as targetUrl so popup-as-tab gets bookmark for screenshot URL
 *   - 5. Side panel URL: GOTO side-panel.html?screenshot=1&url=encode(screenshotPopupUrl)&title=encode(screenshotPopupTitle); SET viewport width 360 (or 240); WAIT for tab content; CAPTURE screenshot (This Page, then By Tag, Tabs, etc.); output side-panel-bookmark.png, side-panel-tags-tree.png, side-panel-tabs.png
 *   - 6. record-demo-side-panel-this-page: SEED chrome.storage.local with placeholderStorageSeed via options page; GOTO side-panel.html?screenshot=1&url=...&title=...; record frames; assemble GIF
 *
 * === END IMPL-FULL-BLOCK: IMPL-SCREENSHOT_MODE ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-SESSION_TAGS ===
 * [IMPL-SESSION_TAGS] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] — In-session tags (lowercase) for auto-apply when AI returns; getSessionTags, recordSessionTags; session or in-memory. Contract: recordSessionTags(tags) or getSessionTags(); array of lowercase tags or void.
 *
 * ## GET_SESSION_TAGS
 *
 * - [IMPL-SESSION_TAGS] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] How: Implements getSessionTags() behavior for IMPL-SESSION_TAGS.
 * - Contract:
 *   - INPUT: recordSessionTags(tags: string[]); getSessionTags(): no args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: getSessionTags() -> string[] (lowercase); recordSessionTags -> void
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: storage key hoverboard_session_tags; use chrome.storage.session or in-memory Map in SW
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_SESSION_TAGS
 *   - IF chrome.storage.session:
 *   - result = await chrome.storage.session.get('hoverboard_session_tags')
 *   - RETURN (result.hoverboard_session_tags ?? []).map(t => t.toLowerCase())
 *   - RETURN inMemorySet ? Array.from(inMemorySet) : []
 *   - How (sub-block): Merge tags (lowercase) into set; persist to session storage or in-memory.
 *
 * ## RECORD_SESSION_TAGS
 *
 * - [IMPL-SESSION_TAGS] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] How: Implements recordSessionTags(tags) behavior for IMPL-SESSION_TAGS.
 * - Contract:
 *   - INPUT: recordSessionTags(tags: string[]); getSessionTags(): no args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: getSessionTags() -> string[] (lowercase); recordSessionTags -> void
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: storage key hoverboard_session_tags; use chrome.storage.session or in-memory Map in SW
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: RECORD_SESSION_TAGS
 *   - current = await getSessionTags()
 *   - set = new Set(current.map(t => t.toLowerCase()))
 *   - FOR tag IN tags: set.add(String(tag).trim().toLowerCase())
 *   - arr = Array.from(set)
 *   - IF chrome.storage.session: await chrome.storage.session.set({ hoverboard_session_tags: arr })
 *   - ELSE: inMemorySet = set
 *
 * === END IMPL-FULL-BLOCK: IMPL-SESSION_TAGS ===
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
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_TAGS_TREE ===
 * [IMPL-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [REQ-SIDE_PANEL_TAGS_TREE] — This block defines the overall feature: side panel tags tree opened from popup; panel shows tag→urls tree; click URL opens in new tab. Implements REQ by providing the side-panel entry and tag-tree UX; implements ARCH by following the open-flow and data-flow decisions.
 *
 * ## BUILD_TAG_TO_BOOKMARKS
 *
 * - [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] How: Popup entry: implements requirement "open tags tree from popup" by sending OPEN_SIDE_PANEL. ARCH prescribes message-based open; this block is the popup side. SW open in user gesture: implements requirement that side panel opens in response to user click. chrome.sidePanel.open() may only be called in user gesture (no await). So: maintain cached normal windowId; on OPEN_SIDE_PANEL handle in onMessage synchronously (no await before open). Implements ARCH open flow. Panel load: implements tag tree data flow; uses getAggregatedBookmarksForIndex (local+file+sync+browser; no Pinboard) then load config, apply filters, sort, group, build tag map and tag list, render. Implements REQ filters/sort/group and config persistence. When panel is tabbed, Tags tree is second tab; load/render runs on tab select or first show. initTagsTreeTab(options) is callable from side-panel.js when user selects Tags tree tab; optional currentBookmarkTags syncs tag selector to current bookmark. Implements "Tags tree tab" in tabbed panel and "tag selector matches current bookmark; tree shows only bookmarks that share at least one tag". Placeholder/demo mode (?demo=1 or ?screenshot=1): loadPlaceholderForScreenshot uses tagsTreePlaceholderBookmarks (tags-tree-demo-data.js), a rich set (25+ bookmarks, 15+ tags, time/updated_at, extended) so the By Tag demo GIF shows tag selector, tree, filters and search. Set rawBookmarks so tag toggle invokes refreshFromConfig; then tagToBookmarks, allTags, selectedTagOrder; hide load error and empty state; renderTagSelector(); renderTree(). buildTagToBookmarks: implements requirement "tag-based tree" by producing Map<tag, [{ title, url }]> from bookmarks. One pass; trim/dedupe per tag.
 * - Contract:
 *   - INPUT: user click in popup (open Tags tree); panel page load; user actions in panel (select/reorder tags, expand/collapse, click URL)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel visible; tag selector and hierarchical tree rendered; URL opens in new tab on click | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: bookmarks (from getAggregatedBookmarksForIndex = local+file+sync+browser; no Pinboard), config (expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder, showAllTags), filtered bookmarks, tagToBookmarks (Map tag → [{ title, url }]), allTags (string[]), collapsedTags/collapsedSections (Set), panel DOM refs
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BUILD_TAG_TO_BOOKMARKS
 *   - result = new Map()
 *   - FOR each b in bookmarks:
 *   - tags = Array.isArray(b.tags) ? b.tags : []; title = b.description || b.url || ''
 *   - FOR each tag in tags:
 *   - tagKey = String(tag).trim(); IF empty skip
 *   - IF result has no key tagKey THEN result[tagKey] = []; result[tagKey].push({ title, url: b.url })
 *   - RETURN result
 *
 * ## GET_ALL_TAGS_FROM_BOOKMARKS
 *
 * - [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] How: getAllTagsFromBookmarks: implements tag selector data by returning sorted unique tags from bookmarks.
 * - Contract:
 *   - INPUT: user click in popup (open Tags tree); panel page load; user actions in panel (select/reorder tags, expand/collapse, click URL)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel visible; tag selector and hierarchical tree rendered; URL opens in new tab on click
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: bookmarks (from getAggregatedBookmarksForIndex = local+file+sync+browser; no Pinboard), config (expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder, showAllTags), filtered bookmarks, tagToBookmarks (Map tag → [{ title, url }]), allTags (string[]), collapsedTags/collapsedSections (Set), panel DOM refs
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_ALL_TAGS_FROM_BOOKMARKS
 *   - set = new Set(); FOR each b in bookmarks: FOR each t in (b.tags || []): set.add(String(t).trim())
 *   - RETURN sorted Array.from(set)
 *
 * ## GET_TAGS_TO_DISPLAY
 *
 * - [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] How: Tag list view mode: implements "user can switch between all tags and only checked tags; choice persisted". showAllTags boolean in config; when true display allTags, when false display selectedTagOrder filtered by allTags (avoid stale tags). Persisted in panel config.
 * - Contract:
 *   - INPUT: user click in popup (open Tags tree); panel page load; user actions in panel (select/reorder tags, expand/collapse, click URL)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel visible; tag selector and hierarchical tree rendered; URL opens in new tab on click
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: bookmarks (from getAggregatedBookmarksForIndex = local+file+sync+browser; no Pinboard), config (expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder, showAllTags), filtered bookmarks, tagToBookmarks (Map tag → [{ title, url }]), allTags (string[]), collapsedTags/collapsedSections (Set), panel DOM refs
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_TAGS_TO_DISPLAY
 *   - IF showAllTags THEN RETURN allTags
 *   - allSet = Set(allTags); RETURN selectedTagOrder filtered to items IN allSet (preserve order)
 *
 * ## RENDER_TAG_SELECTOR
 *
 * - [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] How: renderTagSelector: implements tag selection and order UI and compact layout. Renders checkboxes for visibleTags = getTagsToDisplay(allTags, selectedTagOrder, config.showAllTags); on checkbox change save selectedTagOrder and refreshFromConfig; toggle change updates showAllTags, savePanelConfig, renderTagSelector only.
 * - Contract:
 *   - INPUT: user click in popup (open Tags tree); panel page load; user actions in panel (select/reorder tags, expand/collapse, click URL)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel visible; tag selector and hierarchical tree rendered; URL opens in new tab on click
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: bookmarks (from getAggregatedBookmarksForIndex = local+file+sync+browser; no Pinboard), config (expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder, showAllTags), filtered bookmarks, tagToBookmarks (Map tag → [{ title, url }]), allTags (string[]), collapsedTags/collapsedSections (Set), panel DOM refs
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: RENDER_TAG_SELECTOR
 *   - visibleTags = getTagsToDisplay(allTags, selectedTagOrder, config.showAllTags)
 *   - render list of tags (visibleTags) with selection state (checked iff in selectedTagOrder) and compact layout; on change save selectedTagOrder and refreshFromConfig
 *   - 1. ON tag list view toggle: config.showAllTags = NOT config.showAllTags; savePanelConfig(config); renderTagSelector()
 *
 * ## RENDER_TREE
 *
 * - [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] How: renderTree: implements collapsible URL lists per tag; each section has tag label + toggle + list of title+URL.
 * - Contract:
 *   - INPUT: user click in popup (open Tags tree); panel page load; user actions in panel (select/reorder tags, expand/collapse, click URL)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel visible; tag selector and hierarchical tree rendered; URL opens in new tab on click
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: bookmarks (from getAggregatedBookmarksForIndex = local+file+sync+browser; no Pinboard), config (expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder, showAllTags), filtered bookmarks, tagToBookmarks (Map tag → [{ title, url }]), allTags (string[]), collapsedTags/collapsedSections (Set), panel DOM refs
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: RENDER_TREE
 *   - FOR each tag in selectedTagOrder: entries = tagToBookmarks.get(tag) || []; render section (tag + toggle + list); store url for click
 *
 * ## BLOCK_6
 *
 * - [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] How: refreshFromConfig: syncConfigFromControls; savePanelConfig; IF !rawBookmarks or length 0 RETURN (no re-render). filterState = getFilterStateForTagsTree(panelConfig, selectedTagOrder); filtered = applyFilters(rawBookmarks, filterState); sorted = sortBookmarks(filtered, ...); matchingBookmarks = search filter or sorted; IF groupBy !== 'none' renderGrouped ELSE tagToBookmarks = buildTagToBookmarks(matchingBookmarks, allTags); renderTagSelector(); renderTree(); updateSearchCount; scrollToMatch. Config expand/collapse: implements requirement that config region is expandable for use and collapsible to maximize bookmarks space; toggle loads/saves expanded state; when collapsed only compact bar visible; when expanded show full filter and display controls. Filter pipeline: implements requirement to filter by create/update time range, tags include, and domain. Apply in sequence: time range (field + startMs/endMs), then tags include (bookmark must have at least one tag in set), then domains (URL hostname in set). Empty set or null bounds mean no filter for that step. getDomainFromUrl: implements domain filter/group by returning hostname from URL; invalid or empty URL returns empty string; no throw. filterByTimeRange: implements time range filter; uses bookmark time or updated_at per field; null start/end means no bound; inclusive. filterByTagsInclude: implements tags include filter; empty tagSet = all pass; otherwise bookmark must have at least one tag (case-insensitive) in set. filterByDomains: implements domain filter; empty domainSet = all pass; otherwise bookmark's getDomainFromUrl(url) in domainSet (case-insensitive). sortBookmarks: implements display sort by chosen axis (time, updated_at, tag, domain) and direction (sortAsc). For time use ms; for tag use first tag or ''; for domain use getDomainFromUrl. groupBookmarksBy: implements display group by; returns structure for sectioned render (e.g. Map<groupKey, bookmark[]>). groupBy in 'none' | 'time' | 'updated_at' | 'tag' | 'domain'; bucket keys for date (e.g. date string); per-tag or per-domain one key per value. renderGrouped: implements collapsible sectioned display when groupBy not none; each section has header (toggle) and list of bookmark links; click URL opens in new tab. loadPanelConfig / savePanelConfig: implements config state persistence; read/write expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder, showAllTags to chrome.storage.local. showAllTags defaults true for backward compatibility. openUrlInNewTab / ON click URL: implements "click-to-open in new tab" requirement via chrome.tabs.create({ url }). Tags tree panel layout: panel (#tagsTreePanel) is the scroll container so the above-list div can scroll off the page; .tree-section has min-height 100% so it consumes full visible height when the div is scrolled off and scrolls its list. Implements "tab content fills vertical space" for Tags tree tab. DOM: #tagsTreePanel > .tags-tree-above-list > (header, config-section, search-section, tag-selector-section) + .tree-section
 * - Contract:
 *   - INPUT: user click in popup (open Tags tree); panel page load; user actions in panel (select/reorder tags, expand/collapse, click URL)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel visible; tag selector and hierarchical tree rendered; URL opens in new tab on click
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: bookmarks (from getAggregatedBookmarksForIndex = local+file+sync+browser; no Pinboard), config (expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder, showAllTags), filtered bookmarks, tagToBookmarks (Map tag → [{ title, url }]), allTags (string[]), collapsedTags/collapsedSections (Set), panel DOM refs
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_6
 *   - 1. refreshFromConfig(): syncConfigFromControls(); savePanelConfig(); IF !rawBookmarks or rawBookmarks.length === 0 RETURN; filterState = getFilterStateForTagsTree(panelConfig, selectedTagOrder); filtered = applyFilters(rawBookmarks, filterState); sorted = sortBookmarks(filtered, panelConfig.sortBy, panelConfig.sortAsc); matchingBookmarks = searchQuery ? filterBookmarksBySearch(sorted, searchQuery) : sorted; IF panelConfig.groupBy !== 'none' THEN renderGrouped(matchingBookmarks) ELSE tagToBookmarks = buildTagToBookmarks(matchingBookmarks, allTags); renderTagSelector(); renderTree(); updateSearchCount(); scrollToMatch(searchMatchIndex)
 *   - 2. ON config toggle click: config.expanded = NOT config.expanded; savePanelConfig(config); renderConfigToggle(config.expanded); show or hide config content
 *   - 3. applyFilters(bookmarks, config): list = bookmarks; list = filterByTimeRange(list, config.timeField, config.timeStart, config.timeEnd); list = filterByTagsInclude(list, config.tagsInclude); list = filterByDomains(list, config.domains); RETURN list
 *   - 4. getDomainFromUrl(url): IF !url or !String(url).trim() RETURN ''; TRY parse url; RETURN hostname (lowercase) OR ''
 *   - 5. filterByTimeRange(bookmarks, field, startMs, endMs): RETURN bookmarks WHERE inTimeRange(b, field, startMs, endMs)  // inTimeRange: get ms from b; if null return false; if startMs and ms < startMs return false; if endMs and ms > endMs return false; return true
 *   - 6. filterByTagsInclude(bookmarks, tagSet): IF !tagSet or size 0 RETURN bookmarks; RETURN bookmarks WHERE (b.tags normalized) INTERSECT tagSet non-empty
 *   - 7. filterByDomains(bookmarks, domainSet): IF !domainSet or size 0 RETURN bookmarks; RETURN bookmarks WHERE getDomainFromUrl(b.url) in domainSet
 *   - 8. sortBookmarks(bookmarks, sortBy, sortAsc): sort list by sortBy key; if sortAsc ascending else descending; RETURN sorted array
 *   - 9. groupBookmarksBy(bookmarks, groupBy): IF groupBy === 'none' RETURN null or flat; result = Map(); FOR b in bookmarks: key = keyFor(b, groupBy); append b to result[key]; RETURN result
 *   - 10. renderGrouped(grouped, config): FOR each groupKey in grouped: render section header (groupKey + toggle); render list of title+URL; store url for click → openUrlInNewTab(url)
 *   - 11. loadPanelConfig(): get from chrome.storage.local; RETURN defaults for missing keys (showAllTags default true)
 *   - 12. savePanelConfig(config): chrome.storage.local.set(config keyed by storage keys)
 *   - 13. ON click URL in tree: url = event target url; openUrlInNewTab(url)  // openUrlInNewTab(url) => chrome.tabs.create({ url })
 *   - 14. CSS #tagsTreePanel: display block; flex 1 1 0; min-height 0; overflow-y auto; background var(--color-background)
 *   - 15. CSS .tags-tree-above-list: flex none (natural height; scrolls off with panel scroll)
 *   - 16. CSS .tree-section: min-height 100%; overflow-y auto
 *
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_TAGS_TREE ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-UI_TESTABILITY_HOOKS ===
 * [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-MODULE_VALIDATION] — setOnMessageProcessed, setOnAction, setOnStateChange so tests assert without DOM. Contract: callbacks set by tests; message/action/state trigger callbacks.
 *
 * ## MAIN
 *
 * - [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-MODULE_VALIDATION] How: Logical block for IMPL-UI_TESTABILITY_HOOKS.
 * - Contract:
 *   - INPUT: optional callback fn (set by tests); message (processMessage); popup/overlay action or state change
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: test can assert on message payload, action id, state without DOM
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: MessageHandler._onMessageProcessed; PopupController._onAction, _onStateChange; OverlayManager._onStateChange
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): After processMessage invoke callback with msg/result.
 *   - 1. MessageHandler: AFTER processMessage(msg): IF _onMessageProcessed: CALL with msg/result
 *   - How (sub-block): On action/state change invoke callbacks.
 *   - 2. PopupController: ON action: IF _onAction: CALL with actionId; ON state change: IF _onStateChange: CALL with state
 *   - 3. OverlayManager: ON visibility/content change: IF _onStateChange: CALL with { visible, contentSnapshot }
 *   - How (sub-block): Set callbacks, trigger, assert args.
 *   - 4. Tests: SET callbacks; TRIGGER message/action; ASSERT callback invoked with expected args
 *
 * === END IMPL-FULL-BLOCK: IMPL-UI_TESTABILITY_HOOKS ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-AI_TAGGING_READABILITY ===
 * [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] — Extract main content from document: Readability when available, else title + body.innerText; cap at maxLength.
 *
 * ## EXTRACT_PAGE_CONTENT
 *
 * - [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] How: Implements extractPageContent(document) behavior for IMPL-AI_TAGGING_READABILITY.
 * - Contract:
 *   - INPUT: document (or run in page context)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: { title: string, textContent: string }
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: maxLength (e.g. 16000)
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: EXTRACT_PAGE_CONTENT
 *   - clone = document.cloneNode(true)
 *   - result = Readability.parse(clone)  // @mozilla/readability
 *   - IF result:
 *   - title = result.title ?? document.title
 *   - text = result.textContent ?? ''
 *   - ELSE:
 *   - title = document.title
 *   - text = document.body ? document.body.innerText : ''
 *   - IF text.length > maxLength THEN text = text.slice(0, maxLength)
 *   - RETURN { title, textContent: text }
 *
 * === END IMPL-FULL-BLOCK: IMPL-AI_TAGGING_READABILITY ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-DEBUG_PANEL ===
 * [IMPL-DEBUG_PANEL] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] — Debug logging by category and debug panel showing last actions, messages, and current bookmark/backend. Contract: inputs, outputs, and data for logging and panel.
 *
 * ## MAIN
 *
 * - [IMPL-DEBUG_PANEL] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] How: Logical block for IMPL-DEBUG_PANEL.
 * - Contract:
 *   - INPUT: LOG_CATEGORIES (ui, message, overlay, storage); optional debug panel open
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: debugLogger.trace/debug in message-handler, PopupController, content-main; debug panel shows last actions, last messages, current bookmark/tags/backend
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: debug-logger.js; debug.html + debug.js; inspector ring buffers
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Logging: emit trace/debug when category enabled.
 *   - 1. Logging: WHEN category enabled: debugLogger.trace(msg) or debugLogger.debug(msg) with category
 *   - How (sub-block): Debug panel: on load request last actions/messages/current bookmark and render.
 *   - 2. Debug panel (debug.html): ON load SEND DEV_COMMAND getLastActions/getLastMessages/getCurrentBookmark (or getStorageSnapshot); RENDER in panel
 *
 * === END IMPL-FULL-BLOCK: IMPL-DEBUG_PANEL ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-DEV_COMMAND_INSPECTION ===
 * [IMPL-DEV_COMMAND_INSPECTION] [REQ-UI_INSPECTION] [REQ-URL_TAGS_DISPLAY] [REQ-PER_BOOKMARK_STORAGE_BACKEND] — DEV_COMMAND routing for current bookmark, tags, backend, and storage snapshot (debug-gated). Contract: message shape, returned data, and handler locations.
 *
 * ## PROCESS_DEV_COMMAND
 *
 * - [IMPL-DEV_COMMAND_INSPECTION] [REQ-UI_INSPECTION] [REQ-URL_TAGS_DISPLAY] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements processDevCommand(cmd) behavior for IMPL-DEV_COMMAND_INSPECTION.
 * - Contract:
 *   - INPUT: DEV_COMMAND message with subcommand (getCurrentBookmark | getTagsForUrl | getStorageBackendForUrl | getStorageSnapshot); optional url/context
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: current bookmark for URL, tags for URL, backend for URL, or storage key list (SW only); gated by DEBUG_HOVERBOARD_UI
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: MessageHandler.processDevCommand; service worker getStorageSnapshot
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: PROCESS_DEV_COMMAND
 *   - IF subcommand getCurrentBookmark: RETURN bookmarkRouter.getBookmarkForUrl(url) or current tab url
 *   - IF getTagsForUrl: RETURN tags for url
 *   - IF getStorageBackendForUrl: RETURN storageIndex.getBackendForUrl(url)
 *   - IF getStorageSnapshot (SW): RETURN list of storage key names only
 *
 * === END IMPL-FULL-BLOCK: IMPL-DEV_COMMAND_INSPECTION ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-RUNTIME_VALIDATION ===
 * [IMPL-RUNTIME_VALIDATION] [ARCH-MESSAGE_HANDLING] [ARCH-CONFIG_STRUCTURE] [REQ-CODE_QUALITY] — How: validate message envelopes/data and merged config with Zod at processMessage entry and getConfig merge.
 *
 * ## VALIDATE_INCOMING_MESSAGE
 *
 * - [IMPL-RUNTIME_VALIDATION] [ARCH-MESSAGE_HANDLING] [REQ-CODE_QUALITY] How: validate envelope then per-type data schema before handler body runs.
 * - Contract:
 *   - INPUT: raw chrome.runtime messages; merged config objects from storage
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: accepted typed payloads or structured validation errors; config rejected when schema fails | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: src/shared/message-schemas.js; ConfigManager Zod schemas; MessageHandler.processMessage
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: VALIDATE_INCOMING_MESSAGE
 *   - envelope = validateMessageEnvelope(message)
 *   - IF envelope fails: RETURN error
 *   - data = validateMessageData(message.type, message.data)
 *   - IF data fails: RETURN error
 *   - RETURN { type, data }
 *   - How (sub-block): How: after merge, parse config; on failure return defaults/error path without throwing to UI callers.
 *
 * ## VALIDATE_MERGED_CONFIG
 *
 * - [IMPL-RUNTIME_VALIDATION] [ARCH-MESSAGE_HANDLING] [ARCH-CONFIG_STRUCTURE] [REQ-CODE_QUALITY] How: Implements VALIDATE_MERGED_CONFIG(merged) behavior for IMPL-RUNTIME_VALIDATION.
 * - Contract:
 *   - INPUT: raw chrome.runtime messages; merged config objects from storage
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: accepted typed payloads or structured validation errors; config rejected when schema fails | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: src/shared/message-schemas.js; ConfigManager Zod schemas; MessageHandler.processMessage
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: VALIDATE_MERGED_CONFIG
 *   - parsed = configSchema.safeParse(merged)
 *   - IF NOT parsed.success: LOG; RETURN fallback OR error
 *   - RETURN parsed.data
 *
 * === END IMPL-FULL-BLOCK: IMPL-RUNTIME_VALIDATION ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-TYPESCRIPT_MIGRATION ===
 * [IMPL-TYPESCRIPT_MIGRATION] [ARCH-LANGUAGE_SELECTION] [REQ-MAINTAINABILITY] — How: incremental type-check without full TS rewrite — tsconfig noEmit, // @ts-check on key JS, shared .d.ts. Status: Active tooling; not a Deferred Safari path. Expand when more files adopt @ts-check.
 *
 * ## TYPECHECK_GATE
 *
 * - [IMPL-TYPESCRIPT_MIGRATION] [ARCH-LANGUAGE_SELECTION] [REQ-MAINTAINABILITY] How: validate gate runs typecheck before build/push.
 * - Contract:
 *   - INPUT: npm run typecheck / validate; tsconfig.json; JSDoc and .d.ts for message/config shapes
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: tsc --noEmit pass/fail; contract errors caught at build time on checked files | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: tsconfig.json; src/shared/*.d.ts; @ts-check on config-manager, message-handler, message-schemas, message-client
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: TYPECHECK_GATE
 *   - RUN tsc --noEmit with allowJs
 *   - ON errors: FAIL validate
 *   - RETURN pass
 *   - How (sub-block): How: checked modules document contracts via JSDoc/.d.ts; Zod remains runtime source for messages.
 *
 * ## MAINTAIN_CHECKED_SURFACE
 *
 * - [IMPL-TYPESCRIPT_MIGRATION] [ARCH-LANGUAGE_SELECTION] [REQ-MAINTAINABILITY] How: Implements MAINTAIN_CHECKED_SURFACE behavior for IMPL-TYPESCRIPT_MIGRATION.
 * - Contract:
 *   - INPUT: npm run typecheck / validate; tsconfig.json; JSDoc and .d.ts for message/config shapes
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: tsc --noEmit pass/fail; contract errors caught at build time on checked files | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: tsconfig.json; src/shared/*.d.ts; @ts-check on config-manager, message-handler, message-schemas, message-client
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: MAINTAIN_CHECKED_SURFACE
 *   - KEEP // @ts-check on boundary modules
 *   - UPDATE .d.ts when message/config shapes change
 *   - RETURN
 *
 * === END IMPL-FULL-BLOCK: IMPL-TYPESCRIPT_MIGRATION ===
 */
import { PinboardService } from '../features/pinboard/pinboard-service.js'

/** @typedef {import('../shared/message-types').MessageEnvelope} MessageEnvelope */
/** @typedef {import('../shared/message-types').SaveBookmarkData} SaveBookmarkData */
/** @typedef {import('../shared/message-types').GetCurrentBookmarkData} GetCurrentBookmarkData */
import { LocalBookmarkService } from '../features/storage/local-bookmark-service.js'
import { getBookmarkForDisplay, getTagsForUrl, normalizeBookmarkForDisplay } from '../features/storage/url-tags-manager.js'
import { TagService } from '../features/tagging/tag-service.js'
import { ConfigManager } from '../config/config-manager.js'
import { TabSearchService } from '../features/search/tab-search-service.js'
import { getSessionTags, recordSessionTags } from '../features/ai/session-tags.js'
import { requestAiTags } from '../features/ai/ai-tagging-provider.js'
import { debugLog, debugError, browser } from '../shared/utils.js'
import { validateMessageEnvelope, validateMessageData } from '../shared/message-schemas.js'

// Message type constants - migrated from config.js
export const MESSAGE_TYPES = {
  // Data retrieval
  GET_CURRENT_BOOKMARK: 'getCurrentBookmark',
  GET_TAGS_FOR_URL: 'getTagsForUrl', // [IMPL-URL_TAGS_DISPLAY] Centralized tag storage for tests and UI
  GET_RECENT_BOOKMARKS: 'getRecentBookmarks',
  GET_LOCAL_BOOKMARKS_FOR_INDEX: 'getLocalBookmarksForIndex', // [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
  GET_AGGREGATED_BOOKMARKS_FOR_INDEX: 'getAggregatedBookmarksForIndex', // [ARCH-STORAGE_INDEX_AND_ROUTER] local + file with storage column
  GET_OPTIONS: 'getOptions',
  GET_TAB_ID: 'getTabId',

  // Bookmark operations
  SAVE_BOOKMARK: 'saveBookmark',
  DELETE_BOOKMARK: 'deleteBookmark',
  SAVE_TAG: 'saveTag',
  DELETE_TAG: 'deleteTag',

  // [ARCH-LOCAL_STORAGE_PROVIDER] Storage mode switch (handled by service worker)
  SWITCH_STORAGE_MODE: 'switchStorageMode',

  // [REQ-PER_BOOKMARK_STORAGE_BACKEND] [IMPL-BOOKMARK_ROUTER] Per-bookmark storage (move UI)
  GET_STORAGE_BACKEND_FOR_URL: 'getStorageBackendForUrl',
  MOVE_BOOKMARK_TO_STORAGE: 'moveBookmarkToStorage',

  // UI operations
  TOGGLE_HOVER: 'toggleHover',
  HIDE_OVERLAY: 'hideOverlay',
  REFRESH_DATA: 'refreshData',
  REFRESH_HOVER: 'refreshHover',
  BOOKMARK_UPDATED: 'bookmarkUpdated', // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - New message type
  TAG_UPDATED: 'TAG_UPDATED', // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] - New message type for tag synchronization

  // Site management
  INHIBIT_URL: 'inhibitUrl',

  // Search operations
  SEARCH_TITLE: 'searchTitle',
  SEARCH_TITLE_TEXT: 'searchTitleText',

  // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] Tab search operations
  SEARCH_TABS: 'searchTabs',
  GET_SEARCH_HISTORY: 'getSearchHistory',
  CLEAR_SEARCH_STATE: 'clearSearchState',

  // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Recent tags operations
  ADD_TAG_TO_RECENT: 'addTagToRecent',
  GET_USER_RECENT_TAGS: 'getUserRecentTags',
  GET_SHARED_MEMORY_STATUS: 'getSharedMemoryStatus',

  // [REQ-SIDE_PANEL_BROWSER_TABS] Get document.referrer for tabs (run in SW so injection is in tab context)
  GET_TAB_REFERRERS: 'getTabReferrers',
  // [REQ-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING] [IMPL-BOOKMARK_USAGE_TRACKING] Usage and navigation graph queries
  GET_BOOKMARK_USAGE: 'getBookmarkUsage',
  GET_BOOKMARK_USAGE_STATS: 'getBookmarkUsageStats',
  GET_BOOKMARK_NAVIGATION_GRAPH: 'getBookmarkNavigationGraph',
  GET_BOOKMARK_INBOUND_LINKS: 'getBookmarkInboundLinks',
  // [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [ARCH-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] Get recently closed tabs from chrome.sessions
  GET_RECENTLY_CLOSED_TABS: 'getRecentlyClosedTabs',
  // [REQ-SIDE_PANEL_BROWSER_TABS] Get page body text per tab for filter (SW executeScript per tab)
  GET_TABS_PAGE_TEXT: 'getTabsPageText',
  // [REQ-SIDE_PANEL_BROWSER_TABS] Get important-tags snippet (alt, h1–h3, meta, og:title) per tab for filter (SW executeScript per tab)
  GET_TABS_IMPORTANT_TAGS: 'getTabsImportantTags',

  // Content script lifecycle
  CONTENT_SCRIPT_READY: 'contentScriptReady',

  // Overlay configuration
  UPDATE_OVERLAY_CONFIG: 'updateOverlayConfig',
  GET_OVERLAY_CONFIG: 'getOverlayConfig',

  // Development/debug
  DEV_COMMAND: 'devCommand',
  ECHO: 'echo',

  // [REQ-AI_TAGGING_POPUP] [ARCH-AI_TAGGING_FLOW] AI tagging
  GET_PAGE_CONTENT: 'GET_PAGE_CONTENT',
  GET_AI_TAGS: 'GET_AI_TAGS',
  GET_SESSION_TAGS: 'getSessionTags',
  RECORD_SESSION_TAGS: 'recordSessionTags',

  // [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Message type for opening side panel. Implements contract: popup sends this type; SW handles in onMessage and calls chrome.sidePanel.open({ windowId }).
  OPEN_SIDE_PANEL: 'OPEN_SIDE_PANEL',
  // [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] Popup/command/menu open Local Bookmarks Index via SW OPEN_BOOKMARKS_INDEX_TAB.
  OPEN_BOOKMARKS_INDEX: 'OPEN_BOOKMARKS_INDEX',
  // [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] SW sends after opening panel (and on index tab create); side panel closes itself if visible and open long enough (toggle).
  REQUEST_SIDE_PANEL_CLOSE: 'REQUEST_SIDE_PANEL_CLOSE'
}

export class MessageHandler {
  constructor (bookmarkProvider = null, tagService = null) {
    // [ARCH-LOCAL_STORAGE_PROVIDER] Use active bookmark provider (PinboardService or LocalBookmarkService)
    this.bookmarkProvider = bookmarkProvider || new PinboardService()
    this.tagService = tagService || new TagService(this.bookmarkProvider)
    this.configManager = new ConfigManager()

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] Initialize tab search service
    this.tabSearchService = new TabSearchService()
  }

  /**
   * [ARCH-LOCAL_STORAGE_PROVIDER] Swap the active bookmark provider at runtime (e.g. after storage mode change).
   * @param {import('../features/pinboard/pinboard-service.js').PinboardService | import('../features/storage/local-bookmark-service.js').LocalBookmarkService} provider - PinboardService or LocalBookmarkService instance
   */
  setBookmarkProvider (provider) {
    this.bookmarkProvider = provider
    this.tagService.pinboardService = provider
  }

  /**
   * [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-MODULE_VALIDATION]
   * Set optional callback invoked after each message is processed (for tests). Signature: ({ type, data, response, error, senderContext }) => void
   * @param {((arg: { type: string, data?: unknown, response?: unknown, error?: unknown, senderContext?: { tabId?: number, url?: string } }) => void) | null} fn
   */
  setOnMessageProcessed (fn) {
    this._onMessageProcessed = typeof fn === 'function' ? fn : null
  }

  /**
   * Process incoming messages with modern async/await pattern.
   * [IMPL-RUNTIME_VALIDATION] Validates envelope and data (for critical types) before dispatch.
   * @param {{ type: string, data?: Record<string, unknown> }} message - The message object (type + optional data)
   * @param {chrome.runtime.MessageSender} sender - Chrome extension sender info (tab, id, url)
   * @returns {Promise<unknown>} - Response data or { error, details } on validation failure
   */
  async processMessage (message, sender) {
    // [IMPL-RUNTIME_VALIDATION] Validate message envelope; reject invalid shape before dispatch
    const envelopeResult = validateMessageEnvelope(message)
    if (!envelopeResult.success) {
      const issues = envelopeResult.error?.issues
      debugError('[IMPL-RUNTIME_VALIDATION] Invalid message envelope', issues != null ? JSON.stringify(issues) : 'envelope validation failed')
      return { error: 'Invalid message', details: issues ?? 'envelope validation failed' }
    }
    const { type } = envelopeResult.data
    const rawData = envelopeResult.data.data

    // [IMPL-RUNTIME_VALIDATION] Validate data for critical message types (incremental; no schema = no check)
    const dataResult = validateMessageData(type, rawData)
    if (!dataResult.success) {
      const dataIssues = dataResult.error?.issues
      debugError('[IMPL-RUNTIME_VALIDATION] Invalid message data for type', type, dataIssues != null ? JSON.stringify(dataIssues) : 'data validation failed')
      return { error: 'Invalid message', details: dataIssues ?? 'data validation failed' }
    }
    const data = dataResult.data

    let tabId = sender.tab?.id
    let url = sender.tab?.url

    // If sender doesn't have tab context (e.g., popup), get current active tab
    if (!tabId && (type === MESSAGE_TYPES.SEARCH_TABS || type === MESSAGE_TYPES.GET_CURRENT_BOOKMARK)) {
      try {
        debugLog('[MESSAGE-HANDLER] Getting current active tab for popup request')

        // Try multiple strategies to get the current tab
        let tabs = await browser.tabs.query({ active: true, currentWindow: true })
        debugLog('[MESSAGE-HANDLER] Found tabs (current window):', tabs.length)

        // If no tabs found in current window, try all windows
        if (tabs.length === 0) {
          debugLog('[MESSAGE-HANDLER] No tabs in current window, trying all windows')
          tabs = await browser.tabs.query({ active: true })
          debugLog('[MESSAGE-HANDLER] Found tabs (all windows):', tabs.length)
        }

        // If still no tabs, try getting any tab
        if (tabs.length === 0) {
          debugLog('[MESSAGE-HANDLER] No active tabs found, trying any tab')
          tabs = await browser.tabs.query({})
          debugLog('[MESSAGE-HANDLER] Found total tabs:', tabs.length)

          // Use the first tab if available
          if (tabs.length > 0) {
            tabId = tabs[0].id
            url = tabs[0].url
            debugLog('[MESSAGE-HANDLER] Using first available tab:', { tabId, url })
          }
        } else {
          tabId = tabs[0].id
          url = tabs[0].url
          debugLog('[MESSAGE-HANDLER] Using active tab:', { tabId, url })
        }

        if (!tabId) {
          debugError('[MESSAGE-HANDLER] No tabs available at all')
        }
      } catch (error) {
        debugError('[MESSAGE-HANDLER] Failed to get current tab:', error)
        debugError('[MESSAGE-HANDLER] Error details:', {
          message: error.message,
          stack: error.stack,
          chromeError: browser.runtime.lastError
        })
      }
    }

    const senderContext = { tabId, url }
    let response
    try {
      switch (type) {
        case MESSAGE_TYPES.GET_CURRENT_BOOKMARK:
          response = await this.handleGetCurrentBookmark(data, url, tabId)
          break
        case MESSAGE_TYPES.GET_TAGS_FOR_URL:
          response = await this.handleGetTagsForUrl(data)
          break
        case MESSAGE_TYPES.GET_RECENT_BOOKMARKS:
          response = await this.handleGetRecentBookmarks(data, url)
          break
        case MESSAGE_TYPES.GET_LOCAL_BOOKMARKS_FOR_INDEX:
          response = await this.handleGetLocalBookmarksForIndex()
          break
        case MESSAGE_TYPES.GET_AGGREGATED_BOOKMARKS_FOR_INDEX:
          response = await this.handleGetAggregatedBookmarksForIndex()
          break
        case MESSAGE_TYPES.GET_OPTIONS:
          response = await this.handleGetOptions()
          break
        case MESSAGE_TYPES.SAVE_BOOKMARK:
          response = await this.handleSaveBookmark(data)
          break
        case MESSAGE_TYPES.DELETE_BOOKMARK:
          response = await this.handleDeleteBookmark(data)
          break
        case MESSAGE_TYPES.SAVE_TAG:
          response = await this.handleSaveTag(data)
          break
        case MESSAGE_TYPES.DELETE_TAG:
          response = await this.handleDeleteTag(data)
          break
        case MESSAGE_TYPES.GET_STORAGE_BACKEND_FOR_URL:
          response = await this.handleGetStorageBackendForUrl(data)
          break
        case MESSAGE_TYPES.MOVE_BOOKMARK_TO_STORAGE:
          response = await this.handleMoveBookmarkToStorage(data)
          break
        case MESSAGE_TYPES.INHIBIT_URL:
          response = await this.handleInhibitUrl(data)
          break
        case MESSAGE_TYPES.SEARCH_TITLE:
          response = await this.handleSearchTitle(data, tabId)
          break
        case MESSAGE_TYPES.SEARCH_TABS:
          response = await this.handleSearchTabs(data, tabId)
          break
        case MESSAGE_TYPES.GET_SEARCH_HISTORY:
          response = await this.handleGetSearchHistory()
          break
        case MESSAGE_TYPES.CLEAR_SEARCH_STATE:
          response = await this.handleClearSearchState()
          break
        case MESSAGE_TYPES.ADD_TAG_TO_RECENT:
          response = await this.handleAddTagToRecent(data)
          break
        case MESSAGE_TYPES.GET_USER_RECENT_TAGS:
          response = await this.handleGetUserRecentTags(data)
          break
        case MESSAGE_TYPES.GET_SHARED_MEMORY_STATUS:
          response = await this.handleGetSharedMemoryStatus()
          break
        case MESSAGE_TYPES.GET_TAB_ID:
          if (!tabId) {
            try {
              const tabs = await browser.tabs.query({ active: true, currentWindow: true })
              if (tabs.length > 0) tabId = tabs[0].id
            } catch (err) {
              debugError('[MESSAGE-HANDLER] Error getting active tab:', err)
            }
          }
          response = { tabId }
          break
        case MESSAGE_TYPES.CONTENT_SCRIPT_READY:
          response = await this.handleContentScriptReady(data, tabId, url)
          break
        case MESSAGE_TYPES.UPDATE_OVERLAY_CONFIG:
          response = await this.handleUpdateOverlayConfig(data)
          break
        case MESSAGE_TYPES.GET_OVERLAY_CONFIG:
          response = await this.handleGetOverlayConfig()
          break
        case MESSAGE_TYPES.BOOKMARK_UPDATED:
          response = await this.handleBookmarkUpdated(data, tabId)
          break
        case MESSAGE_TYPES.TAG_UPDATED:
          response = await this.handleTagUpdated(data, tabId)
          break
        case MESSAGE_TYPES.ECHO:
          response = { echo: data, timestamp: Date.now() }
          break
        case MESSAGE_TYPES.GET_PAGE_CONTENT:
          response = await this.handleGetPageContent(data)
          break
        case MESSAGE_TYPES.GET_AI_TAGS:
          response = await this.handleGetAiTags(data)
          break
        case MESSAGE_TYPES.GET_SESSION_TAGS:
          response = await this.handleGetSessionTags()
          break
        case MESSAGE_TYPES.RECORD_SESSION_TAGS:
          response = await this.handleRecordSessionTags(data)
          break
        case MESSAGE_TYPES.DEV_COMMAND:
          response = await this.processDevCommand(data, senderContext)
          break
        default:
          throw new Error(`Unknown message type: ${type}`)
      }
    } catch (error) {
      if (this._onMessageProcessed) {
        this._onMessageProcessed({ type, data, response: null, error: error.message, senderContext })
      }
      throw error
    }
    if (this._onMessageProcessed) {
      this._onMessageProcessed({ type, data, response, error: null, senderContext })
    }
    return response
  }

  /**
   * [REQ-UI_INSPECTION] Handle DEV_COMMAND subcommands for tests and debug panel (only when caller has set debug flag).
   * [IMPL-DEV_COMMAND_INSPECTION] [REQ-UI_INSPECTION] [REQ-URL_TAGS_DISPLAY] [REQ-PER_BOOKMARK_STORAGE_BACKEND] Subcommands: getCurrentBookmark, getTagsForUrl, getStorageBackendForUrl; getStorageSnapshot in SW.
   */
  async processDevCommand (data, senderContext) {
    const sub = data?.subcommand
    if (!sub) return { error: 'missing subcommand' }
    const url = data?.url || senderContext?.url
    const tabId = data?.tabId ?? senderContext?.tabId
    try {
      switch (sub) {
        case 'getCurrentBookmark':
          if (!url) return { error: 'url required' }
          return await this.handleGetCurrentBookmark(data, url, tabId)
        case 'getTagsForUrl':
          if (!url) return { error: 'url required' }
          return await this.handleGetTagsForUrl({ ...data, url })
        case 'getStorageBackendForUrl':
          if (!url) return { error: 'url required' }
          return await this.handleGetStorageBackendForUrl({ url })
        default:
          return { error: 'unknown subcommand' }
      }
    } catch (err) {
      return { error: err.message }
    }
  }

  async handleGetCurrentBookmark (data, url, tabId) {
    // [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] Prefer data.url when http(s) (screenshot mode popup-as-tab); else sender tab url.
    const dataUrl = data?.url && typeof data.url === 'string' && (data.url.startsWith('http://') || data.url.startsWith('https://')) ? data.url : null
    const targetUrl = dataUrl || url || data?.url
    if (!targetUrl) {
      throw new Error('No URL provided')
    }

    debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Getting bookmark for URL:', targetUrl)

    // Check if URL is allowed (not in inhibit list)
    debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Checking if URL is allowed...')
    const isAllowed = await this.configManager.isUrlAllowed(targetUrl)
    if (!isAllowed) {
      return { success: true, data: { blocked: true, url: targetUrl } }
    }
    debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] URL is allowed, getting bookmark data...')

    // [IMPL-URL_TAGS_DISPLAY] Single source: getBookmarkForDisplay (router + normalize); do not short-circuit when no Pinboard auth so local/file/sync bookmarks and tags are shown
    const hasAuth = await this.configManager.hasAuthToken()
    debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Getting bookmark data from provider (router)...')
    const raw = await this.bookmarkProvider.getBookmarkForUrl(targetUrl, data?.title)
    const normalized = normalizeBookmarkForDisplay(raw)
    debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Bookmark data retrieved:', normalized)

    normalized.url = normalized.url || targetUrl
    // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Flag so panel can skip creating bookmark when clearing to-read
    normalized.exists = !!(raw && typeof raw === 'object')
    if (!hasAuth) normalized.needsAuth = true

    // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Return a plain object so url/exists survive structured clone to side panel (fixes "0 tabs modified" when reply.data.url was undefined in panel).
    const dataOut = {
      url: String(normalized.url || targetUrl),
      description: normalized.description ?? '',
      tags: Array.isArray(normalized.tags) ? normalized.tags : [],
      toread: normalized.toread ?? 'no',
      shared: normalized.shared ?? 'yes',
      exists: !!normalized.exists,
      extended: normalized.extended ?? '',
      time: normalized.time ?? '',
      updated_at: normalized.updated_at ?? '',
      hash: normalized.hash ?? ''
    }
    if (normalized.needsAuth) dataOut.needsAuth = true

    const response = { success: true, data: dataOut }
    debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Service worker response structure:', {
      success: response.success,
      dataType: typeof response.data,
      dataKeys: response.data ? Object.keys(response.data) : null,
      hasUrl: !!response.data?.url,
      hasTags: !!response.data?.tags,
      tagCount: response.data?.tags ? (Array.isArray(response.data.tags) ? response.data.tags.length : 'not-array') : 0,
      hasDescription: !!response.data?.description,
      hasShared: response.data?.shared !== undefined,
      hasToread: response.data?.toread !== undefined
    })

    // Update browser badge if configured
    const config = await this.configManager.getConfig()
    if (config.setIconOnLoad && tabId) {
      // Badge update handled by service worker
    }

    return response
  }

  /**
   * [IMPL-URL_TAGS_DISPLAY] Centralized tag storage: return tags array for URL from same source as badge/popup.
   * @param {Object} data - { url: string }
   * @returns {Promise<{ tags: string[] }>}
   */
  async handleGetTagsForUrl (data) {
    const targetUrl = data?.url
    if (!targetUrl) {
      return { tags: [] }
    }
    const tags = await getTagsForUrl(this.bookmarkProvider, targetUrl)
    debugLog('[MESSAGE-HANDLER] [IMPL-URL_TAGS_DISPLAY] getTagsForUrl:', targetUrl, 'tags:', tags?.length)
    return { tags: tags || [] }
  }

  async handleGetRecentBookmarks (data, senderUrl) {
    debugLog('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Handling getRecentBookmarks request:', data)
    debugLog('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Sender URL:', senderUrl)

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Get user recent tags excluding current site
    const recentTags = await this.tagService.getUserRecentTagsExcludingCurrent(data.currentTags || [])

    debugLog('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] User recent tags (excluding current):', recentTags)

    const response = {
      ...data,
      recentTags
    }

    debugLog('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Returning response:', response)
    return response
  }

  /**
   * [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
   * Return all bookmarks from local storage only. Always uses LocalBookmarkService, not bookmarkProvider.
   * @returns {Promise<{ bookmarks: Array }>}
   */
  async handleGetLocalBookmarksForIndex () {
    try {
      const localService = new LocalBookmarkService(this.tagService)
      const bookmarks = await localService.getAllBookmarks()
      debugLog('[MESSAGE-HANDLER] [IMPL-LOCAL_BOOKMARKS_INDEX] getLocalBookmarksForIndex:', bookmarks.length)
      return { bookmarks }
    } catch (error) {
      debugError('[MESSAGE-HANDLER] [IMPL-LOCAL_BOOKMARKS_INDEX] getLocalBookmarksForIndex failed:', error)
      return { bookmarks: [], error: error.message }
    }
  }

  /**
   * [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-LOCAL_BOOKMARKS_INDEX] Return local + file + sync bookmarks with storage field (for index page).
   * @returns {Promise<{ bookmarks: Array<{ ...bookmark, storage: 'local'|'file'|'sync' }> }>}
   */
  async handleGetAggregatedBookmarksForIndex () {
    try {
      if (typeof this.bookmarkProvider.getAllBookmarksForIndex === 'function') {
        const bookmarks = await this.bookmarkProvider.getAllBookmarksForIndex()
        debugLog('[MESSAGE-HANDLER] getAggregatedBookmarksForIndex:', bookmarks.length)
        return { bookmarks }
      }
      const localService = new LocalBookmarkService(this.tagService)
      const bookmarks = (await localService.getAllBookmarks()).map(b => ({ ...b, storage: 'local' }))
      return { bookmarks }
    } catch (error) {
      debugError('[MESSAGE-HANDLER] getAggregatedBookmarksForIndex failed:', error)
      return { bookmarks: [], error: error.message }
    }
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Handle tag addition to recent list (current site only)
   * @param {Object} data - Message data containing tagName and currentSiteUrl
   * @returns {Promise<Object>} Success status
   */
  async handleAddTagToRecent (data) {
    try {
      const { tagName, currentSiteUrl } = data

      debugLog('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Adding tag to recent list:', { tagName, currentSiteUrl })

      if (!tagName || !currentSiteUrl) {
        throw new Error('tagName and currentSiteUrl are required')
      }

      // Add tag to user recent list for current site only
      const success = await this.tagService.addTagToUserRecentList(tagName, currentSiteUrl)

      debugLog('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Tag addition result:', success)

      return { success }
    } catch (error) {
      debugError('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Error adding tag to recent:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Handle get user recent tags request
   * @param {Object} data - Message data
   * @returns {Promise<Object>} Recent tags data
   */
  async handleGetUserRecentTags (data) {
    try {
      debugLog('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Getting user recent tags')

      const recentTags = await this.tagService.getUserRecentTags()

      debugLog('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] User recent tags:', recentTags)

      return { recentTags }
    } catch (error) {
      debugError('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Error getting user recent tags:', error)
      return { recentTags: [], error: error.message }
    }
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Handle get shared memory status request
   * @returns {Promise<Object>} Shared memory status
   */
  async handleGetSharedMemoryStatus () {
    try {
      debugLog('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Getting shared memory status')

      // Get the service worker instance to access shared memory
      const serviceWorker = await this.getServiceWorker()
      if (serviceWorker && serviceWorker.recentTagsMemory) {
        const status = serviceWorker.recentTagsMemory.getMemoryStatus()
        return { recentTagsMemory: serviceWorker.recentTagsMemory, status }
      }

      return { recentTagsMemory: null, status: 'not_available' }
    } catch (error) {
      debugError('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Error getting shared memory status:', error)
      return { recentTagsMemory: null, status: 'error', error: error.message }
    }
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Get service worker instance
   * @returns {Promise<Object|null>} Service worker instance or null
   */
  async getServiceWorker () {
    try {
      // In Manifest V3, we need to access the service worker instance
      // This is a bit tricky since we're already in the service worker context
      if (typeof self !== 'undefined' && self.recentTagsMemory) {
        return self
      }

      // Try to get it from the global scope
      if (typeof globalThis !== 'undefined' && globalThis.recentTagsMemory) {
        return globalThis
      }

      return null
    } catch (error) {
      debugError('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Error getting service worker:', error)
      return null
    }
  }

  async handleGetOptions () {
    debugLog('[MESSAGE-HANDLER] Processing GET_OPTIONS')
    const options = await this.configManager.getOptions()
    debugLog('[MESSAGE-HANDLER] Returning options:', options)
    return options
  }

  /**
   * [REQ-AI_TAGGING_POPUP] [ARCH-AI_TAGGING_FLOW] [IMPL-AI_TAGGING_READABILITY]
   * Get page title and text via scripting.executeScript so it works even when the content script
   * was not injected (e.g. tab opened before extension load). Uses body.innerText; same max length as Readability path.
   */
  async handleGetPageContent (data) {
    const tabId = data?.tabId
    if (tabId == null) return { success: false, error: 'tabId required' }
    const timeoutError = { success: false, error: 'Page content unavailable. Reload the page and try again, or use a different tab.' }
    const scripting = (typeof chrome !== 'undefined' && chrome.scripting) ? chrome.scripting : (typeof browser !== 'undefined' && browser.scripting) ? browser.scripting : null
    if (!scripting) return timeoutError
    // [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] SW fallback when content script not injected: title + body.innerText, 16k cap in caller.
    const extractInPage = () => {
      const title = (document.title && String(document.title).trim()) || ''
      const raw = document.body && document.body.innerText ? String(document.body.innerText).trim() : ''
      return { title, textContent: raw }
    }
    try {
      const results = await scripting.executeScript({ target: { tabId }, func: extractInPage })
      const raw = results && results[0] && results[0].result
      if (!raw || typeof raw !== 'object') return timeoutError
      const maxLen = 16000
      const textContent = (raw.textContent && raw.textContent.length > maxLen) ? raw.textContent.slice(0, maxLen) : (raw.textContent || '')
      return { title: raw.title || '', textContent }
    } catch (e) {
      debugError('[MESSAGE-HANDLER] GET_PAGE_CONTENT executeScript failed:', e)
      return timeoutError
    }
  }

  /**
   * [REQ-AI_TAGGING_POPUP] [ARCH-AI_TAGGING_FLOW] [IMPL-AI_TAGGING_PROVIDER]
   * Call AI provider for tags; uses config aiApiKey, aiProvider, aiTagLimit and TagService.sanitizeTag.
   */
  async handleGetAiTags (data) {
    const config = await this.configManager.getConfig()
    const apiKey = (config.aiApiKey || '').trim()
    if (!apiKey) return { success: false, error: 'No AI API key configured', tags: [] }
    const provider = config.aiProvider || 'openai'
    const limit = Math.min(128, Math.max(1, Number(config.aiTagLimit) || 64))
    const text = (data?.text || '').trim()
    if (!text) return { success: false, error: 'No text', tags: [] }
    // [IMPL-AI_TAGGING_PROVIDER] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] [REQ-TAG_INPUT_SANITIZATION] Get config, call requestAiTags with TagService.sanitizeTag, return tags.
    try {
      const sanitizeTag = (s) => this.tagService.sanitizeTag(s)
      const tags = await requestAiTags(provider, apiKey, text, limit, { sanitizeTag })
      return { success: true, tags }
    } catch (err) {
      debugError('[MESSAGE-HANDLER] GET_AI_TAGS failed:', err)
      return { success: false, error: err.message, tags: [] }
    }
  }

  /**
   * [REQ-AI_TAGGING_POPUP] [IMPL-SESSION_TAGS] Return session tags (lowercase) for auto-apply.
   */
  async handleGetSessionTags () {
    const tags = await getSessionTags()
    return { success: true, tags }
  }

  /**
   * [IMPL-SESSION_TAGS] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Add tags to session set (called when user adds tags).
   */
  async handleRecordSessionTags (data) {
    const tags = Array.isArray(data?.tags) ? data.tags : (data?.tag ? [data.tag] : [])
    await recordSessionTags(tags)
    return { success: true }
  }

  async handleSaveBookmark (data) {
    // [IMPL-URL_TAGS_DISPLAY] Previous tags from same source as badge/popup (getTagsForUrl returns normalized array)
    const previousTags = await getTagsForUrl(this.bookmarkProvider, data.url)
    const newTags = Array.isArray(data.tags) ? data.tags : (data.tags ? String(data.tags).split(' ').filter(tag => tag.trim()) : [])
    // Compute which tags are newly added
    const addedTags = newTags.filter(tag => !previousTags.includes(tag))

    const result = await this.bookmarkProvider.saveBookmark(data)

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Only track newly added tags
    for (const tag of addedTags) {
      if (tag.trim()) {
        try {
          await this.tagService.handleTagAddition(tag.trim(), data)
        } catch (error) {
          debugError(`[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] Failed to track tag "${tag}":`, error)
          // Don't fail the entire operation if tag tracking fails
        }
      }
    }

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Track newly added tags for current site only
    for (const tag of addedTags) {
      if (tag.trim()) {
        try {
          await this.tagService.addTagToUserRecentList(tag.trim(), data.url)
        } catch (error) {
          debugError(`[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Failed to add tag "${tag}" to user recent list:`, error)
          // Don't fail the entire operation if tag tracking fails
        }
      }
    }

    // [IMPL-SESSION_TAGS] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Record added tags for session auto-apply
    if (addedTags.length > 0) {
      try {
        await recordSessionTags(addedTags.map(t => t.trim()).filter(Boolean))
      } catch (err) {
        debugError('[IMPL-SESSION_TAGS] recordSessionTags failed:', err)
      }
    }

    return result
  }

  /**
   * [IMPL-BOOKMARK_ROUTER] [REQ-LOCAL_BOOKMARKS_INDEX] Pass full data so preferredBackend reaches BookmarkRouter.
   */
  async handleDeleteBookmark (data) {
    return this.bookmarkProvider.deleteBookmark(data)
  }

  async handleSaveTag (data) {
    const result = await this.bookmarkProvider.saveTag(data)

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Enhanced tag tracking for tag save
    if (data.value && data.value.trim()) {
      try {
        await this.tagService.handleTagAddition(data.value.trim(), data)
      } catch (error) {
        debugError(`[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] Failed to track tag "${data.value}":`, error)
        // Don't fail the entire operation if tag tracking fails
      }
    }

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Track tag addition for current site only
    if (data.value && data.value.trim() && data.url) {
      try {
        await this.tagService.addTagToUserRecentList(data.value.trim(), data.url)
      } catch (error) {
        debugError(`[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Failed to add tag "${data.value}" to user recent list:`, error)
        // Don't fail the entire operation if tag tracking fails
      }
    }

    // [IMPL-SESSION_TAGS] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Record tag for session auto-apply
    if (data.value && data.value.trim()) {
      try {
        await recordSessionTags([data.value.trim()])
      } catch (err) {
        debugError('[IMPL-SESSION_TAGS] recordSessionTags failed:', err)
      }
    }

    return result
  }

  async handleDeleteTag (data) {
    return this.bookmarkProvider.deleteTag(data)
  }

  /**
   * [REQ-PER_BOOKMARK_STORAGE_BACKEND] [IMPL-BOOKMARK_ROUTER] Get storage backend for URL (for move UI).
   */
  async handleGetStorageBackendForUrl (data) {
    if (typeof this.bookmarkProvider.getStorageBackendForUrl === 'function') {
      return this.bookmarkProvider.getStorageBackendForUrl(data?.url || '')
    }
    return this.configManager.getStorageMode()
  }

  /**
   * [REQ-PER_BOOKMARK_STORAGE_BACKEND] [IMPL-BOOKMARK_ROUTER] Move bookmark to target storage.
   */
  async handleMoveBookmarkToStorage (data) {
    if (typeof this.bookmarkProvider.moveBookmarkToStorage !== 'function') {
      return { success: false, code: 'unsupported', message: 'Move not supported' }
    }
    const url = data?.url
    const targetBackend = data?.targetBackend
    if (!url || !targetBackend) {
      return { success: false, code: 'invalid', message: 'url and targetBackend required' }
    }
    return this.bookmarkProvider.moveBookmarkToStorage(url, targetBackend)
  }

  async handleInhibitUrl (data) {
    return this.configManager.addInhibitUrl(data.url)
  }

  async handleSearchTitle (data, tabId) {
    // TODO: Implement title search functionality
    // This was a complex feature in the original code
    return { searchCount: 0, tabId }
  }

  /**
   * [TAB-SEARCH-CORE] Handle tab search request
   */
  async handleSearchTabs (data, tabId) {
    try {
      const { searchText } = data

      debugLog('[TAB-SEARCH-CORE] Starting tab search:', { searchText, tabId })

      if (!searchText || !searchText.trim()) {
        throw new Error('Search text is required')
      }

      if (!tabId) {
        throw new Error('Current tab ID is required')
      }

      debugLog('[TAB-SEARCH-CORE] Calling tabSearchService.searchAndNavigate')
      const result = await this.tabSearchService.searchAndNavigate(searchText, tabId)
      debugLog('[TAB-SEARCH-CORE] Search result:', result)
      return result
    } catch (error) {
      debugError('[TAB-SEARCH-CORE] Search tabs error:', error)
      throw error
    }
  }

  /**
   * [TAB-SEARCH-STATE] Handle get search history request
   */
  async handleGetSearchHistory () {
    try {
      const history = this.tabSearchService.getSearchHistory()
      return { history }
    } catch (error) {
      debugError('[TAB-SEARCH-STATE] Get search history error:', error)
      throw error
    }
  }

  /**
   * [TAB-SEARCH-STATE] Handle clear search state request
   */
  async handleClearSearchState () {
    try {
      this.tabSearchService.clearSearchState()
      return { success: true }
    } catch (error) {
      debugError('[TAB-SEARCH-STATE] Clear search state error:', error)
      throw error
    }
  }

  async handleContentScriptReady (data, tabId, url) {
    // Handle content script ready notification
    debugLog('Content script ready:', { tabId, url, data })
    return { acknowledged: true, tabId, timestamp: Date.now() }
  }

  async handleUpdateOverlayConfig (data) {
    try {
      await this.configManager.updateConfig(data)

      // Broadcast the configuration update to all content scripts
      await this.broadcastToAllTabs({
        message: 'updateOverlayTransparency',
        config: data
      })

      return { success: true, updated: data }
    } catch (error) {
      debugError('Failed to update overlay config:', error)
      throw new Error('Failed to update overlay configuration')
    }
  }

  async handleGetOverlayConfig () {
    try {
      const config = await this.configManager.getConfig()

      return {
        overlayTransparencyMode: config.overlayTransparencyMode,
        overlayPositionMode: config.overlayPositionMode,
        overlayOpacityNormal: config.overlayOpacityNormal,
        overlayOpacityHover: config.overlayOpacityHover,
        overlayOpacityFocus: config.overlayOpacityFocus,
        overlayAdaptiveVisibility: config.overlayAdaptiveVisibility,
        overlayBlurAmount: config.overlayBlurAmount
      }
    } catch (error) {
      debugError('Failed to get overlay config:', error)
      throw new Error('Failed to get overlay configuration')
    }
  }

  /**
   * [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - Handle bookmark updates across interfaces
   * @param {Object} data - Bookmark data
   * @param {number} tabId - Tab ID
   */
  async handleBookmarkUpdated (data, tabId) {
    try {
      debugLog('[MessageHandler] handleBookmarkUpdated called', { data, tabId })
      // Update the bookmark with new privacy setting or other changes
      const result = await this.bookmarkProvider.saveBookmark(data)
      debugLog('[MessageHandler] Bookmark updated via bookmarkProvider.saveBookmark', { result })
      // Optionally broadcast to all tabs if needed
      await this.broadcastToAllTabs({
        type: 'BOOKMARK_UPDATED',
        data
      })
      debugLog('[MessageHandler] BOOKMARK_UPDATED broadcasted to all tabs', { data })
      return { success: true, updated: data }
    } catch (error) {
      debugError('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Failed to handle bookmark update:', error)
      throw new Error('Failed to update bookmark across interfaces')
    }
  }

  /**
   * [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] - Handle tag updates across interfaces
   * @param {Object} data - Tag update data
   * @param {number} tabId - Tab ID
   */
  async handleTagUpdated (data, tabId) {
    try {
      debugLog('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] Handling tag update:', data)

      // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] - Validate tag update data
      if (!data || !data.url || !Array.isArray(data.tags)) {
        throw new Error('Invalid tag update data')
      }

      // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] - Broadcast tag update to all tabs
      await this.broadcastToAllTabs({
        type: 'TAG_UPDATED',
        data
      })

      debugLog('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] Tag update broadcasted successfully')
      return { success: true, updated: data }
    } catch (error) {
      debugError('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] Failed to handle tag update:', error)
      if (error && error.message === 'Invalid tag update data') {
        throw error
      } else {
        throw new Error('Failed to update tags across interfaces')
      }
    }
  }

  /**
   * Send message to content script
   * @param {number} tabId - Tab ID to send message to
   * @param {Object} message - Message to send
   */
  async sendToTab (tabId, message) {
    try {
      await browser.tabs.sendMessage(tabId, message)
    } catch (error) {
      debugError('Failed to send message to tab:', error)
    }
  }

  /**
   * Broadcast message to all tabs
   * @param {Object} message - Message to broadcast
   */
  async broadcastToAllTabs (message) {
    try {
      const tabs = await browser.tabs.query({})
      const promises = tabs.map(tab =>
        this.sendToTab(tab.id, message).catch(() => {
          // Ignore errors for inactive tabs
        })
      )
      await Promise.all(promises)
    } catch (error) {
      debugError('Failed to broadcast message:', error)
    }
  }
}
