# Verification evidence manifest

Process tokens: `[PROC-QUALITY_ASSURANCE]`, `[PROC-QUALITY_EVIDENCE_PROVENANCE]`; implementation token: `[IMPL-QUALITY_EVIDENCE_MANIFEST]`.

## Purpose and proof boundary

The verification evidence manifest is machine-generated evidence for one run. It records what commands and validators observed, under which environment and commit, with which thresholds and artifacts. Human rationale, waivers, owners, expiry, and residual-risk acceptance remain separate review data.

The manifest does not prove universal correctness, regulatory certification, runtime security, performance, resilience, usability, privacy, or product behavior beyond the recorded checks.

## Shape

The `quality_evidence_manifest_build` MCP tool emits `verification-evidence-manifest.v1`:

```yaml
schema_version: verification-evidence-manifest.v1
run_id: "~"
commit: "~"
environment: {}
command_results:
  - id: "~"
    command: "~"
    cwd: "~"
    exit_code: 0
    result: passed
    threshold: "~"
    artifacts: []
quality_rows:
  - id: "~"
    attribute: baseline-functional
    applicability: applicable
    rationale: "~"
    risk: "~"
    evidence_method: "~"
    command_or_test: "~"
    threshold: "~"
    result: passed
    owner: "~"
    limitation: "~"
    waiver:
      required: false
      reason: "~"
      owner: "~"
      expiry: "~"
covered_tokens: []
proof_boundaries: []
human_decisions:
  stored_separately: true
  references: []
```

`command_results` and `quality_rows` are sorted by stable identifiers. Covered tokens and proof-boundary labels are de-duplicated and sorted. A missing command, exit code, result, row identifier, attribute, or applicability is a validator error.

## Quality row applicability

Use `applicable`, `not_applicable`, or `accepted_risk`. `not_applicable` requires a rationale. `accepted_risk` requires a separate owner and expiry. Profile selection is risk-triggered: baseline functional is always considered, while security, data integrity, reliability, performance/cost, accessibility, privacy/regulatory, and AI profiles activate from their documented boundaries.

## Reproducibility

Retain the commit identity, environment/tool versions, exact commands, exit codes, thresholds, output artifact references, covered REQ/IMPL tokens, validator diagnostics, and `tied_validate_consistency` result. A result without those provenance fields is incomplete evidence.
