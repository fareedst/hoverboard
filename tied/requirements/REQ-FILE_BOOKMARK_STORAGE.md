# [REQ-FILE_BOOKMARK_STORAGE] File-Based Bookmark Storage

**Status**: Planned  
**Cross-references**: ARCH-FILE_BOOKMARK_PROVIDER, IMPL-FILE_BOOKMARK_SERVICE

---

## Summary

The extension supports a third bookmark storage backend: **file-based**. Bookmarks are stored in a **single user-chosen directory** in a **single file** (e.g. `hoverboard-bookmarks.json`) in a format suitable for **cloud sync** and **ad-hoc sharing** with groups. The file-based provider implements the same contract as PinboardService and LocalBookmarkService.

## Purpose

- Enable storing bookmarks in a folder that can be cloud-synchronized (e.g. Dropbox, Drive).
- Allow sharing the bookmark file with ad-hoc groups.
- Keep one file per directory for simple conflict semantics (last-write-wins when synced).

## Satisfaction Criteria

- File-based provider exposes: getBookmarkForUrl, getRecentBookmarks, saveBookmark, deleteBookmark, saveTag, deleteTag, testConnection.
- File format: `{ "version": 1, "bookmarks": { "<url>": { bookmark object } } }`; same bookmark shape as local (url, description, extended, tags, time, shared, toread, hash).
- File I/O is behind an abstraction (adapter) so the module is testable with a mocked/in-memory adapter.

## Validation Criteria

- Unit tests with mocked adapter: save/get/delete, getRecentBookmarks order, saveTag/deleteTag, edge cases (empty file, missing URL, invalid JSON).

## Related

- ARCH-FILE_BOOKMARK_PROVIDER (architecture for file provider and adapter)
- IMPL-FILE_BOOKMARK_SERVICE (implementation and file format)
- REQ-STORAGE_MODE_DEFAULT (existing storage modes)
