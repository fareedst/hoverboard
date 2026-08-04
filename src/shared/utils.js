/**
 * Modern Utilities - Replaces legacy tools.js
 * Provides common utility functions with modern patterns
 *
 * [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] URL processing and validation
 * [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] String manipulation and text processing
 * [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Array and object manipulation
 * [IMPL-TIME_ASYNC_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Time and async utilities for UI and API operations
 * [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] DOM utilities for extension content scripts
 */

/**
 * === IMPL-FULL-BLOCK: IMPL-SELECTION_TO_TAG_INPUT ===
 * [IMPL-SELECTION_TO_TAG_INPUT] [ARCH-SELECTION_TO_TAG_INPUT] [REQ-SELECTION_TO_TAG_INPUT] [REQ-TAG_MANAGEMENT] — Prefill tag input from page selection on popup open; GET_PAGE_SELECTION and normalizeSelectionForTagInput. Contract: selection via message; tag input prefilled.
 *
 * ## NORMALIZE_SELECTION_FOR_TAG_INPUT
 *
 * - [IMPL-SELECTION_TO_TAG_INPUT] [ARCH-SELECTION_TO_TAG_INPUT] [REQ-SELECTION_TO_TAG_INPUT] [REQ-TAG_MANAGEMENT] How: Implements normalizeSelectionForTagInput(selection, maxWords) behavior for IMPL-SELECTION_TO_TAG_INPUT.
 * - Contract:
 *   - INPUT: none at popup open (selection read from page via message); raw selection string (normalizeSelectionForTagInput)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: tag input field prefilled with normalized words (side effect) | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: current tab; newTagInput element; maxWords = 8
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: NORMALIZE_SELECTION_FOR_TAG_INPUT
 *   - text = replace non-word non-space chars with space in selection
 *   - text = collapse spaces, trim
 *   - words = split text on whitespace
 *   - RETURN first maxWords words joined by space
 *   - How (sub-block): Request selection; if present set tag input to normalized value.
 *   - 1. popup loadInitialData (after loadSuggestedTags or loadRecentTags):
 *   - TRY response = sendToTab(GET_PAGE_SELECTION)
 *   - ON timeout or failure LEAVE tag input unchanged, RETURN
 *   - raw = response.data.selection
 *   - IF raw non-empty:
 *   - normalized = normalizeSelectionForTagInput(raw, 8)
 *   - setTagInputValue(normalized)
 *
 * === END IMPL-FULL-BLOCK: IMPL-SELECTION_TO_TAG_INPUT ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-ARRAY_OBJECT_UTILITIES ===
 * [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] — Array and object helpers: unique, chunk, compact; deepClone, isEmpty, pick; pure, no mutation.
 *
 * ## UNIQUE
 *
 * - [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements unique(arr) behavior for IMPL-ARRAY_OBJECT_UTILITIES.
 * - Contract:
 *   - INPUT: array or object; optional keys (for pick), size (for chunk)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: transformed array or object; no mutation of inputs
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: pure functions; same file as urlUtils, textUtils
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: UNIQUE
 *   - RETURN array of distinct elements (order preserved or by first occurrence)
 *
 * ## CHUNK
 *
 * - [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements chunk(arr, size) behavior for IMPL-ARRAY_OBJECT_UTILITIES.
 * - Contract:
 *   - INPUT: array or object; optional keys (for pick), size (for chunk)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: transformed array or object; no mutation of inputs
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: pure functions; same file as urlUtils, textUtils
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: CHUNK
 *   - SPLIT arr into subarrays of length size; last chunk may be shorter
 *   - RETURN array of chunks
 *
 * ## COMPACT
 *
 * - [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements compact(arr) behavior for IMPL-ARRAY_OBJECT_UTILITIES.
 * - Contract:
 *   - INPUT: array or object; optional keys (for pick), size (for chunk)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: transformed array or object; no mutation of inputs
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: pure functions; same file as urlUtils, textUtils
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: COMPACT
 *   - RETURN array with falsy elements removed (false, null, undefined, 0, "", NaN)
 *
 * ## DEEP_CLONE
 *
 * - [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements deepClone(obj) behavior for IMPL-ARRAY_OBJECT_UTILITIES.
 * - Contract:
 *   - INPUT: array or object; optional keys (for pick), size (for chunk)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: transformed array or object; no mutation of inputs
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: pure functions; same file as urlUtils, textUtils
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: DEEP_CLONE
 *   - RETURN deep copy of obj (nested objects/arrays copied recursively)
 *
 * ## IS_EMPTY
 *
 * - [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements isEmpty(obj) behavior for IMPL-ARRAY_OBJECT_UTILITIES.
 * - Contract:
 *   - INPUT: array or object; optional keys (for pick), size (for chunk)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: transformed array or object; no mutation of inputs
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: pure functions; same file as urlUtils, textUtils
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: IS_EMPTY
 *   - IF obj is null or undefined: RETURN true
 *   - FOR each enumerable key: IF any exists RETURN false
 *   - RETURN true
 *
 * ## PICK
 *
 * - [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements pick(obj, keys) behavior for IMPL-ARRAY_OBJECT_UTILITIES.
 * - Contract:
 *   - INPUT: array or object; optional keys (for pick), size (for chunk)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: transformed array or object; no mutation of inputs
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: pure functions; same file as urlUtils, textUtils
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: PICK
 *   - result = {}
 *   - FOR each key IN keys: IF obj[key] present THEN result[key] = obj[key]
 *   - RETURN result
 *
 * ## SHARED_UTILITIES_COMPOSITION
 *
 * - [IMPL-ARRAY_OBJECT_UTILITIES] [IMPL-URL_UTILITIES] [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Composes pure shared utility modules so URL normalization can consume the same non-mutating helper contract as array and object utilities.
 * - Contract:
 *   - INPUT: bookmark URL and shared utility functions
 *   - PRE: utility functions are imported from the shared module
 *   - OUTPUT: normalized URL and unchanged source data
 *   - POST:
 *     - success => normalization returns the expected URL while helper inputs remain unchanged
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: SHARED_UTILITIES_COMPOSITION
 *   - Preserve source bookmark data
 *   - APPLY URL normalization
 *   - RETURN normalized URL
 *
 * === END IMPL-FULL-BLOCK: IMPL-ARRAY_OBJECT_UTILITIES ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-CROSS_BROWSER ===
 * [IMPL-CROSS_BROWSER] [ARCH-CROSS_BROWSER] [REQ-CROSS_BROWSER] — Chrome-first browser API shim; shared `browser` export for messaging and storage helpers. Contract: callers import { browser } from safari-shim (via utils); Promise-friendly messaging.
 *
 * ## INITIALIZE_BROWSER_API
 *
 * - [IMPL-CROSS_BROWSER] [ARCH-CROSS_BROWSER] [REQ-CROSS_BROWSER] How: Implements initializeBrowserAPI() behavior for IMPL-CROSS_BROWSER.
 * - Contract:
 *   - INPUT: chrome (or future browser) extension APIs; caller operations (sendMessage, tabs, storage)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: unified `browser` object with Promise wrappers, retry, and storage helpers
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: src/shared/safari-shim.js; re-export from src/shared/utils.js
 *   - EFFECTS: Async, Http, IO
 *   - TERMINATION: total
 * - PROCEDURE: INITIALIZE_BROWSER_API
 *   - IF chrome is defined: browser = chrome; RETURN
 *   - IF window.browser (polyfill): browser = window.browser; RETURN
 *   - browser = createMinimalBrowserAPI()
 *   - How (sub-block): Wrap messaging/tabs with retries and Promise API for Chrome service worker and content scripts.
 *   - 1. safariEnhancements (browser API shim):
 *   - PROVIDE runtime.sendMessage / tabs.* with retry and Promise behavior
 *   - PROVIDE storage helpers (quota monitoring, graceful degradation) for Chromium storage
 *   - DO NOT attach Safari-only platform metadata on messages (Safari product deferred)
 *   - How (sub-block): Reserved hooks for deferred multi-browser; Safari product not active.
 *
 * ## PLATFORM_UTILS
 *
 * - [IMPL-CROSS_BROWSER] [ARCH-CROSS_BROWSER] [REQ-CROSS_BROWSER] How: Implements platformUtils behavior for IMPL-CROSS_BROWSER.
 * - Contract:
 *   - INPUT: chrome (or future browser) extension APIs; caller operations (sendMessage, tabs, storage)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: unified `browser` object with Promise wrappers, retry, and storage helpers
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: src/shared/safari-shim.js; re-export from src/shared/utils.js
 *   - EFFECTS: Async, Http, IO
 *   - TERMINATION: total
 * - PROCEDURE: PLATFORM_UTILS
 *   - isSafari(): RETURN false  # reserved; Safari App Extension deferred
 *   - isChrome(): RETURN chrome is defined
 *   - isFirefox(): RETURN browser.runtime.getBrowserInfo is a function
 *   - getPlatform():
 *   - IF isChrome(): RETURN "chrome"
 *   - IF isFirefox(): RETURN "firefox"
 *   - RETURN "unknown"
 *   - How (sub-block): Call sites use shim export, not raw chrome only, for future expansion readiness.
 *   - 1. ON service worker / content / message-handler import:
 *   - USE browser from safari-shim (or utils re-export)
 *
 * ## MESSAGE_DISPATCH_SHARED_BROWSER
 *
 * - [IMPL-CROSS_BROWSER] [IMPL-MESSAGE_HANDLING] [ARCH-CROSS_BROWSER] [ARCH-MESSAGE_HANDLING] [REQ-CROSS_BROWSER] How: Routes a MessageClient request through the shared browser shim and resolves the callback response without UI or host-specific behavior.
 * - Contract:
 *   - INPUT: message payload, retry options, shared browser runtime
 *   - PRE: shared browser runtime is available; callback-style sendMessage is supported
 *   - OUTPUT: resolved message response
 *   - POST:
 *     - success => runtime receives the message with a generated messageId and the response is returned
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: MESSAGE_DISPATCH_SHARED_BROWSER
 *   - message = ADD messageId to input payload
 *   - SEND message through shared browser runtime
 *   - AWAIT callback response
 *   - RETURN response
 *
 * === END IMPL-FULL-BLOCK: IMPL-CROSS_BROWSER ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-DOM_UTILITIES ===
 * [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] — DOM helpers: waitForElement (MutationObserver), createElement, and pin form helpers. Contract: inputs and outputs for each utility.
 *
 * ## WAIT_FOR_ELEMENT
 *
 * - [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements waitForElement(container, selector, options) behavior for IMPL-DOM_UTILITIES.
 * - Contract:
 *   - INPUT: selector (waitForElement); tag and attrs (createElement); form data (createPinFromFormData / validatePinFormData)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: element or null (waitForElement); element (createElement); pin object or validation result | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: WAIT_FOR_ELEMENT
 *   - IF element = container.querySelector(selector) THEN RETURN resolve(element)
 *   - observer = new MutationObserver(callback)
 *   - observer.observe(container, { childList, subtree })
 *   - ON mutation: IF element = container.querySelector(selector) THEN resolve(element), disconnect observer
 *   - ON timeout (if given): reject or resolve null, disconnect observer
 *   - How (sub-block): Create element with tag and attributes.
 *
 * ## CREATE_ELEMENT
 *
 * - [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements createElement(tag, attrs) behavior for IMPL-DOM_UTILITIES.
 * - Contract:
 *   - INPUT: selector (waitForElement); tag and attrs (createElement); form data (createPinFromFormData / validatePinFormData)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: element or null (waitForElement); element (createElement); pin object or validation result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: CREATE_ELEMENT
 *   - el = document.createElement(tag)
 *   - FOR each attr in attrs: SET el[attr] or setAttribute
 *   - RETURN el
 *   - How (sub-block): Build pin object from form fields.
 *
 * ## CREATE_PIN_FROM_FORM_DATA
 *
 * - [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements createPinFromFormData(formData) behavior for IMPL-DOM_UTILITIES.
 * - Contract:
 *   - INPUT: selector (waitForElement); tag and attrs (createElement); form data (createPinFromFormData / validatePinFormData)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: element or null (waitForElement); element (createElement); pin object or validation result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: CREATE_PIN_FROM_FORM_DATA
 *   - BUILD pin object from form fields (url, description, tags, etc.)
 *   - RETURN pin object
 *   - How (sub-block): Validate required fields and formats for pin/form.
 *
 * ## VALIDATE_PIN_FORM_DATA
 *
 * - [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements validatePinFormData(formData or pin) behavior for IMPL-DOM_UTILITIES.
 * - Contract:
 *   - INPUT: selector (waitForElement); tag and attrs (createElement); form data (createPinFromFormData / validatePinFormData)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: element or null (waitForElement); element (createElement); pin object or validation result | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: VALIDATE_PIN_FORM_DATA
 *   - CHECK required fields and formats
 *   - RETURN valid boolean or validation errors
 *
 * === END IMPL-FULL-BLOCK: IMPL-DOM_UTILITIES ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-TEXT_UTILITIES ===
 * [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] — truncate, normalizeText, escapeHtml for UI and user input. Contract: string and optional maxLen; truncated/normalized/escaped string.
 *
 * ## TRUNCATE
 *
 * - [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements truncate(str, maxLen) behavior for IMPL-TEXT_UTILITIES.
 * - Contract:
 *   - INPUT: string and optional max length (truncate); string (normalizeText, escapeHtml)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: string (truncated, normalized, or HTML-escaped)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: ellipsis string (e.g. "…")
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: TRUNCATE
 *   - IF str.length <= maxLen RETURN str
 *   - RETURN str.slice(0, maxLen) + ellipsis
 *   - How (sub-block): Trim and collapse whitespace; normalize Unicode.
 *
 * ## NORMALIZE_TEXT
 *
 * - [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements normalizeText(str) behavior for IMPL-TEXT_UTILITIES.
 * - Contract:
 *   - INPUT: string and optional max length (truncate); string (normalizeText, escapeHtml)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: string (truncated, normalized, or HTML-escaped)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: ellipsis string (e.g. "…")
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: NORMALIZE_TEXT
 *   - NORMALIZE whitespace and Unicode (e.g. trim, collapse spaces) for display or comparison
 *   - RETURN normalized string
 *   - How (sub-block): Encode <, >, &, " for safe textContent/attribute use.
 *
 * ## ESCAPE_HTML
 *
 * - [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements escapeHtml(str) behavior for IMPL-TEXT_UTILITIES.
 * - Contract:
 *   - INPUT: string and optional max length (truncate); string (normalizeText, escapeHtml)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: string (truncated, normalized, or HTML-escaped)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: ellipsis string (e.g. "…")
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: ESCAPE_HTML
 *   - ENCODE characters that are significant in HTML (e.g. <, >, &, ") so string is safe for textContent or attribute use
 *   - RETURN encoded string
 *
 * ## SHARED_UTILITIES_COMPOSITION
 *
 * - [IMPL-TEXT_UTILITIES] [IMPL-ARRAY_OBJECT_UTILITIES] [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Keeps text normalization available to the shared URL and array/object utility composition without mutating caller data.
 * - Contract:
 *   - INPUT: text or URL value and shared helper module
 *   - PRE: text helper functions are available
 *   - OUTPUT: normalized text value consumed by a shared utility
 *   - POST:
 *     - success => normalized output is deterministic and source input is unchanged
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: SHARED_UTILITIES_COMPOSITION
 *   - Receive text value
 *   - NORMALIZE text
 *   - RETURN normalized value to the composing utility
 *
 * === END IMPL-FULL-BLOCK: IMPL-TEXT_UTILITIES ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-TIME_ASYNC_UTILITIES ===
 * [IMPL-TIME_ASYNC_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] — delay (Promise), formatTimestamp, getRelativeTime for API/UI. Contract: ms or timestamp in; Promise or formatted/relative string out.
 *
 * ## DELAY
 *
 * - [IMPL-TIME_ASYNC_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements delay(ms) behavior for IMPL-TIME_ASYNC_UTILITIES.
 * - Contract:
 *   - INPUT: milliseconds (delay); timestamp (formatTimestamp, getRelativeTime)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise that resolves after ms (delay); formatted date string (formatTimestamp); relative time string (getRelativeTime)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: current time for relative calculation
 *   - EFFECTS: Async
 *   - TERMINATION: total
 * - PROCEDURE: DELAY
 *   - RETURN new Promise such that resolve() is called after ms (e.g. setTimeout(resolve, ms))
 *   - How (sub-block): Convert to locale date/time string.
 *
 * ## FORMAT_TIMESTAMP
 *
 * - [IMPL-TIME_ASYNC_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements formatTimestamp(ts) behavior for IMPL-TIME_ASYNC_UTILITIES.
 * - Contract:
 *   - INPUT: milliseconds (delay); timestamp (formatTimestamp, getRelativeTime)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise that resolves after ms (delay); formatted date string (formatTimestamp); relative time string (getRelativeTime)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: current time for relative calculation
 *   - EFFECTS: Async
 *   - TERMINATION: total
 * - PROCEDURE: FORMAT_TIMESTAMP
 *   - CONVERT timestamp to display format (e.g. locale date/time string)
 *   - RETURN formatted string
 *   - How (sub-block): Return "X s/m/h/d ago" from delta.
 *
 * ## GET_RELATIVE_TIME
 *
 * - [IMPL-TIME_ASYNC_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements getRelativeTime(ts) behavior for IMPL-TIME_ASYNC_UTILITIES.
 * - Contract:
 *   - INPUT: milliseconds (delay); timestamp (formatTimestamp, getRelativeTime)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise that resolves after ms (delay); formatted date string (formatTimestamp); relative time string (getRelativeTime)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: current time for relative calculation
 *   - EFFECTS: Async
 *   - TERMINATION: total
 * - PROCEDURE: GET_RELATIVE_TIME
 *   - delta = now - ts
 *   - IF delta in seconds/minutes/hours/days THEN RETURN "X s/m/h/d ago" (or similar)
 *   - RETURN human-readable relative string
 *
 * === END IMPL-FULL-BLOCK: IMPL-TIME_ASYNC_UTILITIES ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-URL_UTILITIES ===
 * [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] — processUrl (strip hash), isValidUrl, getDomain for bookmark management. Contract: url string in; normalized url or boolean or domain out.
 *
 * ## PROCESS_URL
 *
 * - [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements processUrl(url) behavior for IMPL-URL_UTILITIES.
 * - Contract:
 *   - INPUT: url (string)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized url (processUrl), boolean (isValidUrl), domain string (getDomain)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: pure functions in same file as arrayUtils, objectUtils, textUtils
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: PROCESS_URL
 *   - IF url empty or invalid: RETURN url or default
 *   - OPTIONALLY strip hash, trailing slash, normalize scheme
 *   - RETURN normalized url string
 *   - How (sub-block): Parse with URL constructor or regex; return true if valid.
 *
 * ## IS_VALID_URL
 *
 * - [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements isValidUrl(url) behavior for IMPL-URL_UTILITIES.
 * - Contract:
 *   - INPUT: url (string)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized url (processUrl), boolean (isValidUrl), domain string (getDomain)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: pure functions in same file as arrayUtils, objectUtils, textUtils
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: IS_VALID_URL
 *   - TRY parse url with URL constructor (or regex)
 *   - RETURN true if valid else false
 *   - How (sub-block): Parse and return hostname or host.
 *
 * ## GET_DOMAIN
 *
 * - [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements getDomain(url) behavior for IMPL-URL_UTILITIES.
 * - Contract:
 *   - INPUT: url (string)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized url (processUrl), boolean (isValidUrl), domain string (getDomain)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: pure functions in same file as arrayUtils, objectUtils, textUtils
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: GET_DOMAIN
 *   - parsed = parse url
 *   - RETURN parsed.hostname or parsed.host or ""
 *
 * ## SHARED_UTILITIES_COMPOSITION
 *
 * - [IMPL-URL_UTILITIES] [IMPL-ARRAY_OBJECT_UTILITIES] [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Exposes URL normalization as a pure shared-utility composition alongside array/object and text helpers.
 * - Contract:
 *   - INPUT: URL string and shared helper module
 *   - PRE: URL helper and shared utility functions are available
 *   - OUTPUT: normalized URL, validity result, or domain
 *   - POST:
 *     - success => URL helper returns deterministic output without mutating input
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: SHARED_UTILITIES_COMPOSITION
 *   - Receive URL input
 *   - APPLY shared text/array helper contracts where needed
 *   - RETURN URL utility result
 *
 * === END IMPL-FULL-BLOCK: IMPL-URL_UTILITIES ===
 */
// [IMPL-CROSS_BROWSER] [ARCH-CROSS_BROWSER] [REQ-CROSS_BROWSER]
// Chrome-first browser API re-export from safari-shim.js (historical filename; browser API shim).
// Prefer import { browser } from './utils' (or safari-shim) for Promise-friendly messaging.

import { logger } from './logger.js'
import { browser } from './safari-shim.js'

// [IMPL-CROSS_BROWSER] Export browser API from browser API shim
export { browser }

/**
 * [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] URL utilities: processUrl, isValidUrl, getDomain.
 */
export const urlUtils = {
  /**
   * [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Strip hash from URL if configured.
   * @param {string} url - Original URL
   * @param {boolean} stripHash - Whether to strip hash
   * @returns {string} - Processed URL
   */
  processUrl (url, stripHash = false) {
    if (!url) return ''

    try {
      // IMPL-URL_UTILITIES: Use native URL constructor for reliable URL parsing
      const urlObj = new URL(url)
      if (stripHash) {
        // IMPL-URL_UTILITIES: Remove hash fragment if requested (for URL matching)
        urlObj.hash = ''
      }
      return urlObj.toString()
    } catch (error) {
      // IMPL-URL_UTILITIES: Log warning but preserve original URL for graceful degradation
      logger.warn('Invalid URL provided:', url)
      return url
    }
  },

  /**
   * [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Check if URL is valid.
   * @param {string} url - URL to validate
   * @returns {boolean} - Whether URL is valid
   */
  isValidUrl (url) {
    try {
      // IMPL-URL_UTILITIES: URL constructor throws on invalid URLs - reliable validation
      const urlObj = new URL(url)
      return !!urlObj
    } catch {
      // IMPL-URL_UTILITIES: Any exception indicates invalid URL
      return false
    }
  },

  /**
   * [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Extract domain from URL.
   * @param {string} url - URL to process
   * @returns {string} - Domain or empty string
   */
  getDomain (url) {
    try {
      // IMPL-URL_UTILITIES: Extract hostname property for clean domain identification
      return new URL(url).hostname
    } catch {
      // IMPL-URL_UTILITIES: Return empty string for safe string operations
      return ''
    }
  }
}

/**
 * [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] String utilities: truncate, cleanText, escapeHtml.
 */
export const stringUtils = {
  /**
   * [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Truncate string to maxLength with suffix.
   * @param {string} str - String to truncate
   * @param {number} maxLength - Maximum length
   * @param {string} suffix - Suffix to add if truncated
   * @returns {string} - Truncated string
   */
  truncate (str, maxLength = 100, suffix = '...') {
    if (!str || str.length <= maxLength) return str || ''
    // IMPL-TEXT_UTILITIES: Subtract suffix length to maintain total length constraint
    return str.substring(0, maxLength - suffix.length) + suffix
  },

  /**
   * [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Clean and normalize text (trim, collapse spaces).
   * @param {string} text - Text to clean
   * @returns {string} - Cleaned text
   */
  cleanText (text) {
    if (!text) return ''
    // IMPL-TEXT_UTILITIES: Trim and collapse whitespace for clean text processing
    return text.trim().replace(/\s+/g, ' ')
  },

  /**
   * [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Escape HTML entities (textContent).
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  escapeHtml (text) {
    if (!text) return ''
    // IMPL-TEXT_UTILITIES: Use DOM element textContent for reliable HTML escaping
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}

/**
 * [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES]
 * Array utilities: unique, chunk, compact; pure, no mutation.
 */
export const arrayUtils = {
  /**
   * [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Dedupe; order by first occurrence.
   */
  unique (arr) {
    return [...new Set(arr)]
  },

  /**
   * [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Split into size-sized chunks; last may be shorter.
   */
  chunk (arr, size) {
    const chunks = []
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size))
    }
    return chunks
  },

  /**
   * [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Remove falsy (false, null, undefined, 0, "", NaN).
   */
  compact (arr) {
    return arr.filter(item => item != null && item !== '')
  }
}

/**
 * [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES]
 * Object utilities: deepClone, isEmpty, pick; pure, no mutation.
 */
export const objectUtils = {
  /**
   * [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Deep copy; Date/Array/plain object recursively.
   */
  deepClone (obj) {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime())
    if (obj instanceof Array) return obj.map(item => this.deepClone(item))
    const cloned = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone(obj[key])
      }
    }
    return cloned
  },

  /**
   * [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] True if null/undefined or no enumerable keys.
   */
  isEmpty (obj) {
    return obj == null || Object.keys(obj).length === 0
  },

  /**
   * [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Subset of object with only specified keys.
   */
  pick (obj, keys) {
    const result = {}
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key]
      }
    })
    return result
  }
}

/**
 * [IMPL-TIME_ASYNC_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Time utilities: sleep (delay), formatTimestamp, getRelativeTime.
 */
export const timeUtils = {
  /**
   * [IMPL-TIME_ASYNC_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Sleep for specified milliseconds.
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} - Promise that resolves after delay
   */
  sleep (ms) {
    // IMPL-TIME_ASYNC_UTILITIES: Promise-based delay for async/await patterns
    return new Promise(resolve => setTimeout(resolve, ms))
  },

  /**
   * [IMPL-TIME_ASYNC_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Format timestamp for display (toLocaleString).
   * @param {number|string|Date} timestamp - Timestamp to format
   * @returns {string} - Formatted timestamp
   */
  formatTimestamp (timestamp) {
    const date = new Date(timestamp)
    // IMPL-TIME_ASYNC_UTILITIES: Use toLocaleString for user's locale-appropriate formatting
    return date.toLocaleString()
  },

  /**
   * [IMPL-TIME_ASYNC_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Get relative time string (e.g. "2 hours ago").
   * @param {number|string|Date} timestamp - Timestamp to process
   * @returns {string} - Relative time string
   */
  getRelativeTime (timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    // IMPL-TIME_ASYNC_UTILITIES: Progressive time unit selection for optimal readability
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    // IMPL-TIME_ASYNC_UTILITIES: Fall back to formatted date for older timestamps
    return this.formatTimestamp(timestamp)
  }
}

/**
 * [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] DOM utilities: waitForElement (MutationObserver), createElement, legacy pin helpers.
 */
export const domUtils = {
  /**
   * [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Wait for selector in DOM via MutationObserver with timeout.
   */
  waitForElement (selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      // [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Check if element already exists
      const existingElement = document.querySelector(selector)
      if (existingElement) {
        resolve(existingElement)
        return
      }

      // [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Timeout for promise rejection
      const timeoutId = setTimeout(() => {
        observer.disconnect()
        reject(new Error(`Element ${selector} not found within ${timeout}ms`))
      }, timeout)

      // [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] MutationObserver for DOM watching
      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector)
        if (element) {
          clearTimeout(timeoutId)
          obs.disconnect()
          resolve(element)
        }
      })

      // [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Observe document.body for new elements
      observer.observe(document.body, {
        childList: true,
        subtree: true
      })
    })
  },

  /**
   * [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Create element with tag, attributes, and content.
   */
  createElement (tag, attributes = {}, content = '') {
    const element = document.createElement(tag)
    Object.entries(attributes).forEach(([key, value]) => {
      if (key.startsWith('on') && typeof value === 'function') {
        element.addEventListener(key.substring(2).toLowerCase(), value)
      } else if (key === 'className') {
        element.className = value
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value)
      } else {
        element.setAttribute(key, value)
      }
    })
    if (content) {
      element.textContent = content
    }

    return element
  }
}

// [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Legacy createPinFromFormData-style: new pin with merged data and timestamp.
export function newPin (existing = {}, additional = {}) {
  return {
    url: '',
    description: '',
    extended: '',
    tags: '',
    dt: new Date().toISOString(),
    hash: '',
    meta: '',
    others: '',
    shared: 'yes',
    toread: 'no',
    ...existing,
    ...additional
  }
}

// [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Legacy validatePinFormData-style: minimal bookmark structure with fallback title.
export function minEmpty (data, title = '') {
  return {
    url: data?.url || '',
    description: data?.description || title || 'Untitled',
    tags: data?.tags || '',
    extended: data?.extended || '',
    shared: data?.shared || 'yes',
    toread: data?.toread || 'no'
  }
}

/**
 * [IMPL-SELECTION_TO_TAG_INPUT] [ARCH-SELECTION_TO_TAG_INPUT] [REQ-SELECTION_TO_TAG_INPUT] [REQ-TAG_MANAGEMENT] Normalize page selection for tag input prefill (strip punctuation, first maxWords).
 * @param {string} selection - Raw selection text
 * @param {number} maxWords - Max words to keep (default 8)
 * @returns {string} - Normalized string or ''
 */
export function normalizeSelectionForTagInput (selection, maxWords = 8) {
  if (!selection || typeof selection !== 'string') return ''
  const stripped = selection.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
  const words = stripped.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  return words.slice(0, maxWords).join(' ')
}

/**
 * Global debug configuration
 * Controls debug output throughout the application
 */
export const DEBUG_CONFIG = {
  enabled: true, // Set to false to disable all debug output
  prefix: '[HOVERBOARD-DEBUG]'
}

/**
 * Debug logging utility
 * Only outputs to console when DEBUG_CONFIG.enabled is true
 * @param {string} component - Component name for the log
 * @param {string} message - Debug message
 * @param {...any} args - Additional arguments to log
 */
export function debugLog (component, message, ...args) {
  if (DEBUG_CONFIG.enabled) {
    const prefix = `${DEBUG_CONFIG.prefix} [${component}]`
    if (args.length > 0) {
      console.log(prefix, message, ...args)
    } else {
      console.log(prefix, message)
    }
  }
}

/**
 * Debug error logging utility
 * Only outputs to console when DEBUG_CONFIG.enabled is true
 * @param {string} component - Component name for the log
 * @param {string} message - Debug message
 * @param {...any} args - Additional arguments to log
 */
export function debugError (component, message, ...args) {
  if (DEBUG_CONFIG.enabled) {
    const prefix = `${DEBUG_CONFIG.prefix} [${component}]`
    if (args.length > 0) {
      console.error(prefix, message, ...args)
    } else {
      console.error(prefix, message)
    }
  }
}

/**
 * Debug warning logging utility
 * Only outputs to console when DEBUG_CONFIG.enabled is true
 * @param {string} component - Component name for the log
 * @param {string} message - Debug message
 * @param {...any} args - Additional arguments to log
 */
export function debugWarn (component, message, ...args) {
  if (DEBUG_CONFIG.enabled) {
    const prefix = `${DEBUG_CONFIG.prefix} [${component}]`
    if (args.length > 0) {
      console.warn(prefix, message, ...args)
    } else {
      console.warn(prefix, message)
    }
  }
}
