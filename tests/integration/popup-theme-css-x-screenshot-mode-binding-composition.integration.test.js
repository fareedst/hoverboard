/**
 * [IMPL-POPUP_THEME_CSS] [IMPL-SCREENSHOT_MODE] [ARCH-THEME] [REQ-DARK_THEME] How: Confirms screenshot seed theme values select a popup CSS theme rule without requiring browser rendering.
 * Contract:
 *   INPUT: screenshot seed theme value and popup stylesheet
 *   PRE: screenshot seed and popup CSS are available as project artifacts
 *   OUTPUT: compatible theme selector and dark-root rule
 *   POST:
 *     success => screenshot mode defaults to a theme represented by popup CSS
 *   EFFECTS: pure
 *   TERMINATION: total
 * PROCEDURE: SCREENSHOT_THEME_CONTRACT
 *   Read screenshot seed theme selector
 *   Read popup CSS theme selectors
 *   ASSERT the default/selected theme is represented by the stylesheet
 *
 * Pattern: UNKNOWN stylesheet/screenshot binding.
 * Composition: screenshot seed theme -> popup theme selector. This checks the
 * static contract used by screenshot capture without invoking a browser UI.
 */

import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

describe('[IMPL-POPUP_THEME_CSS] screenshot theme composition', () => {
  test('screenshot mode seeds a theme supported by popup CSS', () => {
    const screenshotScript = fs.readFileSync(
      path.join(root, 'scripts/screenshots-placeholder.js'),
      'utf8'
    )
    const popupCss = fs.readFileSync(path.join(root, 'src/ui/popup/popup.css'), 'utf8')

    expect(screenshotScript).toContain('hoverboard_theme')
    expect(screenshotScript).toContain("data.hoverboard_theme || 'dark'")
    expect(popupCss).toContain(':root.hb-theme-dark')
  })
})
