# IMPL Code/Test Sync — LEAP notes

**Date:** 2026-07-29  
**Parent:** `IMPL_CODE_TEST_SYNC_20260729210000-plan.md`

## Carry-forward from IMPL corpus remediation

1. Side Panel Browser Bookmarks vs Store B dual path — architecture; not unified in this pass.  
2. Tabs create `preferredBackend: 'local'` vs Options `defaultStorageMode` — product CITDP later.  
3. Template IMPLs left as stubs.  
4. Methodology YAML-only IMPLs — no product essence.

## Contradictions found during sync

- **Badge attribution:** `badge-manager.js` previously led with `IMPL-BOOKMARK_STATE_SYNC` / `IMPL-URL_TAGS_DISPLAY` only — resolved by adding full `IMPL-BADGE` blocks alongside sibling markers (kept sibling blocks).
- **BOOKMARKING vs MESSAGE_HANDLING:** save/delete/get owned by MessageHandler; added `IMPL-BOOKMARKING` full blocks + dedicated unit suite without removing MESSAGE_HANDLING envelope ownership.
- **Thin-stub IMPLs with empty `code_locations`:** SEARCH / THEME / UX_CORE / SITE_MGMT / PRIVACY / EXT_IDENTITY / MV3 mapped to existing modules (tab-search, popup/config, SW) rather than inventing new packages.

## Deferred

- Secondary composition/E2E files need not carry every H2 when the primary unit locus already has the full block (policy §3).
- Product LEAPs unchanged: Browser panel vs Store B dual path; Tabs `preferredBackend: local` vs `defaultStorageMode`.  
