# IMPL Corpus — out-of-scope LEAP notes

**Date:** 2026-07-29  
**Parent plan:** IMPL_CORPUS_REVIEW_20260729204500-plan.md

## Deferred for future CITDP

1. **§3a literal block-lead / full-block copy into all tests/code** — **DONE** (2026-07-29)  
   Follow-up completed in `tied/working/IMPL_CODE_TEST_SYNC_20260729210000-plan.md` (full-block mode).

2. **Wire Side Panel Browser Bookmarks through BookmarkRouter**  
   Dual path (direct `chrome.bookmarks` vs Store B) remains documented; unification is product/architecture work.

3. **Tabs create `preferredBackend: 'local'` vs Options `defaultStorageMode`**  
   Documented as product rule in `IMPL-SIDE_PANEL_BROWSER_TABS` Contract during uplift. Changing create path to follow `defaultStorageMode` needs dedicated CITDP + tests.

4. **Promote Template IMPL-ERROR_HANDLING / IMPL-TESTING / IMPL-CONFIG_STRUCT / IMPL-EXAMPLE_IMPLEMENTATION**  
   Left Template with minimal stubs; full strategies need dedicated content.

5. **Sidecars for methodology IMPLs** (`MCP_FEEDBACK_TOOLS`, `MODULE_VALIDATION`, `TIED_FILES`)  
   Explicitly YAML-approach only; do not invent product essence. MCP `yaml_detail_update` rejects writes (`methodology-owned read-only`). Policy recorded here only — no project override invented.

6. **Auto-uplift residual quality**  
   Bulk converter produced SHAPE-003 structure for all Active sidecars. Hand-polished: `IMPL-BOOKMARK_ROUTER`, `IMPL-STORAGE_INDEX`, BOOKMARKING five-backend DATA, Tabs `preferredBackend: local` product rule, URL_TAGS/USAGE five-backend notes. Deeper per-block PRE predicates remain iterative when each IMPL is next edited under CITDP.
