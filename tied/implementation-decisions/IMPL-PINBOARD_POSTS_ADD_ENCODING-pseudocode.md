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
