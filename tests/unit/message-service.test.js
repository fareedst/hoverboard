/**
 * [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] MessageService unit tests.
 * MessageService wraps MessageClient and manages onMessage listeners; content script usage.
 */

import { MessageService } from '../../src/core/message-service.js'

jest.mock('../../src/features/content/message-client.js', () => {
  const mockSend = jest.fn().mockResolvedValue({ success: true })
  const mockCleanup = jest.fn()
  return {
    MessageClient: jest.fn().mockImplementation(() => ({
      sendMessage: mockSend,
      cleanup: mockCleanup
    }))
  }
})

describe('[IMPL-MESSAGE_HANDLING] MessageService', () => {
  let service
  let addListenerSpy

  beforeEach(() => {
    addListenerSpy = jest.fn()
    global.chrome.runtime.onMessage = { addListener: addListenerSpy }
    service = new MessageService()
  })

  afterEach(() => {
    if (service && typeof service.destroy === 'function') {
      service.destroy()
    }
  })

  test('registers onMessage listener on construction', () => {
    expect(addListenerSpy).toHaveBeenCalled()
    expect(typeof addListenerSpy.mock.calls[0][0]).toBe('function')
  })

  test('onMessage(type, listener) adds listener for type', () => {
    const listener = jest.fn()
    service.onMessage('getCurrentBookmark', listener)
    expect(service.messageListeners.has('getCurrentBookmark')).toBe(true)
    expect(service.messageListeners.get('getCurrentBookmark')).toContain(listener)
  })

  test('removeListener(type, listener) removes listener', () => {
    const listener = jest.fn()
    service.onMessage('getCurrentBookmark', listener)
    service.removeListener('getCurrentBookmark', listener)
    expect(service.messageListeners.get('getCurrentBookmark')).not.toContain(listener)
  })

  test('sendMessage with string type delegates to MessageClient with envelope', async () => {
    const { MessageClient } = await import('../../src/features/content/message-client.js')
    const instance = MessageClient.mock.results[0].value
    await service.sendMessage('getCurrentBookmark', { url: 'https://example.com' })
    expect(instance.sendMessage).toHaveBeenCalledWith({
      type: 'getCurrentBookmark',
      data: { url: 'https://example.com' }
    })
  })

  test('sendMessage with object passes through to MessageClient', async () => {
    const { MessageClient } = await import('../../src/features/content/message-client.js')
    const instance = MessageClient.mock.results[0].value
    const envelope = { type: 'saveBookmark', data: { url: 'https://x.com' } }
    await service.sendMessage(envelope)
    expect(instance.sendMessage).toHaveBeenCalledWith(envelope)
  })

  test('destroy clears listeners and calls MessageClient.cleanup', () => {
    service.onMessage('x', () => {})
    service.destroy()
    expect(service.messageListeners.size).toBe(0)
    const { MessageClient } = require('../../src/features/content/message-client.js')
    expect(MessageClient.mock.results[0].value.cleanup).toHaveBeenCalled()
  })
})
