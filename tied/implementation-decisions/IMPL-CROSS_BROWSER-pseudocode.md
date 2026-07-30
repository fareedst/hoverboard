# [IMPL-CROSS_BROWSER] [ARCH-CROSS_BROWSER] [REQ-CROSS_BROWSER] — Chrome-first browser API shim; shared `browser` export for messaging and storage helpers. Contract: callers import { browser } from safari-shim (via utils); Promise-friendly messaging.

## INITIALIZE_BROWSER_API

- [IMPL-CROSS_BROWSER] [ARCH-CROSS_BROWSER] [REQ-CROSS_BROWSER] How: Implements initializeBrowserAPI() behavior for IMPL-CROSS_BROWSER.
- Contract:
  - INPUT: chrome (or future browser) extension APIs; caller operations (sendMessage, tabs, storage)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: unified `browser` object with Promise wrappers, retry, and storage helpers
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: src/shared/safari-shim.js; re-export from src/shared/utils.js
  - EFFECTS: Async, Http, IO
  - TERMINATION: total
- PROCEDURE: INITIALIZE_BROWSER_API
  - IF chrome is defined: browser = chrome; RETURN
  - IF window.browser (polyfill): browser = window.browser; RETURN
  - browser = createMinimalBrowserAPI()
  - How (sub-block): Wrap messaging/tabs with retries and Promise API for Chrome service worker and content scripts.
  - 1. safariEnhancements (browser API shim):
  - PROVIDE runtime.sendMessage / tabs.* with retry and Promise behavior
  - PROVIDE storage helpers (quota monitoring, graceful degradation) for Chromium storage
  - DO NOT attach Safari-only platform metadata on messages (Safari product deferred)
  - How (sub-block): Reserved hooks for deferred multi-browser; Safari product not active.

## PLATFORM_UTILS

- [IMPL-CROSS_BROWSER] [ARCH-CROSS_BROWSER] [REQ-CROSS_BROWSER] How: Implements platformUtils behavior for IMPL-CROSS_BROWSER.
- Contract:
  - INPUT: chrome (or future browser) extension APIs; caller operations (sendMessage, tabs, storage)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: unified `browser` object with Promise wrappers, retry, and storage helpers
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: src/shared/safari-shim.js; re-export from src/shared/utils.js
  - EFFECTS: Async, Http, IO
  - TERMINATION: total
- PROCEDURE: PLATFORM_UTILS
  - isSafari(): RETURN false  # reserved; Safari App Extension deferred
  - isChrome(): RETURN chrome is defined
  - isFirefox(): RETURN browser.runtime.getBrowserInfo is a function
  - getPlatform():
  - IF isChrome(): RETURN "chrome"
  - IF isFirefox(): RETURN "firefox"
  - RETURN "unknown"
  - How (sub-block): Call sites use shim export, not raw chrome only, for future expansion readiness.
  - 1. ON service worker / content / message-handler import:
  - USE browser from safari-shim (or utils re-export)
