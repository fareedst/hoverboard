/**
 * [REQ-NON_WEB_TOOLS_TOOLBAR] [IMPL-NON_WEB_TOOLS_TOOLBAR] isWebProtocolUrl allowlist
 */
import { isWebProtocolUrl } from '../../src/shared/web-protocol.js'

describe('isWebProtocolUrl [REQ-NON_WEB_TOOLS_TOOLBAR]', () => {
  test('allows http and https', () => {
    expect(isWebProtocolUrl('http://example.com')).toBe(true)
    expect(isWebProtocolUrl('https://example.com/path')).toBe(true)
    expect(isWebProtocolUrl('  HTTPS://Example.COM  ')).toBe(true)
  })

  test('rejects non-web and empty', () => {
    expect(isWebProtocolUrl('chrome://settings')).toBe(false)
    expect(isWebProtocolUrl('chrome-extension://abc/page.html')).toBe(false)
    expect(isWebProtocolUrl('brave://rewards')).toBe(false)
    expect(isWebProtocolUrl('edge://flags')).toBe(false)
    expect(isWebProtocolUrl('about:blank')).toBe(false)
    expect(isWebProtocolUrl('ssh://host')).toBe(false)
    expect(isWebProtocolUrl('file:///tmp/x')).toBe(false)
    expect(isWebProtocolUrl('')).toBe(false)
    expect(isWebProtocolUrl('   ')).toBe(false)
    expect(isWebProtocolUrl(null)).toBe(false)
    expect(isWebProtocolUrl(undefined)).toBe(false)
  })
})
