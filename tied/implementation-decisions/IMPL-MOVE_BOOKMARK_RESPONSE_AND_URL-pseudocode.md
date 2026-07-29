# [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL] [REQ-MOVE_BOOKMARK_STORAGE_UI]
# Popup uses response.data for success/error; move uses currentPin.url; router sets time when missing.
# Contract: response and currentPin/currentTab; UI and move request and router behavior.
INPUT: response (from moveBookmarkToStorage message), currentPin (bookmark), currentTab (tab URL)
OUTPUT: correct success/error UI; move request with correct URL; router allows no-time bookmark
DATA: service worker returns { success: true, data: routerResult }; routerResult = { success, message?, ... }

# Use inner result for success/error and refresh.
Popup — unwrap inner result:
  result = response?.data ?? response
  IF result?.success: show success; refresh bookmark; update storage UI
  ELSE: show error (result?.message or generic)

# Prefer currentPin.url so key matches storage.
Popup — URL for move:
  url = currentPin?.url || currentTab?.url
  SEND moveBookmarkToStorage(url, targetBackend)   // same key as storage, avoids tab-URL mismatch

# Set time when missing; save to target, delete from source, update index.
Router — move when bookmark has no time:
  bookmark = sourceProvider.getBookmarkForUrl(url)
  IF bookmark has url and (time missing or invalid):
    toSave = { ...bookmark, time: now ISO }
  ELSE: toSave = bookmark
  targetProvider.saveBookmark(toSave)
  sourceProvider.deleteBookmark(url)
  storageIndex.setBackendForUrl(url, targetBackend)
