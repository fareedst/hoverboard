# [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] Local Bookmarks Index Export Architecture

**Status**: Active  
**Cross-references**: REQ-LOCAL_BOOKMARKS_INDEX_EXPORT, IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT

---

## Summary

Export is implemented **entirely on the index page** (client-side). Data comes from the in-memory arrays already present: **allBookmarks** (all local bookmarks) or **filteredBookmarks** (currently displayed after search/filter/sort). No new background message is required. The chosen scope is serialized to **CSV** (columns: title, url, tags, time, shared, toread, notes) and/or **JSON** (full bookmark objects). Download is triggered via Blob, object URL, and a temporary anchor with the `download` attribute.

## Data source

- **allBookmarks**: Full list returned by getAggregatedBookmarksForIndex (or getLocalBookmarksForIndex fallback); used for "Export all". Items include `storage` field ('local' | 'file').
- **filteredBookmarks**: Result of applying search and filters (and current sort); used for "Export displayed".

## Export format

- **CSV**: Header row (Title, URL, Tags, Time, Storage, Shared, To read, Notes). Data rows: quoted fields; internal double-quotes escaped as `""`; tags joined (e.g. comma); Storage column (Local | File). Enables use in spreadsheets.
- **JSON** (optional): Array of bookmark objects as returned from the index (description, url, tags, time, shared, toread, extended, etc.).

## Download mechanism

- Build string (CSV or JSON).
- Create Blob (e.g. `text/csv; charset=utf-8` or `application/json`).
- Create object URL; create `<a download="filename">`, set href to object URL; programmatic click(); revokeObjectURL; remove anchor.

## Related

- IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT (export UI and exportBookmarks implementation)
- ARCH-LOCAL_BOOKMARKS_INDEX (index page this export extends)
