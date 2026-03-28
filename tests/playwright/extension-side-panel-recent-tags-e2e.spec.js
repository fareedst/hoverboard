/**
 * [REQ-RECENT_TAGS_SYSTEM] [IMPL-SIDE_PANEL_TABS] [IMPL-RECENT_TAGS_POPUP_REFRESH] [IMPL-PLAYWRIGHT_E2E_EXTENSION] [ARCH-SIDE_PANEL_TABS] [ARCH-TAG_SYSTEM]
 * Phase H (PROC-AGENT_REQ_CHECKLIST S11): E2E surfaces documented on IMPL-SIDE_PANEL_TABS as
 * phase_h_side_panel_recent_tags_extension_document and phase_h_window_focus_recent_tags_cross_window.
 *
 * Running test — why composition/integration is insufficient:
 * - tests/integration/window-focus-recent-tags-composition.integration.test.js mocks chrome.* and a stub controller; it proves
 *   bindWindowFocusRecentTagsRefresh wiring only.
 * - This spec loads real chrome-extension://…/side-panel.html in Chromium with the unpacked extension so PopupController
 *   runs loadInitialData → loadRecentTags against the live service worker and UIManager paints under scoped #bookmarkPanel.
 *   That extension-origin document + runtime messaging path is not reproduced in Jest.
 *
 * Skipped test — platform gap (named in IMPL phase_h_window_focus_recent_tags_cross_window.e2e_only_reason):
 * - True REQ cross-window refresh needs chrome.windows.onFocusChanged across separate browser windows; this Playwright project
 *   uses one persistent browser window (new pages are tabs). Multi-window focus ordering is manual / future fixture work.
 */

import { test, expect, getExtensionId } from './extension-fixture.js'

test.describe('[REQ-RECENT_TAGS_SYSTEM] Side panel Recent Tags — Phase H E2E', () => {
  test('This Page Recent Tags container mounts and fills after load in real extension side panel [IMPL-SIDE_PANEL_TABS]', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const contentPage = await context.newPage()
    await contentPage.goto('https://example.com/')
    await contentPage.waitForLoadState('domcontentloaded')
    await contentPage.bringToFront()

    const sidePanelPage = await context.newPage()
    await sidePanelPage.goto(`chrome-extension://${extensionId}/src/ui/side-panel/side-panel.html`)
    await sidePanelPage.waitForLoadState('domcontentloaded')

    const recentLoc = sidePanelPage.locator('#bookmarkPanel [data-popup-ref="recentTagsContainer"]')
    await expect(recentLoc).toBeVisible({ timeout: 20000 })

    await sidePanelPage.waitForFunction(
      () => {
        const el = document.querySelector('#bookmarkPanel [data-popup-ref="recentTagsContainer"]')
        return el != null && el.childElementCount > 0
      },
      { timeout: 25000 }
    )

    const summary = await recentLoc.evaluate((el) => {
      const chips = el.querySelectorAll('.tag-element')
      const empty = el.querySelector('.no-tags')
      return {
        chipCount: chips.length,
        hasEmptyPlaceholder: !!(empty && empty.textContent && empty.textContent.trim())
      }
    })
    expect(summary.chipCount > 0 || summary.hasEmptyPlaceholder).toBe(true)

    const windowsApi = await sidePanelPage.evaluate(() => {
      const cr = typeof globalThis !== 'undefined' ? globalThis.chrome : undefined
      return {
        onFocusChanged: !!(cr?.windows?.onFocusChanged?.addListener),
        getCurrent: !!(cr?.windows?.getCurrent)
      }
    })
    expect(windowsApi.onFocusChanged && windowsApi.getCurrent).toBe(true)

    await sidePanelPage.close()
    await contentPage.close()
  })

  test.skip('cross-window Recent Tags refresh when returning focus to side panel window (e2e_only)', async () => {
    // phase_h_window_focus_recent_tags_cross_window: requires multiple Chrome windows + real
    // chrome.windows.onFocusChanged focus order; extension Playwright fixture uses one persistent window (tabs only).
    // Covered at composition level: tests/integration/window-focus-recent-tags-composition.integration.test.js
  })
})
