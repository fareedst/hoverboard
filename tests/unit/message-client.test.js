/**
 * [IMPL-MESSAGE_HANDLING] [IMPL-POPUP_MESSAGE_TIMEOUT]
 * MessageClient: retry on retryable errors, reject after max retries.
 * Safari shim uses callback-style sendMessage; tests use direct Promise mock for sendSingleMessage path.
 */

import { MessageClient } from '../../src/features/content/message-client.js'

describe('[IMPL-MESSAGE_HANDLING] MessageClient sendMessage retry and error', () => {
  beforeEach(() => {
    global.browser = global.chrome
    jest.clearAllMocks()
    global.chrome.runtime.getManifest.mockReturnValue({ version: '1.0.0' })
    // Safari shim uses callback: (msg, cb) => cb(response). Simulate failure via lastError + cb().
    global.chrome.runtime.sendMessage.mockImplementation((msg, cb) => {
      if (typeof cb === 'function') {
        const err = global.chrome.runtime._testSendMessageError
        if (err) {
          global.chrome.runtime.lastError = { message: err }
          cb(undefined)
        } else {
          global.chrome.runtime.lastError = null
          cb(global.chrome.runtime._testSendMessageResponse ?? { success: true })
        }
      }
    })
  })

  test('rejects with error after retries exhausted when sendMessage reports lastError [IMPL-POPUP_MESSAGE_TIMEOUT]', async () => {
    const client = new MessageClient()
    global.chrome.runtime._testSendMessageError = 'Could not establish connection'

    await expect(client.sendMessage({ type: 'PING' }, { retries: 2, retryDelay: 10 })).rejects.toThrow('Could not establish connection')
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalled()
  })

  test('does not retry when error is not retryable', async () => {
    const client = new MessageClient()
    global.chrome.runtime._testSendMessageError = 'Some other error'

    await expect(client.sendMessage({ type: 'PING' }, { retries: 2, retryDelay: 10 })).rejects.toThrow('Some other error')
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalled()
  })

  test('retries on retryable error message "Extension context invalidated"', async () => {
    const client = new MessageClient()
    global.chrome.runtime._testSendMessageError = 'Extension context invalidated'

    await expect(client.sendMessage({ type: 'PING' }, { retries: 1, retryDelay: 10 })).rejects.toThrow('Extension context invalidated')
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalled()
  })

  test('resolves with response when sendMessage succeeds', async () => {
    const client = new MessageClient()
    global.chrome.runtime._testSendMessageError = null
    global.chrome.runtime._testSendMessageResponse = { success: true, data: 'pong' }

    const result = await client.sendMessage({ type: 'PING' })
    expect(result).toEqual({ success: true, data: 'pong' })
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledTimes(1)
  })
})

describe('[IMPL-MESSAGE_HANDLING] MessageClient isRetryableError', () => {
  test('returns true for "Could not establish connection"', () => {
    const client = new MessageClient()
    expect(client.isRetryableError(new Error('Could not establish connection'))).toBe(true)
  })

  test('returns false for generic error', () => {
    const client = new MessageClient()
    expect(client.isRetryableError(new Error('Something went wrong'))).toBe(false)
  })
})
