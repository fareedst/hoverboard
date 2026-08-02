# Controlled quality-assurance pilot

Process tokens: `[PROC-QUALITY_ASSURANCE]`, `[PROC-QUALITY_EVIDENCE_PROVENANCE]`, `[PROC-TEST_ADEQUACY]`.

## Pilot contract

Candidate gates are piloted on representative methodology changes before becoming universal release requirements. The pilot owner records cohort, approval, privacy constraints, rollback action, evidence retention, outcome measures, and stop criteria. A passing pilot is not a claim of universal correctness or regulatory certification.

Stop the pilot or roll back a candidate gate when any of the following occurs:

- a critical/high risk is left without an owner, expiry, or evidence;
- a gate produces a false block with no actionable diagnostic;
- evidence cannot be reproduced from its command, environment, commit, and artifact references;
- ceremony cost grows without an actionable finding;
- privacy or sensitive-data handling is not bounded.

## Methodology-repository pilot cohort

| Representative change | Selected profile | Evidence | Outcome |
|---|---|---|---|
| Ordinary validator feature | baseline-functional | MCP server TypeScript build/tests and unit/composition tests | Retain structural unit and composition gates. |
| External-input MCP boundary | external-input-security | Zod input schemas, invalid command test, handler composition test | Retain malformed-input and proof-boundary diagnostics. |
| Data migration | data-integrity-migration | N/A: no persistence schema or migration changed in this cohort; rationale recorded | Do not promote migration checks universally. |
| Performance-sensitive path | performance-scale-cost | N/A for release blocking: no workload-sensitive product path changed; adequacy validator records required budget fields | Retain conditional cost-control schema; do not claim performance proof. |
| AI-enabled path | ai-enabled | N/A: this repository change adds no model, prompt, tool, or generated-content path | Keep AI profile conditional. |

## Measurements and promotion

Record escaped defects, missing-scenario findings, security findings, recovery success, budget regressions, flaky-test rate, mutation/property/fuzz signal, review time, evidence reproducibility, and checklist effort. Tool telemetry such as MCP usage counts is not a feature-quality outcome.

For this pilot, the actionable signals were missing composition evidence, unresolved pseudo-code calls, missing contract fields, unclassified E2E claims, and incomplete flaky/external-call control metadata. The retained gates are the deterministic validators for those signals. Specialized runtime checks remain profile-triggered and are not promoted as universal ceremony without a representative product path and measurable signal.

Evidence retention for this pilot is the repository test output, Go test output, YAML lint output, `tied_validate_consistency` result, and the final CITDP record. Human waiver and residual-risk decisions remain separate from the machine manifest.

## Webhook inbox pilot result

The boundary-rich pilot at `pilot/webhook-inbox` selected `baseline-functional`,
`external-input-security`, `data-integrity-migration`, and
`stateful-reliability`. Its two-test suite passed with no false block observed:
signature verification, malformed input, replay rejection, SQLite idempotency,
duplicate delivery, retry, and terminal failure transitions were exercised.

The reproducibility command is `npm --prefix pilot/webhook-inbox test`; the
quality command runner records its exact argv, working directory, tool version,
exit code, and stdout/stderr artifacts before manifest construction. Ceremony
was limited to the pilot package, its unit tests, and the selected evidence
rows. No production defect rate, vulnerability-database result, or
backup/restore guarantee is inferred from this pilot.
