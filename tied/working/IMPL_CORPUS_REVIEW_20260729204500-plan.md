# IMPL Corpus Remediation Plan

**Date:** 2026-07-29  
**Source review:** full project IMPL inventory via TIED MCP + sidecar scan; five-backend LEAP largely done; universal SHAPE-003 gap.  
**Cursor plan:** [`impl_corpus_remediation_40da8849.plan.md`](/Users/fareed/.cursor/plans/impl_corpus_remediation_40da8849.plan.md)  
**Leap notes:** [`IMPL_CORPUS_REVIEW_20260729204500-leap-notes.md`](./IMPL_CORPUS_REVIEW_20260729204500-leap-notes.md)

**Inventory:** 103 indexed IMPL tokens; 103 detail files; 100 sidecars; 3 YAML-only methodology IMPLs.

**Constraint:** Mutate project TIED YAML only via tied-yaml MCP / `tied-cli.sh`. Sidecars may be edited as plain Markdown. Do not edit `tied/methodology/`. Run `tied_validate_consistency` after batches.

---

## Phase 0 — Template + artifacts

Vendor `templates/impl-essence-pseudocode-template.md`; create this working pack.

## Phase 1 — Index ↔ detail hygiene

Propagate `essence_pseudocode_path`; sync REQ/ARCH/tests arrays; fix SUGGESTED_TAGS / POPUP_MESSAGE_TIMEOUT / empty summaries.

## Phase 2 — Storage cluster sidecars → SHAPE-003..006

## Phase 3 — UI surface sidecars

## Phase 4 — Utility / config / AI / logging sidecars

## Phase 5 — Thin stubs, Templates, YAML-only policy

## Phase 6 — Validate, vocab, CHANGELOG

## Execution log (2026-07-29)

1. Phase 0 — Vendored template; working plan/leap notes/tracker.
2. Phase 1 — Index `essence_pseudocode_path` for 100 sidecars; traceability sync; SUGGESTED_TAGS/TESTING/RUNTIME_VALIDATION/POPUP_MESSAGE_TIMEOUT; side-panel summaries. Methodology IMPLs not writable via MCP (leap note).
3. Phases 2–4 — Bulk SHAPE-003 uplift of 95 Active sidecars; hand-polish BOOKMARK_ROUTER + STORAGE_INDEX; artifact cleanup.
4. Phase 5 — Thin-stub decisions replaced; BOOKMARKING five-backend DATA; Tabs preferredBackend local product rule; URL_TAGS/USAGE notes; Templates/Deferred stubs.
5. Phase 6 — Validate + vocab + CHANGELOG.

## Done when

- Template vendored; all Active sidecars have H2 + PRE/POST/EFFECTS
- Index↔detail essence paths and core traceability agree
- Templates stay stubs; methodology IMPLs YAML-only
- `tied_validate_consistency` ok
