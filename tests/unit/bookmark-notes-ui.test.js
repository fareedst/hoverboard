/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARK_NOTES_UI ===
 * [IMPL-BOOKMARK_NOTES_UI] [ARCH-BOOKMARK_NOTES_UI] [REQ-BOOKMARK_NOTES_UI] — Title/Notes capture UI; payload helpers; browser notes no-op.
 *
 * ## Notes editability by backend
 *
 * - [IMPL-BOOKMARK_NOTES_UI] [ARCH-BOOKMARK_NOTES_UI] [REQ-BOOKMARK_NOTES_UI] How: Browser backend cannot store extended; other backends allow notes.
 * - Contract:
 *   - INPUT: backendId (string or null)
 *   - PRE: caller may pass null/unknown
 *   - OUTPUT: boolean notesEditable
 *   - POST:
 *     - success => true iff backendId is not "browser"
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: NOTES_EDITABLE_FOR_BACKEND
 *   - 1. IF lowercase(backendId) == "browser" THEN RETURN false
 *   - 2. RETURN true
 *
 * ## Build save payload for title and notes
 *
 * - [IMPL-BOOKMARK_NOTES_UI] [ARCH-BOOKMARK_NOTES_UI] [REQ-BOOKMARK_NOTES_UI] How: Merge title/notes into pin-shaped save data with preferredBackend.
 * - Contract:
 *   - INPUT: currentPin (or null), tabTitle, titleText, notesText, preferredBackend, notesEditable
 *   - PRE: url available from currentPin.url or caller supplies url
 *   - OUTPUT: { url, description, extended, tags, shared, toread, preferredBackend? } | { error: MissingUrl }
 *   - POST:
 *     - success => description is trimmed title or tabTitle fallback; extended is notes when notesEditable else preserved or empty string; preferredBackend set when provided
 *     - error MissingUrl => no save payload
 *   - FAILURE_MODES: MissingUrl
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: BUILD_BOOKMARK_NOTES_SAVE_PAYLOAD
 *   - 1. url = currentPin.url OR caller.url
 *   - 2. IF url empty THEN RETURN { error: MissingUrl }
 *   - 3. description = trim(titleText); IF description empty THEN description = tabTitle OR ""
 *   - 4. IF notesEditable THEN extended = notesText OR "" ELSE extended = currentPin.extended OR ""
 *   - 5. tags = currentPin.tags OR ""; shared = currentPin.shared OR "yes"; toread = currentPin.toread OR "no"
 *   - 6. payload = { url, description, extended, tags, shared, toread }
 *   - 7. IF preferredBackend THEN payload.preferredBackend = preferredBackend
 *   - 8. RETURN payload
 *
 * ## Sync Details fields from pin
 *
 * - [IMPL-BOOKMARK_NOTES_UI] [ARCH-BOOKMARK_NOTES_UI] [REQ-BOOKMARK_NOTES_UI] How: Populate Title/Notes inputs; disable Notes for browser.
 * - Contract:
 *   - INPUT: pin, backendId, titleInput, notesInput, notesHintEl
 *   - PRE: DOM elements exist when called from UIManager
 *   - OUTPUT: inputs updated; notes disabled when not editable
 *   - POST:
 *     - success => titleInput.value = pin.description; notesInput.value = pin.extended when editable else ""; notesInput.disabled = !notesEditable; hint visible iff !notesEditable
 *   - EFFECTS: State
 *   - DATA: titleInput, notesInput, notesHintEl
 *   - DATA_TRANSITION: field values and disabled state match pin and backend
 *   - TERMINATION: total
 * - PROCEDURE: SYNC_BOOKMARK_NOTES_FIELDS
 *   - 1. notesEditable = NOTES_EDITABLE_FOR_BACKEND(backendId)
 *   - 2. SET titleInput.value = pin.description OR ""
 *   - 3. SET notesInput.value = IF notesEditable THEN (pin.extended OR "") ELSE ""
 *   - 4. SET notesInput.disabled = NOT notesEditable
 *   - 5. SHOW notesHintEl iff NOT notesEditable
 *
 * ## Persist on blur or Save details
 *
 * - [IMPL-BOOKMARK_NOTES_UI] [ARCH-BOOKMARK_NOTES_UI] [REQ-BOOKMARK_NOTES_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] How: Build payload and send saveBookmark with preferredBackend.
 * - Contract:
 *   - INPUT: titleText, notesText, currentPin, currentTab, getSelectedStorageBackend, resolvedBackend
 *   - PRE: sendMessage available
 *   - OUTPUT: saveBookmark sent | no-op when unchanged | { error: MissingUrl | SaveFailed }
 *   - POST:
 *     - success => pin refreshed; fields re-synced
 *   - FAILURE_MODES: MissingUrl, SaveFailed
 *   - EFFECTS: Http, State, Async
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_BOOKMARK_DETAILS
 *   - 1. preferredBackend = getSelectedStorageBackend()
 *   - 2. notesEditable = NOTES_EDITABLE_FOR_BACKEND(resolvedBackend OR preferredBackend)
 *   - 3. payload = BUILD_BOOKMARK_NOTES_SAVE_PAYLOAD(...)
 *   - 4. IF payload.error THEN show error; RETURN
 *   - 5. IF payload matches currentPin description/extended (and notesEditable) THEN RETURN no-op
 *   - 6. SEND saveBookmark(payload)
 *   - 7. ON success: update currentPin; SYNC_BOOKMARK_NOTES_FIELDS; show success
 *   - 8. ON failure: show error
 *
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_NOTES_UI ===
 */
import {
  notesEditableForBackend,
  buildBookmarkNotesSavePayload,
  bookmarkDetailsUnchanged,
  syncBookmarkNotesFields
} from '../../src/shared/bookmark-notes-ui.js'

describe('[REQ-BOOKMARK_NOTES_UI] [IMPL-BOOKMARK_NOTES_UI] notesEditableForBackend', () => {
  test('returns false for browser backend', () => {
    expect(notesEditableForBackend('browser')).toBe(false)
    expect(notesEditableForBackend('Browser')).toBe(false)
  })

  test('returns true for other backends and null', () => {
    expect(notesEditableForBackend('local')).toBe(true)
    expect(notesEditableForBackend('file')).toBe(true)
    expect(notesEditableForBackend('pinboard')).toBe(true)
    expect(notesEditableForBackend('sync')).toBe(true)
    expect(notesEditableForBackend(null)).toBe(true)
  })
})

describe('[REQ-BOOKMARK_NOTES_UI] [IMPL-BOOKMARK_NOTES_UI] buildBookmarkNotesSavePayload', () => {
  test('returns MissingUrl when no url', () => {
    expect(buildBookmarkNotesSavePayload({ titleText: 'T' })).toEqual({ error: 'MissingUrl' })
  })

  test('uses titleText and notes when editable', () => {
    const payload = buildBookmarkNotesSavePayload({
      url: 'https://example.com/',
      tabTitle: 'Tab',
      titleText: '  My Title  ',
      notesText: 'My notes',
      preferredBackend: 'local',
      notesEditable: true,
      currentPin: { tags: 'a b', shared: 'no', toread: 'yes' }
    })
    expect(payload).toMatchObject({
      url: 'https://example.com/',
      description: 'My Title',
      extended: 'My notes',
      tags: 'a b',
      shared: 'no',
      toread: 'yes',
      preferredBackend: 'local'
    })
  })

  test('falls back to tabTitle when title empty', () => {
    const payload = buildBookmarkNotesSavePayload({
      url: 'https://example.com/',
      tabTitle: 'From Tab',
      titleText: '   ',
      notesEditable: true
    })
    expect(payload.description).toBe('From Tab')
  })

  test('preserves extended when notes not editable', () => {
    const payload = buildBookmarkNotesSavePayload({
      currentPin: { url: 'https://example.com/', extended: 'kept', tags: '' },
      titleText: 'T',
      notesText: 'ignored',
      notesEditable: false
    })
    expect(payload.extended).toBe('kept')
  })
})

describe('[REQ-BOOKMARK_NOTES_UI] [IMPL-BOOKMARK_NOTES_UI] syncBookmarkNotesFields', () => {
  test('disables notes and shows hint for browser', () => {
    const titleInput = { value: '' }
    const notesInput = { value: 'x', disabled: false }
    const notesHintEl = { hidden: true, style: { display: 'none' } }
    const result = syncBookmarkNotesFields({
      pin: { description: 'Title', extended: 'Notes' },
      backendId: 'browser',
      titleInput,
      notesInput,
      notesHintEl
    })
    expect(result.notesEditable).toBe(false)
    expect(titleInput.value).toBe('Title')
    expect(notesInput.value).toBe('')
    expect(notesInput.disabled).toBe(true)
    expect(notesHintEl.hidden).toBe(false)
  })

  test('enables notes for local', () => {
    const titleInput = { value: '' }
    const notesInput = { value: '', disabled: true }
    const notesHintEl = { hidden: false, style: { display: '' } }
    syncBookmarkNotesFields({
      pin: { description: 'T', extended: 'N' },
      backendId: 'local',
      titleInput,
      notesInput,
      notesHintEl
    })
    expect(notesInput.value).toBe('N')
    expect(notesInput.disabled).toBe(false)
    expect(notesHintEl.hidden).toBe(true)
  })
})

describe('[REQ-BOOKMARK_NOTES_UI] [IMPL-BOOKMARK_NOTES_UI] bookmarkDetailsUnchanged', () => {
  test('detects unchanged title and notes', () => {
    const pin = { description: 'A', extended: 'B' }
    const payload = { description: 'A', extended: 'B' }
    expect(bookmarkDetailsUnchanged(pin, payload, true)).toBe(true)
    expect(bookmarkDetailsUnchanged(pin, { description: 'A', extended: 'C' }, true)).toBe(false)
  })
})
