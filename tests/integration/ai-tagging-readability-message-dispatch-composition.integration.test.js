/**
 * [IMPL-AI_TAGGING_READABILITY] [IMPL-CROSS_BROWSER] [ARCH-AI_TAGGING_FLOW] [ARCH-CROSS_BROWSER] [REQ-AI_TAGGING_POPUP] [REQ-CROSS_BROWSER] How: Dispatches GET_PAGE_CONTENT to EXTRACT_PAGE_CONTENT and returns the extracted payload through the runtime response channel.
 * Contract:
 *   INPUT: runtime message, sender, response callback
 *   PRE: runtime listener is registered; response callback is callable
 *   OUTPUT: response channel containing { success: true, data: { title, textContent } }
 *   POST:
 *     success => response callback receives the extracted page payload
 *   EFFECTS: Async, IO
 *   TERMINATION: total
 * PROCEDURE: MESSAGE_DISPATCH_GET_PAGE_CONTENT
 *   ON runtime message with type GET_PAGE_CONTENT:
 *     data = AWAIT EXTRACT_PAGE_CONTENT(document)
 *     SEND response callback { success: true, data }
 *     RETURN true to keep the response channel open
 *
 * Pattern: MESSAGE_DISPATCH
 * Composition: runtime.onMessage GET_PAGE_CONTENT -> content listener ->
 * extractPageContent -> sendResponse. No popup or page UI invocation.
 */

describe('[IMPL-AI_TAGGING_READABILITY] GET_PAGE_CONTENT dispatch composition', () => {
  test('the early content listener returns the extracted page payload', async () => {
    const listeners = []
    global.chrome.runtime.onMessage.addListener = jest.fn((listener) => {
      listeners.push(listener)
    })

    await import('../../src/features/content/content-main.js')

    expect(listeners.length).toBeGreaterThan(0)
    const sendResponse = jest.fn()
    const keepChannelOpen = listeners[0](
      { type: 'GET_PAGE_CONTENT' },
      {},
      sendResponse
    )

    expect(keepChannelOpen).toBe(true)
    expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        title: expect.any(String),
        textContent: expect.any(String)
      })
    }))
  })
})
