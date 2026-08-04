/**
 * [IMPL-MESSAGE_HANDLING] [IMPL-UI_TESTABILITY_HOOKS] [IMPL-DEBUG_PANEL] [IMPL-UI_ACTION_CONTRACT] [ARCH-MESSAGE_HANDLING] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-MODULE_VALIDATION] How: Dispatches a validated message through the handler and exposes the result to testability hooks and inspection consumers.
 * Contract:
 *   INPUT: message, sender, handler map, optional processed callback
 *   PRE: message type and payload satisfy the allowlist
 *   OUTPUT: handler result and optional inspection callback payload
 *   POST:
 *     success => handler result is returned and the processed callback receives message/result
 *   FAILURE_MODES: OperationFailed
 *   EFFECTS: Async, IO, State
 *   TERMINATION: total
 * PROCEDURE: MESSAGE_DISPATCH_TESTABILITY
 *   VALIDATE message
 *   AWAIT handler result
 *   IF processed callback exists: CALL callback with message and result
 *   RETURN result
 *
 * Pattern: MESSAGE_DISPATCH
 * Composition: runtime message -> MessageHandler -> testability callback /
 * action contract observer. No DOM or UI invocation.
 */

import { MessageHandler } from '../../src/core/message-handler.js'
import { MESSAGE_TYPES, POPUP_ACTION_IDS } from '../../src/shared/ui-action-contract.js'

describe('[IMPL-UI_TESTABILITY_HOOKS] message dispatch callback composition', () => {
  test('processMessage sends the validated message and response to the callback', async () => {
    const provider = {
      getBookmarkForUrl: jest.fn().mockResolvedValue({
        url: 'https://example.com',
        description: 'Example',
        tags: ['work']
      })
    }
    const handler = new MessageHandler(provider, null, {
      archiveSearch: {},
      getBookmark: jest.fn(),
      saveArchive: jest.fn()
    })
    const processed = jest.fn()
    handler.setOnMessageProcessed(processed)

    const response = await handler.processMessage(
      { type: MESSAGE_TYPES.GET_TAGS_FOR_URL, data: { url: 'https://example.com' } },
      { tab: { id: 12, url: 'https://example.com' } }
    )

    expect(response).toEqual({ tags: ['work'] })
    expect(processed).toHaveBeenCalledWith(expect.objectContaining({
      type: MESSAGE_TYPES.GET_TAGS_FOR_URL,
      response: { tags: ['work'] },
      error: null,
      senderContext: { tabId: 12, url: 'https://example.com' }
    }))
  })

  test('the shared action contract exposes the message id used by observers', () => {
    expect(POPUP_ACTION_IDS.addTag).toBe('addTag')
    expect(MESSAGE_TYPES.SAVE_TAG).toBe('saveTag')
  })

  test('the debug command seam reads the same provider used by message handling', async () => {
    const provider = {
      getBookmarkForUrl: jest.fn().mockResolvedValue({
        url: 'https://example.com/debug',
        description: 'Debug bookmark',
        tags: ['inspect']
      })
    }
    const handler = new MessageHandler(provider, null, {
      archiveSearch: {},
      getBookmark: jest.fn(),
      saveArchive: jest.fn()
    })

    const response = await handler.processDevCommand(
      { subcommand: 'getCurrentBookmark', url: 'https://example.com/debug' },
      { tabId: 21, url: 'https://example.com/debug' }
    )

    expect(response.data).toMatchObject({
      url: 'https://example.com/debug',
      description: 'Debug bookmark',
      tags: ['inspect']
    })
    expect(provider.getBookmarkForUrl).toHaveBeenCalledWith('https://example.com/debug', undefined)
  })
})
