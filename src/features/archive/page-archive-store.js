/**
 * === IMPL-FULL-BLOCK: IMPL-PAGE_ARCHIVE_STORAGE ===
 * Capture and persist sanitized readable page archives and separate artifacts for Local/File bookmarks.
 *
 * ## RESOLVE_ARCHIVE_ADAPTER
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: resolve only Local/File archive adapters and report unsupported or unavailable storage before capture.
 * - Contract:
 *   - INPUT: backend (string), adapters (map)
 *   - PRE: backend is supplied as a string; adapters may omit an unconfigured File adapter
 *   - OUTPUT: adapter | { error: UnsupportedBackend | StorageUnavailable }
 *   - POST:
 *     - success => adapter is the adapter registered for local or file
 *     - error => no capture or state transition occurs
 *   - FAILURE_MODES: UnsupportedBackend, StorageUnavailable
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: RESOLVE_ARCHIVE_ADAPTER
 *   - backend = lowercase(String(backend))
 *   - IF backend is not local or file: RETURN { error: UnsupportedBackend }
 *   - adapter = adapters[backend]
 *   - IF adapter is absent: RETURN { error: StorageUnavailable }
 *   - RETURN adapter
 *
 * ## ARCHIVE_PRIVACY_GATE
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: enforce HTTP(S), inhibit-list, explicit-capture, and Local/File boundaries before page content or screenshot capture.
 * - Contract:
 *   - INPUT: bookmark { url, storage }, isUrlAllowed (function), captureExplicit (boolean)
 *   - PRE: bookmark is present; isUrlAllowed is callable
 *   - OUTPUT: allowed | { error: RestrictedUrl | InhibitedUrl | UnsupportedBackend | InvalidRequest }
 *   - POST:
 *     - success => browser capture may proceed
 *     - error => browser capture is not attempted
 *   - FAILURE_MODES: InvalidRequest, UnsupportedBackend, RestrictedUrl, InhibitedUrl
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: ARCHIVE_PRIVACY_GATE
 *   - IF captureExplicit is false: RETURN { error: InvalidRequest }
 *   - IF bookmark.url is not HTTP(S): RETURN { error: RestrictedUrl }
 *   - IF bookmark.storage is not local or file: RETURN { error: UnsupportedBackend }
 *   - IF isUrlAllowed(bookmark.url) is false: RETURN { error: InhibitedUrl }
 *   - RETURN allowed
 *
 * ## CAPTURE_AND_VALIDATE
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: capture and normalize the readable artifact only after the archive privacy gate succeeds.
 * - Contract:
 *   - INPUT: bookmark, capture options, capturePageContent (function)
 *   - PRE: bookmark passed ARCHIVE_PRIVACY_GATE; capturePageContent is callable
 *   - OUTPUT: archive | { error: CaptureFailed | TooLarge | RestrictedUrl | InhibitedUrl | UnsupportedBackend }
 *   - POST:
 *     - success => archive has sanitizedHtml, textContent, contentHash, version, capturedAt
 *     - error => no archive is persisted
 *   - FAILURE_MODES: CaptureFailed, TooLarge, RestrictedUrl, InhibitedUrl, UnsupportedBackend
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: CAPTURE_AND_VALIDATE
 *   - gate = AWAIT ARCHIVE_PRIVACY_GATE(bookmark)
 *   - IF gate is error: RETURN gate
 *   - captured = AWAIT capturePageContent(bookmark.url, options)
 *   - IF captured fails: RETURN { error: CaptureFailed }
 *   - archive = NORMALIZE_ARCHIVE(captured)
 *   - IF archive exceeds limits: RETURN { error: TooLarge }
 *   - RETURN archive
 *
 * ## SAVE_PAGE_ARCHIVE
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: preserve the prior archive, write the new artifact, and update derived archive search only after storage succeeds.
 * - Contract:
 *   - INPUT: bookmark { url, storage }, capture options, adapters, archiveSearch
 *   - PRE: capture is explicit; bookmark.url is HTTP(S); archiveSearch may be absent
 *   - OUTPUT: { success: true, archive } | { success: false, code, previous? }
 *   - POST:
 *     - success => one current archive version and matching derived text entry exist
 *     - StorageFailed => prior archive remains available when the adapter supports atomic failure
 *   - FAILURE_MODES: InvalidRequest, UnsupportedBackend, StorageUnavailable, RestrictedUrl, InhibitedUrl, CaptureFailed, TooLarge, StorageFailed
 *   - DATA: archive collections and derived ArchiveTextIndex
 *   - DATA_TRANSITION: successful write replaces one URL version; failure does not claim a new archive
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_PAGE_ARCHIVE
 *   - adapter = RESOLVE_ARCHIVE_ADAPTER(bookmark.storage, adapters)
 *   - IF adapter is error: RETURN { success: false, code: adapter.error }
 *   - archive = AWAIT CAPTURE_AND_VALIDATE(bookmark, options, capturePageContent)
 *   - IF archive is error: RETURN { success: false, code: archive.error }
 *   - previous = AWAIT adapter.readArchiveFile(bookmark.url)
 *   - result = AWAIT adapter.writeArchiveFile(bookmark.url, archive)
 *   - IF result fails: RETURN { success: false, code: StorageFailed, previous }
 *   - IF archiveSearch exists: AWAIT archiveSearch.replaceArchivedContent(bookmark.url, archive)
 *   - RETURN { success: true, archive }
 *
 * ## DELETE_PAGE_ARCHIVE
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: delete the selected backend's readable archive, screenshot artifacts, and derived search state together.
 * - Contract:
 *   - INPUT: bookmark { url, storage }, optional selected backend, adapters, archiveSearch
 *   - PRE: bookmark.url is normalized or normalizable
 *   - OUTPUT: { success: true } | { success: false, code: InvalidUrl | UnsupportedBackend | StorageUnavailable | StorageFailed }
 *   - POST:
 *     - success => readable archive, screenshot artifacts, and selected-backend search entry are absent
 *     - error => unrelated URLs and backends are unchanged
 *   - FAILURE_MODES: InvalidUrl, UnsupportedBackend, StorageUnavailable, StorageFailed
 *   - DATA: archive and screenshot collections, ArchiveTextIndex
 *   - DATA_TRANSITION: only the requested URL is removed
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: DELETE_PAGE_ARCHIVE
 *   - adapter = RESOLVE_ARCHIVE_ADAPTER(bookmark.storage, adapters)
 *   - IF adapter is error: RETURN { success: false, code: adapter.error }
 *   - REMOVE readable archive and matching screenshot records for bookmark.url
 *   - IF archiveSearch exists: AWAIT archiveSearch.removeArchivedContent(bookmark.url)
 *   - RETURN { success: true }
 *
 * ## LOOKUP_PAGE_ARCHIVE
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: resolve the explicitly selected adapter before reading a URL or archive identifier and never fetch the live page.
 * - Contract:
 *   - INPUT: identifier (URL or archiveId), optional backend, adapters
 *   - PRE: identifier is present; backend is local or file when supplied
 *   - OUTPUT: archive | { error: MissingArchive | UnsupportedBackend | StorageUnavailable | StorageFailed }
 *   - POST:
 *     - success => returned archive is persisted sanitized data; no network request occurs
 *     - error => no network request occurs
 *   - FAILURE_MODES: MissingArchive, UnsupportedBackend, StorageUnavailable, StorageFailed
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: LOOKUP_PAGE_ARCHIVE
 *   - candidates = backend is supplied ? [backend] : [local, file]
 *   - FOR candidate IN candidates:
 *     - adapter = RESOLVE_ARCHIVE_ADAPTER(candidate, adapters)
 *     - IF adapter is error and backend is supplied: RETURN { error: adapter.error }
 *     - IF adapter is error: CONTINUE
 *     - IF identifier is an archiveId: archive = AWAIT adapter.getArchiveById(identifier)
 *     - ELSE: archive = AWAIT adapter.getArchive(normalizeUrl(identifier))
 *     - IF archive exists: RETURN archive
 *   - RETURN { error: MissingArchive }
 *
 * ## LIST_PAGE_ARCHIVES
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: enumerate persisted Local/File artifacts through resolved adapters for explicit browse and search-scope wiring.
 * - Contract:
 *   - INPUT: optional backend, adapters
 *   - PRE: backend is local or file when supplied
 *   - OUTPUT: archives | { error: UnsupportedBackend | StorageUnavailable | StorageFailed }
 *   - POST:
 *     - success => archives contain only persisted records in deterministic order
 *   - FAILURE_MODES: UnsupportedBackend, StorageUnavailable, StorageFailed
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: LIST_PAGE_ARCHIVES
 *   - candidates = backend is supplied ? [backend] : [local, file]
 *   - FOR candidate IN candidates:
 *     - adapter = RESOLVE_ARCHIVE_ADAPTER(candidate, adapters)
 *     - IF adapter is error and backend is supplied: RETURN { error: adapter.error }
 *     - IF adapter is error: CONTINUE
 *     - archives = archives CONCAT AWAIT adapter.listArchives()
 *   - RETURN SORT archives BY capturedAt DESCENDING, url ASCENDING
 *
 * === END IMPL-FULL-BLOCK: IMPL-PAGE_ARCHIVE_STORAGE ===
 */
import {
  archiveKey,
  readArchiveMap,
  InMemoryPageArchiveStorageAdapter,
  ChromeStoragePageArchiveAdapter
} from './page-archive-storage-adapter.js'

export const ARCHIVE_BACKENDS = Object.freeze(['local', 'file'])

function isSupportedBackend (backend) {
  return ARCHIVE_BACKENDS.includes(String(backend || '').toLowerCase())
}

function clone (value) {
  return value == null ? value : JSON.parse(JSON.stringify(value))
}

export class PageArchiveStore {
  constructor ({ localAdapter, fileAdapter, clock = () => new Date().toISOString(), archiveSearch = null } = {}) {
    this.adapters = {
      local: localAdapter || (globalThis.chrome?.storage?.local ? new ChromeStoragePageArchiveAdapter() : new InMemoryPageArchiveStorageAdapter()),
      // [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] File archives require an explicitly configured durable adapter; never silently downgrade to memory.
      file: fileAdapter || null
    }
    this.clock = clock
    this.archiveSearch = archiveSearch
  }

  adapterForBackend (backend) {
    const normalized = String(backend || '').toLowerCase()
    return isSupportedBackend(normalized) ? this.adapters[normalized] : null
  }

  /**
   * [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
   * Read the selected-backend archive version for association compensation.
   */
  async read (url, backend) {
    return this.getArchive(url, backend)
  }

  /**
   * [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
   * Look up one persisted archive by normalized URL without requesting live content.
   */
  async getArchive (url, backend = null) {
    const key = archiveKey(url)
    const backends = backend ? [String(backend).toLowerCase()] : ARCHIVE_BACKENDS
    for (const candidate of backends) {
      const adapter = this.adapterForBackend(candidate)
      if (!adapter) continue
      const data = await readArchiveMap(adapter)
      if (key && data.archives[key]) return clone({ ...data.archives[key], storage: candidate })
    }
    return null
  }

  /**
   * [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
   * Resolve a persisted archive by stable archive identifier for Reader navigation.
   */
  async getArchiveById (archiveId, backend = null) {
    if (!archiveId) return null
    const backends = backend ? [String(backend).toLowerCase()] : ARCHIVE_BACKENDS
    for (const candidate of backends) {
      const adapter = this.adapterForBackend(candidate)
      if (!adapter) continue
      const data = await readArchiveMap(adapter)
      const archive = Object.values(data.archives).find(item => item?.archiveId === archiveId)
      if (archive) return clone({ ...archive, storage: candidate })
    }
    return null
  }

  /**
   * [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
   * Enumerate current persisted archives for explicit browse/search scope.
   */
  async listArchives (backend = null) {
    const backends = backend ? [String(backend).toLowerCase()] : ARCHIVE_BACKENDS
    const result = []
    for (const candidate of backends) {
      const adapter = this.adapterForBackend(candidate)
      if (!adapter) continue
      const data = await readArchiveMap(adapter)
      for (const [url, archive] of Object.entries(data.archives)) {
        result.push({ ...clone(archive), url: archive.url || url, storage: candidate })
      }
    }
    return result.sort((a, b) => String(b.capturedAt || '').localeCompare(String(a.capturedAt || '')))
  }

  /**
   * [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
   * Save only after capture validation and keep the adapter's other artifact collections intact.
   */
  async saveArchive (url, backend, archive) {
    const key = archiveKey(url)
    const adapter = this.adapterForBackend(backend)
    if (!key) return { success: false, code: 'InvalidUrl' }
    if (!adapter) {
      return {
        success: false,
        code: isSupportedBackend(backend) ? 'StorageUnavailable' : 'UnsupportedBackend'
      }
    }
    if (!archive?.sanitizedHtml && !archive?.textContent) return { success: false, code: 'CaptureFailed' }
    try {
      const data = await readArchiveMap(adapter)
      const normalized = {
        ...clone(archive),
        archiveId: archive.archiveId || `archive-${key}`,
        url: key,
        version: Number(archive.version) || 1,
        capturedAt: archive.capturedAt || this.clock(),
        status: archive.status || 'available',
        screenshots: Array.isArray(archive.screenshots) ? archive.screenshots : []
      }
      data.archives[key] = normalized
      await adapter.writeArchiveFile(data)
      await this.archiveSearch?.replaceArchivedContent(key, normalized)
      console.log('[IMPL-PAGE_ARCHIVE_STORAGE] Archive saved:', key, backend)
      return { success: true, archive: clone({ ...normalized, storage: backend }) }
    } catch (error) {
      console.error('[IMPL-PAGE_ARCHIVE_STORAGE] Archive save failed:', error)
      return { success: false, code: 'StorageFailed', error: error.message }
    }
  }

  /**
   * [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
   * Restore the prior archive version after selected-backend bookmark association failure.
   */
  async restore (url, backend, archive) {
    return this.saveArchive(url, backend, archive)
  }

  /**
   * [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
   * Remove only the current readable archive version while preserving separate screenshot artifacts.
   */
  async removeCurrent (url, backend) {
    const key = archiveKey(url)
    const adapter = this.adapterForBackend(backend)
    if (!key) return { success: false, code: 'InvalidUrl' }
    if (!adapter) {
      return {
        success: false,
        code: isSupportedBackend(backend) ? 'StorageUnavailable' : 'UnsupportedBackend'
      }
    }
    try {
      const data = await readArchiveMap(adapter)
      delete data.archives[key]
      await adapter.writeArchiveFile(data)
      await this.archiveSearch?.removeArchivedContent(key)
      console.log('[IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] Current archive removed:', key, backend)
      return { success: true }
    } catch (error) {
      console.error('[IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] Current archive removal failed:', error)
      return { success: false, code: 'StorageFailed', error: error.message }
    }
  }

  /**
   * [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
   * Remove readable content, screenshots, and derived search state for a URL.
   */
  async deleteArchive (url, backend = null) {
    const key = archiveKey(url)
    if (!key) return { success: false, code: 'InvalidUrl' }
    const backends = backend ? [String(backend).toLowerCase()] : ARCHIVE_BACKENDS
    try {
      for (const candidate of backends) {
        const adapter = this.adapterForBackend(candidate)
        if (!adapter) {
          if (backend) {
            return {
              success: false,
              code: isSupportedBackend(candidate) ? 'StorageUnavailable' : 'UnsupportedBackend'
            }
          }
          continue
        }
        const data = await readArchiveMap(adapter)
        delete data.archives[key]
        for (const screenshotKey of Object.keys(data.screenshots)) {
          if (data.screenshots[screenshotKey]?.url === key) delete data.screenshots[screenshotKey]
        }
        await adapter.writeArchiveFile(data)
      }
      await this.archiveSearch?.removeArchivedContent(key)
      console.log('[IMPL-PAGE_ARCHIVE_STORAGE] Archive deleted:', key)
      return { success: true }
    } catch (error) {
      console.error('[IMPL-PAGE_ARCHIVE_STORAGE] Archive delete failed:', error)
      return { success: false, code: 'StorageFailed', error: error.message }
    }
  }
}

export { isSupportedBackend }
