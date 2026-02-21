/**
 * [TEST-FIX-001-MODULE] Module import fix validation - [IMPL-MESSAGE_HANDLING] [IMPL-ERROR_HANDLING] [ARCH-MESSAGE_HANDLING]
 * Tests MessageClient and debug utils imports.
 */

describe('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] Module Import Fix Validation', () => {
  describe('[TEST-FIX-001-MODULE] MessageClient Import', () => {
    test('[TEST-FIX-001-MODULE] should properly import MessageClient', async () => {
      // [TEST-FIX-001-MODULE] - Test MessageClient import
      const { MessageClient } = await import('../../src/features/content/message-client.js')
      expect(MessageClient).toBeDefined()
      expect(typeof MessageClient).toBe('function')
    })

    test('[TEST-FIX-001-MODULE] should create MessageClient instance', async () => {
      // [TEST-FIX-001-MODULE] - Test MessageClient instantiation
      const { MessageClient } = await import('../../src/features/content/message-client.js')
      const messageClient = new MessageClient()
      expect(messageClient).toBeDefined()
      expect(typeof messageClient.sendMessage).toBe('function')
    })
  })

  describe('[TEST-FIX-001-MODULE] Debug Functions Import', () => {
    test('[TEST-FIX-001-MODULE] should import all debug functions', async () => {
      // [TEST-FIX-001-MODULE] - Test debug function imports
      const { debugLog, debugError, debugWarn } = await import('../../src/shared/utils.js')
      expect(debugLog).toBeDefined()
      expect(debugError).toBeDefined()
      expect(debugWarn).toBeDefined()
      expect(typeof debugLog).toBe('function')
      expect(typeof debugError).toBe('function')
      expect(typeof debugWarn).toBe('function')
    })
  })

  describe('[TEST-FIX-001-MODULE] PinboardService Import', () => {
    test('[TEST-FIX-001-MODULE] should import PinboardService with debugWarn', async () => {
      // [TEST-FIX-001-MODULE] - Test PinboardService import
      const { PinboardService } = await import('../../src/features/pinboard/pinboard-service.js')
      expect(PinboardService).toBeDefined()
      expect(typeof PinboardService).toBe('function')
    })
  })

  describe('[TEST-FIX-001-MODULE] TagService Import', () => {
    test('[TEST-FIX-001-MODULE] should import TagService', async () => {
      // [TEST-FIX-001-MODULE] - Test TagService import
      const { TagService } = await import('../../src/features/tagging/tag-service.js')
      expect(TagService).toBeDefined()
      expect(typeof TagService).toBe('function')
    })
  })
}) 