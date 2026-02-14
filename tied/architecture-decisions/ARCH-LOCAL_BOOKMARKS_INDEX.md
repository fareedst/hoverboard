# [ARCH-LOCAL_BOOKMARKS_INDEX] Local Bookmarks Index Architecture

**Status**: Active  
**Cross-references**: REQ-LOCAL_BOOKMARKS_INDEX, IMPL-LOCAL_BOOKMARKS_INDEX

---

## Summary

A **single extension page** (e.g. `bookmarks-table.html`) displays a table of **locally stored bookmarks only**. The data source is always **LocalBookmarkService** (getAllBookmarks), not the current bookmark provider. The page is opened via `chrome.tabs.create`; data is loaded once via message **getLocalBookmarksForIndex**. The table supports **search** (single input over title, URL, tags, notes), **filters** (by tag, to-read, private), **sortable columns** (default: time descending), and **launchable URLs** (link opens in new tab). When there are no local bookmarks, an empty state is shown.

## Data source

- **getLocalBookmarksForIndex**: This message is handled by instantiating or using LocalBookmarkService directly and calling `getAllBookmarks()`. The current provider (Pinboard or local) is not used, so the index always reflects chrome.storage.local.
- When storage mode is Pinboard, the index may be empty; the UI can explain that the index is for locally stored bookmarks only.

## Page design

- **Search**: One text input; case-insensitive substring match on description, url, tags (joined), extended.
- **Filters**: By tag (include/exclude), "To read" only (toread === 'yes'), "Private" only (shared === 'no'). Combined with search; all client-side.
- **Sort**: Click column header to sort; toggle asc/desc. Columns: Title, URL, Tags, Time, Shared, To read (and optionally Extended). Default sort: time descending.
- **Launch**: URL column is `<a href="..." target="_blank" rel="noopener">`.

## Related

- IMPL-LOCAL_BOOKMARKS_INDEX (getAllBookmarks, handler, bookmarks-table UI)
- ARCH-LOCAL_STORAGE_PROVIDER (LocalBookmarkService strategy)
- ARCH-MESSAGE_HANDLING (message routing)
