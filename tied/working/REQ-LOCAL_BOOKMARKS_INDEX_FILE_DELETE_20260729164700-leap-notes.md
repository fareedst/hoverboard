# Out-of-scope notes (future CITDP)

From File-store Delete fix (2026-07-29):

1. **Delete result UI** — **Delivered** by `CITDP-REQ-LOCAL_BOOKMARKS_INDEX-delete-status` (`#delete-result` pending/final).
2. **External restore of `hoverboard-bookmarks.json`** — If a cloud-synced File directory rewrites the file after a durable delete, rows can reappear; out of Hoverboard control.
3. **Composition** — **Delivered:** `message-handler-router-storage.integration.test.js` (preferredBackend file delete + adapter WRITE); `bookmarks-table-bulk-delete-composition.integration.test.js` (`runBulkDelete`).
