# [ARCH-FILE_BOOKMARK_PROVIDER] File-Based Bookmark Provider

**Status**: Active  
**Cross-references**: REQ-FILE_BOOKMARK_STORAGE, ARCH-LOCAL_STORAGE_PROVIDER, IMPL-FILE_BOOKMARK_SERVICE

---

## Summary

A third bookmark storage backend is **file-based**: a single user-chosen directory contains one JSON file (e.g. `hoverboard-bookmarks.json`). The **FileBookmarkService** implements the same provider contract as PinboardService and LocalBookmarkService. File I/O runs in a **document context** (offscreen document or options page) because MV3 service workers cannot use the File System Access API; the directory handle is stored in **IndexedDB**.

## Rationale

- **Problem**: No way to store bookmarks in a cloud-synced folder or share a file with ad-hoc groups.
- **Solution**: File-based provider with one file per directory; file format versioned for compatibility.

## Implementation Notes

- **Adapter abstraction**: readBookmarksFile(), writeBookmarksFile(data). Enables unit tests with in-memory mock; real adapter uses File System Access (directory handle + getFileHandle + createWritable/read) in offscreen or options context.
- **File format**: `{ "version": 1, "bookmarks": { "<url>": { ... } } }` — same bookmark shape as local storage.

## Related

- IMPL-FILE_BOOKMARK_SERVICE (service and adapter implementation)
- ARCH-LOCAL_STORAGE_PROVIDER (strategy pattern for providers)
