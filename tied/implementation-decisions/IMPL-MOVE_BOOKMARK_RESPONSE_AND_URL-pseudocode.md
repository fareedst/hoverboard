# [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL] [REQ-MOVE_BOOKMARK_STORAGE_UI] — Popup uses response.data for success/error; move uses currentPin.url; router sets time when missing. Contract: response and currentPin/currentTab; UI and move request and router behavior.

## MAIN

- [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL] [REQ-MOVE_BOOKMARK_STORAGE_UI] How: Logical block for IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL.
- Contract:
  - INPUT: response (from moveBookmarkToStorage message), currentPin (bookmark), currentTab (tab URL)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: correct success/error UI; move request with correct URL; router allows no-time bookmark | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: service worker returns { success: true, data: routerResult }; routerResult = { success, message?, ... }
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: MAIN
  - How (sub-block): Use inner result for success/error and refresh.
  - 1. Popup — unwrap inner result:
  - 2.   result = response?.data ?? response
  - 3.   IF result?.success: show success; refresh bookmark; update storage UI
  - 4.   ELSE: show error (result?.message or generic)
  - How (sub-block): Prefer currentPin.url so key matches storage.
  - 5. Popup — URL for move:
  - 6.   url = currentPin?.url || currentTab?.url
  - 7.   SEND moveBookmarkToStorage(url, targetBackend)   // same key as storage, avoids tab-URL mismatch
  - How (sub-block): Set time when missing; save to target, delete from source, update index.
  - 8. Router — move when bookmark has no time:
  - 9.   bookmark = sourceProvider.getBookmarkForUrl(url)
  - 10.   IF bookmark has url and (time missing or invalid):
  - 11.     toSave = { ...bookmark, time: now ISO }
  - 12.   ELSE: toSave = bookmark
  - 13.   targetProvider.saveBookmark(toSave)
  - 14.   sourceProvider.deleteBookmark(url)
  - 15.   storageIndex.setBackendForUrl(url, targetBackend)
