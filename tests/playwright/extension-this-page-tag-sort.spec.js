/**
 * === IMPL-FULL-BLOCK: IMPL-PLAYWRIGHT_E2E_EXTENSION ===
 * [IMPL-PLAYWRIGHT_E2E_EXTENSION] [ARCH-UI_TESTABILITY] [ARCH-MESSAGE_HANDLING] [REQ-UI_INSPECTION] [REQ-THIS_PAGE_TAG_SORT] [REQ-AI_TAGGING_POPUP] — How: build unpacked extension then drive Chromium persistent context for popup, messaging, overlay, options, side panel E2E.
 * 
 * ## LAUNCH_EXTENSION_CONTEXT
 * 
 * - [IMPL-PLAYWRIGHT_E2E_EXTENSION] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] How: global setup builds extension; fixture launches persistent context and resolves extension id.
 * - Contract:
 *   - INPUT: npm run test:e2e:extension; playwright.extension.config.js; built dist/ extension
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: pass/fail Playwright reports for extension surfaces; getExtensionId for page evaluation | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: tests/playwright/global-setup.js; extension-fixture.js; extension-*.spec.js
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: LAUNCH_EXTENSION_CONTEXT
 *   - AWAIT buildExtensionDist()
 *   - context = launchPersistentContext(userDataDir, args with --load-extension)
 *   - extensionId = AWAIT getExtensionId(context)
 *   - RETURN { context, extensionId }
 *   - How (sub-block): How: specs open popup/side panel/options pages and assert messaging/UI contracts without rewriting product logic.
 * 
 * ## RUN_EXTENSION_SPECS
 * 
 * - [IMPL-PLAYWRIGHT_E2E_EXTENSION] [ARCH-UI_TESTABILITY] [ARCH-MESSAGE_HANDLING] [REQ-UI_INSPECTION] [REQ-THIS_PAGE_TAG_SORT] [REQ-AI_TAGGING_POPUP] How: Implements RUN_EXTENSION_SPECS behavior for IMPL-PLAYWRIGHT_E2E_EXTENSION.
 * - Contract:
 *   - INPUT: npm run test:e2e:extension; playwright.extension.config.js; built dist/ extension
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: pass/fail Playwright reports for extension surfaces; getExtensionId for page evaluation | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: tests/playwright/global-setup.js; extension-fixture.js; extension-*.spec.js
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: RUN_EXTENSION_SPECS
 *   - FOR each extension-*.spec: use LAUNCH_EXTENSION_CONTEXT; exercise surface; ASSERT expectations
 *   - RETURN
 * 
 * === END IMPL-FULL-BLOCK: IMPL-PLAYWRIGHT_E2E_EXTENSION ===
 */
import { test, expect, getExtensionId } from './extension-fixture.js'

test.describe('[REQ-THIS_PAGE_TAG_SORT] [IMPL-THIS_PAGE_TAG_SORT] Side panel tag sort toolbar', () => {
  /** Maps to IMPL essence_pseudocode side_panel_tag_sort_toolbar_e2e; requires real extension page + pointer. */
  test('tag sort toggle visible in extension panel; Frequency click updates aria-pressed', async ({ context }) => {
    const extensionId = await getExtensionId(context)

    const contentPage = await context.newPage()
    await contentPage.goto('https://example.com/')
    await contentPage.waitForLoadState('domcontentloaded')

    const sidePanelPage = await context.newPage()
    await sidePanelPage.goto(`chrome-extension://${extensionId}/src/ui/side-panel/side-panel.html`)
    await sidePanelPage.waitForLoadState('domcontentloaded')

    await sidePanelPage.locator('#bookmarkPanel [data-popup-ref="mainInterface"]:not(.hidden)').waitFor({
      state: 'visible',
      timeout: 15000
    })

    const toggle = sidePanelPage.locator('[data-popup-ref="tagSortToggle"]')
    await expect(toggle).toBeVisible()

    const az = sidePanelPage.locator('[data-sort-mode="alphabetical"]')
    const freq = sidePanelPage.locator('[data-sort-mode="frequency"]')
    await expect(az).toHaveAttribute('aria-pressed', 'true')
    await expect(freq).toHaveAttribute('aria-pressed', 'false')

    await freq.click()
    await expect(freq).toHaveAttribute('aria-pressed', 'true')
    await expect(az).toHaveAttribute('aria-pressed', 'false')

    await sidePanelPage.close()
    await contentPage.close()
  })

  test('[IMPL-SUGGESTED_TAGS] preserves This Page scroll after Suggested Tag activation', async ({ context }) => {
    // [IMPL-SUGGESTED_TAGS] [IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] How: Preserve the scoped This Page container scroll position across Suggested Tag loading, focus, persistence, and chip-redraw effects while leaving standalone popup behavior unchanged.
    const extensionId = await getExtensionId(context)
    const targetUrl = 'https://example.com/suggested-tag-scroll'
    const suggestedTags = [
      'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta',
      'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu',
      'nu', 'xi', 'omicron', 'pi', 'rho', 'sigma'
    ]

    const seedPage = await context.newPage()
    await seedPage.goto(`chrome-extension://${extensionId}/src/ui/options/options.html`)
    await seedPage.evaluate(({ targetUrl, suggestedTags }) => {
      return new Promise((resolve) => {
        chrome.storage.local.set({
          hoverboard_storage_mode: 'local',
          hoverboard_local_bookmarks: {
            [targetUrl]: {
              url: targetUrl,
              description: 'Suggested tag scroll fixture',
              extended: '',
              tags: ['Existing'],
              time: '2026-08-03T00:00:00.000Z',
              updated_at: '2026-08-03T00:00:00.000Z',
              shared: 'yes',
              toread: 'no'
            }
          },
          hoverboard_demo_suggested_tags: suggestedTags,
          hoverboard_demo_recent_tags: [
            'recent-one', 'recent-two', 'recent-three', 'recent-four',
            'recent-five', 'recent-six', 'recent-seven'
          ]
        }, resolve)
      })
    }, { targetUrl, suggestedTags })
    await seedPage.close()

    const sidePanelPage = await context.newPage()
    await sidePanelPage.setViewportSize({ width: 360, height: 320 })
    await sidePanelPage.goto(
      `chrome-extension://${extensionId}/src/ui/side-panel/side-panel.html?screenshot=1&url=${encodeURIComponent(targetUrl)}&title=Suggested%20Tag%20Scroll`
    )
    await sidePanelPage.waitForLoadState('domcontentloaded')
    await sidePanelPage.locator('#bookmarkPanel [data-popup-ref="mainInterface"]:not(.hidden)').waitFor({
      state: 'visible',
      timeout: 15000
    })

    const suggestedChip = sidePanelPage.locator(
      '#bookmarkPanel [data-popup-ref="suggestedTagsContainer"] .tag.recent.clickable'
    ).first()
    await expect(suggestedChip).toBeAttached()

    const beforeScrollTop = await sidePanelPage.evaluate(() => {
      const panel = document.querySelector('#bookmarkPanel')
      const maxScrollTop = Math.max(0, panel.scrollHeight - panel.clientHeight)
      panel.scrollTop = Math.min(140, maxScrollTop)
      return panel.scrollTop
    })
    expect(beforeScrollTop).toBeGreaterThan(0)

    await sidePanelPage.evaluate(() => {
      const chip = document.querySelector(
        '#bookmarkPanel [data-popup-ref="suggestedTagsContainer"] .tag.recent.clickable'
      )
      chip.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    await sidePanelPage.waitForFunction(() => {
      const loading = document.querySelector('#bookmarkPanel [data-popup-ref="loadingState"]')
      return loading && loading.classList.contains('hidden')
    }, null, { timeout: 15000 })

    const afterScrollTop = await sidePanelPage.locator('#bookmarkPanel').evaluate((panel) => panel.scrollTop)
    expect(afterScrollTop).toBe(beforeScrollTop)

    await sidePanelPage.close()
  })
})
