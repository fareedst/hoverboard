# Traceability gap classification

**Date:** 2026-08-04
**Scope:** `tied_scoped_analysis_run(mode=traceability_gap_report)` over `src`, `tests`, and `tied`
**Tokens:** [PROC-TOKEN_VALIDATION] [PROC-AGENT_REQ_CHECKLIST] [REQ-MODULE_VALIDATION]

## Active product requirements remediated

The following records now have owning architecture and implementation decisions plus named executable tests:

- `REQ-CONFIGURATION` → ConfigManager structure/migration/backup and restore tests.
- `REQ-ERROR_HANDLING` → message validation, popup error, and timeout tests.
- `REQ-PERFORMANCE` → explicit overlay harness budgets: element creation `<100ms` and selector queries `<50ms`.
- `REQ-RELIABILITY` → storage/router timestamp aggregation, message routing, and validation tests.
- `REQ-USABILITY` → side-panel search/grouping and popup/side-panel interaction tests.

The corresponding test files carry the requirement markers so the scoped analyzer can verify the links from executable evidence.

## Explicitly non-actionable or out-of-scope records

| Requirement | Classification | Rationale |
|---|---|---|
| `REQ-EXAMPLE_FEATURE` | Template | TIED example stub; no product behavior is expected. |
| `REQ-SAFARI_ADAPTATION` | Deferred | Active delivery target is Chromium MV3; Safari packaging and host-specific suites are absent by design. |
| `REQ-FEEDBACK_TO_TIED` | Canonical-source anchor | Feedback implementation and tests belong to the upstream TIED methodology repository; this client intentionally has no local coverage. |
| `REQ-TIED_SETUP` | Inherited methodology | Setup behavior is validated by methodology/bootstrap tests, not product tests in this client. |
| `REQ-QUALITY_ASSURANCE_EVIDENCE` | Inherited methodology | Quality validators and their tests are canonical methodology artifacts; this client records pilot evidence but does not duplicate their implementation. |

These exclusions are intentional proof boundaries, not missing product tests. The methodology records remain read-only in this client.

## Verification

The post-remediation scoped report returned exit code 0:

- no unexplained active product REQ without a test marker;
- no active product REQ without an owning implementation marker;
- only the five classified records above remain in the `REQ` test-gap set.
