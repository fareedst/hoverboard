# Quality assurance vocabulary

**Scope:** Risk-triggered quality selection and evidence provenance for TIED changes.

## Canonical terms

| Preferred term | Synonyms to resolve | Meaning | Naming bridge |
|---|---|---|---|
| quality attribute | quality dimension, quality concern | A property whose risk may require evidence, such as security, reliability, performance, privacy, accessibility, or maintainability. | `QUALITY_ATTRIBUTE` |
| risk tier | risk level, severity band | A bounded classification used to select assurance depth and escalation. | `RISK_TIER` |
| assurance profile | quality profile, test profile | A versioned applicability selector with triggers, evidence requirements, owner, and failure action. | `ASSURANCE_PROFILE` |
| quality evidence matrix | QA matrix, assurance matrix | Rows mapping quality attributes to applicability, rationale, risk, evidence, threshold, result, owner, limitation, and waiver. | `QUALITY_EVIDENCE_MATRIX` |
| evidence item | proof item, check result | One machine- or human-supported result tied to a matrix row and evidence provenance. | `EVIDENCE_ITEM` |
| evidence manifest | verification manifest, proof manifest | A machine-generated collection of reproducible command and validator results. | `VERIFICATION_EVIDENCE_MANIFEST` |
| evidence provenance | proof provenance, result provenance | The identity, environment, tool version, command, threshold, exit code, and artifact references behind evidence. | `EVIDENCE_PROVENANCE` |
| residual risk | remaining risk, accepted exposure | Risk remaining after implemented controls and available evidence. | `RESIDUAL_RISK` |
| waiver | exception, risk acceptance | A time-bounded approval to accept a known unmet or non-applicable obligation. | `QUALITY_WAIVER` |
| owner/expiry | accountable owner, review expiry | The person or role accountable for an evidence gap or waiver and the date it must be revisited. | `RISK_OWNER_EXPIRY` |
| pilot | controlled trial, evaluation cohort | A bounded application of a candidate gate before canonical promotion. | `ASSURANCE_PILOT` |
| stop criterion | stopping rule, abort threshold | A measurable condition that pauses or rolls back a pilot or gate. | `PILOT_STOP_CRITERION` |
| test adequacy | test sufficiency, test strength | Risk-relative confidence that selected tests exercise meaningful behavior, boundaries, and failure modes. | `TEST_ADEQUACY` |
| proof boundary | quality proof, validation guarantee | The explicit claim limit for one evidence source; it states what the evidence does and does not establish. | `PROOF_BOUNDARY` |
| abuse case | security scenario, attack case | A named external-input misuse or failure scenario that requires executable evidence or an owned waiver. | `ABUSE_CASE` |
| accepted risk | risk acceptance, waived obligation | A deliberate residual-risk decision with rationale, accountable owner, and expiry. | `ACCEPTED_RISK` |
| quality command declaration | quality command, verification command | A bounded argv, working directory, limits, and artifact destination used to collect executable evidence. | `QUALITY_COMMAND_DECLARATION` |
| artifact reference | output path, evidence artifact | A stable path or identifier pointing to command output retained as evidence provenance. | `ARTIFACT_REFERENCE` |
| evidence collection | command collection, proof collection | The composition step that executes declared quality commands before building the verification evidence manifest. | `EVIDENCE_COLLECTION` |
| idempotency key | deduplication key, replay key | A stable event identifier used to prevent duplicate webhook inbox entries. | `IDEMPOTENCY_KEY` |
| event claim | worker claim, competing claim | An atomic ownership transition that allows one worker to process a due event. | `EVENT_CLAIM` |

## Profile applicability

| Profile | Trigger | Minimum evidence |
|---|---|---|
| baseline-functional | Every behavior-changing change | Unit TDD, applicable composition bindings, and traceability proof boundaries. |
| external-input-security | Untrusted input, authorization, API, CLI, message, file, or content boundary | Abuse cases, authorization checks, malformed-input handling, and sensitive-data review. |
| data-integrity-migration | Persistence, schema, migration, import/export, or idempotency change | Invariants, migration/replay evidence, backup/restore or recovery owner, and data-loss limitation. |
| stateful-reliability | Stateful workflow, retry, recovery, concurrency, or restart behavior | Failure transitions, replay/idempotency, recovery target, and deterministic reproduction. |
| performance-scale-cost | Workload, latency, throughput, memory, external call, or model/tool cost risk | Workload, budget, timeout/retry, resource behavior, and reproducible measurement. |
| user-facing-accessibility | User-visible behavior or interaction contract | Accessibility/usability acceptance and the relevant UI-free or E2E boundary. |
| regulated-privacy | Sensitive data, retention, consent, or regulatory obligation | Named owner, retention/consent evidence, limitation, and qualified review where required. |
| ai-enabled | Model, prompt, tool, agent, or generated-content boundary | Prompt-injection, sensitive-data, unsafe-output, authorization, sandbox, and abuse-volume checks. |

## External-input security case set

The `external-input-security` profile uses these canonical abuse cases:
`malformed-oversized-input`, `authentication-authorization`, `injection-unsafe-content`,
`path-traversal-file-access`, `replay-duplicate`, `secret-sensitive-data`,
`resource-exhaustion-timeout-rate-limit`, and `dependency-vulnerability-review`.

## Token links

- `[REQ-QUALITY_ASSURANCE_EVIDENCE]` defines the quality evidence obligation.
- `[ARCH-QUALITY_ASSURANCE_PROFILES]` defines profiles and proof boundaries.
- `[IMPL-QUALITY_EVIDENCE_MANIFEST]` defines machine-derived provenance.
- `[PROC-QUALITY_ASSURANCE]` selects profiles before design.
- `[PROC-QUALITY_EVIDENCE_PROVENANCE]` preserves executable evidence provenance.
- `[PROC-TEST_ADEQUACY]` selects advanced testing by risk.

Domain terms above are distinct from IMPL grammar keywords such as `INPUT`, `OUTPUT`, `DATA`, `CONTROL`, `PRE`, `POST`, and `EFFECTS`.

## Naming bridge

| Concept | TIED artifact or symbol | Related token |
|---|---|---|
| proof boundary | `proof_boundary` / `PROOF_BOUNDARY` | `[REQ-QUALITY_ASSURANCE_EVIDENCE]` |
| abuse case | `abuse_case` / `ABUSE_CASE` | `[IMPL-QUALITY_SECURITY_PROFILE_VALIDATION]` |
| accepted risk | `accepted_risk` / `ACCEPTED_RISK` | `[ARCH-QUALITY_ASSURANCE_PROFILES]` |
| binding row fields | `trigger`, `callee`, `arguments`, `effect`, `ordering`, `failure_behavior` | `[IMPL-QUALITY_BINDING_INVENTORY]` |
| quality command declaration | `QualityCommandDeclaration` / `QUALITY_COMMAND_DECLARATION` | `[IMPL-QUALITY_EVIDENCE_COMMAND_RUNNER]` |
| artifact reference | `artifacts` / `ARTIFACT_REFERENCE` | `[PROC-QUALITY_EVIDENCE_PROVENANCE]` |
| evidence collection | `collectVerificationEvidence` / `EVIDENCE_COLLECTION` | `[IMPL-QUALITY_EVIDENCE_COLLECTION]` |
| event claim | `claim` / `EVENT_CLAIM` | `[IMPL-QUALITY_ASSURANCE_PILOT_WEBHOOK]` |
| idempotency key | `event_id` / `IDEMPOTENCY_KEY` | `[IMPL-QUALITY_ASSURANCE_PILOT_WEBHOOK]` |

## Alphabetical index

| Term | Section |
|---|---|
| abuse case | Canonical terms |
| accepted risk | Canonical terms |
| artifact reference | Canonical terms |
| binding row fields | Naming bridge |
| evidence collection | Canonical terms |
| event claim | Canonical terms |
| idempotency key | Canonical terms |
| proof boundary | Canonical terms |
| quality command declaration | Canonical terms |
