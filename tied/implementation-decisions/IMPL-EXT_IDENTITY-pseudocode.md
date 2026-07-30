# [IMPL-EXT_IDENTITY] [ARCH-EXT_IDENTITY] [REQ-EXTENSION_IDENTITY] — How: present Hoverboard as a Chromium extension with content-script injection and Pinboard-compatible UX surfaces.

## BOOTSTRAP_EXTENSION

- [IMPL-EXT_IDENTITY] [ARCH-EXT_IDENTITY] [REQ-EXTENSION_IDENTITY] How: MV3 entry points register once; content script bootstraps page UI when URL allowed.
- Contract:
  - INPUT: extension install/load; manifest entry points (service worker, content scripts, popup, options, side panel)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: loaded extension identity (name, permissions, entry points); content scripts on matching pages
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: manifest.json; src/core/service-worker.js; content script entry; browser API shim (IMPL-CROSS_BROWSER)
  - EFFECTS: Http, IO
  - TERMINATION: total
- PROCEDURE: BOOTSTRAP_EXTENSION
  - REGISTER service worker message listeners
  - ON content script load: IF URL not inhibited THEN init overlay/hover surface
  - EXPOSE popup / side panel / options as user-facing surfaces
  - RETURN
