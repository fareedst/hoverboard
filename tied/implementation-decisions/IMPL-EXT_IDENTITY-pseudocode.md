# [IMPL-EXT_IDENTITY] [ARCH-EXT_IDENTITY] [REQ-EXTENSION_IDENTITY]
# How: present Hoverboard as a Chromium extension with content-script injection and Pinboard-compatible UX surfaces.
INPUT: extension install/load; manifest entry points (service worker, content scripts, popup, options, side panel)
OUTPUT: loaded extension identity (name, permissions, entry points); content scripts on matching pages
DATA: manifest.json; src/core/service-worker.js; content script entry; browser API shim (IMPL-CROSS_BROWSER)

# [IMPL-EXT_IDENTITY] [ARCH-EXT_IDENTITY] [REQ-EXTENSION_IDENTITY]
# How: MV3 entry points register once; content script bootstraps page UI when URL allowed.
BOOTSTRAP_EXTENSION:
  REGISTER service worker message listeners
  ON content script load: IF URL not inhibited THEN init overlay/hover surface
  EXPOSE popup / side panel / options as user-facing surfaces
  RETURN
