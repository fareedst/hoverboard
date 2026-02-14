# [IMPL-LOCAL_BOOKMARKS_INDEX] Local Bookmarks Index Implementation

**Status**: Active  
**Cross-references**: ARCH-LOCAL_BOOKMARKS_INDEX, REQ-LOCAL_BOOKMARKS_INDEX, ARCH-STORAGE_INDEX_AND_ROUTER

---

## Summary

- **Primary data**: On load, the index page sends **getAggregatedBookmarksForIndex**. Message handler calls `bookmarkProvider.getAllBookmarksForIndex()` when available (BookmarkRouter); router aggregates localProvider.getAllBookmarks() and fileProvider.getAllBookmarks(), tags each item with `storage: 'local'` or `'file'`, returns merged list sorted by time desc. Fallback: page sends **getLocalBookmarksForIndex** and tags each item with `storage: 'local'`.
- **LocalBookmarkService.getAllBookmarks()**: Used by getLocalBookmarksForIndex handler and by BookmarkRouter for local slice of aggregated data.
- **Bookmarks table page**: `src/ui/bookmarks-table/bookmarks-table.html`, `bookmarks-table.js`, `bookmarks-table.css`. Renders table with **Storage** column (Local | File); sortable by storage; search (single input over description/url/tags/extended), filters (tag include, toread only, private only), column sort (toggle asc/desc), URL column as links. All operations client-side on in-memory array.
- **Entry point**: Popup footer has "Bookmarks index" button (bookmarksIndexBtn); click emits openBookmarksIndex, PopupController.handleOpenBookmarksIndex opens tab. Options footer has "Local bookmarks index" link (bookmarks-index-link); options.js sets href in init() to chrome.runtime.getURL('src/ui/bookmarks-table/bookmarks-table.html').

## Code locations

- `src/features/storage/local-bookmark-service.js`: getAllBookmarks()
- `src/features/storage/bookmark-router.js`: getAllBookmarksForIndex() (aggregates local + file with storage field)
- `src/core/message-handler.js`: MESSAGE_TYPES.GET_AGGREGATED_BOOKMARKS_FOR_INDEX, GET_LOCAL_BOOKMARKS_FOR_INDEX; handleGetAggregatedBookmarksForIndex, handleGetLocalBookmarksForIndex; processMessage routes to handlers
- `src/ui/bookmarks-table/bookmarks-table.html`: structure, search input, filter controls, table with Storage column, empty state
- `src/ui/bookmarks-table/bookmarks-table.js`: loadBookmarks() (getAggregatedBookmarksForIndex then fallback getLocalBookmarksForIndex), applySearchAndFilter(), renderTableBody() (Storage cell), setSort() (storage key), compare() for storage
- `src/ui/bookmarks-table/bookmarks-table.css`: table, sort indicators, search/filter bar
- `src/ui/popup/popup.html`: bookmarksIndexBtn. PopupController.js: handleOpenBookmarksIndex. UIManager.js: bookmarksIndexBtn click → openBookmarksIndex
- `src/ui/options/options.html`: bookmarks-index-link. options.js: bindElements + init() sets link href

## Related

- IMPL-LOCAL_BOOKMARK_SERVICE (existing local provider)
- IMPL-BOOKMARK_ROUTER (getAllBookmarksForIndex)
- ARCH-LOCAL_BOOKMARKS_INDEX, REQ-LOCAL_BOOKMARKS_INDEX, ARCH-STORAGE_INDEX_AND_ROUTER
