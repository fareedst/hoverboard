# REQ Corpus Remediation Plan

**Date:** 2026-07-29  
**Source review:** full REQ inventory via TIED MCP; `tied_validate_consistency` ok; no requirement cycles; scoped traceability gap report.  
**Cursor plan:** [`req_corpus_remediation.plan.md`](/Users/fareed/.cursor/plans/req_corpus_remediation.plan.md)  
**Interactive summary:** [req-corpus-review canvas](/Users/fareed/.cursor/projects/Users-fareed-Documents-dev-browser-hoverboard/canvases/req-corpus-review.canvas.tsx)

**Inventory:** 69 indexed REQ tokens; 70 detail files; orphan detail without index: `REQ-IDENTIFIER`.

**Constraint:** Mutate project TIED YAML only via tied-yaml MCP / `tied-cli.sh`. Do not edit `tied/methodology/`. Run `tied_validate_consistency` after writes.

---

## Phase 1 — Finish Browser-backend LEAP (highest density)

`REQ-BROWSER_BOOKMARK_STORAGE` is Implemented (fifth peer backend). Sibling REQs still contradict that scope.

| Token | Current conflict | Target |
| --- | --- | --- |
| `REQ-LOCAL_BOOKMARKS_INDEX` | summary/purpose include Browser; `table_page` Stores still L/F/S; `how_validated` still Local/File/Sync; empty ARCH/IMPL links | Stores L/F/S/B and Move/Import language consistent; fill ARCH/IMPL |
| `REQ-LOCAL_BOOKMARKS_INDEX_EXPORT` | CSV Storage Local\|File\|Sync; `export_all` = local+file | Include Sync + Browser; scopes match aggregate |
| `REQ-LOCAL_BOOKMARKS_INDEX_IMPORT` | Import to Local\|File\|Sync only | Add Browser **or** explicitly exclude with rationale |
| `REQ-MOVE_BOOKMARK_STORAGE_UI` | Popup move Pinboard/Local/File; Sync/Browser absent | Align Save-to / Move with five backends; fill `traceability.tests` |
| `REQ-PER_BOOKMARK_STORAGE_BACKEND` | Index criteria still “four providers”; detail summary says five | One five-backend contract in index + detail |
| `REQ-BROWSER_BOOKMARK_IMPORT` | Import to Local\|File\|Sync (source = Chrome tree) | Document intentional exclusion of Browser as import *target* |
| `REQ-STORAGE_MODE_DEFAULT` | Already mentions Browser in Options | Cross-check only |

Also reconcile ARCH prose still saying “four providers” where LEAP updated summary to five (`ARCH-STORAGE_INDEX_AND_ROUTER`).

**Vocab:** `tied/vocab/storage-backends.md`, `tied/vocab/bookmarks-index.md`.

---

## Phase 2 — Sync index ↔ detail status

| Token | Index | Detail | Likely correct |
| --- | --- | --- | --- |
| `REQ-FILE_BOOKMARK_STORAGE` | Implemented | Planned | Implemented |
| `REQ-PER_BOOKMARK_STORAGE_BACKEND` | Implemented | Planned | Implemented (after Phase 1) |
| `REQ-NATIVE_HOST_WRAPPER` | Implemented | Planned | Confirm against native host + ping; set both the same |
| `REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS` | Planned | Implemented | Implemented if unit criteria met |

Use `yaml_index_update` + `yaml_detail_update` so both layers match.

---

## Phase 3 — Close Manifest V3

`REQ-MANIFEST_V3_MIGRATION` is P0 **Planned**, but `manifest.json` already has `manifest_version: 3` and a service worker.

- Prefer: status **Implemented**, criteria = maintain MV3 / no V2 regression.
- Alternate: rewrite as Active maintenance REQ with clear non-migration criteria.

---

## Phase 4 — Suggested-tags cleanup

Tokens: `REQ-SUGGESTED_TAGS_FROM_CONTENT`, `REQ-SUGGESTED_TAGS_DEDUPLICATION`, `REQ-SUGGESTED_TAGS_CASE_PRESERVATION`.

1. Remove stale “no tests / not implemented” prose that contradicts Implemented status and existing tests.
2. Align numeric limits between `satisfaction_criteria` and `modifiable_decisions` (5/10/20/30 vs 10/20/40/60).
3. Fix mutual `depends_on` into a one-way graph.
4. Add dedicated deduplication tests or demote DEDUPLICATION; fill `traceability.tests`.

---

## Phase 5 — Thin stubs and placeholder NFRs

**Thin stubs:** e.g. `REQ-BADGE_INDICATORS`, `REQ-BOOKMARK_STATE_SYNCHRONIZATION`, `REQ-CHROME_STORAGE_USAGE`, `REQ-CORE_UX_PRESERVATION`, `REQ-DARK_THEME`, overlay family, `REQ-PINBOARD_COMPATIBILITY`, `REQ-PRIVACY_CONTROLS`, `REQ-SEARCH_FUNCTIONALITY`, `REQ-SITE_MANAGEMENT`, `REQ-SMART_BOOKMARKING`, `REQ-TAG_MANAGEMENT`, `REQ-TAG_INPUT_SANITIZATION`.

For each: expand criteria from ARCH/IMPL + named tests, **or** demote status.

**Placeholder Active NFRs:** `REQ-CONFIGURATION`, `REQ-ERROR_HANDLING`, `REQ-MAINTAINABILITY`, `REQ-PERFORMANCE`, `REQ-RELIABILITY`, `REQ-USABILITY` — link owning REQs or write measurable criteria.

Also fix `REQ-CODE_QUALITY`: index `engines.node >= 18.18.0` vs detail `>= 20.19.0` — match `package.json`.

---

## Phase 6 — Hygiene and ownership boundaries

1. Delete or index orphan `tied/requirements/REQ-IDENTIFIER.yaml`.
2. Keep `REQ-EXAMPLE_FEATURE` as Template; exclude from backlog burn-down.
3. Document boundary: `REQ-SIDE_PANEL_BROWSER_BOOKMARKS` (Chrome tree UI) vs `REQ-BROWSER_BOOKMARK_STORAGE` (BookmarkRouter peer / Store B).
4. Fill empty `traceability.tests` where prose already names tests (`REQ-URL_TAGS_DISPLAY`, `REQ-MOVE_BOOKMARK_STORAGE_UI`).

---

## Traceability backlog (triage)

Scoped gap report: **21** REQs without test markers; **14** without production markers. Exclude methodology, Template, Deferred Safari, and intentional umbrella NFRs before forcing annotations.

---

## Done when

- Sibling storage REQs agree on five backends (or documented exclusions)
- Four index↔detail status pairs match
- Manifest V3 REQ matches shipped MV3
- Suggested-tags REQs have consistent status, limits, deps, and test claims
- Stub/NFR policy applied (fleshed or demoted)
- Orphan `REQ-IDENTIFIER` resolved; panel vs Browser-backend boundary written
- `tied_validate_consistency` still ok; vocab RECORD/VALIDATE for any renamed terms

## Out of scope

- Committing unless explicitly requested
- Editing `tied/methodology/`
- Re-running the full corpus inventory (already done)

---

## Execution log (2026-07-29)

Full exec completed via tied-yaml MCP / `tied-cli.sh`:

1. Phase 1 — Sibling storage REQs + ARCH prose aligned to five backends; Browser import-target exclusion documented.
2. Phase 2 — FILE / NATIVE_HOST / PER_BOOKMARK detail→Implemented; RECENTLY_CLOSED index→Implemented.
3. Phase 3 — MANIFEST_V3 → Implemented with maintain-MV3 criteria.
4. Phase 4 — Suggested-tags stale prose cleared; limits aligned; one-way depends; DEDUPLICATION tests filled.
5. Phase 5 — CODE_QUALITY engines.node ≥20.19.0; thin stubs/NFRs expanded as umbrellas with related_to.
6. Phase 6 — Orphan `REQ-IDENTIFIER` deleted; panel vs Store B boundary; empty `traceability.tests` filled for MOVE / URL_TAGS / NATIVE_HOST.
7. Vocab RECORD — `routing.md`, `side-panel.md`, `bookmarks-index.md`.

## Close-loop execution (2026-07-29)

8. IMPL LEAP — `IMPL-MOVE_BOOKMARK_UI` five Save to; Index Import/Export Browser in sidecars + YAML.
9. ARCH/REQ LEAP — `ARCH-MOVE_BOOKMARK_UI` decision/summary/traceability; `REQ-MOVE_BOOKMARK_STORAGE_UI` drops dedicated Local/File toggle criterion.
10. Vocab RECORD — demote file↔browser toggle under Save to in `storage-backends.md`.
11. Code/test — `buildCsv` Storage emits Browser; unit test in `bookmarks-table-export.test.js`; stale popup comment sync.
12. CHANGELOG Unreleased + proposed commit message (no commit).
