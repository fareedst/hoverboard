# [ARCH-MOVE_BOOKMARK_UI] Move Bookmark Storage UI

**Status**: Active  
**Cross-references**: REQ-MOVE_BOOKMARK_STORAGE_UI, ARCH-STORAGE_INDEX_AND_ROUTER, IMPL-MOVE_BOOKMARK_UI

---

## Summary

Popup displays the **current storage backend** for the current tab's bookmark and allows the user to **move** it to another backend (Pinboard, Local, File). Move is implemented in the router: copy bookmark to target provider, delete from source provider, update storage index. When the bookmark is in Local or File, a dedicated control (file ↔ browser toggle) offers one-click move between those two backends; the same move path is used (moveBookmarkToStorage).

## Related

- IMPL-MOVE_BOOKMARK_UI (popup select and messaging)
- ARCH-STORAGE_INDEX_AND_ROUTER (router.moveBookmarkToStorage)
