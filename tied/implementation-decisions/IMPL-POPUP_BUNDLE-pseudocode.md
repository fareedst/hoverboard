# [IMPL-POPUP_BUNDLE] [ARCH-EXTENSION_BUNDLED_ENTRY_POINTS] [REQ-EXTENSION_BUNDLED_ENTRY_POINTS]
# Bundle popup entry and dependencies so no bare specifiers at runtime.
# Contract: source and deps in; single bundle out; build config and skip list.
INPUT: source src/ui/popup/popup.js and its dependency graph
OUTPUT: single bundle dist/src/ui/popup/popup.js with all deps inlined; no bare specifiers at runtime
DATA: build config (e.g. rollup/vite); copyDir skip list for popup.js

# Bundle entry and all imports into single file.
build:popup:
  ENTRY = src/ui/popup/popup.js
  BUNDLE ENTRY and all imports into dist/src/ui/popup/popup.js
  INLINE fast-xml-parser, TagService, PinboardService, etc.

# Skip popup.js in copy so only bundle is in dist.
copyDir (scripts/build.js):
  SKIP src/ui/popup/popup.js so only the bundle is in dist
