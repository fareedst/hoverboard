/**
 * [REQ-LINK_HEALTH] [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH]
 * Options checkbox load/save for linkHealthChecksEnabled (default off).
 * No options.html Playwright E2E — unit covers bind/load/save wiring.
 */

import { OptionsController } from '../../src/ui/options/options.js'

describe('[REQ-LINK_HEALTH] [IMPL-LINK_HEALTH] Options linkHealthChecksEnabled', () => {
  /** @type {HTMLInputElement} */
  let checkbox
  /** @type {{ getConfig: jest.Mock, updateConfig: jest.Mock, getAuthToken: jest.Mock, setAuthToken: jest.Mock, getInhibitUrls: jest.Mock, setInhibitUrls: jest.Mock, initializeDefaults: jest.Mock }} */
  let configManager

  beforeEach(() => {
    document.body.innerHTML = `
      <input type="checkbox" id="link-health-checks-enabled" />
      <input type="radio" id="storage-mode-pinboard" name="storage-mode" />
      <input type="radio" id="storage-mode-local" name="storage-mode" checked />
      <input type="radio" id="storage-mode-file" name="storage-mode" />
      <input type="radio" id="storage-mode-sync" name="storage-mode" />
      <input type="radio" id="storage-mode-browser" name="storage-mode" />
      <input id="auth-token" />
      <input type="checkbox" id="show-hover-on-load" />
      <input type="checkbox" id="hover-show-tooltips" />
      <input id="recent-posts-count" value="10" />
      <input type="checkbox" id="show-section-labels" />
      <input id="badge-not-bookmarked" value="-" />
      <input id="badge-no-tags" value="0" />
      <input id="badge-private" value="*" />
      <input id="badge-to-read" value="!" />
      <textarea id="inhibit-urls"></textarea>
      <input type="checkbox" id="strip-url-hash" />
      <input id="auto-close-timeout" value="0" />
      <button id="default-theme-toggle"><span class="theme-icon"></span><span class="theme-text"></span></button>
      <input type="checkbox" id="default-transparency-enabled" />
      <input id="default-background-opacity" value="90" />
      <div class="opacity-setting"></div>
      <span class="opacity-value"></span>
      <div id="visibility-preview"></div>
      <input id="font-size-suggested-tags" value="10" />
      <input id="font-size-labels" value="12" />
      <input id="font-size-tags" value="12" />
      <input id="font-size-base" value="14" />
      <input id="font-size-inputs" value="14" />
      <input type="checkbox" id="icon-click-opens-side-panel" checked />
      <button id="save-settings"></button>
      <button id="reset-settings"></button>
      <button id="export-settings"></button>
      <button id="import-settings"></button>
      <input type="file" id="import-file" />
      <button id="test-auth"></button>
      <div id="status-message"></div>
      <div id="auth-section"></div>
    `

    checkbox = document.getElementById('link-health-checks-enabled')
    configManager = {
      getConfig: jest.fn().mockResolvedValue({
        storageMode: 'local',
        showHoverOnPageLoad: false,
        hoverShowTooltips: false,
        initRecentPostsCount: 10,
        uxShowSectionLabels: false,
        badgeTextIfNotBookmarked: '-',
        badgeTextIfBookmarkedNoTags: '0',
        badgeTextIfPrivate: '*',
        badgeTextIfQueued: '!',
        uxUrlStripHash: false,
        uxAutoCloseTimeout: 0,
        defaultVisibilityTheme: 'light-on-dark',
        defaultTransparencyEnabled: false,
        defaultBackgroundOpacity: 90,
        fontSizeSuggestedTags: 10,
        fontSizeLabels: 12,
        fontSizeTags: 12,
        fontSizeBase: 14,
        fontSizeInputs: 14,
        iconClickOpensSidePanel: true,
        linkHealthChecksEnabled: false
      }),
      updateConfig: jest.fn().mockResolvedValue(undefined),
      getAuthToken: jest.fn().mockResolvedValue(''),
      setAuthToken: jest.fn().mockResolvedValue(undefined),
      getInhibitUrls: jest.fn().mockResolvedValue([]),
      setInhibitUrls: jest.fn().mockResolvedValue(undefined),
      initializeDefaults: jest.fn().mockResolvedValue(undefined)
    }

    global.chrome = {
      storage: {
        local: {
          get: jest.fn().mockResolvedValue({}),
          set: jest.fn().mockResolvedValue(undefined)
        },
        onChanged: { addListener: jest.fn() }
      },
      runtime: {
        getURL: jest.fn((p) => p),
        sendMessage: jest.fn().mockResolvedValue({})
      }
    }
  })

  test('loadSettings leaves checkbox unchecked when default false', async () => {
    const controller = new OptionsController({ skipInit: true, configManager })
    controller.bindElements()
    await controller.loadSettings()
    expect(checkbox.checked).toBe(false)
  })

  test('loadSettings checks checkbox when config enabled', async () => {
    configManager.getConfig.mockResolvedValue({
      ...(await configManager.getConfig()),
      linkHealthChecksEnabled: true
    })
    // reset mock implementation after the await above mutated call history
    configManager.getConfig.mockResolvedValue({
      storageMode: 'local',
      showHoverOnPageLoad: false,
      hoverShowTooltips: false,
      initRecentPostsCount: 10,
      uxShowSectionLabels: false,
      badgeTextIfNotBookmarked: '-',
      badgeTextIfBookmarkedNoTags: '0',
      badgeTextIfPrivate: '*',
      badgeTextIfQueued: '!',
      uxUrlStripHash: false,
      uxAutoCloseTimeout: 0,
      defaultVisibilityTheme: 'light-on-dark',
      defaultTransparencyEnabled: false,
      defaultBackgroundOpacity: 90,
      fontSizeSuggestedTags: 10,
      fontSizeLabels: 12,
      fontSizeTags: 12,
      fontSizeBase: 14,
      fontSizeInputs: 14,
      iconClickOpensSidePanel: true,
      linkHealthChecksEnabled: true
    })

    const controller = new OptionsController({ skipInit: true, configManager })
    controller.bindElements()
    await controller.loadSettings()
    expect(checkbox.checked).toBe(true)
  })

  test('saveSettings persists linkHealthChecksEnabled true', async () => {
    const controller = new OptionsController({ skipInit: true, configManager })
    controller.bindElements()
    controller.currentTheme = 'light-on-dark'
    checkbox.checked = true

    await controller.saveSettings()

    expect(configManager.updateConfig).toHaveBeenCalled()
    const patch = configManager.updateConfig.mock.calls[0][0]
    expect(patch.linkHealthChecksEnabled).toBe(true)
  })

  test('saveSettings persists linkHealthChecksEnabled false', async () => {
    const controller = new OptionsController({ skipInit: true, configManager })
    controller.bindElements()
    controller.currentTheme = 'light-on-dark'
    checkbox.checked = false

    await controller.saveSettings()

    const patch = configManager.updateConfig.mock.calls[0][0]
    expect(patch.linkHealthChecksEnabled).toBe(false)
  })
})
