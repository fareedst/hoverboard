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
import { archiveKey, readArchiveMap } from './page-archive-storage-adapter.js'

export class PageScreenshotStore {
  constructor ({ localAdapter, fileAdapter, clock = () => new Date().toISOString() } = {}) {
    this.adapters = { local: localAdapter, file: fileAdapter }
    this.clock = clock
  }

  adapterForBackend (backend) {
    return this.adapters[String(backend || '').toLowerCase()] || null
  }

  /**
   * [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE]
   * List durable screenshot artifacts, optionally narrowed to the selected backend and URL.
   */
  async listScreenshots (backend = null, url = null) {
    if (backend && !['local', 'file'].includes(String(backend).toLowerCase())) return []
    const key = url ? archiveKey(url) : null
    const candidates = backend ? [String(backend).toLowerCase()] : ['local', 'file']
    const result = []
    for (const candidate of candidates) {
      const adapter = this.adapterForBackend(candidate)
      if (!adapter) continue
      // [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] Prepare the replacement map independently so a failed adapter write cannot mutate the prior in-memory result.
      const data = JSON.parse(JSON.stringify(await readArchiveMap(adapter)))
      result.push(...Object.values(data.screenshots)
        .filter(artifact => !key || artifact?.url === key)
        .map((artifact) => ({ ...artifact, storage: candidate })))
    }
    return result.sort((a, b) => String(b.capturedAt || '').localeCompare(String(a.capturedAt || '')))
  }

  /**
   * [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE]
   * Persist one current screenshot artifact and remove stale captures for the same normalized URL.
   */
  async saveScreenshot (url, backend, artifact) {
    const key = archiveKey(url)
    const adapter = this.adapterForBackend(backend)
    if (!key) return { success: false, code: 'InvalidUrl' }
    if (!adapter) {
      return {
        success: false,
        code: ['local', 'file'].includes(String(backend || '').toLowerCase())
          ? 'StorageUnavailable'
          : 'UnsupportedBackend'
      }
    }
    if (!artifact?.dataUrl) return { success: false, code: 'CaptureFailed' }
    try {
      const data = await readArchiveMap(adapter)
      const normalized = {
        ...artifact,
        artifactId: artifact.artifactId || `screenshot-${key}`,
        url: key,
        capturedAt: artifact.capturedAt || this.clock(),
        version: Number(artifact.version) || 1
      }
      // [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] Replace every prior artifact for this URL before writing the current capture.
      const previous = Object.values(data.screenshots).find(item => item?.url === key)
      normalized.version = Math.max(normalized.version, (Number(previous?.version) || 0) + 1)
      for (const [artifactId, current] of Object.entries(data.screenshots)) {
        if (current?.url === key) delete data.screenshots[artifactId]
      }
      data.screenshots[normalized.artifactId] = normalized
      await adapter.writeArchiveFile(data)
      console.log('[IMPL-PAGE_SCREENSHOT_ARCHIVE] Screenshot saved:', key, backend)
      return { success: true, artifact: normalized }
    } catch (error) {
      console.error('[IMPL-PAGE_SCREENSHOT_ARCHIVE] Screenshot save failed:', error)
      return { success: false, code: 'StorageFailed', error: error.message }
    }
  }

  /**
   * [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE]
   * Delete all durable screenshot artifacts for one URL while leaving readable archive content intact.
   */
  async deleteScreenshots (url, backend = null) {
    const key = archiveKey(url)
    if (!key) return { success: false, code: 'InvalidUrl' }
    if (backend && !['local', 'file'].includes(String(backend).toLowerCase())) {
      return { success: false, code: 'UnsupportedBackend' }
    }
    const candidates = backend ? [String(backend).toLowerCase()] : ['local', 'file']
    try {
      for (const candidate of candidates) {
        const adapter = this.adapterForBackend(candidate)
        if (!adapter) {
          if (backend) return { success: false, code: 'StorageUnavailable' }
          continue
        }
        const data = await readArchiveMap(adapter)
        for (const [id, artifact] of Object.entries(data.screenshots)) {
          if (artifact?.url === key) delete data.screenshots[id]
        }
        await adapter.writeArchiveFile(data)
      }
      return { success: true }
    } catch (error) {
      return { success: false, code: 'StorageFailed', error: error.message }
    }
  }
}
