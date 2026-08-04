# Quality-evidence rollout boundary

**Date:** 2026-08-04
**Scope:** [REQ-QUALITY_ASSURANCE_EVIDENCE] pilot validators and inherited methodology dependency graph

## Pilot result

The client-side pilot is actionable and reproducible:

- `test_adequacy_validate`: passed for `baseline-functional`, `data-integrity-migration`, `performance-scale-cost`, and `quality-assurance-pilot`; replay and flaky checks were explicitly N/A with rationale.
- `binding_inventory_validate`: passed for representative MESSAGE_DISPATCH, ROUTER_STORAGE, utility, manifest, and theme bindings.
- `tied_validate_consistency`: passed with detail files and pseudo-code enabled.
- `npm run composition:plan`: `0 unit-only`, `0 candidate`, `164 covered`.

These validators remain report-only for this client because the pilot proves evidence quality, not a global policy migration.

## Module validation boundaries

- Pure utility modules (`arrayUtils`, `stringUtils`, `urlUtils`) pass independent unit tests before the shared-utility composition test.
- Storage modules (`StorageIndex`, provider doubles, `BookmarkRouter`) pass provider/router unit tests before ROUTER_STORAGE composition tests.
- Message and entry-point modules (`MessageHandler`, content listener, browser shim, MV3 manifest) pass isolated contract tests before MESSAGE_DISPATCH composition tests.
- UI-support modules (`OverlayManager`, controls, tags-tree grouping) pass DOM/data unit tests before UI-free binding tests.

The composition suites therefore validate bindings between independently validated modules; they do not replace the module-level tests.

## Canonical blocker and ownership

`tied_cycles --graph implementation` still reports:

`IMPL-QUALITY_EVIDENCE_COLLECTION → IMPL-QUALITY_EVIDENCE_MANIFEST → IMPL-QUALITY_EVIDENCE_COLLECTION`

Both records are inherited under `tied/methodology/`, which is read-only in this client. The dependency-cycle repair and the boundary between machine-generated evidence manifests and human residual-risk decisions belong to the TIED methodology repository.

- **Owner:** TIED methodology maintainers.
- **Follow-up:** break the cycle upstream, clarify manifest/residual-risk ownership, refresh this client through `copy_files.sh`.
- **Stop condition:** do not promote global strict assurance gates while the cycle remains unresolved.

## Controlled rollout decision

Keep `binding_inventory_validate`, `test_adequacy_validate`, `pseudocode_validate`, and evidence collection report-only in this client. New or changed work must still run them and retain their proof boundaries; promotion to strict enforcement is an upstream decision after the cycle is repaired and a fresh pilot passes.
