# [IMPL-FILE_BOOKMARK_SERVICE] File Bookmark Service

**Status**: Active  
**Cross-references**: REQ-FILE_BOOKMARK_STORAGE, ARCH-FILE_BOOKMARK_PROVIDER

---

## Summary

**FileBookmarkStorageAdapter** provides an abstraction for reading and writing the bookmarks file: `readBookmarksFile()` returns `Promise<{ version, bookmarks }>`, `writeBookmarksFile(data)` writes the same shape. **FileBookmarkService** uses the adapter to implement the full provider contract (getBookmarkForUrl, getRecentBookmarks, saveBookmark, deleteBookmark, saveTag, deleteTag, testConnection). Bookmark shape and URL normalization match LocalBookmarkService. Filename in the directory: **hoverboard-bookmarks.json**.

## File format [REQ-FILE_BOOKMARK_STORAGE]

```json
{
  "version": 1,
  "bookmarks": {
    "https://example.com/page": {
      "url": "https://example.com/page",
      "description": "Title",
      "extended": "",
      "tags": ["tag1", "tag2"],
      "time": "2026-02-14T12:00:00.000Z",
      "shared": "yes",
      "toread": "no",
      "hash": "file-abc123"
    }
  }
}
```

Stored as URL -> bookmark object; tags in file may be array or space-separated string; service normalizes to array for return values.

## Code locations

- `src/features/storage/file-bookmark-storage-adapter.js`: Adapter interface; InMemoryFileBookmarkAdapter for tests (and optional default when no directory set).
- `src/features/storage/file-bookmark-service.js`: FileBookmarkService class; constructor accepts adapter (and optional TagService).

## Related

- IMPL-LOCAL_BOOKMARK_SERVICE (same contract and bookmark shape)
- ARCH-FILE_BOOKMARK_PROVIDER (file I/O in document context)
