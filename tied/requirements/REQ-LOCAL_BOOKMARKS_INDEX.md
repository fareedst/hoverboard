# [REQ-LOCAL_BOOKMARKS_INDEX] Local Bookmarks Index Page

**Status**: Implemented  
**Cross-references**: ARCH-LOCAL_BOOKMARKS_INDEX, IMPL-LOCAL_BOOKMARKS_INDEX

---

## Summary

A dedicated extension page shows **only locally stored bookmarks** (chrome.storage.local via LocalBookmarkService). Data is **live only**—no static or hardcoded bookmark data. The page must be **searchable** (text across title, URL, tags, notes), **filterable** (by tag, to-read, private), **sortable** (column click, default time descending), and **launchable** (URL opens in new tab).

## Purpose

- Give users a single place to browse and search all local bookmarks.
- Support finding and opening bookmarks without leaving the extension.
- Keep the index local-only; Pinboard data is not shown in this index.

## Satisfaction criteria

- **Backend**: LocalBookmarkService exposes `getAllBookmarks()` returning the full normalized array (sorted by time desc). Message `getLocalBookmarksForIndex` always uses LocalBookmarkService (not the current provider), so the index reflects local storage even when storage mode is Pinboard.
- **Table page**: Implements search (single input, case-insensitive match on description, url, tags, extended), filters (tag include/exclude, toread only, shared/private), sortable columns (Title, URL, Tags, Time, Shared, To read; default sort time desc), and URL column as links (`target="_blank"`).
- **Entry point**: Popup and/or options provide a link/button that opens the index page in a new tab via `chrome.tabs.create({ url: chrome.runtime.getURL('src/ui/bookmarks-table/bookmarks-table.html') })`.

## How validated

- Manual: Open index page, confirm local bookmarks load; run search, filters, sort; click URL to open in new tab.
- Optional unit tests: `getAllBookmarks()` returns normalized list; handler for `getLocalBookmarksForIndex` uses LocalBookmarkService only.

## Related

- ARCH-LOCAL_BOOKMARKS_INDEX (architecture for dedicated page and local-only data source)
- IMPL-LOCAL_BOOKMARKS_INDEX (getAllBookmarks, message handler, bookmarks-table UI)
- REQ-STORAGE_MODE_DEFAULT (local vs Pinboard mode)
- REQ-CHROME_STORAGE_USAGE (chrome.storage.local)
