# [IMPL-LOCAL_BOOKMARKS_INDEX] Local Bookmarks Index Implementation

**Status**: Active  
**Cross-references**: ARCH-LOCAL_BOOKMARKS_INDEX, REQ-LOCAL_BOOKMARKS_INDEX

---

## Summary

- **LocalBookmarkService.getAllBookmarks()**: Public method that returns the full normalized array of bookmarks from chrome.storage.local (using existing _getAllBookmarks and _normalizeBookmark), sorted by time descending.
- **Message getLocalBookmarksForIndex**: Message type `getLocalBookmarksForIndex`; handler always uses LocalBookmarkService (not this.bookmarkProvider), calls getAllBookmarks(), returns { bookmarks }.
- **Bookmarks table page**: `src/ui/bookmarks-table/bookmarks-table.html`, `bookmarks-table.js`, `bookmarks-table.css`. On load, page sends getLocalBookmarksForIndex, receives list, renders table; implements search (single input over description/url/tags/extended), filters (tag include, toread only, private only), column sort (toggle asc/desc), URL column as links. All operations client-side on in-memory array.
- **Entry point**: Popup footer has "Bookmarks index" button (bookmarksIndexBtn); click emits openBookmarksIndex, PopupController.handleOpenBookmarksIndex opens tab. Options footer has "Local bookmarks index" link (bookmarks-index-link); options.js sets href in init() to chrome.runtime.getURL('src/ui/bookmarks-table/bookmarks-table.html').

## Code locations

- `src/features/storage/local-bookmark-service.js`: getAllBookmarks()
- `src/core/message-handler.js`: MESSAGE_TYPES.GET_LOCAL_BOOKMARKS_FOR_INDEX, handleGetLocalBookmarksForIndex; processMessage routes to handler
- `src/ui/bookmarks-table/bookmarks-table.html`: structure, search input, filter controls, table container, empty state
- `src/ui/bookmarks-table/bookmarks-table.js`: loadBookmarks(), applySearchAndFilter(), renderTableBody(), setSort()
- `src/ui/bookmarks-table/bookmarks-table.css`: table, sort indicators, search/filter bar
- `src/ui/popup/popup.html`: bookmarksIndexBtn. PopupController.js: handleOpenBookmarksIndex. UIManager.js: bookmarksIndexBtn click → openBookmarksIndex
- `src/ui/options/options.html`: bookmarks-index-link. options.js: bindElements + init() sets link href

## Related

- IMPL-LOCAL_BOOKMARK_SERVICE (existing local provider)
- ARCH-LOCAL_BOOKMARKS_INDEX, REQ-LOCAL_BOOKMARKS_INDEX
