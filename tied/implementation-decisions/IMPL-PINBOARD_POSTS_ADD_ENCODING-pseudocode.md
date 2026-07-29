# [IMPL-PINBOARD_POSTS_ADD_ENCODING] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]
# buildSaveParams with encodeURIComponent for posts/add so #, +, etc. are safe.
# Related IMPLs: [IMPL-PINBOARD_API] [IMPL-TAG_SYSTEM]
# Contract: bookmarkData in; encoded query string out.
INPUT: bookmarkData (url, description, extended, tags, shared, toread)
OUTPUT: query string safe for posts/add URL (no raw #, +, &, = in values)
DATA: param names and values from bookmarkData

# Encode each param value and join as key=value&...
buildSaveParams(bookmarkData):
  pairs = []
  FOR each key in [url, description, extended, tags, shared, toread]:
    value = bookmarkData[key] (or default)
    encoded = encodeURIComponent(value)
    pairs.push(key + "=" + encoded)
  RETURN pairs.join("&")

# Use result in posts/add URL so fragment and plus are not misinterpreted.
usage: BUILD posts/add request URL as baseUrl + "?" + buildSaveParams(bookmarkData) so fragment and plus are not misinterpreted by server or transport.
