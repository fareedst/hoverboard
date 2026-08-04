# [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY] — Token auth, endpoint wrappers, 429 retry, 401 handling; get/save/delete/recent. Contract: token and params; API response; base URL and endpoints.

## REQUEST

- [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY] How: Implements request(endpoint, params) behavior for IMPL-PINBOARD_API.
- Contract:
  - INPUT: auth token; endpoint params (url, tag, etc.); optional retry policy
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: API response (bookmark list, success/error); 401/429 handled | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: base URL; token in query; endpoints /posts/get, /posts/recent, /posts/add, /posts/delete
  - EFFECTS: Http, IO
  - TERMINATION: total
- PROCEDURE: REQUEST
  - URL = base + endpoint + "?auth_token=" + token + queryString(params)
  - response = FETCH URL
  - IF 429: WAIT; RETRY with backoff
  - IF 401: RETURN error (auth failed)
  - RETURN parsed response
  - How (sub-block): Provider methods delegate to request with appropriate endpoint.
  - 1. getBookmarkForUrl(url): request("/posts/get", { url }); RETURN single post or null
  - 2. getRecentBookmarks(count): request("/posts/recent", { count }); RETURN list
  - 3. saveBookmark(data): request("/posts/add", data); RETURN result
  - 4. deleteBookmark(url): request("/posts/delete", { url }); RETURN result

## ROUTER_STORAGE_PINBOARD

- [IMPL-PINBOARD_API] [IMPL-PINBOARD_POSTS_ADD_ENCODING] [IMPL-BOOKMARK_ROUTER] [IMPL-STORAGE_INDEX] [ARCH-PINBOARD_API] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PINBOARD_COMPATIBILITY] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Connects BookmarkRouter preferred-backend selection to Pinboard save and encoded posts/add parameters without a live network call.
- Contract:
  - INPUT: bookmark data, preferred backend, Pinboard provider, storage index
  - PRE: Pinboard provider and router storage index are initialized
  - OUTPUT: Pinboard save result and encoded request parameters
  - POST:
    - success => router delegates to Pinboard and encoded values preserve fragments and plus characters
  - FAILURE_MODES: OperationFailed
  - DATA: bookmark fields, encoded parameter pairs, storage-index backend mapping
  - DATA_TRANSITION: successful router save records pinboard as the URL backend
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: ROUTER_STORAGE_PINBOARD
  - Resolve pinboard from preferred backend
  - AWAIT provider save
  - Encode each posts/add value
  - Update storage index after successful save
  - RETURN provider result
