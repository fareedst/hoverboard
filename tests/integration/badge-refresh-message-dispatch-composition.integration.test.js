/**
 * [IMPL-BADGE_REFRESH] [IMPL-MESSAGE_HANDLING] [ARCH-BADGE] [ARCH-MESSAGE_HANDLING] [REQ-BADGE_INDICATORS] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: Completes a successful message dispatch before refreshing the affected tab badge.
 * Contract:
 *   INPUT: message, sender tab, message-processing result
 *   PRE: message processing has a resolvable result; badge updater is available
 *   OUTPUT: updated badge state for the affected tab
 *   POST:
 *     success => badge refresh runs only for saveTag, deleteTag, or saveBookmark
 *   EFFECTS: Async, IO
 *   TERMINATION: total
 * PROCEDURE: MESSAGE_DISPATCH_BADGE_REFRESH
 *   AWAIT processMessage(message)
 *   IF message type is saveTag, deleteTag, or saveBookmark:
 *     tab = sender tab when present
 *     IF tab is absent and message type is saveBookmark: AWAIT active-tab lookup
 *     IF tab exists: AWAIT updateBadgeForTab(tab)
 *
 * Pattern: MESSAGE_DISPATCH
 * Composition: service-worker handleMessage -> MessageHandler.processMessage
 * -> badge refresh for mutation messages. No UI invocation.
 */

import { jest } from '@jest/globals'

const mockProcessMessage = jest.fn().mockResolvedValue({ success: true })
const mockTabsQuery = jest.fn().mockResolvedValue([])

jest.mock('../../src/core/message-handler.js', () => ({
  MessageHandler: jest.fn().mockImplementation(() => ({
    processMessage: mockProcessMessage,
    bookmarkProvider: null,
    setBookmarkProvider: jest.fn(),
    tagService: {}
  })),
  MESSAGE_TYPES: {
    SAVE_TAG: 'saveTag',
    DELETE_TAG: 'deleteTag',
    SAVE_BOOKMARK: 'saveBookmark',
    SWITCH_STORAGE_MODE: 'switchStorageMode'
  }
}))

jest.mock('../../src/config/config-manager.js', () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    getConfig: jest.fn().mockResolvedValue({ setIconOnLoad: true }),
    getStorageMode: jest.fn().mockResolvedValue('local'),
    initializeDefaults: jest.fn().mockResolvedValue(undefined)
  }))
}))

jest.mock('../../src/features/pinboard/pinboard-service.js', () => ({
  PinboardService: jest.fn().mockImplementation(() => ({}))
}))

jest.mock('../../src/features/storage/local-bookmark-service.js', () => ({
  LocalBookmarkService: jest.fn().mockImplementation(() => ({}))
}))

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
    },
    storage: {
      local: { get: jest.fn().mockResolvedValue({}) }
    }
  }
}))

describe('[IMPL-BADGE_REFRESH] mutation message dispatch composition', () => {
  let HoverboardServiceWorker

  beforeAll(async () => {
    const module = await import('../../src/core/service-worker.js')
    HoverboardServiceWorker = module.HoverboardServiceWorker
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockProcessMessage.mockResolvedValue({ success: true })
    mockTabsQuery.mockResolvedValue([])
  })

  test('saveTag dispatch reaches the badge refresh seam with sender tab', async () => {
    const worker = new HoverboardServiceWorker()
    worker._providerInitialized = true
    worker.updateBadgeForTab = jest.fn().mockResolvedValue(undefined)
    const tab = { id: 7, url: 'https://example.com/tagged' }

    await worker.handleMessage(
      { type: 'saveTag', data: { url: tab.url, value: 'work' } },
      { tab }
    )

    expect(mockProcessMessage).toHaveBeenCalled()
    expect(worker.updateBadgeForTab).toHaveBeenCalledWith(tab)
  })

  test('saveBookmark dispatch resolves an active tab when sender has no tab', async () => {
    const tab = { id: 8, url: 'https://example.com/bookmarked' }
    mockTabsQuery.mockResolvedValue([tab])
    const worker = new HoverboardServiceWorker()
    worker._providerInitialized = true
    worker.updateBadgeForTab = jest.fn().mockResolvedValue(undefined)

    await worker.handleMessage(
      { type: 'saveBookmark', data: { url: tab.url, shared: 'yes' } },
      {}
    )

    expect(mockTabsQuery).toHaveBeenCalledWith({ active: true, currentWindow: true })
    expect(worker.updateBadgeForTab).toHaveBeenCalledWith(tab)
  })
})
