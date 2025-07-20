/**
 * Phase 2 Integration Test - Verify core module migration
 * Tests configuration, services, and message handling
 */

import { ConfigManager } from '../config/config-manager.js'
import { PinboardService } from '../features/pinboard/pinboard-service.js'
import { TagService } from '../features/tagging/tag-service.js'
import { MessageHandler } from './message-handler.js'
import { BadgeManager } from './badge-manager.js'

export class Phase2IntegrationTest {
  constructor () {
    this.configManager = new ConfigManager()
    this.pinboardService = new PinboardService()
    this.tagService = new TagService()
    this.messageHandler = new MessageHandler()
    this.badgeManager = new BadgeManager()
  }

  /**
   * Run all Phase 2 integration tests
   */
  async runAllTests () {
    console.log('🚀 Starting Phase 2 Integration Tests...')
    const results = []

    try {
      results.push(await this.testConfigManager())
      results.push(await this.testPinboardService())
      results.push(await this.testTagService())
      results.push(await this.testMessageHandler())
      results.push(await this.testBadgeManager())

      const passed = results.filter(r => r.passed).length
      const total = results.length

      console.log(`✅ Phase 2 Integration Tests Complete: ${passed}/${total} passed`)

      if (passed === total) {
        console.log('🎉 All Phase 2 components are properly integrated!')
        return { success: true, results }
      } else {
        console.log('⚠️  Some integration issues found. See details above.')
        return { success: false, results }
      }
    } catch (error) {
      console.error('❌ Integration test failed:', error)
      return { success: false, error: error.message }
    }
  }

  async testConfigManager () {
    try {
      console.log('Testing ConfigManager...')

      // Test default configuration
      const defaultConfig = this.configManager.getDefaultConfiguration()
      if (!defaultConfig || typeof defaultConfig !== 'object') {
        throw new Error('Default configuration not available')
      }

      // Test configuration methods
      await this.configManager.initializeDefaults()
      const config = await this.configManager.getConfig()
      const options = await this.configManager.getOptions()

      if (!config || !options) {
        throw new Error('Configuration retrieval failed')
      }

      console.log('✅ ConfigManager: OK')
      return { component: 'ConfigManager', passed: true }
    } catch (error) {
      console.error('❌ ConfigManager test failed:', error)
      return { component: 'ConfigManager', passed: false, error: error.message }
    }
  }

  async testPinboardService () {
    try {
      console.log('Testing PinboardService...')

      // Test service instantiation and methods exist
      const methods = ['getBookmarkForUrl', 'saveBookmark', 'deleteBookmark', 'saveTag', 'deleteTag']

      for (const method of methods) {
        if (typeof this.pinboardService[method] !== 'function') {
          throw new Error(`Missing method: ${method}`)
        }
      }

      // Test empty bookmark creation (doesn't require auth)
      const emptyBookmark = this.pinboardService.createEmptyBookmark('https://example.com', 'Test')
      if (!emptyBookmark || !emptyBookmark.url) {
        throw new Error('Empty bookmark creation failed')
      }

      console.log('✅ PinboardService: OK')
      return { component: 'PinboardService', passed: true }
    } catch (error) {
      console.error('❌ PinboardService test failed:', error)
      return { component: 'PinboardService', passed: false, error: error.message }
    }
  }

  async testTagService () {
    try {
      console.log('Testing TagService...')

      // Test service methods exist
      const methods = ['getRecentTags', 'getTagSuggestions', 'recordTagUsage', 'getFrequentTags']

      for (const method of methods) {
        if (typeof this.tagService[method] !== 'function') {
          throw new Error(`Missing method: ${method}`)
        }
      }

      // Test cache management
      await this.tagService.clearCache()
      const cacheStatus = await this.tagService.getCacheStatus()

      if (typeof cacheStatus !== 'object') {
        throw new Error('Cache status check failed')
      }

      console.log('✅ TagService: OK')
      return { component: 'TagService', passed: true }
    } catch (error) {
      console.error('❌ TagService test failed:', error)
      return { component: 'TagService', passed: false, error: error.message }
    }
  }

  async testMessageHandler () {
    try {
      console.log('Testing MessageHandler...')

      // Test message constants exist
      const { MESSAGE_TYPES } = await import('./message-handler.js')
      if (!MESSAGE_TYPES || typeof MESSAGE_TYPES !== 'object') {
        throw new Error('MESSAGE_TYPES not properly exported')
      }

      // Test echo message (simple test case)
      const mockSender = { tab: { id: 1, url: 'https://example.com' } }
      const echoMessage = { type: MESSAGE_TYPES.ECHO, data: 'test' }

      const response = await this.messageHandler.processMessage(echoMessage, mockSender)
      if (!response || response.echo !== 'test') {
        throw new Error('Echo message test failed')
      }

      console.log('✅ MessageHandler: OK')
      return { component: 'MessageHandler', passed: true }
    } catch (error) {
      console.error('❌ MessageHandler test failed:', error)
      return { component: 'MessageHandler', passed: false, error: error.message }
    }
  }

  async testBadgeManager () {
    try {
      console.log('Testing BadgeManager...')

      // Test badge methods exist
      const methods = ['updateBadge', 'setBadgeText', 'setBadgeColor', 'setBadgeIcon']

      for (const method of methods) {
        if (typeof this.badgeManager[method] !== 'function') {
          throw new Error(`Missing method: ${method}`)
        }
      }

      console.log('✅ BadgeManager: OK')
      return { component: 'BadgeManager', passed: true }
    } catch (error) {
      console.error('❌ BadgeManager test failed:', error)
      return { component: 'BadgeManager', passed: false, error: error.message }
    }
  }
}

// Export for use in service worker or testing
export default Phase2IntegrationTest
