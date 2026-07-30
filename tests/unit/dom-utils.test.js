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
import { newPin, minEmpty } from '../../src/shared/utils.js'

describe('[IMPL-DOM_UTILITIES] newPin and minEmpty', () => {
  describe('newPin', () => {
    test('returns pin shape with defaults when no args', () => {
      const pin = newPin()
      expect(pin).toHaveProperty('url', '')
      expect(pin).toHaveProperty('description', '')
      expect(pin).toHaveProperty('tags', '')
      expect(pin).toHaveProperty('dt')
      expect(pin).toHaveProperty('shared', 'yes')
      expect(pin).toHaveProperty('toread', 'no')
    })

    test('merges existing and additional over defaults', () => {
      const pin = newPin({ url: 'https://a.com' }, { description: 'Desc' })
      expect(pin.url).toBe('https://a.com')
      expect(pin.description).toBe('Desc')
      expect(pin.shared).toBe('yes')
    })
  })

  describe('minEmpty', () => {
    test('returns minimal bookmark with fallback title when data empty', () => {
      const out = minEmpty(null, 'Fallback')
      expect(out.url).toBe('')
      expect(out.description).toBe('Fallback')
      expect(out.tags).toBe('')
      expect(out.shared).toBe('yes')
      expect(out.toread).toBe('no')
    })

    test('uses data when provided', () => {
      const out = minEmpty({ url: 'https://x.com', description: 'D', tags: 'a b' })
      expect(out.url).toBe('https://x.com')
      expect(out.description).toBe('D')
      expect(out.tags).toBe('a b')
    })
  })
})
