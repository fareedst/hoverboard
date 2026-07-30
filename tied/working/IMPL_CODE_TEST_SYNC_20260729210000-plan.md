# IMPL Full-Block Three-Way Sync Plan

**Date:** 2026-07-29  
**Cursor plan:** [`impl_code_test_sync_0df93b2a.plan.md`](/Users/fareed/.cursor/plans/impl_code_test_sync_0df93b2a.plan.md)  
**Leap notes:** [`IMPL_CODE_TEST_SYNC_20260729210000-leap-notes.md`](./IMPL_CODE_TEST_SYNC_20260729210000-leap-notes.md)  
**Policy:** [`tied/docs/source-file-impl-traceability.md`](../docs/source-file-impl-traceability.md)

**Mode:** full-block duplication (lead + Contract + PROCEDURE) into `src/` and `tests/unit/` (and composition tests when listed).  
**Delivery:** Phase 0 → storage → UI → util → closeout.  
**Exclude:** Template / Deferred / methodology YAML-only IMPLs.

## Phases

| Phase | Status | Notes |
|-------|--------|-------|
| 0 Policy + working pack | completed | policy doc + tracker + sync script |
| 1 Storage / bookmark | completed | full-block inject + bookmarking/native-host tests |
| 2 UI / messaging / tags | completed | full-block inject + badge UPDATE tests |
| 3 Config / AI / util / platform | completed | shared-utils unit suite; empty-locus force map |
| 4 Closeout | completed | check 0/95 missing; CHANGELOG; validate |

## Done when

- Active sidecars have full-block copies at mapped production + unit-test loci  
- Hard-gap unit coverage patched  
- `traceability.tests` synced via MCP  
- `tied_validate_consistency` ok; CHANGELOG updated; prior §3a leap note closed  
