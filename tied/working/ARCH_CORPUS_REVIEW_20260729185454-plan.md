# ARCH Corpus Remediation Plan

**Date:** 2026-07-29  
**Source review:** full project ARCH inventory via TIED MCP; `tied_validate_consistency` indexes valid; semantic gaps/contradictions analyzed.  
**Cursor plan:** [`arch_corpus_remediation_b5ce35e7.plan.md`](/Users/fareed/.cursor/plans/arch_corpus_remediation_b5ce35e7.plan.md)  
**Tracker:** [`ARCH_CORPUS_REVIEW_20260729185454.yaml`](./ARCH_CORPUS_REVIEW_20260729185454.yaml)  
**Canvas:** [arch-corpus-review](/Users/fareed/.cursor/projects/Users-fareed-Documents-dev-browser-hoverboard/canvases/arch-corpus-review.canvas.tsx)  
**Leap notes:** [`ARCH_CORPUS_REVIEW_20260729185454-leap-notes.md`](./ARCH_CORPUS_REVIEW_20260729185454-leap-notes.md)

**Inventory:** 65 indexed ARCH tokens; 65 detail files; 0 orphans; 0 missing details.  
**Status mix (index):** Active 61, Template 3, Deferred 1 (`ARCH-SAFARI_ADAPTATION`).

**Constraint:** Mutate project TIED YAML only via tied-yaml MCP / `tied-cli.sh`. Do not edit `tied/methodology/`. Run `tied_validate_consistency` after writes.

---

## Phase 1 — Five-backend LEAP (highest density)

Canonical contract: `ARCH-STORAGE_INDEX_AND_ROUTER` (pinboard | local | file | sync | browser).

| Token | Current conflict | Target |
| --- | --- | --- |
| `ARCH-LOCAL_STORAGE_PROVIDER` | “two bookmark storage modes” | Local as one of five; restore detail REQ/IMPL |
| `ARCH-FILE_BOOKMARK_PROVIDER` / `ARCH-SYNC_STORAGE_PROVIDER` | third/fourth framing; thin Sync | Peer backends; fill traceability |
| `ARCH-LOCAL_BOOKMARKS_INDEX` / `ARCH-MOVE_BOOKMARK_UI` (index bodies) | Summary five-aware; approach/rationale stale | L/F/S/B + five Save-to |
| `ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT` | Storage local\|file only | Include sync + browser |
| `ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT` / `ARCH-BROWSER_BOOKMARK_IMPORT` | Import-to Local\|File\|Sync | Document Browser exclusion as import *target* |
| `ARCH-SIDE_PANEL_TAGS_TREE` | Aggregate local+file+sync only | Include Browser |
| Router ↔ Browser provider | Circular `depends_on` | Providers depend on router; router `see_also` providers |

---

## Phase 2 — Index ↔ detail hygiene

| Token | Fix |
| --- | --- |
| `ARCH-EXAMPLE_DECISION` | Detail Active → Template |
| `ARCH-CODE_QUALITY` | engines.node ≥20.19.0; detail status |
| `ARCH-UI_TESTABILITY` | Ensure detail status Active |
| Local/File/Native Host/URL_TAGS | Sync emptied detail traceability with index |
| `ARCH-BROWSER_BOOKMARK_PROVIDER` | Thicken thin index from detail |
| `ARCH-SIDE_PANEL_TABS` / `ARCH-LANGUAGE_SELECTION` | Align REQ arrays |

---

## Phase 3 — Panel vs Browser-backend boundary

Document `ARCH-SIDE_PANEL_BROWSER_BOOKMARKS` (direct `chrome.bookmarks` tree UX) vs `ARCH-BROWSER_BOOKMARK_PROVIDER` (BookmarkRouter peer / Store B).

---

## Phase 4 — Satellite four-provider prose

`ARCH-URL_TAGS_DISPLAY`, `ARCH-BOOKMARK_USAGE_TRACKING`, `ARCH-BOOKMARK_CREATE_UPDATE_TIMES`.

---

## Phase 5 — Thin stubs, Templates, empty shells

Empty-IA: CONFIG_STRUCTURE, PROJECT_STRUCTURE, PRIVACY, SEARCH, SITE_MGMT.  
Clarify ARCH-STORAGE = settings/portability. Expand PINBOARD_API / SYNC / BOOKMARK_STATE_SYNC. Keep ERROR_HANDLING, TESTING_STRATEGY, EXAMPLE as Template. Polish thin decision strings.

---

## Phase 6 — Ownership overlaps (doc-only)

Overlay spacing contract; MV3 parent vs SW child; UX_CORE vs POPUP_SESSION; SEARCH → side-panel/tab search children. Out-of-scope → working-folder leap note.

---

## Done when

- Storage/index/move/export/import/tags-tree ARCH agree on five backends (or documented exclusions)
- Index↔detail status and key traceability arrays match for flagged tokens
- Panel vs Store B boundary written; EXAMPLE Template on both layers
- Empty shells fleshed or demoted; Template trio left Template; CODE_QUALITY engines ≥20.19.0
- Overlay spacing contradiction resolved in ARCH prose
- `tied_validate_consistency` ok; vocab RECORD/VALIDATE

## Out of scope

- Committing unless explicitly requested
- Editing `tied/methodology/`
- Re-implementing panel to route through BookmarkRouter
- Promoting Template ERROR_HANDLING / TESTING_STRATEGY without real content
- Full production-code rewrite / panel→router unification (IMPL prose audit completed in close-out step 9)

---

## Execution log (2026-07-29)

Full exec via tied-yaml MCP / `tied-cli.sh` (`yaml_updates_apply`):

1. **Artifacts** — Working plan, checklist tracker copy, canvas `arch-corpus-review.canvas.tsx`, leap notes file.
2. **Phase 1** — Local/File/Sync providers as peers; index bodies for LOCAL_BOOKMARKS_INDEX + MOVE_BOOKMARK_UI; export Storage L/F/S/B; tags-tree aggregate includes Browser; router↔Browser circular `depends_on` broken. (Index Import Browser exclusion later reversed in close-out — exclusion stays on Browser Bookmark Import page only.)
3. **Phase 2** — EXAMPLE detail→Template; CODE_QUALITY engines ≥20.19.0; UI_TESTABILITY status; NATIVE_HOST / URL_TAGS / SIDE_PANEL_TABS / LANGUAGE_SELECTION traceability; Browser provider index thickened.
4. **Phase 3** — SIDE_PANEL_BROWSER_BOOKMARKS decision: direct tree UX vs Store B provider.
5. **Phase 4** — URL_TAGS_DISPLAY / USAGE_TRACKING / CREATE_UPDATE_TIMES five-backend prose.
6. **Phase 5** — Empty shells as umbrellas; ARCH-STORAGE = settings only; Pinboard/Sync/state-sync decisions; Template ERROR/TESTING pointers; thin decision polish.
7. **Phase 6** — Overlay parent/child layout contract (Close 8/8, Refresh 8/40); UX_CORE vs POPUP_SESSION; MV3 parent / SW child; SEARCH→children (Phase 5); leap notes for deferred items.
8. **Close-loop** — Vocab RECORD in `config-and-privacy.md` + `storage-backends.md`; `tied_validate_consistency` **ok**.
9. **IMPL LEAP close-out (option 2)** — Restored Index Import-to Local|File|Sync|**Browser** on `ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT`; scrubbed four-provider residue on `ARCH-URL_TAGS_DISPLAY`. Edited IMPLs: BROWSER_BOOKMARK_IMPORT, SIDE_PANEL_TAGS_TREE, SIDE_PANEL_BROWSER_BOOKMARKS, BOOKMARK_CREATE_UPDATE_TIMES (Browser = Chrome dateAdded on read), SYNC_BOOKMARK_SERVICE, LOCAL_BOOKMARK_SERVICE, URL_TAGS_DISPLAY, BOOKMARK_USAGE_TRACKING, OVERLAY_CONTROLS spacing. Light REQ: URL_TAGS_DISPLAY + SIDE_PANEL_TAGS_TREE aggregate. Verify-only: MOVE/EXPORT/IMPORT/ROUTER/STORAGE_INDEX/BROWSER_SERVICE/INDEX. Vocab VALIDATE; `tied_validate_consistency` **ok** (include_pseudocode). CHANGELOG Unreleased; commit message proposed (no commit).
