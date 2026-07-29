# [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES]
# DOM helpers: waitForElement (MutationObserver), createElement, and pin form helpers.
# Contract: inputs and outputs for each utility.
INPUT: selector (waitForElement); tag and attrs (createElement); form data (createPinFromFormData / validatePinFormData)
OUTPUT: element or null (waitForElement); element (createElement); pin object or validation result

# Wait for selector in container via MutationObserver with optional timeout.
waitForElement(container, selector, options):
  IF element = container.querySelector(selector) THEN RETURN resolve(element)
  observer = new MutationObserver(callback)
  observer.observe(container, { childList, subtree })
  ON mutation: IF element = container.querySelector(selector) THEN resolve(element), disconnect observer
  ON timeout (if given): reject or resolve null, disconnect observer

# Create element with tag and attributes.
createElement(tag, attrs):
  el = document.createElement(tag)
  FOR each attr in attrs: SET el[attr] or setAttribute
  RETURN el

# Build pin object from form fields.
createPinFromFormData(formData):
  BUILD pin object from form fields (url, description, tags, etc.)
  RETURN pin object

# Validate required fields and formats for pin/form.
validatePinFormData(formData or pin):
  CHECK required fields and formats
  RETURN valid boolean or validation errors
