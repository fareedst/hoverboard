/**
 * === IMPL-FULL-BLOCK: IMPL-PINBOARD_API ===
 * Token auth, 429 retry, 401 handling; get/save/delete/recent wrappers.
 * === END IMPL-FULL-BLOCK: IMPL-PINBOARD_API ===
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
