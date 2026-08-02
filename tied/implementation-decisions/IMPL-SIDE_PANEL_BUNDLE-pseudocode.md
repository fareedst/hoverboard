# [IMPL-SIDE_PANEL_BUNDLE] [ARCH-SIDE_PANEL_BUNDLE] [REQ-SIDE_PANEL_BUNDLE_SIZE] — Production minify for all esbuild extension entry points; side-panel bundle analyze script. Implements REQ by reducing transfer size (minified + gzip); implements ARCH by production vs dev build flags.

## BUILD_EXTENSION_ENTRIES

- [IMPL-SIDE_PANEL_BUNDLE] [ARCH-SIDE_PANEL_BUNDLE] [REQ-SIDE_PANEL_BUNDLE_SIZE] How: Central esbuild runner applies --minify when NODE_ENV=production; all five manifest entry points use the same helper so dev builds stay readable.
- Contract:
  - INPUT: entry key in { sw, popup, options, content, side-panel }; NODE_ENV
  - PRE: entry key valid; source paths exist
  - OUTPUT: bundled file at dist path; no bare specifiers at runtime
  - POST:
    - success => dist artifact exists; minified iff production_mode
  - DATA: ENTRY_MAP (in, out, format per entry); production_mode = NODE_ENV === 'production'
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: BUILD_EXTENSION_ENTRIES
  - 1. entry = argv entry key
  - 2. opts = ENTRY_MAP[entry]
  - 3. esbuild --bundle --format=opts.format --platform=browser
  - 4. IF production_mode: append --minify
  - 5. OUT = opts.out

## BUILD_SIDE_PANEL

- [IMPL-SIDE_PANEL_BUNDLE] [ARCH-SIDE_PANEL_BUNDLE] [REQ-SIDE_PANEL_BUNDLE_SIZE] [IMPL-SIDE_PANEL_TABS] How: scripts/build.js writes build-info.js with BUILD_TIME_UTC then invokes BUILD_EXTENSION_ENTRIES for side-panel.
- Contract:
  - INPUT: production_mode flag from NODE_ENV
  - PRE: build-info path writable
  - OUTPUT: dist/src/ui/side-panel/side-panel.js bundle
  - POST: BUILD_TIME_UTC injected before bundle step
  - DATA: build-info.js exports BUILD_TIME_UTC
  - CONTROL: build:prod preserves NODE_ENV=production through scripts/build.js
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: BUILD_SIDE_PANEL
  - 1. WRITE build-info.js with BUILD_TIME_UTC = now UTC YYYY-MM-DD HH:mm
  - 2. CALL BUILD_EXTENSION_ENTRIES(side-panel)

## ANALYZE_SIDE_PANEL_BUNDLE

- [IMPL-SIDE_PANEL_BUNDLE] [ARCH-SIDE_PANEL_BUNDLE] [REQ-SIDE_PANEL_BUNDLE_SIZE] How: Dev/CI script runs esbuild with --metafile to temp output; reports unminified, minified, gzip sizes and top-N contributors; metafile never copied to dist/.
- Contract:
  - INPUT: side-panel entry src/ui/side-panel/side-panel.js
  - PRE: esbuild available
  - OUTPUT: stdout JSON or table with bytes_unminified, bytes_minified, bytes_gzip, top_contributors[]
  - POST: no dist/ mutation beyond temp files
  - DATA: metafile path under os.tmpdir or /tmp
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: ANALYZE_SIDE_PANEL_BUNDLE
  - 1. BUILD unminified with --metafile → temp
  - 2. BUILD minified → temp; measure bytes; gzip measure
  - 3. SORT metafile inputs by bytes DESC; take top N
  - 4. PRINT report
