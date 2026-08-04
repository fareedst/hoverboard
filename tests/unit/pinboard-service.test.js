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
 * ## ROUTER_STORAGE_PINBOARD
 *
 * - [IMPL-PINBOARD_POSTS_ADD_ENCODING] [IMPL-PINBOARD_API] [IMPL-BOOKMARK_ROUTER] [IMPL-STORAGE_INDEX] [ARCH-PINBOARD_API] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PINBOARD_COMPATIBILITY] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Ensures router-selected Pinboard saves use encoded posts/add values before provider persistence.
 * - Contract:
 *   - INPUT: bookmark fields and router-selected Pinboard provider
 *   - PRE: posts/add parameter builder and provider save path are available
 *   - OUTPUT: encoded parameter string and successful provider result
 *   - POST:
 *     - success => reserved URL/value characters remain encoded through the router path
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: ROUTER_STORAGE_PINBOARD
 *   - Receive bookmark data from router
 *   - BUILD encoded posts/add parameters
 *   - AWAIT Pinboard provider save
 *   - RETURN provider result
 *
 * === END IMPL-FULL-BLOCK: IMPL-PINBOARD_POSTS_ADD_ENCODING ===
 */
import { PinboardService } from '../../src/features/pinboard/pinboard-service.js'

describe('[IMPL-PINBOARD_API] REQUEST and wrappers', () => {
  let service
  let configManager

  beforeEach(() => {
    service = new PinboardService({
      sanitizeTag: (s) => s,
      handleTagAddition: jest.fn().mockResolvedValue(undefined)
    })
    configManager = {
      hasAuthToken: jest.fn().mockResolvedValue(true),
      getAuthTokenParam: jest.fn().mockResolvedValue('auth_token=user:secret'),
      getConfig: jest.fn().mockResolvedValue({ pinRetryCountMax: 2, pinRetryDelay: 1 })
    }
    service.configManager = configManager
    service.sleep = jest.fn().mockResolvedValue(undefined)
    service.retryDelays = [1, 1]
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('makeApiRequest includes auth_token in URL [IMPL-PINBOARD_API]', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => '<result code="done" />'
    })
    service.parseXmlResponse = jest.fn().mockReturnValue({ result: { '@_code': 'done' } })
    await service.makeApiRequest('posts/get?url=https%3A%2F%2Fe.com')
    expect(global.fetch).toHaveBeenCalled()
    const calledUrl = global.fetch.mock.calls[0][0]
    expect(calledUrl).toContain('auth_token=user:secret')
    expect(calledUrl).toContain('posts/get')
  })

  test('makeApiRequest throws when no auth [IMPL-PINBOARD_API]', async () => {
    configManager.hasAuthToken.mockResolvedValue(false)
    await expect(service.makeApiRequest('posts/get?url=x')).rejects.toThrow('No authentication token')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  test('retries on 429 then succeeds [IMPL-PINBOARD_API]', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => ''
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => '<ok />'
      })
    service.parseXmlResponse = jest.fn().mockReturnValue({ ok: true })
    await service.makeRequestWithRetry('https://api.pinboard.in/v1/posts/get?auth_token=t', 'GET')
    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(service.sleep).toHaveBeenCalled()
  })

  test('does not retry 401 auth failures [IMPL-PINBOARD_API]', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => ''
    })
    await expect(
      service.makeRequestWithRetry('https://api.pinboard.in/v1/posts/get?auth_token=t', 'GET')
    ).rejects.toThrow(/401/)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  test('getBookmarkForUrl short-circuits without auth (no fetch) [IMPL-PINBOARD_API]', async () => {
    configManager.hasAuthToken.mockResolvedValue(false)
    const bm = await service.getBookmarkForUrl('https://example.com', 'Title')
    expect(global.fetch).not.toHaveBeenCalled()
    expect(bm.url).toBe('https://example.com')
    expect(bm.tags).toEqual([])
  })
})

describe('[IMPL-PINBOARD_POSTS_ADD_ENCODING] buildSaveParams', () => {
  let service

  beforeEach(() => {
    service = new PinboardService({
      sanitizeTag: (s) => s,
      handleTagAddition: jest.fn().mockResolvedValue(undefined)
    })
  })

  test('encodes # + & = in values [IMPL-PINBOARD_POSTS_ADD_ENCODING]', () => {
    const qs = service.buildSaveParams({
      url: 'https://example.com/a?x=1&y=2',
      description: 'C# + Node',
      extended: 'a=b&c=d',
      tags: ['c#', 'a+b'],
      shared: 'yes',
      toread: 'no'
    })
    expect(qs).toContain('url=' + encodeURIComponent('https://example.com/a?x=1&y=2'))
    expect(qs).toContain('description=' + encodeURIComponent('C# + Node'))
    expect(qs).not.toMatch(/description=C#/)
    expect(qs).toContain('tags=' + encodeURIComponent('c# a+b'))
    expect(qs).toContain('shared=yes')
    expect(qs).toContain('toread=no')
  })
})
