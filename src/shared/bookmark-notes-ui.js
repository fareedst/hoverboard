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
export function notesEditableForBackend (backendId) {
  // PROCEDURE: NOTES_EDITABLE_FOR_BACKEND
  if (String(backendId || '').toLowerCase() === 'browser') return false
  return true
}

/**
 * - [IMPL-BOOKMARK_NOTES_UI] [ARCH-BOOKMARK_NOTES_UI] [REQ-BOOKMARK_NOTES_UI] How: Merge title/notes into pin-shaped save data with preferredBackend.
 * @param {object} opts
 * @returns {object} payload or { error: 'MissingUrl' }
 */
export function buildBookmarkNotesSavePayload ({
  currentPin = null,
  url = null,
  tabTitle = '',
  titleText = '',
  notesText = '',
  preferredBackend = null,
  notesEditable = true
} = {}) {
  // PROCEDURE: BUILD_BOOKMARK_NOTES_SAVE_PAYLOAD
  const resolvedUrl = (currentPin && currentPin.url) || url || ''
  if (!resolvedUrl || !String(resolvedUrl).trim()) {
    return { error: 'MissingUrl' }
  }
  let description = String(titleText ?? '').trim()
  if (!description) description = String(tabTitle ?? '').trim() || ''
  const extended = notesEditable
    ? String(notesText ?? '')
    : String((currentPin && currentPin.extended) || '')
  const tags = currentPin?.tags != null ? currentPin.tags : ''
  const shared = currentPin?.shared != null ? currentPin.shared : 'yes'
  const toread = currentPin?.toread != null ? currentPin.toread : 'no'
  const payload = {
    url: resolvedUrl,
    description,
    extended,
    tags,
    shared,
    toread
  }
  if (preferredBackend) payload.preferredBackend = preferredBackend
  return payload
}

/**
 * True when title/notes would not change the pin (skip save).
 * @param {object|null} currentPin
 * @param {object} payload
 * @param {boolean} notesEditable
 */
export function bookmarkDetailsUnchanged (currentPin, payload, notesEditable) {
  if (!currentPin || payload?.error) return false
  const sameTitle = String(currentPin.description || '') === String(payload.description || '')
  if (!notesEditable) return sameTitle
  const sameNotes = String(currentPin.extended || '') === String(payload.extended || '')
  return sameTitle && sameNotes
}

/**
 * - [IMPL-BOOKMARK_NOTES_UI] [ARCH-BOOKMARK_NOTES_UI] [REQ-BOOKMARK_NOTES_UI] How: Populate Title/Notes inputs; disable Notes for browser.
 * @param {object} opts
 */
export function syncBookmarkNotesFields ({
  pin = null,
  backendId = null,
  titleInput = null,
  notesInput = null,
  notesHintEl = null
} = {}) {
  // PROCEDURE: SYNC_BOOKMARK_NOTES_FIELDS
  const notesEditable = notesEditableForBackend(backendId)
  if (titleInput) {
    titleInput.value = (pin && pin.description) || ''
  }
  if (notesInput) {
    notesInput.value = notesEditable ? ((pin && pin.extended) || '') : ''
    notesInput.disabled = !notesEditable
  }
  if (notesHintEl) {
    notesHintEl.hidden = notesEditable
    notesHintEl.style.display = notesEditable ? 'none' : ''
  }
  return { notesEditable }
}
