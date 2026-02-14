/**
 * [REQ-BADGE_INDICATORS] [IMPL-BADGE_REFRESH] Badge refresh on overlay/popup changes
 * Unit tests for service worker refreshing the badge after saveTag, deleteTag, and saveBookmark.
 */

import { jest } from '@jest/globals'

const MESSAGE_TYPES = {
  SAVE_TAG: 'saveTag',
  DELETE_TAG: 'deleteTag',
  SAVE_BOOKMARK: 'saveBookmark',
  SWITCH_STORAGE_MODE: 'switchStorageMode'
}

const mockProcessMessage = jest.fn().mockResolvedValue({})

jest.mock('../../src/core/message-handler.js', () => ({
  MessageHandler: jest.fn().mockImplementation(() => ({
    processMessage: mockProcessMessage,
    bookmarkProvider: null,
    setBookmarkProvider: jest.fn(),
    tagService: {}
  })),
  MESSAGE_TYPES
}))

jest.mock('../../src/config/config-manager.js', () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    getConfig: jest.fn().mockResolvedValue({ setIconOnLoad: true }),
    getStorageMode: jest.fn().mockResolvedValue('remote'),
    initializeDefaults: jest.fn().mockResolvedValue(undefined)
  }))
}))

jest.mock('../../src/core/badge-manager.js', () => ({
  BadgeManager: jest.fn().mockImplementation(() => ({}))
}))

jest.mock('../../src/features/pinboard/pinboard-service.js', () => ({
  PinboardService: jest.fn().mockImplementation(() => ({}))
}))

jest.mock('../../src/features/storage/local-bookmark-service.js', () => ({
  LocalBookmarkService: jest.fn().mockImplementation(() => ({}))
}))

const mockTabsQuery = jest.fn().mockResolvedValue([])
jest.mock('../../src/shared/safari-shim.js', () => ({
  browser: {
    tabs: {
      get: jest.fn().mockResolvedValue({ id: 1, url: 'https://example.com' }),
      query: mockTabsQuery,
      onActivated: { addListener: jest.fn() },
      onUpdated: { addListener: jest.fn() }
    },
    runtime: {
      onInstalled: { addListener: jest.fn() },
      onMessage: { addListener: jest.fn() },
      onStartup: { addListener: jest.fn() }
    }
  }
}))

describe('[REQ-BADGE_INDICATORS] [IMPL-BADGE_REFRESH] Badge refresh after overlay/popup changes', () => {
  let HoverboardServiceWorker

  beforeAll(async () => {
    const module = await import('../../src/core/service-worker.js')
    HoverboardServiceWorker = module.HoverboardServiceWorker
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockProcessMessage.mockResolvedValue({})
    mockTabsQuery.mockResolvedValue([])
  })

  test('calls updateBadgeForTab when saveTag is handled and sender has tab', async () => {
    const sw = new HoverboardServiceWorker()
    sw._providerInitialized = true
    const updateBadgeForTab = jest.fn().mockResolvedValue(undefined)
    sw.updateBadgeForTab = updateBadgeForTab

    const senderTab = { id: 101, url: 'https://example.com/page' }
    await sw.handleMessage(
      { type: 'saveTag', data: { url: 'https://example.com/page', value: 'foo' } },
      { tab: senderTab }
    )

    expect(mockProcessMessage).toHaveBeenCalled()
    expect(updateBadgeForTab).toHaveBeenCalledTimes(1)
    expect(updateBadgeForTab).toHaveBeenCalledWith(senderTab)
  })

  test('calls updateBadgeForTab when deleteTag is handled and sender has tab', async () => {
    const sw = new HoverboardServiceWorker()
    sw._providerInitialized = true
    const updateBadgeForTab = jest.fn().mockResolvedValue(undefined)
    sw.updateBadgeForTab = updateBadgeForTab

    const senderTab = { id: 102, url: 'https://example.org' }
    await sw.handleMessage(
      { type: 'deleteTag', data: { url: 'https://example.org', value: 'bar' } },
      { tab: senderTab }
    )

    expect(updateBadgeForTab).toHaveBeenCalledTimes(1)
    expect(updateBadgeForTab).toHaveBeenCalledWith(senderTab)
  })

  test('calls updateBadgeForTab when saveBookmark is handled and sender has tab', async () => {
    const sw = new HoverboardServiceWorker()
    sw._providerInitialized = true
    const updateBadgeForTab = jest.fn().mockResolvedValue(undefined)
    sw.updateBadgeForTab = updateBadgeForTab

    const senderTab = { id: 103, url: 'https://example.net' }
    await sw.handleMessage(
      { type: 'saveBookmark', data: { url: 'https://example.net', shared: 'no', toread: 'yes' } },
      { tab: senderTab }
    )

    expect(updateBadgeForTab).toHaveBeenCalledTimes(1)
    expect(updateBadgeForTab).toHaveBeenCalledWith(senderTab)
  })

  test('calls updateBadgeForTab for saveBookmark without sender.tab by querying active tab', async () => {
    const activeTab = { id: 201, url: 'https://active-tab.com' }
    mockTabsQuery.mockResolvedValue([activeTab])

    const sw = new HoverboardServiceWorker()
    sw._providerInitialized = true
    const updateBadgeForTab = jest.fn().mockResolvedValue(undefined)
    sw.updateBadgeForTab = updateBadgeForTab

    await sw.handleMessage(
      { type: 'saveBookmark', data: { url: 'https://active-tab.com', shared: 'yes' } },
      {}
    )

    expect(mockTabsQuery).toHaveBeenCalledWith({ active: true, currentWindow: true })
    expect(updateBadgeForTab).toHaveBeenCalledTimes(1)
    expect(updateBadgeForTab).toHaveBeenCalledWith(activeTab)
  })

  test('does not call updateBadgeForTab for saveTag when sender has no tab', async () => {
    const sw = new HoverboardServiceWorker()
    sw._providerInitialized = true
    const updateBadgeForTab = jest.fn().mockResolvedValue(undefined)
    sw.updateBadgeForTab = updateBadgeForTab

    await sw.handleMessage(
      { type: 'saveTag', data: { url: 'https://example.com', value: 'baz' } },
      {}
    )

    expect(updateBadgeForTab).not.toHaveBeenCalled()
  })

  test('does not call updateBadgeForTab for unrelated message types', async () => {
    const sw = new HoverboardServiceWorker()
    sw._providerInitialized = true
    const updateBadgeForTab = jest.fn().mockResolvedValue(undefined)
    sw.updateBadgeForTab = updateBadgeForTab

    await sw.handleMessage(
      { type: 'getCurrentBookmark', data: { url: 'https://example.com' } },
      { tab: { id: 1, url: 'https://example.com' } }
    )

    expect(updateBadgeForTab).not.toHaveBeenCalled()
  })
})
