# [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT] Local Bookmarks Index Export

**Status**: Implemented  
**Cross-references**: ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT, IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT, REQ-LOCAL_BOOKMARKS_INDEX

---

## Summary

From the local bookmarks index page, the user can **export bookmarks as a downloadable file**. Two scopes are supported: **all** (entire list of local + file bookmarks loaded on the page) or **currently displayed** (filtered/sorted rows shown in the table). The file is downloaded client-side (e.g. CSV or JSON). CSV includes a **Storage** column (Local | File).

## Purpose

- Allow users to backup or port index data outside the extension.
- Support exporting either the full local+file set or the current filtered/sorted view, including storage location.

## Satisfaction criteria

- **Export control(s)** in the index page UI with clear scope (all vs displayed).
- **Export all**: Downloads a file containing every bookmark shown in the index (local + file; same as full list loaded on the page).
- **Export displayed**: Downloads a file containing only the rows currently shown (after search/filter/sort).
- **At least one format**: CSV (recommended for table-like export; columns include Title, URL, Tags, Time, **Storage**, Shared, To read, Notes); optionally JSON for full record structure.
- **Download** is triggered client-side (no backend export message).

## How validated

- Manual: Open index page, click "Export all" and "Export displayed"; verify CSV downloads with correct row counts and content; verify "Export displayed" reflects current filters/sort.

## Related

- ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT (client-side export architecture)
- IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT (export UI and serialization)
- REQ-LOCAL_BOOKMARKS_INDEX (index page this export extends)
