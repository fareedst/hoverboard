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
 *     - success => archive has sanitizedHtml, textContent, contentHash, version, capturedAt, and optional sourcePresentationProfile
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
 * ## EXTRACT_SOURCE_PRESENTATION
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: extract only computed background, foreground, link, and color-scheme intent from the live document without copying source CSS.
 * - Contract:
 *   - INPUT: live document
 *   - PRE: document is available in the page-world executeScript context
 *   - OUTPUT: raw source presentation profile
 *   - POST:
 *     - background is the first opaque computed background found while walking from body toward document
 *     - text and link are computed color values; color-scheme is light, dark, or absent
 *     - no stylesheet text, inline style text, layout, script, or external asset enters the result
 *   - FAILURE_MODES: MissingDocument
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: EXTRACT_SOURCE_PRESENTATION
 *   - IF document or document.documentElement is absent: RETURN {}
 *   - nodes = body followed by each parent through document.documentElement
 *   - FOR node IN nodes:
 *     - style = GET_COMPUTED_STYLE(node)
 *     - IF background is absent and style.backgroundColor is opaque: SET background
 *   - text = GET_COMPUTED_STYLE(body OR document.documentElement).color
 *   - link = GET_COMPUTED_STYLE(first anchor OR body OR document.documentElement).color
 *   - colorScheme = document.documentElement.style.colorScheme OR computed color-scheme intent
 *   - RETURN { background, text, link, colorScheme }
 *
 * ## NORMALIZE_SOURCE_PRESENTATION
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: reduce raw computed presentation data to a bounded allowlisted archive field and keep it outside content identity hashes.
 * - Contract:
 *   - INPUT: raw source presentation profile, size limit
 *   - PRE: raw data is untrusted and may contain malformed CSS-like strings
 *   - OUTPUT: sourcePresentationProfile | absent
 *   - POST:
 *     - only canonical opaque colors and light/dark color-scheme intent remain
 *     - malformed, transparent, unsupported, and oversized values are omitted
 *     - contentHash and archiveId inputs remain based only on URL, sanitized HTML, and text
 *   - FAILURE_MODES: InvalidProfile
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: NORMALIZE_SOURCE_PRESENTATION
 *   - profile = parse each allowlisted color field as canonical RGB or hex
 *   - profile = remove transparent or invalid background and any invalid optional fields
 *   - profile.colorScheme = light or dark when the raw intent is allowlisted
 *   - IF serialized profile exceeds the profile size limit: RETURN absent
 *   - IF profile has no valid field: RETURN absent
 *   - RETURN profile
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
  capturePageContentFromSource,
  hashArchiveContent,
  normalizeSourcePresentationProfile,
  sanitizeArchiveHtml
} from '../../src/features/archive/page-capture.js'

describe('page capture [REQ-PAGE_ARCHIVE_STORAGE]', () => {
  test('removes executable markup, handlers, unsafe URLs, and inline styles', () => {
    const html = '<article><h1>Hello</h1><script>alert(1)</script><a href="javascript:alert(1)" onclick="alert(2)" style="color:red">Read</a><img src="https://example.com/a.png"></article>'
    const sanitized = sanitizeArchiveHtml(html)
    expect(sanitized).not.toContain('<script')
    expect(sanitized).not.toContain('onclick')
    expect(sanitized).not.toContain('javascript:')
    expect(sanitized).not.toContain('style=')
    expect(sanitized).toContain('https://example.com/a.png')
  })

  test('captures sanitized HTML/text with content hash and version', () => {
    const result = capturePageContentFromSource({
      url: 'https://example.com/article',
      title: 'Example',
      html: '<article><h1>Example</h1><p>Readable content.</p></article>',
      textContent: 'Example Readable content.'
    }, { capturedAt: '2026-07-31T12:00:00.000Z' })
    expect(result.success).toBe(true)
    expect(result.archive).toMatchObject({
      url: 'https://example.com/article',
      sourceTitle: 'Example',
      version: 1,
      capturedAt: '2026-07-31T12:00:00.000Z',
      status: 'available'
    })
    expect(result.archive.contentHash).toMatch(/^archive-/)
    expect(result.archive.sanitizedHtml).toContain('Readable content.')
  })

  test('rejects restricted URLs and oversized content', () => {
    expect(capturePageContentFromSource({ url: 'chrome://settings', html: '<p>x</p>', textContent: 'x' })).toEqual({
      success: false,
      code: 'RestrictedUrl'
    })
    expect(capturePageContentFromSource({
      url: 'https://example.com',
      html: '<p>too large</p>',
      textContent: '0123456789'
    }, { maxTextLength: 5 })).toEqual({ success: false, code: 'TooLarge' })
  })

  test('hash is stable for duplicate content', () => {
    expect(hashArchiveContent('same')).toBe(hashArchiveContent('same'))
    expect(hashArchiveContent('same')).not.toBe(hashArchiveContent('different'))
  })

  // - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: reduce raw computed presentation data to a bounded allowlisted archive field and keep it outside content identity hashes.
  test('normalizes a bounded source presentation profile without changing archive identity [IMPL-PAGE_ARCHIVE_STORAGE]', () => {
    const profile = normalizeSourcePresentationProfile({
      background: 'rgb(255, 255, 255)',
      text: '#202124',
      link: 'rgba(0, 0, 238, 1)',
      colorScheme: 'light dark',
      ignored: 'url(https://attacker.example/style.css)'
    })
    expect(profile).toEqual({
      background: '#ffffff',
      text: '#202124',
      link: '#0000ee'
    })

    const withProfile = capturePageContentFromSource({
      url: 'https://example.com/article',
      title: 'Example',
      html: '<article><p>Readable content.</p></article>',
      textContent: 'Readable content.',
      sourcePresentationProfile: {
        background: '#ffffff',
        text: '#202124',
        link: '#0000ee',
        colorScheme: 'light'
      }
    })
    const withoutProfile = capturePageContentFromSource({
      url: 'https://example.com/article',
      title: 'Example',
      html: '<article><p>Readable content.</p></article>',
      textContent: 'Readable content.'
    })
    expect(withProfile.archive.sourcePresentationProfile).toEqual({
      background: '#ffffff',
      text: '#202124',
      link: '#0000ee',
      colorScheme: 'light'
    })
    expect(withProfile.archive.archiveId).toBe(withoutProfile.archive.archiveId)
    expect(withProfile.archive.contentHash).toBe(withoutProfile.archive.contentHash)
  })

  // - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: reduce raw computed presentation data to a bounded allowlisted archive field and keep it outside content identity hashes.
  test('omits transparent, malformed, and oversized source presentation values [REQ-PAGE_ARCHIVE_STORAGE]', () => {
    expect(normalizeSourcePresentationProfile({
      background: 'transparent',
      text: 'not-a-color',
      link: '#fff',
      colorScheme: 'sepia'
    })).toEqual({ link: '#ffffff' })

    expect(normalizeSourcePresentationProfile({
      background: '#ffffff',
      text: '#000000'
    }, 10)).toBeUndefined()
  })
})
