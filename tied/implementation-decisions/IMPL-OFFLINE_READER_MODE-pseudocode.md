# [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE]
# Render persisted sanitized archive content in a dedicated Offline Reader without fetching the live page.

## LOAD_READER_ARCHIVE
- [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: parse URL/archiveId/backend identity, request only the selected persisted archive state, and use an explicit freshness handoff.
- Contract:
  - INPUT: location { search }, sendMessage, elements, staleAfterMs option
  - PRE: Reader is an extension page; sendMessage reads persisted state only
  - OUTPUT: rendered Reader state
  - POST:
    - URL/archiveId query => one GET_PAGE_ARCHIVE request includes `backend`, `archiveId`, and `staleAfterMs`
    - no query => no storage request and missing state is rendered
    - archive success => screenshot lookup uses the persisted archive URL, backend, and archive identity
  - FAILURE_MODES: MissingArchive, UnsupportedBackend, StorageFailed, InvalidArchive
  - DATA: URLSearchParams, backend, archiveId, PageArchiveStore response, PageScreenshotStore response
  - DATA_TRANSITION: storage response becomes DOM state; no live page data enters Reader
  - EFFECTS: DOM, Async, IO
  - TERMINATION: total
- PROCEDURE: LOAD_READER_ARCHIVE
  - query = PARSE_QUERY(location)
  - IF query.url and query.archiveId are absent: RENDER_READER_ERROR(MissingArchive); RETURN MissingArchive
  - staleAfterMs = options.staleAfterMs OR DEFAULT_READER_STALE_AFTER_MS (default 0, meaning no age-based override)
  - archiveResponse = AWAIT sendMessage(GET_PAGE_ARCHIVE, { url: query.url, archiveId: query.archiveId, backend: query.backend, staleAfterMs })
  - IF archiveResponse is missing: RENDER_READER_ERROR(MissingArchive); RETURN MissingArchive
  - IF archiveResponse is failed: RENDER_READER_ERROR(archiveResponse.code OR StorageFailed); RETURN archiveResponse.code OR StorageFailed
  - IF archive lookup throws: RENDER_READER_ERROR(StorageFailed); RETURN { success: false, code: StorageFailed, error }
  - RENDER_READER_ARCHIVE(archiveResponse.archive)
  - screenshotResponse = AWAIT sendMessage(GET_PAGE_SCREENSHOTS, { url: archiveResponse.archive.url, archiveId: archiveResponse.archive.archiveId, backend: archiveResponse.archive.storage OR query.backend })
  - IF screenshotResponse is successful: RENDER_READER_SCREENSHOTS(screenshotResponse.screenshots)
  - RETURN success

## RENDER_READER_ERROR
- [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: preserve stable missing, unsupported, storage, and malformed archive failure codes in an accessible Reader error state instead of collapsing them into missing content.
- Contract:
  - INPUT: failure code, Reader DOM elements
  - PRE: code is a stable archive lookup failure or defaults to StorageFailed
  - OUTPUT: { success: false, code }
  - POST:
    - content is empty and live link is hidden
    - status state is error with code-specific guidance
    - failure code remains available to callers
  - FAILURE_MODES: MissingArchive, UnsupportedBackend, StorageFailed, InvalidArchive
  - EFFECTS: DOM
  - TERMINATION: total
- PROCEDURE: RENDER_READER_ERROR
  - normalizedCode = code OR StorageFailed
  - clear content and live link
  - set title and status text from normalizedCode
  - set status state to error
  - RETURN { success: false, code: normalizedCode }

## VALIDATE_SOURCE_PRESENTATION
- [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: validate persisted source presentation metadata before it can influence the extension-owned Reader shell.
- Contract:
  - INPUT: optional sourcePresentationProfile
  - PRE: profile came from persisted archive data and is untrusted
  - OUTPUT: valid profile | absent
  - POST:
    - valid output contains only allowlisted opaque colors and light/dark intent
    - background-to-text and background-to-link contrast is at least WCAG AA 4.5:1
    - invalid, transparent, missing, or low-contrast input returns absent
  - FAILURE_MODES: InvalidProfile, InsufficientContrast
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: VALIDATE_SOURCE_PRESENTATION
  - parse background, text, and optional link as canonical opaque colors
  - IF background or text is absent: RETURN absent
  - IF contrast(background, text) is less than 4.5: RETURN absent
  - IF link exists and contrast(background, link) is less than 4.5: RETURN absent
  - RETURN profile with optional link and colorScheme

## APPLY_SOURCE_PRESENTATION
- [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: apply validated profile only through fixed extension-owned CSS variables on the Reader shell and clear them for the Hoverboard theme fallback.
- Contract:
  - INPUT: Reader shell element, validated profile or absent
  - PRE: shell is an extension-owned DOM element; profile has passed VALIDATE_SOURCE_PRESENTATION
  - OUTPUT: source presentation state
  - POST:
    - valid profile => shell receives fixed background, text, link, and color-scheme variables and active state
    - absent profile => all source variables are cleared and fallback state is active
    - archive HTML is never modified with profile values
  - FAILURE_MODES: MissingShell
  - EFFECTS: DOM
  - TERMINATION: total
- PROCEDURE: APPLY_SOURCE_PRESENTATION
  - IF shell is absent: RETURN { state: fallback, error: MissingShell }
  - IF profile is absent: clear fixed source variables; remove active state; RETURN fallback
  - set fixed source variables from profile; set active state; RETURN active

## RENDER_READER_ARCHIVE
- [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: render only sanitized stored HTML/text and apply a validated source presentation profile without loading live HTML.
- Contract:
  - INPUT: archive (nullable), Reader DOM elements
  - PRE: archive content came from persisted storage; sanitizer is available
  - OUTPUT: { success: true, archive } | { success: false, code: MissingArchive }
  - POST:
    - archive absent => content is empty, missing state is visible, live link is hidden
    - archive present => only sanitized HTML is inserted and validated profile state is applied
    - stale archive => warning remains visible while content remains readable
  - FAILURE_MODES: MissingArchive, InvalidArchive
  - DATA_TRANSITION: archive fields become text/DOM state; no live HTML is inserted
  - EFFECTS: DOM
  - TERMINATION: total
- PROCEDURE: RENDER_READER_ARCHIVE
  - IF archive is absent:
    - RETURN RENDER_READER_ERROR(MissingArchive)
  - title = archive.sourceTitle OR archive.title OR archive.url
  - profile = VALIDATE_SOURCE_PRESENTATION(archive.sourcePresentationProfile)
  - APPLY_SOURCE_PRESENTATION(reader shell, profile)
  - content.innerHTML = SANITIZE_ARCHIVE_HTML(archive.sanitizedHtml OR '')
  - status = archive.status == stale ? stale warning : available message
  - live link is optional and explicit; never auto-fetched
  - RETURN success

## RENDER_READER_SCREENSHOTS
- [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: present only persisted safe screenshot artifacts alongside Reader content.
- Contract:
  - INPUT: screenshots (list), screenshot DOM elements
  - PRE: screenshot response is untrusted data
  - OUTPUT: rendered screenshot list
  - POST:
    - only data:image png/jpeg/webp base64 values create img elements
    - empty safe list hides the screenshot section
  - FAILURE_MODES: InvalidArchive
  - EFFECTS: DOM
  - TERMINATION: total
- PROCEDURE: RENDER_READER_SCREENSHOTS
  - clear screenshot list
  - FOR each screenshot with valid data:image/*;base64 data:
    - append img with data URL and captured timestamp alt text
  - hide screenshot section when list is empty

## OPEN_LIVE_PAGE
- [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: expose explicit live-page navigation without coupling it to archive rendering or fetching it automatically.
- Contract:
  - INPUT: archive.url, live-link element
  - PRE: archive.url may be absent, non-HTTP(S), or HTTP(S); live-link element is extension-owned
  - OUTPUT: configured or hidden link
  - POST: user activation may navigate to the live URL; Reader performs no fetch
  - EFFECTS: DOM
  - TERMINATION: total
- PROCEDURE: OPEN_LIVE_PAGE
  - IF archive.url is not HTTP(S): clear live link href; hide live link; RETURN
  - set live link href to archive.url only when URL is HTTP(S)
  - user activation opens the link; Reader does not fetch it
