/**
 * [REQ-CROSS_BROWSER] [ARCH-CROSS_BROWSER] [IMPL-CROSS_BROWSER]
 * Chrome-first browser API shim platformUtils: Safari product deferred.
 */

import { jest } from '@jest/globals'
import { platformUtils } from '../../src/shared/safari-shim.js'

describe('browser API shim platformUtils [REQ-CROSS_BROWSER] [IMPL-CROSS_BROWSER]', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('isSafari always returns false (Safari App Extension deferred)', () => {
    expect(platformUtils.isSafari()).toBe(false)
  })

  test('isChrome is true when global chrome is defined (Jest setup)', () => {
    expect(typeof chrome).not.toBe('undefined')
    expect(platformUtils.isChrome()).toBe(true)
  })

  test('getPlatform returns chrome when chrome is defined', () => {
    expect(platformUtils.getPlatform()).toBe('chrome')
  })

  test('isFirefox is false without browser.runtime.getBrowserInfo function', () => {
    // setup.js sets global.browser = global.chrome (no getBrowserInfo)
    expect(platformUtils.isFirefox()).toBe(false)
  })
})
