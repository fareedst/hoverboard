# [IMPL-PINBOARD_POSTS_ADD_ENCODING] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY] — buildSaveParams with encodeURIComponent for posts/add so #, +, etc. are safe. Contract: bookmarkData in; encoded query string out.

## BUILD_SAVE_PARAMS

- [IMPL-PINBOARD_POSTS_ADD_ENCODING] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY] How: Implements buildSaveParams(bookmarkData) behavior for IMPL-PINBOARD_POSTS_ADD_ENCODING.
- Contract:
  - INPUT: bookmarkData (url, description, extended, tags, shared, toread)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: query string safe for posts/add URL (no raw #, +, &, = in values)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: param names and values from bookmarkData
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: BUILD_SAVE_PARAMS
  - pairs = []
  - FOR each key in [url, description, extended, tags, shared, toread]:
  - value = bookmarkData[key] (or default)
  - encoded = encodeURIComponent(value)
  - pairs.push(key + "=" + encoded)
  - RETURN pairs.join("&")
  - How (sub-block): Use result in posts/add URL so fragment and plus are not misinterpreted.
  - 1. usage: BUILD posts/add request URL as baseUrl + "?" + buildSaveParams(bookmarkData) so fragment and plus are not misinterpreted by server or transport.

## ROUTER_STORAGE_PINBOARD

- [IMPL-PINBOARD_POSTS_ADD_ENCODING] [IMPL-PINBOARD_API] [IMPL-BOOKMARK_ROUTER] [IMPL-STORAGE_INDEX] [ARCH-PINBOARD_API] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PINBOARD_COMPATIBILITY] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Ensures router-selected Pinboard saves use encoded posts/add values before provider persistence.
- Contract:
  - INPUT: bookmark fields and router-selected Pinboard provider
  - PRE: posts/add parameter builder and provider save path are available
  - OUTPUT: encoded parameter string and successful provider result
  - POST:
    - success => reserved URL/value characters remain encoded through the router path
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: ROUTER_STORAGE_PINBOARD
  - Receive bookmark data from router
  - BUILD encoded posts/add parameters
  - AWAIT Pinboard provider save
  - RETURN provider result
