/**
 * [IMPL-OVERLAY] [IMPL-OVERLAY_CONTROLS] [IMPL-OVERLAY_TEST_HARNESS] [ARCH-OVERLAY] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_SYSTEM] [REQ-OVERLAY_CONTROL_LAYOUT] How: Connects OverlayManager.show to refresh-control creation, message retrieval, and a second overlay render in the deterministic DOM harness.
 * Contract:
 *   INPUT: overlay content, refresh control, message service, DOM harness
 *   PRE: overlay manager and message service are initialized
 *   OUTPUT: refreshed overlay content and visible control state
 *   POST:
 *     success => refresh sends getCurrentBookmark and renders the returned bookmark
 *   FAILURE_MODES: BookmarkRefreshFailed
 *   DATA: overlay DOM and current bookmark snapshot
 *   DATA_TRANSITION: refreshed bookmark replaces the displayed content while visibility remains true
 *   EFFECTS: Async, IO, State
 *   TERMINATION: total
 * PROCEDURE: OVERLAY_REFRESH_COMPOSITION
 *   SHOW overlay with initial bookmark
 *   CREATE refresh control
 *   ON refresh click: SEND getCurrentBookmark through message service
 *   AWAIT response
 *   SHOW overlay with refreshed bookmark
 *
 * Pattern: UNKNOWN binding resolved as overlay/control composition.
 * Composition: OverlayManager.show -> control creation -> refresh callback ->
 * message service -> overlay refresh. Uses a DOM test harness, not Playwright.
 */

import { OverlayManager } from '../../src/features/content/overlay-manager.js'

const { createMockDocument } = require('../utils/mock-dom')

describe('[IMPL-OVERLAY] overlay controls composition', () => {
  test('refresh control dispatches through the message service and updates overlay', async () => {
    const documentMock = createMockDocument()
    const messageService = {
      sendMessage: jest.fn(async (message) => {
        if (message.type === 'getCurrentBookmark') {
          return {
            success: true,
            data: {
              url: 'https://example.com',
              description: 'Updated',
              tags: ['updated'],
              shared: 'yes',
              toread: 'no'
            }
          }
        }
        if (message.type === 'getRecentBookmarks') return { recentTags: [] }
        return { success: true }
      })
    }
    const manager = new OverlayManager(documentMock, {})
    manager.messageService = messageService
    manager.showMessage = jest.fn()
    const show = jest.spyOn(manager, 'show')

    await manager.show({
      bookmark: {
        url: 'https://example.com',
        description: 'Original',
        tags: [],
        shared: 'yes',
        toread: 'no'
      },
      pageTitle: 'Example',
      pageUrl: 'https://example.com'
    })

    const refreshButton = documentMock.querySelector('.refresh-button')
    expect(refreshButton).toBeTruthy()
    await refreshButton._triggerClick()

    expect(messageService.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'getCurrentBookmark'
    }))
    expect(show).toHaveBeenCalledWith(expect.objectContaining({
      bookmark: expect.objectContaining({ description: 'Updated' })
    }))
  })
})
