/**
 * [IMPL-CONFIG_MIGRATION] [IMPL-FEATURE_FLAGS] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY]
 * Integration test: ConfigManager load and auth with minimal mocks (chrome.storage.sync only).
 */

import { ConfigManager } from '../../src/config/config-manager.js'

let syncStorage

beforeEach(() => {
  syncStorage = {
    hoverboard_auth_token: '',
    hoverboard_settings: {},
    hoverboard_inhibit_urls: ''
  }
  global.chrome.storage.sync.get.mockImplementation(async (keys) => {
    if (keys === null || keys === undefined) {
      return { ...syncStorage }
    }
    const key = typeof keys === 'object' && !Array.isArray(keys) ? Object.keys(keys)[0] : (Array.isArray(keys) ? keys[0] : keys)
    return { [key]: syncStorage[key] }
  })
  global.chrome.storage.sync.set.mockImplementation((obj) => {
    Object.assign(syncStorage, obj)
    return Promise.resolve()
  })
})

describe('[IMPL-CONFIG_MIGRATION] [ARCH-CONFIG_STRUCTURE] ConfigManager auth and storage mode integration', () => {
  test('setAuthToken then getAuthToken returns token', async () => {
    const config = new ConfigManager()
    await config.setAuthToken('test-token-123')
    const token = await config.getAuthToken()
    expect(token).toBe('test-token-123')
  })

  test('hasAuthToken returns false when no token, true after setAuthToken', async () => {
    const config = new ConfigManager()
    expect(await config.hasAuthToken()).toBe(false)
    await config.setAuthToken('x')
    expect(await config.hasAuthToken()).toBe(true)
  })

  test('getStorageMode returns default when not set', async () => {
    const config = new ConfigManager()
    const mode = await config.getStorageMode()
    expect(['local', 'pinboard', 'file', 'sync']).toContain(mode)
  })
})
