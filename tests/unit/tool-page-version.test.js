/**
 * [REQ-NON_WEB_TOOLS_TOOLBAR] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [REQ-BOOKMARK_USAGE_TRACKING]
 * Shared tool-page brand-row version fill (tool page shell).
 */
/**
 * @jest-environment jsdom
 */
import { initToolPageVersion } from '../../src/ui/styles/tool-page-version.js'

describe('initToolPageVersion', () => {
  test('sets v{version} from override on [data-extension-version]', () => {
    const root = document.createElement('div')
    root.innerHTML = '<span data-extension-version></span>'
    initToolPageVersion(root, '2.1.0')
    expect(root.querySelector('[data-extension-version]').textContent).toBe('v2.1.0')
  })

  test('no-op when span missing', () => {
    const root = document.createElement('div')
    expect(() => initToolPageVersion(root, '1.0.0')).not.toThrow()
  })

  test('clears text when version empty', () => {
    const root = document.createElement('div')
    root.innerHTML = '<span data-extension-version>v9</span>'
    initToolPageVersion(root, '')
    expect(root.querySelector('[data-extension-version]').textContent).toBe('')
  })
})
