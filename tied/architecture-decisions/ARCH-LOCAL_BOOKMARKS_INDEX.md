# [ARCH-LOCAL_BOOKMARKS_INDEX] Local Bookmarks Index Architecture

**Status**: Active  
**Cross-references**: REQ-LOCAL_BOOKMARKS_INDEX, IMPL-LOCAL_BOOKMARKS_INDEX, ARCH-STORAGE_INDEX_AND_ROUTER

---

## Summary

A **single extension page** (e.g. `bookmarks-table.html`) displays a table of **local and file-stored bookmarks** (non-Pinboard). The primary data source is message **getAggregatedBookmarksForIndex**, which returns bookmarks from LocalBookmarkService and FileBookmarkService (via BookmarkRouter.getAllBookmarksForIndex), each item tagged with `storage: 'local'` or `'file'`. Fallback: **getLocalBookmarksForIndex** (LocalBookmarkService only, all items `storage: 'local'`) when the router is not used. The table includes a **Storage** column (Local | File), supports **search** (single input over title, URL, tags, notes), **filters** (by tag, to-read, private), **sortable columns** (including Storage; default: time descending), and **launchable URLs** (link opens in new tab). When there are no local or file bookmarks, an empty state is shown.

## Data source

- **getAggregatedBookmarksForIndex**: Handled by calling `bookmarkProvider.getAllBookmarksForIndex()` when the provider is BookmarkRouter; router aggregates `localProvider.getAllBookmarks()` and `fileProvider.getAllBookmarks()`, adds `storage: 'local'` or `'file'`, merges and sorts by time desc.
- **getLocalBookmarksForIndex**: Fallback when aggregated is unavailable; uses LocalBookmarkService directly, returns local bookmarks only (index page tags each with `storage: 'local'`).
- Pinboard bookmarks are not shown in this index.

## Page design

- **Search**: One text input; case-insensitive substring match on description, url, tags (joined), extended.
- **Filters**: By tag (include), "To read" only (toread === 'yes'), "Private" only (shared === 'no'). Combined with search; all client-side.
- **Sort**: Click column header to sort; toggle asc/desc. Columns: Title, URL, Tags, Time, **Storage** (Local | File), Shared, To read. Default sort: time descending.
- **Launch**: URL column is `<a href="..." target="_blank" rel="noopener">`.

## Related

- IMPL-LOCAL_BOOKMARKS_INDEX (getAggregatedBookmarksForIndex / getLocalBookmarksForIndex, handler, bookmarks-table UI with Storage column)
- ARCH-STORAGE_INDEX_AND_ROUTER (BookmarkRouter, getAllBookmarksForIndex)
- ARCH-LOCAL_STORAGE_PROVIDER (LocalBookmarkService strategy)
- ARCH-MESSAGE_HANDLING (message routing)
