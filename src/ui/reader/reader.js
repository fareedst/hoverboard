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
import { sanitizeArchiveHtml } from '../../features/archive/archive-sanitizer.js'
import {
  getSourceContrastRatio,
  normalizeSourcePresentationProfile
} from '../../features/archive/source-presentation.js'

const GET_PAGE_ARCHIVE = 'GET_PAGE_ARCHIVE'
const GET_PAGE_SCREENSHOTS = 'GET_PAGE_SCREENSHOTS'
export const DEFAULT_READER_STALE_AFTER_MS = 0

function defaultSendMessage (message) {
  return chrome.runtime.sendMessage(message)
}

function actualResponse (response) {
  return response && typeof response === 'object' && 'data' in response && response.success !== undefined
    ? response.data
    : response
}

const READER_ERROR_MESSAGES = Object.freeze({
  MissingArchive: {
    title: 'Archive unavailable',
    status: 'This bookmark has no stored archive.'
  },
  UnsupportedBackend: {
    title: 'Archive backend unavailable',
    status: 'This archive backend is unavailable.'
  },
  StorageFailed: {
    title: 'Archive could not be loaded',
    status: 'The stored archive could not be loaded from local storage.'
  },
  InvalidArchive: {
    title: 'Archive is invalid',
    status: 'The stored archive is invalid.'
  }
})

/**
 * [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: preserve stable missing, unsupported, storage, and malformed archive failure codes in an accessible Reader error state instead of collapsing them into missing content.
 */
export function renderReaderError (code = 'StorageFailed', elements = {}) {
  const normalizedCode = READER_ERROR_MESSAGES[code] ? code : 'StorageFailed'
  const message = READER_ERROR_MESSAGES[normalizedCode]
  const titleEl = elements.titleEl || document.getElementById('reader-title')
  const statusEl = elements.statusEl || document.getElementById('reader-status')
  const contentEl = elements.contentEl || document.getElementById('reader-content')
  const liveLink = elements.liveLink || document.getElementById('reader-live-link')
  const shellEl = elements.shellEl || contentEl?.closest('.reader-shell') || document.querySelector('.reader-shell')
  if (titleEl) titleEl.textContent = message.title
  if (statusEl) {
    statusEl.textContent = message.status
    statusEl.dataset.state = 'error'
  }
  if (contentEl) contentEl.replaceChildren()
  if (liveLink) {
    liveLink.removeAttribute('href')
    liveLink.hidden = true
  }
  applySourcePresentation(shellEl, undefined)
  return { success: false, code: normalizedCode }
}

/**
 * [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: validate persisted source presentation metadata before it can influence the extension-owned Reader shell.
 */
export function validateSourcePresentation (rawProfile) {
  const profile = normalizeSourcePresentationProfile(rawProfile)
  if (!profile?.background || !profile.text) return undefined
  if (getSourceContrastRatio(profile.text, profile.background) < 4.5) return undefined
  if (profile.link && getSourceContrastRatio(profile.link, profile.background) < 4.5) return undefined
  return profile
}

/**
 * [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: apply validated profile only through fixed extension-owned CSS variables on the Reader shell and clear them for the Hoverboard theme fallback.
 */
export function applySourcePresentation (shellEl, profile) {
  if (!shellEl) return { state: 'fallback', error: 'MissingShell' }
  const properties = [
    '--reader-source-background',
    '--reader-source-text',
    '--reader-source-link',
    '--reader-source-color-scheme'
  ]
  if (!profile) {
    for (const property of properties) shellEl.style.removeProperty(property)
    delete shellEl.dataset.sourcePresentation
    return { state: 'fallback' }
  }
  shellEl.style.setProperty('--reader-source-background', profile.background)
  shellEl.style.setProperty('--reader-source-text', profile.text)
  shellEl.style.setProperty('--reader-source-link', profile.link || profile.text)
  if (profile.colorScheme) shellEl.style.setProperty('--reader-source-color-scheme', profile.colorScheme)
  else shellEl.style.removeProperty('--reader-source-color-scheme')
  shellEl.dataset.sourcePresentation = 'active'
  return { state: 'active' }
}

/**
 * [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE]
 * Render only the sanitized stored fragment and never request or insert live HTML.
 */
export function renderReaderArchive (archive, elements = {}) {
  const titleEl = elements.titleEl || document.getElementById('reader-title')
  const metaEl = elements.metaEl || document.getElementById('reader-meta')
  const statusEl = elements.statusEl || document.getElementById('reader-status')
  const contentEl = elements.contentEl || document.getElementById('reader-content')
  const liveLink = elements.liveLink || document.getElementById('reader-live-link')
  const shellEl = elements.shellEl || contentEl?.closest('.reader-shell') || document.querySelector('.reader-shell')
  if (!archive) {
    return renderReaderError('MissingArchive', elements)
  }
  if (titleEl) titleEl.textContent = archive.sourceTitle || archive.title || archive.url || 'Archived page'
  if (metaEl) {
    const captured = archive.capturedAt ? new Date(archive.capturedAt).toLocaleString() : 'unknown time'
    metaEl.textContent = `Captured ${captured} · ${archive.status || 'available'}`
  }
  if (statusEl) {
    statusEl.textContent = archive.status === 'stale'
      ? 'This archive is stale. Recapture it from the bookmark page when you are online.'
      : 'Reading stored content; the live page was not loaded.'
    statusEl.dataset.state = archive.status === 'stale' ? 'warning' : 'available'
  }
  applySourcePresentation(shellEl, validateSourcePresentation(archive.sourcePresentationProfile))
  if (contentEl) contentEl.innerHTML = sanitizeArchiveHtml(archive.sanitizedHtml || '')
  if (liveLink) {
    if (/^https?:/i.test(archive.url || '')) {
      liveLink.href = archive.url
      liveLink.hidden = false
    } else {
      liveLink.removeAttribute('href')
      liveLink.hidden = true
    }
  }
  return { success: true, archive }
}

/**
 * [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: parse URL/archiveId/backend identity, request only the selected persisted archive state, and use an explicit freshness handoff.
 */
export async function loadReaderArchive (locationLike = window.location, options = {}) {
  const sendMessage = options.sendMessage || defaultSendMessage
  const elements = options.elements || {}
  const query = new URLSearchParams(locationLike.search || '')
  const url = query.get('url')
  const archiveId = query.get('archiveId')
  const backend = query.get('backend') || null
  if (!url && !archiveId) return renderReaderError('MissingArchive', elements)
  try {
    const staleAfterMs = Number(options.staleAfterMs ?? DEFAULT_READER_STALE_AFTER_MS)
    const response = actualResponse(await sendMessage({
      type: GET_PAGE_ARCHIVE,
      data: { url, archiveId, backend, staleAfterMs }
    }))
    if (!response?.success) return renderReaderError(response?.code || 'StorageFailed', elements)
    if (!response.archive) return renderReaderError('InvalidArchive', elements)
    const result = renderReaderArchive(response.archive, elements)
    try {
      const screenshotResponse = actualResponse(await sendMessage({
        type: GET_PAGE_SCREENSHOTS,
        data: {
          url: response.archive.url,
          archiveId: response.archive.archiveId || response.archive.id || archiveId,
          backend: response.archive.storage || backend
        }
      }))
      if (screenshotResponse?.success !== false) {
        renderReaderScreenshots(screenshotResponse?.screenshots || [], elements)
      }
    } catch (error) {
      console.warn('[IMPL-PAGE_SCREENSHOT_ARCHIVE] Reader screenshot lookup failed:', error)
    }
    return result
  } catch (error) {
    renderReaderError('StorageFailed', elements)
    return { success: false, code: 'StorageFailed', error: error.message }
  }
}

/**
 * [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE]
 * Present only persisted image data URLs returned by the dedicated screenshot artifact message.
 */
export function renderReaderScreenshots (screenshots, elements = {}) {
  const section = elements.screenshotSection || document.getElementById('reader-screenshots')
  const list = elements.screenshotList || document.getElementById('reader-screenshot-list')
  if (!section || !list) return
  list.replaceChildren()
  const safe = (Array.isArray(screenshots) ? screenshots : []).filter((artifact) => /^data:image\/(?:png|jpe?g|webp);base64,/i.test(artifact?.dataUrl || ''))
  for (const artifact of safe) {
    const image = document.createElement('img')
    image.src = artifact.dataUrl
    image.alt = `Archived screenshot captured ${artifact.capturedAt || 'at an unknown time'}`
    list.appendChild(image)
  }
  section.hidden = safe.length === 0
}

export function bindReaderPage () {
  const back = document.getElementById('reader-back')
  if (back) {
    back.addEventListener('click', (event) => {
      event.preventDefault()
      window.history.back()
    })
  }
  return loadReaderArchive()
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', bindReaderPage)
}
