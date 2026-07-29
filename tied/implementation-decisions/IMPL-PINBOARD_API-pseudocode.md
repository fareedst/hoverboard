# [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]
# Token auth, endpoint wrappers, 429 retry, 401 handling; get/save/delete/recent.
# Contract: token and params; API response; base URL and endpoints.
INPUT: auth token; endpoint params (url, tag, etc.); optional retry policy
OUTPUT: API response (bookmark list, success/error); 401/429 handled
DATA: base URL; token in query; endpoints /posts/get, /posts/recent, /posts/add, /posts/delete

# Build URL with token and params; fetch; retry on 429; return error on 401.
request(endpoint, params):
  URL = base + endpoint + "?auth_token=" + token + queryString(params)
  response = FETCH URL
  IF 429: WAIT; RETRY with backoff
  IF 401: RETURN error (auth failed)
  RETURN parsed response

# Provider methods delegate to request with appropriate endpoint.
getBookmarkForUrl(url): request("/posts/get", { url }); RETURN single post or null
getRecentBookmarks(count): request("/posts/recent", { count }); RETURN list
saveBookmark(data): request("/posts/add", data); RETURN result
deleteBookmark(url): request("/posts/delete", { url }); RETURN result
