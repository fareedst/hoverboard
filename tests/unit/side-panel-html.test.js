/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TABS]
 * Unit tests: side panel HTML tab button display labels (This Page, By Tag, Tabs, Bookmarks).
 */

import fs from 'fs'
import path from 'path'

// Resolve from project root (npm test runs from repo root)
const sidePanelHtmlPath = path.join(process.cwd(), 'src/ui/side-panel/side-panel.html')

/**
 * Extract visible label text for a tab button by data-tab value.
 * @param {string} html - side-panel.html content
 * @param {string} dataTab - data-tab value (e.g. "bookmark", "tagsTree")
 * @returns {string} trimmed text between > and </button> for that button
 */
function getTabButtonLabel (html, dataTab) {
  const re = new RegExp(`data-tab="${dataTab}"[^>]*>([^<]+)`, 's')
  const m = html.match(re)
  return m ? m[1].trim() : ''
}

describe('[REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TABS] Side panel HTML tab labels', () => {
  let html

  beforeAll(() => {
    html = fs.readFileSync(sidePanelHtmlPath, 'utf8')
  })

  test('tab button data-tab=bookmark has display label "This Page"', () => {
    expect(getTabButtonLabel(html, 'bookmark')).toBe('This Page')
  })

  test('tab button data-tab=tagsTree has display label "By Tag"', () => {
    expect(getTabButtonLabel(html, 'tagsTree')).toBe('By Tag')
  })

  test('tab button data-tab=browserTabs has display label "Tabs"', () => {
    expect(getTabButtonLabel(html, 'browserTabs')).toBe('Tabs')
  })

  test('tab button data-tab=browserBookmarks has display label "Bookmarks"', () => {
    expect(getTabButtonLabel(html, 'browserBookmarks')).toBe('Bookmarks')
  })
})
