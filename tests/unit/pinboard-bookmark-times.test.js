/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARK_CREATE_UPDATE_TIMES ===
 * [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [ARCH-BOOKMARK_CREATE_UPDATE_TIMES] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] — Every bookmark has time (create) and updated_at (last update); provider-specific set/normalize; export/import include.
 *
 * ## PINBOARD
 *
 * - [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [ARCH-BOOKMARK_CREATE_UPDATE_TIMES] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] — import create preserves CSV/JSON Time and Updated. How: Implements Pinboard behavior for IMPL-BOOKMARK_CREATE_UPDATE_TIMES.
 * - Contract:
 *   - INPUT: bookmark data (for save), API response (for Pinboard), raw record (for normalize)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark with time and updated_at set per provider and context
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: time = create time; updated_at = last update time
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: PINBOARD
 *   - parseBookmarkResponse / createEmptyBookmark: SET updated_at = time (API has no updated_at)
 *   - SEND to API: do NOT include updated_at
 *   - How (sub-block): If missing updated_at set to time (legacy); include updated_at in payload/CSV/JSON.
 *   - 1. Normalize (url-tags-manager, display, move, export/import):
 *   - IF bookmark has no updated_at: SET updated_at = time   // legacy
 *   - ELSE: keep updated_at
 *   - Include updated_at in payload/CSV/JSON
 *
 * ## ROUTER_STORAGE_BOOKMARK_TIMES
 *
 * - [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [IMPL-BOOKMARK_ROUTER] [IMPL-STORAGE_INDEX] [ARCH-BOOKMARK_CREATE_UPDATE_TIMES] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] [REQ-RELIABILITY] How: Preserves bookmark time fields while router storage operations select a provider and update the storage index.
 * - Contract:
 *   - INPUT: bookmark data, preferred backend, storage providers, storage index
 *   - PRE: bookmark URL and provider map are available
 *   - OUTPUT: provider result with normalized time fields and updated storage index
 *   - POST:
 *     - success => saved bookmark retains time and updated_at; index points to the selected backend
 *   - FAILURE_MODES: ProviderSaveFailed
 *   - DATA: bookmark time fields and storage-index backend mapping
 *   - DATA_TRANSITION: successful save updates the selected URL mapping; failed save leaves the mapping unchanged
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: ROUTER_STORAGE_BOOKMARK_TIMES
 *   - Normalize missing updated_at from time
 *   - Resolve provider from preferred backend
 *   - AWAIT provider save
 *   - IF save succeeds: update storage index for the URL
 *   - RETURN provider result
 *
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_CREATE_UPDATE_TIMES ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-PINBOARD_API ===
 * [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY] — Token auth, endpoint wrappers, 429 retry, 401 handling; get/save/delete/recent. Contract: token and params; API response; base URL and endpoints.
 *
 * ## REQUEST
 *
 * - [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY] How: Implements request(endpoint, params) behavior for IMPL-PINBOARD_API.
 * - Contract:
 *   - INPUT: auth token; endpoint params (url, tag, etc.); optional retry policy
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: API response (bookmark list, success/error); 401/429 handled | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: base URL; token in query; endpoints /posts/get, /posts/recent, /posts/add, /posts/delete
 *   - EFFECTS: Http, IO
 *   - TERMINATION: total
 * - PROCEDURE: REQUEST
 *   - URL = base + endpoint + "?auth_token=" + token + queryString(params)
 *   - response = FETCH URL
 *   - IF 429: WAIT; RETRY with backoff
 *   - IF 401: RETURN error (auth failed)
 *   - RETURN parsed response
 *   - How (sub-block): Provider methods delegate to request with appropriate endpoint.
 *   - 1. getBookmarkForUrl(url): request("/posts/get", { url }); RETURN single post or null
 *   - 2. getRecentBookmarks(count): request("/posts/recent", { count }); RETURN list
 *   - 3. saveBookmark(data): request("/posts/add", data); RETURN result
 *   - 4. deleteBookmark(url): request("/posts/delete", { url }); RETURN result
 *
 * ## ROUTER_STORAGE_PINBOARD
 *
 * - [IMPL-PINBOARD_API] [IMPL-PINBOARD_POSTS_ADD_ENCODING] [IMPL-BOOKMARK_ROUTER] [IMPL-STORAGE_INDEX] [ARCH-PINBOARD_API] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PINBOARD_COMPATIBILITY] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Connects BookmarkRouter preferred-backend selection to Pinboard save and encoded posts/add parameters without a live network call.
 * - Contract:
 *   - INPUT: bookmark data, preferred backend, Pinboard provider, storage index
 *   - PRE: Pinboard provider and router storage index are initialized
 *   - OUTPUT: Pinboard save result and encoded request parameters
 *   - POST:
 *     - success => router delegates to Pinboard and encoded values preserve fragments and plus characters
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: bookmark fields, encoded parameter pairs, storage-index backend mapping
 *   - DATA_TRANSITION: successful router save records pinboard as the URL backend
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: ROUTER_STORAGE_PINBOARD
 *   - Resolve pinboard from preferred backend
 *   - AWAIT provider save
 *   - Encode each posts/add value
 *   - Update storage index after successful save
 *   - RETURN provider result
 *
 * === END IMPL-FULL-BLOCK: IMPL-PINBOARD_API ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-PINBOARD_POSTS_ADD_ENCODING ===
 * [IMPL-PINBOARD_POSTS_ADD_ENCODING] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY] — buildSaveParams with encodeURIComponent for posts/add so #, +, etc. are safe. Contract: bookmarkData in; encoded query string out.
 * 
 * ## BUILD_SAVE_PARAMS
 * 
 * - [IMPL-PINBOARD_POSTS_ADD_ENCODING] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY] How: Implements buildSaveParams(bookmarkData) behavior for IMPL-PINBOARD_POSTS_ADD_ENCODING.
 * - Contract:
 *   - INPUT: bookmarkData (url, description, extended, tags, shared, toread)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: query string safe for posts/add URL (no raw #, +, &, = in values)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: param names and values from bookmarkData
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: BUILD_SAVE_PARAMS
 *   - pairs = []
 *   - FOR each key in [url, description, extended, tags, shared, toread]:
 *   - value = bookmarkData[key] (or default)
 *   - encoded = encodeURIComponent(value)
 *   - pairs.push(key + "=" + encoded)
 *   - RETURN pairs.join("&")
 *   - How (sub-block): Use result in posts/add URL so fragment and plus are not misinterpreted.
 *   - 1. usage: BUILD posts/add request URL as baseUrl + "?" + buildSaveParams(bookmarkData) so fragment and plus are not misinterpreted by server or transport.
 * 
 * === END IMPL-FULL-BLOCK: IMPL-PINBOARD_POSTS_ADD_ENCODING ===
 */
import { PinboardService } from '../../src/features/pinboard/pinboard-service.js'

describe('PinboardService bookmark times [REQ-BOOKMARK_CREATE_UPDATE_TIMES]', () => {
  let service

  beforeEach(() => {
    service = new PinboardService()
  })

  describe('createEmptyBookmark', () => {
    test('includes updated_at empty [IMPL-BOOKMARK_CREATE_UPDATE_TIMES]', () => {
      const b = service.createEmptyBookmark('https://example.com', 'Title')
      expect(b).toHaveProperty('updated_at', '')
      expect(b.time).toBe('')
    })
  })

  describe('parseBookmarkResponse', () => {
    test('sets updated_at equal to time from API [IMPL-BOOKMARK_CREATE_UPDATE_TIMES]', () => {
      const xmlObj = {
        posts: {
          post: [
            {
              '@_href': 'https://example.com',
              '@_description': 'Example',
              '@_extended': '',
              '@_tag': 'a b',
              '@_time': '2026-02-14T12:00:00.000Z',
              '@_shared': 'yes',
              '@_toread': 'no',
              '@_hash': 'h'
            }
          ]
        }
      }
      const result = service.parseBookmarkResponse(xmlObj, 'https://example.com', 'Example')
      expect(result.time).toBe('2026-02-14T12:00:00.000Z')
      expect(result.updated_at).toBe('2026-02-14T12:00:00.000Z')
    })

    test('single post object (not array) sets updated_at equal to time', () => {
      const xmlObj = {
        posts: {
          post: {
            '@_href': 'https://single.com',
            '@_description': 'Single',
            '@_tag': '',
            '@_time': '2026-02-10T08:00:00.000Z',
            '@_shared': 'yes',
            '@_toread': 'no',
            '@_hash': ''
          }
        }
      }
      const result = service.parseBookmarkResponse(xmlObj, 'https://single.com', 'Single')
      expect(result.time).toBe('2026-02-10T08:00:00.000Z')
      expect(result.updated_at).toBe('2026-02-10T08:00:00.000Z')
    })
  })
})
