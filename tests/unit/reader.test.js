/**
 * === IMPL-FULL-BLOCK: IMPL-OFFLINE_READER_MODE ===
 * Render persisted sanitized archive content in a dedicated Offline Reader without fetching the live page.
 *
 * ## LOAD_READER_ARCHIVE
 * - [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: parse URL/archiveId/backend identity, request only the selected persisted archive state, and use an explicit freshness handoff.
 * - Contract:
 *   - INPUT: location { search }, sendMessage, elements, staleAfterMs option
 *   - PRE: Reader is an extension page; sendMessage reads persisted state only
 *   - OUTPUT: rendered Reader state
 *   - POST:
 *     - URL/archiveId query => one GET_PAGE_ARCHIVE request includes `backend`, `archiveId`, and `staleAfterMs`
 *     - no query => no storage request and missing state is rendered
 *     - archive success => screenshot lookup uses the persisted archive URL, backend, and archive identity
 *   - FAILURE_MODES: MissingArchive, UnsupportedBackend, StorageFailed, InvalidArchive
 *   - DATA: URLSearchParams, backend, archiveId, PageArchiveStore response, PageScreenshotStore response
 *   - DATA_TRANSITION: storage response becomes DOM state; no live page data enters Reader
 *   - EFFECTS: DOM, Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: LOAD_READER_ARCHIVE
 *   - query = PARSE_QUERY(location)
 *   - IF query.url and query.archiveId are absent: RENDER_READER_ERROR(MissingArchive); RETURN MissingArchive
 *   - staleAfterMs = options.staleAfterMs OR DEFAULT_READER_STALE_AFTER_MS (default 0, meaning no age-based override)
 *   - archiveResponse = AWAIT sendMessage(GET_PAGE_ARCHIVE, { url: query.url, archiveId: query.archiveId, backend: query.backend, staleAfterMs })
 *   - IF archiveResponse is missing: RENDER_READER_ERROR(MissingArchive); RETURN MissingArchive
 *   - IF archiveResponse is failed: RENDER_READER_ERROR(archiveResponse.code OR StorageFailed); RETURN archiveResponse.code OR StorageFailed
 *   - IF archive lookup throws: RENDER_READER_ERROR(StorageFailed); RETURN { success: false, code: StorageFailed, error }
 *   - RENDER_READER_ARCHIVE(archiveResponse.archive)
 *   - screenshotResponse = AWAIT sendMessage(GET_PAGE_SCREENSHOTS, { url: archiveResponse.archive.url, archiveId: archiveResponse.archive.archiveId, backend: archiveResponse.archive.storage OR query.backend })
 *   - IF screenshotResponse is successful: RENDER_READER_SCREENSHOTS(screenshotResponse.screenshots)
 *   - RETURN success
 *
 * ## RENDER_READER_ERROR
 * - [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: preserve stable missing, unsupported, storage, and malformed archive failure codes in an accessible Reader error state instead of collapsing them into missing content.
 * - Contract:
 *   - INPUT: failure code, Reader DOM elements
 *   - PRE: code is a stable archive lookup failure or defaults to StorageFailed
 *   - OUTPUT: { success: false, code }
 *   - POST:
 *     - content is empty and live link is hidden
 *     - status state is error with code-specific guidance
 *     - failure code remains available to callers
 *   - FAILURE_MODES: MissingArchive, UnsupportedBackend, StorageFailed, InvalidArchive
 *   - EFFECTS: DOM
 *   - TERMINATION: total
 * - PROCEDURE: RENDER_READER_ERROR
 *   - normalizedCode = code OR StorageFailed
 *   - clear content and live link
 *   - set title and status text from normalizedCode
 *   - set status state to error
 *   - RETURN { success: false, code: normalizedCode }
 *
 * ## VALIDATE_SOURCE_PRESENTATION
 * - [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: validate persisted source presentation metadata before it can influence the extension-owned Reader shell.
 * - Contract:
 *   - INPUT: optional sourcePresentationProfile
 *   - PRE: profile came from persisted archive data and is untrusted
 *   - OUTPUT: valid profile | absent
 *   - POST:
 *     - valid output contains only allowlisted opaque colors and light/dark intent
 *     - background-to-text and background-to-link contrast is at least WCAG AA 4.5:1
 *     - invalid, transparent, missing, or low-contrast input returns absent
 *   - FAILURE_MODES: InvalidProfile, InsufficientContrast
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: VALIDATE_SOURCE_PRESENTATION
 *   - parse background, text, and optional link as canonical opaque colors
 *   - IF background or text is absent: RETURN absent
 *   - IF contrast(background, text) is less than 4.5: RETURN absent
 *   - IF link exists and contrast(background, link) is less than 4.5: RETURN absent
 *   - RETURN profile with optional link and colorScheme
 *
 * ## APPLY_SOURCE_PRESENTATION
 * - [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: apply validated profile only through fixed extension-owned CSS variables on the Reader shell and clear them for the Hoverboard theme fallback.
 * - Contract:
 *   - INPUT: Reader shell element, validated profile or absent
 *   - PRE: shell is an extension-owned DOM element; profile has passed VALIDATE_SOURCE_PRESENTATION
 *   - OUTPUT: source presentation state
 *   - POST:
 *     - valid profile => shell receives fixed background, text, link, and color-scheme variables and active state
 *     - absent profile => all source variables are cleared and fallback state is active
 *     - archive HTML is never modified with profile values
 *   - FAILURE_MODES: MissingShell
 *   - EFFECTS: DOM
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_SOURCE_PRESENTATION
 *   - IF shell is absent: RETURN { state: fallback, error: MissingShell }
 *   - IF profile is absent: clear fixed source variables; remove active state; RETURN fallback
 *   - set fixed source variables from profile; set active state; RETURN active
 *
 * ## RENDER_READER_ARCHIVE
 * - [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: render only sanitized stored HTML/text and apply a validated source presentation profile without loading live HTML.
 * - Contract:
 *   - INPUT: archive (nullable), Reader DOM elements
 *   - PRE: archive content came from persisted storage; sanitizer is available
 *   - OUTPUT: { success: true, archive } | { success: false, code: MissingArchive }
 *   - POST:
 *     - archive absent => content is empty, missing state is visible, live link is hidden
 *     - archive present => only sanitized HTML is inserted and validated profile state is applied
 *     - stale archive => warning remains visible while content remains readable
 *   - FAILURE_MODES: MissingArchive, InvalidArchive
 *   - DATA_TRANSITION: archive fields become text/DOM state; no live HTML is inserted
 *   - EFFECTS: DOM
 *   - TERMINATION: total
 * - PROCEDURE: RENDER_READER_ARCHIVE
 *   - IF archive is absent:
 *     - RETURN RENDER_READER_ERROR(MissingArchive)
 *   - title = archive.sourceTitle OR archive.title OR archive.url
 *   - profile = VALIDATE_SOURCE_PRESENTATION(archive.sourcePresentationProfile)
 *   - APPLY_SOURCE_PRESENTATION(reader shell, profile)
 *   - content.innerHTML = SANITIZE_ARCHIVE_HTML(archive.sanitizedHtml OR '')
 *   - status = archive.status == stale ? stale warning : available message
 *   - live link is optional and explicit; never auto-fetched
 *   - RETURN success
 *
 * ## RENDER_READER_SCREENSHOTS
 * - [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: present only persisted safe screenshot artifacts alongside Reader content.
 * - Contract:
 *   - INPUT: screenshots (list), screenshot DOM elements
 *   - PRE: screenshot response is untrusted data
 *   - OUTPUT: rendered screenshot list
 *   - POST:
 *     - only data:image png/jpeg/webp base64 values create img elements
 *     - empty safe list hides the screenshot section
 *   - FAILURE_MODES: InvalidArchive
 *   - EFFECTS: DOM
 *   - TERMINATION: total
 * - PROCEDURE: RENDER_READER_SCREENSHOTS
 *   - clear screenshot list
 *   - FOR each screenshot with valid data:image/*;base64 data:
 *     - append img with data URL and captured timestamp alt text
 *   - hide screenshot section when list is empty
 *
 * ## OPEN_LIVE_PAGE
 * - [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: expose explicit live-page navigation without coupling it to archive rendering or fetching it automatically.
 * - Contract:
 *   - INPUT: archive.url, live-link element
 *   - PRE: archive.url may be absent, non-HTTP(S), or HTTP(S); live-link element is extension-owned
 *   - OUTPUT: configured or hidden link
 *   - POST: user activation may navigate to the live URL; Reader performs no fetch
 *   - EFFECTS: DOM
 *   - TERMINATION: total
 * - PROCEDURE: OPEN_LIVE_PAGE
 *   - IF archive.url is not HTTP(S): clear live link href; hide live link; RETURN
 *   - set live link href to archive.url only when URL is HTTP(S)
 *   - user activation opens the link; Reader does not fetch it
 *
 * === END IMPL-FULL-BLOCK: IMPL-OFFLINE_READER_MODE ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-PAGE_SCREENSHOT_ARCHIVE ===
 * Capture and persist a bounded product screenshot as a separate Local/File artifact.
 *
 * ## VALIDATE_SCREENSHOT_REQUEST
 * - [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: validate backend, URL, privacy, and requested dimensions before invoking browser capture.
 * - Contract:
 *   - INPUT: url, storage, options, limits, isUrlAllowed
 *   - PRE: request is explicit; isUrlAllowed is callable
 *   - OUTPUT: valid | { error: UnsupportedBackend | RestrictedUrl | InhibitedUrl | TooLarge }
 *   - POST:
 *     - valid => browser capture may be called
 *     - error => browser capture is not called
 *   - FAILURE_MODES: UnsupportedBackend, RestrictedUrl, InhibitedUrl, TooLarge
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: VALIDATE_SCREENSHOT_REQUEST
 *   - IF storage is not local or file: RETURN UnsupportedBackend
 *   - IF url is not HTTP(S): RETURN RestrictedUrl
 *   - IF isUrlAllowed(url) is false: RETURN InhibitedUrl
 *   - IF requested dimensions exceed limits: RETURN TooLarge
 *   - RETURN valid
 *
 * ## CAPTURE_PAGE_SCREENSHOT
 * - [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: perform pre-capture validation, capture through the dedicated browser boundary, then normalize and size-check the output.
 * - Contract:
 *   - INPUT: tabId, url, options, storage, limits, isUrlAllowed, dedicatedBrowserCapture
 *   - PRE: capture request is explicit; validation dependencies are available
 *   - OUTPUT: artifact | { success: false, code }
 *   - POST:
 *     - success => artifact has data URL, dimensions, format, contentHash, capturedAt
 *     - validation error => browser capture was not invoked
 *   - FAILURE_MODES: UnsupportedBackend, RestrictedUrl, InhibitedUrl, FullPageCaptureUnavailable, CaptureFailed, TooLarge
 *   - EFFECTS: Browser IO, Async
 *   - TERMINATION: total
 * - PROCEDURE: CAPTURE_PAGE_SCREENSHOT
 *   - validation = AWAIT VALIDATE_SCREENSHOT_REQUEST(url, storage, options, limits, isUrlAllowed)
 *   - IF validation fails: RETURN { success: false, code: validation }
 *   - IF options.fullPage and full-page capability is unavailable: RETURN FullPageCaptureUnavailable
 *   - binary = AWAIT dedicatedBrowserCapture(tabId, options)
 *   - IF binary fails: RETURN CaptureFailed
 *   - artifact = NORMALIZE_SCREENSHOT(binary, options)
 *   - IF artifact exceeds limits: RETURN TooLarge
 *   - RETURN artifact
 *
 * ## SAVE_PAGE_SCREENSHOT
 * - [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: persist a validated screenshot through the explicit adapter/store boundary only after capture succeeds.
 * - Contract:
 *   - INPUT: bookmark { url, storage }, tab, options, screenshotStore
 *   - PRE: screenshotStore is configured for the selected backend
 *   - OUTPUT: { success: true, artifact } | { success: false, code }
 *   - POST:
 *     - success => one current screenshot artifact exists for URL
 *     - failure => prior screenshot remains unchanged
 *   - FAILURE_MODES: delegated capture failures, UnsupportedBackend, StorageFailed
 *   - DATA_TRANSITION: successful recapture replaces current artifact after write
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_PAGE_SCREENSHOT
 *   - artifact = AWAIT CAPTURE_PAGE_SCREENSHOT(tab, options, bookmark.storage)
 *   - IF artifact is error: RETURN artifact
 *   - result = AWAIT screenshotStore.saveScreenshot(bookmark.url, bookmark.storage, artifact)
 *   - IF result fails: RETURN StorageFailed
 *   - RETURN { success: true, artifact: result.artifact }
 *
 * ## REPLACE_CURRENT_SCREENSHOT
 * - [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: use one explicit adapter write to replace every prior artifact for the normalized URL while preserving unrelated archive data.
 * - Contract:
 *   - INPUT: normalized URL, selected backend, validated screenshot artifact, adapter
 *   - PRE: backend is local or file; artifact passed validation and normalization
 *   - OUTPUT: { success: true, artifact } | { success: false, code: UnsupportedBackend | StorageFailed }
 *   - POST:
 *     - success => exactly one current screenshot artifact for URL remains
 *     - write failure => prior screenshot map remains unchanged
 *   - FAILURE_MODES: InvalidUrl, UnsupportedBackend, StorageFailed
 *   - DATA_TRANSITION: replacement data is prepared before one adapter write
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: REPLACE_CURRENT_SCREENSHOT
 *   - data = AWAIT readArchiveMap(adapter)
 *   - remove every data.screenshots entry whose artifact.url == normalize(url)
 *   - data.screenshots[artifact.artifactId] = artifact with version incremented from current URL artifact or 1
 *   - AWAIT adapter.writeArchiveFile(data)
 *   - RETURN { success: true, artifact: data.screenshots[artifact.artifactId] }
 *
 * ## LIST_PAGE_SCREENSHOTS
 * - [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: enumerate only durable product screenshot records through the selected adapter in deterministic order.
 * - Contract:
 *   - INPUT: optional selected backend, URL, adapters
 *   - PRE: backend is local or file when supplied
 *   - OUTPUT: deterministic screenshot artifact list
 *   - POST: list contains only durable screenshot records, ordered newest first
 *   - FAILURE_MODES: UnsupportedBackend, StorageUnavailable, StorageFailed
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: LIST_PAGE_SCREENSHOTS
 *   - RETURN screenshotStore.listScreenshots(backend, url)
 *
 * ## DELETE_PAGE_SCREENSHOTS
 * - [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: delete screenshot artifacts for one URL without changing readable archive content.
 * - Contract:
 *   - INPUT: URL, optional selected backend, adapters
 *   - PRE: URL is normalizable
 *   - OUTPUT: { success: true } | { success: false, code: InvalidUrl | UnsupportedBackend | StorageFailed }
 *   - POST: matching screenshot artifacts are absent; readable archive remains unless DELETE_PAGE_ARCHIVE runs
 *   - FAILURE_MODES: InvalidUrl, UnsupportedBackend, StorageFailed
 *   - DATA_TRANSITION: only matching screenshot records are removed
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: DELETE_PAGE_SCREENSHOTS
 *   - RETURN screenshotStore.deleteScreenshots(url, backend)
 *
 * === END IMPL-FULL-BLOCK: IMPL-PAGE_SCREENSHOT_ARCHIVE ===
 */
import {
  applySourcePresentation,
  loadReaderArchive,
  renderReaderArchive,
  renderReaderError,
  renderReaderScreenshots,
  validateSourcePresentation
} from '../../src/ui/reader/reader.js'

describe('offline Reader [REQ-OFFLINE_READER_MODE]', () => {
  let elements

  beforeEach(() => {
    document.body.innerHTML = '<main class="reader-shell"><h1 id="reader-title"></h1><p id="reader-meta"></p><p id="reader-status"></p><a id="reader-live-link"></a><article id="reader-content"></article><section id="reader-screenshots"><div id="reader-screenshot-list"></div></section></main>'
    elements = {
      shellEl: document.querySelector('.reader-shell'),
      titleEl: document.getElementById('reader-title'),
      metaEl: document.getElementById('reader-meta'),
      statusEl: document.getElementById('reader-status'),
      liveLink: document.getElementById('reader-live-link'),
      contentEl: document.getElementById('reader-content'),
      screenshotSection: document.getElementById('reader-screenshots'),
      screenshotList: document.getElementById('reader-screenshot-list')
    }
  })

  test('renders sanitized stored HTML and capture status', () => {
    const result = renderReaderArchive({
      url: 'https://example.com',
      sourceTitle: 'Stored',
      capturedAt: '2026-07-31T12:00:00.000Z',
      status: 'available',
      sanitizedHtml: '<p>Offline</p><script>window.bad = true</script>'
    }, elements)
    expect(result.success).toBe(true)
    expect(elements.titleEl.textContent).toBe('Stored')
    expect(elements.contentEl.textContent).toBe('Offline')
    expect(elements.contentEl.querySelector('script')).toBeNull()
    expect(elements.statusEl.textContent).toContain('stored content')
  })

  test('renders stale archive warning while preserving offline content REQ-OFFLINE_READER_MODE', () => {
    const result = renderReaderArchive({
      url: 'https://example.com/stale',
      sourceTitle: 'Stale stored page',
      capturedAt: '2026-07-01T12:00:00.000Z',
      status: 'stale',
      sanitizedHtml: '<p>Still available offline</p>'
    }, elements)

    expect(result.success).toBe(true)
    expect(elements.statusEl.dataset.state).toBe('warning')
    expect(elements.statusEl.textContent).toContain('stale')
    expect(elements.contentEl.textContent).toBe('Still available offline')
  })

  test('renders missing state without live-page fallback', () => {
    expect(renderReaderArchive(null, elements)).toEqual({ success: false, code: 'MissingArchive' })
    expect(elements.statusEl.dataset.state).toBe('error')
    expect(elements.liveLink.hidden).toBe(true)
    expect(elements.shellEl.dataset.sourcePresentation).toBeUndefined()
  })

  test.each([
    ['MissingArchive', 'no stored archive'],
    ['UnsupportedBackend', 'backend is unavailable'],
    ['StorageFailed', 'could not be loaded from local storage'],
    ['InvalidArchive', 'archive is invalid']
  ])('preserves structured Reader failure %s [REQ-OFFLINE_READER_MODE]', (code, message) => {
    expect(renderReaderError(code, elements)).toEqual({ success: false, code })
    expect(elements.statusEl.dataset.state).toBe('error')
    expect(elements.statusEl.textContent).toContain(message)
    expect(elements.contentEl.textContent).toBe('')
    expect(elements.liveLink.hidden).toBe(true)
  })

  // - [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: validate persisted source presentation metadata before it can influence the extension-owned Reader shell.
  test('validates source colors with WCAG AA contrast and applies them to the Reader shell [REQ-OFFLINE_READER_MODE]', () => {
    const profile = validateSourcePresentation({
      background: '#ffffff',
      text: '#202124',
      link: '#0000ee',
      colorScheme: 'light'
    })
    expect(profile).toEqual({
      background: '#ffffff',
      text: '#202124',
      link: '#0000ee',
      colorScheme: 'light'
    })

    expect(applySourcePresentation(elements.shellEl, profile)).toEqual({ state: 'active' })
    expect(elements.shellEl.dataset.sourcePresentation).toBe('active')
    expect(elements.shellEl.style.getPropertyValue('--reader-source-background')).toBe('#ffffff')
    expect(elements.shellEl.style.getPropertyValue('--reader-source-text')).toBe('#202124')
    expect(elements.shellEl.style.getPropertyValue('--reader-source-link')).toBe('#0000ee')
  })

  // - [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: apply validated profile only through fixed extension-owned CSS variables on the Reader shell and clear them for the Hoverboard theme fallback.
  test('falls back for missing, unsafe, transparent, or low-contrast source profiles [REQ-OFFLINE_READER_MODE]', () => {
    expect(validateSourcePresentation(null)).toBeUndefined()
    expect(validateSourcePresentation({
      background: 'url(https://attacker.example/style.css)',
      text: '#000000'
    })).toBeUndefined()
    expect(validateSourcePresentation({
      background: 'transparent',
      text: '#000000'
    })).toBeUndefined()
    expect(validateSourcePresentation({
      background: '#ffffff',
      text: '#eeeeee',
      link: '#dddddd'
    })).toBeUndefined()

    applySourcePresentation(elements.shellEl, {
      background: '#ffffff',
      text: '#000000',
      link: '#0000ee'
    })
    expect(applySourcePresentation(elements.shellEl, undefined)).toEqual({ state: 'fallback' })
    expect(elements.shellEl.dataset.sourcePresentation).toBeUndefined()
    expect(elements.shellEl.style.getPropertyValue('--reader-source-background')).toBe('')
    expect(elements.shellEl.style.getPropertyValue('--reader-source-text')).toBe('')
    expect(elements.shellEl.style.getPropertyValue('--reader-source-link')).toBe('')
    expect(elements.shellEl.style.getPropertyValue('--reader-source-color-scheme')).toBe('')
  })

  // - [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: render only sanitized stored HTML and apply a validated source presentation profile without loading live HTML.
  test('renders a valid source presentation profile on chrome and content [IMPL-OFFLINE_READER_MODE]', () => {
    renderReaderArchive({
      url: 'https://example.com/light',
      sourceTitle: 'Light source',
      sanitizedHtml: '<p>Readable</p>',
      sourcePresentationProfile: {
        background: '#ffffff',
        text: '#202124',
        link: '#0000ee',
        colorScheme: 'light'
      }
    }, elements)

    expect(elements.shellEl.dataset.sourcePresentation).toBe('active')
    expect(elements.contentEl.textContent).toBe('Readable')
  })

  test('clears source presentation and live-link state for invalid archive presentation', () => {
    renderReaderArchive({
      url: 'https://example.com/valid',
      sanitizedHtml: '<p>First</p>',
      sourcePresentationProfile: {
        background: '#ffffff',
        text: '#202124',
        link: '#0000ee',
        colorScheme: 'light'
      }
    }, elements)

    renderReaderArchive({
      url: 'archive:invalid-url',
      sanitizedHtml: '<a href="https://example.com/content">Second</a>',
      sourcePresentationProfile: {
        background: '#ffffff',
        text: '#eeeeee',
        link: '#dddddd',
        colorScheme: 'dark'
      }
    }, elements)

    expect(elements.shellEl.dataset.sourcePresentation).toBeUndefined()
    expect(elements.shellEl.style.getPropertyValue('--reader-source-background')).toBe('')
    expect(elements.shellEl.style.getPropertyValue('--reader-source-text')).toBe('')
    expect(elements.shellEl.style.getPropertyValue('--reader-source-link')).toBe('')
    expect(elements.shellEl.style.getPropertyValue('--reader-source-color-scheme')).toBe('')
    expect(elements.liveLink.hidden).toBe(true)
    expect(elements.liveLink.hasAttribute('href')).toBe(false)
    expect(elements.contentEl.querySelector('a')).not.toBeNull()
  })

  test('looks up archive through the selected backend and archive identity', async () => {
    const sendMessage = jest.fn().mockResolvedValue({
      success: true,
      archive: {
        url: 'https://example.com/page',
        archiveId: 'archive-file-page',
        storage: 'file',
        sourceTitle: 'Page',
        capturedAt: '2026-07-31T12:00:00.000Z',
        sanitizedHtml: '<p>Read me</p>'
      }
    })
    const result = await loadReaderArchive(
      { search: '?url=https%3A%2F%2Fexample.com%2Fpage&backend=file&archiveId=archive-file-page' },
      { sendMessage, elements }
    )
    expect(sendMessage).toHaveBeenCalledWith({
      type: 'GET_PAGE_ARCHIVE',
      data: {
        url: 'https://example.com/page',
        archiveId: 'archive-file-page',
        backend: 'file',
        staleAfterMs: 0
      }
    })
    expect(result.success).toBe(true)
    expect(elements.contentEl.textContent).toBe('Read me')
  })

  test('presents only persisted product screenshots for the resolved archive', () => {
    renderReaderScreenshots([
      { dataUrl: 'data:image/png;base64,AAAA', capturedAt: '2026-08-01T10:00:00.000Z' },
      { dataUrl: 'https://example.com/not-an-image' }
    ], elements)

    expect(elements.screenshotList.querySelectorAll('img')).toHaveLength(1)
    expect(elements.screenshotList.querySelector('img').src).toContain('data:image/png;base64,AAAA')
    expect(elements.screenshotSection.hidden).toBe(false)
  })

  test('loads screenshots through the Reader message composition boundary', async () => {
    const sendMessage = jest.fn().mockImplementation(async message => {
      if (message.type === 'GET_PAGE_ARCHIVE') {
        return {
          success: true,
          archive: {
            url: 'https://example.com/with-shot',
            archiveId: 'archive-file-shot',
            storage: 'file',
            sourceTitle: 'With screenshot',
            sanitizedHtml: '<p>Stored</p>'
          }
        }
      }
      return {
        success: true,
        screenshots: [{ dataUrl: 'data:image/png;base64,AAAA', capturedAt: '2026-08-01T10:00:00.000Z' }]
      }
    })

    await loadReaderArchive(
      { search: '?url=https%3A%2F%2Fexample.com%2Fwith-shot' },
      { sendMessage, elements }
    )

    expect(sendMessage).toHaveBeenCalledWith({
      type: 'GET_PAGE_SCREENSHOTS',
      data: {
        url: 'https://example.com/with-shot',
        archiveId: 'archive-file-shot',
        backend: 'file'
      }
    })
    expect(elements.screenshotList.querySelectorAll('img')).toHaveLength(1)
  })

  test('renders the response error code instead of treating storage failure as missing', async () => {
    const sendMessage = jest.fn().mockResolvedValue({
      success: false,
      code: 'StorageFailed',
      error: 'File archive unavailable'
    })

    const result = await loadReaderArchive(
      { search: '?url=https%3A%2F%2Fexample.com%2Ffailed&backend=file' },
      { sendMessage, elements }
    )

    expect(result).toEqual({ success: false, code: 'StorageFailed' })
    expect(elements.statusEl.textContent).toContain('could not be loaded from local storage')
    expect(elements.statusEl.textContent).not.toContain('no stored archive')
  })

  test('renders structured storage failure when archive lookup rejects [REQ-OFFLINE_READER_MODE]', async () => {
    const sendMessage = jest.fn().mockRejectedValue(new Error('storage disconnected'))

    const result = await loadReaderArchive(
      { search: '?url=https%3A%2F%2Fexample.com%2Frejected&backend=file' },
      { sendMessage, elements }
    )

    expect(result).toEqual({
      success: false,
      code: 'StorageFailed',
      error: 'storage disconnected'
    })
    expect(elements.titleEl.textContent).toBe('Archive could not be loaded')
    expect(elements.statusEl.dataset.state).toBe('error')
    expect(elements.contentEl.textContent).toBe('')
    expect(elements.liveLink.hidden).toBe(true)
  })

  test('passes an explicit Reader freshness threshold to archive lookup [REQ-OFFLINE_READER_MODE]', async () => {
    const sendMessage = jest.fn().mockResolvedValue({
      success: true,
      archive: {
        url: 'https://example.com/freshness',
        sanitizedHtml: '<p>Freshness</p>'
      }
    })

    await loadReaderArchive(
      { search: '?url=https%3A%2F%2Fexample.com%2Ffreshness' },
      { sendMessage, elements, staleAfterMs: 86_400_000 }
    )

    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'GET_PAGE_ARCHIVE',
      data: {
        url: 'https://example.com/freshness',
        archiveId: null,
        backend: null,
        staleAfterMs: 86_400_000
      }
    }))
  })
})
