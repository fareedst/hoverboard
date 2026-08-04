/**
 * [IMPL-CROSS_BROWSER] [IMPL-MESSAGE_HANDLING] [ARCH-CROSS_BROWSER] [ARCH-MESSAGE_HANDLING] [REQ-CROSS_BROWSER] How: Routes a MessageClient request through the shared browser shim and resolves the callback response without UI or host-specific behavior.
 * Contract:
 *   INPUT: message payload, retry options, shared browser runtime
 *   PRE: shared browser runtime is available; callback-style sendMessage is supported
 *   OUTPUT: resolved message response
 *   POST:
 *     success => runtime receives the message with a generated messageId and the response is returned
 *   EFFECTS: Async, IO
 *   TERMINATION: total
 * PROCEDURE: MESSAGE_DISPATCH_SHARED_BROWSER
 *   message = ADD messageId to input payload
 *   SEND message through shared browser runtime
 *   AWAIT callback response
 *   RETURN response
 *
 * Pattern: MESSAGE_DISPATCH
 * Composition: MessageClient -> shared browser shim -> runtime.sendMessage.
 * No UI invocation and no platform-specific host.
 */

import { MessageClient } from '../../src/features/content/message-client.js'

describe('[IMPL-CROSS_BROWSER] browser shim message composition', () => {
  test('MessageClient sends through the shared browser runtime API', async () => {
    const response = { success: true, data: { ok: true } }
    global.chrome.runtime.sendMessage = jest.fn().mockImplementation((_message, callback) => {
      callback(response)
    })
    const client = new MessageClient()

    await expect(client.sendMessage(
      { type: 'GET_OPTIONS' },
      { retries: 0 }
    )).resolves.toBe(response)

    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'GET_OPTIONS', messageId: expect.any(String) }),
      expect.any(Function)
    )
  })
})
