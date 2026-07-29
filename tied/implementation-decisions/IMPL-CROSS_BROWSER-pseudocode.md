# [IMPL-CROSS_BROWSER] [ARCH-CROSS_BROWSER] [REQ-CROSS_BROWSER]
# Chrome-first browser API shim; shared `browser` export for messaging and storage helpers.
# Future multi-browser expansion reuses this shim; Safari product stack is deferred ([REQ-SAFARI_ADAPTATION]).
# Related identity: [REQ-EXTENSION_IDENTITY] Chrome/Chromium target.
# Contract: callers import { browser } from safari-shim (via utils); Promise-friendly messaging.
INPUT: chrome (or future browser) extension APIs; caller operations (sendMessage, tabs, storage)
OUTPUT: unified `browser` object with Promise wrappers, retry, and storage helpers
DATA: src/shared/safari-shim.js; re-export from src/shared/utils.js

# Prefer Chrome API; fall back to polyfill or minimal mock for tests.
initializeBrowserAPI():
  IF chrome is defined: browser = chrome; RETURN
  IF window.browser (polyfill): browser = window.browser; RETURN
  browser = createMinimalBrowserAPI()

# Wrap messaging/tabs with retries and Promise API for Chrome service worker and content scripts.
safariEnhancements (browser API shim):
  PROVIDE runtime.sendMessage / tabs.* with retry and Promise behavior
  PROVIDE storage helpers (quota monitoring, graceful degradation) for Chromium storage
  DO NOT attach Safari-only platform metadata on messages (Safari product deferred)

# Reserved hooks for deferred multi-browser; Safari product not active.
platformUtils:
  isSafari(): RETURN false  # reserved; Safari App Extension deferred
  isChrome(): RETURN chrome is defined
  isFirefox(): RETURN browser.runtime.getBrowserInfo is a function
  getPlatform():
    IF isChrome(): RETURN "chrome"
    IF isFirefox(): RETURN "firefox"
    RETURN "unknown"

# Call sites use shim export, not raw chrome only, for future expansion readiness.
ON service worker / content / message-handler import:
  USE browser from safari-shim (or utils re-export)
