# [IMPL-PINBOARD_POSTS_ADD_ENCODING] Pinboard posts/add query parameter encoding

**Status**: Active  
**Cross-references**: IMPL-PINBOARD_API, IMPL-TAG_SYSTEM

---

## Summary

`posts/add` query parameters are explicitly percent-encoded (via `encodeURIComponent`) so that tags and other user-controlled fields containing `#`, `+`, `.`, `&`, `=`, etc. do not break the API request.

## Rationale

- **Problem**: Store-tag API calls failed when tags contained `#`, `+`, or `.` because the request URL was not safely encoded. Unencoded `#` starts the URL fragment so the server may not receive `auth_token` or other params; unencoded `+` is interpreted as space.
- **Solution**: In `buildSaveParams`, build the query string from `key=encodeURIComponent(value)` pairs and `join('&')` instead of relying on `URLSearchParams`, so encoding is guaranteed in all runtimes (extension and Safari).

## Implementation

- **Files**: `src/features/pinboard/pinboard-service.js`, `safari/src/features/pinboard/pinboard-service.js`
- **Function**: `buildSaveParams(bookmarkData)` — builds `pairs` with `encodeURIComponent` for `url`, `description`, `extended`, `tags`, `shared`, `toread`, then returns `pairs.join('&')`.

## Tests

- `tests/unit/tag-storage.test.js`: "should save tag with special characters (#, +, .) with percent-encoded URL" — asserts the `posts/add` fetch URL contains `%23` and `%2B` and does not contain unencoded `#` or `+` in the tags parameter.

## Related

- IMPL-PINBOARD_API (endpoints and auth)
- IMPL-TAG_SYSTEM (tag handling and sanitization; this fix preserves special characters in stored tags via encoding rather than stripping them)
