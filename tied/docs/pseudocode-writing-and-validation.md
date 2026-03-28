# Writing and Validating IMPL Pseudo-Code

**Audience**: Humans and AI agents. Process token: `[PROC-PSEUDOCODE_VALIDATION]`.

**Purpose**: This document is the single place for how to **write** and how to **validate** IMPL pseudo-code (`essence_pseudocode`) in TIED projects. It ties together writing rules (in `implementation-decisions.md`) and the application pseudo-code validation checklist (in `pseudocode-validation-checklist.yaml`).

---

## 1. How to Write IMPL Pseudo-Code

IMPL pseudo-code lives in each IMPL detail file as the `essence_pseudocode` field. It is the **source of consistent logic** for the implementation; tests and code are derived from it and must stay aligned ([PROC-IMPL_PSEUDOCODE_TOKENS], [PROC-LEAP]).

### Writing rules (summary)

- **Mandatory structure**: Every IMPL detail file must include `essence_pseudocode`. Address all logical and flow issues there **before** writing tests or code.
- **Contract block**: Use explicit `INPUT:`, `OUTPUT:`, `DATA:` (and `CONTROL:` when relevant). Procedure names in UPPER_SNAKE or camelCase.
- **One action per step**: Each logical step should express one clear action or decision; avoid long prose that mixes multiple actions.
- **Token comments in every block** ([PROC-IMPL_PSEUDOCODE_TOKENS]): Every block must have a comment that (1) names all REQ, ARCH, and IMPL reflected in that block and (2) states how the block implements them. Top-level: `# [IMPL-X] [ARCH-Y] [REQ-Z]` plus a one-line summary. Sub-blocks with the same token set: comment only the *how*. Sub-blocks with a different set: open with the full token list and how the sub-block implements them.
- **Preferred vocabulary**: INPUT, OUTPUT, DATA, CONTROL; ON, WHEN; SEND, BROADCAST, RETURN; IF, ELSE; FOR … IN; ON error, RETURN error; AWAIT, Promise. See the full list in `implementation-decisions.md`.
- **Collision detection**: When IMPLs are composed or share code paths, document ordering, shared data, and pre/post conditions so overlapping steps and conflicting assumptions are visible.

**Full writing guide**: See `tied/implementation-decisions.md` (or root `implementation-decisions.md`) for:

- Mandatory essence_pseudocode
- Preferred vocabulary for essence_pseudocode
- Expressing sequence and structure
- Template and stub pseudo-code
- Managed code and block token rules (REQ/ARCH/IMPL in pseudo-code)
- Collision detection using essence_pseudocode

---

## 2. How to Validate IMPL Pseudo-Code

The **application pseudo-code validation checklist** is defined in [pseudocode-validation-checklist.yaml](pseudocode-validation-checklist.yaml). Use it to ensure pseudo-code is parseable, well-shaped, consistent with contracts and architecture, and covered by tests before any test or code is written.

### Intended use

- Projects where pseudo-code is the **primary application specification**.
- Projects where pseudo-code **drives unit-test and integration-test definitions**.
- Projects that require **requirement, architecture, and implementation traceability**.

### How to apply

1. Parse each pseudo-code block into a normalized internal representation (or treat the block as the unit if no parser exists).
2. Run each validation pass in the **recommended order** (see below).
3. Record findings with **severity** and **source location** (block identifier, line/column when available).
4. Treat **required checks as gating** unless explicitly waived and documented.

### Result severities

- **error** — Must be fixed before proceeding; gating.
- **warning** — Should be addressed; may be waived with justification.
- **info** — Informational; no gate.

### Recommended validation order

Run categories in this order:

1. **parsing** — Blocks parse successfully; source locations preserved.
2. **schema** — Required sections exist; inputs/outputs/data declarations consistent.
3. **symbol_resolution** — Every referenced symbol resolves uniquely; duplicate identifiers controlled.
4. **contract_validation** — Test inputs/outputs and errors conform to target block contracts; safety/invariants testable where required.
5. **dependency_graph** — Application dependency graph valid; unit tests do not silently depend on undeclared collaborators.
6. **behavioral_coverage** — Each implementation block has success-path coverage; failure-path coverage when failure is possible; optionally boundary/edge cases.
7. **traceability** — Every requirement tag has at least one test; every implementation tag has validation coverage; optionally architecture reflected in integration tests.
8. **linting** — Optional: precise verbs, explicit fixtures/mocks.
9. **semantic_simulation** — Optional: setup satisfies preconditions, assertions reachable.
10. **generation_readiness** — Optional: steps map to test framework primitives.
11. **reporting** — Findings emitted with severity, message, and source location.

### Minimum gating rules

Do not proceed to writing tests or code until:

- All **required** checks pass (or are explicitly waived and documented).
- No **unresolved symbols** remain.
- Every **requirement tag** is covered by at least one test.
- Every **implementation block** has success-path coverage.
- Every **declared failure mode** has coverage when failure is possible.
- **Diagnostics** include source locations where available.

### Tailoring

Projects may:

- Add **project-specific block kinds** under the schema category.
- Add **domain-specific safety rules** under contract_validation.
- Add **project architecture constraints** under dependency_graph.
- Add **custom coverage thresholds** per block kind.
- Add **generation backend constraints** if pseudo-code drives test generation directly.

See the `tailoring` section in [pseudocode-validation-checklist.yaml](pseudocode-validation-checklist.yaml).

### If no parser or tool exists

Perform a **manual pass** over the checklist categories in the recommended order. For each category, walk the checklist items (by `id`) and document results (pass / fail / waived) with severity and, where possible, block or file location. Treat required checks as gating; fix or waive before proceeding.

---

## 3. When to Run Validation

- **Before any tests or code** — Align with S06 of the agent checklist ([PROC-AGENT_REQ_CHECKLIST]): after authoring or updating IMPL pseudo-code and applying block token comments, run validation before persisting and before S07–S16.
- **After any change to IMPL `essence_pseudocode`** — When aiming for generation-ready or full traceability, re-run validation after edits so the checklist remains satisfied.

---

## 4. References

| Document | What it provides |
|----------|------------------|
| [pseudocode-validation-checklist.yaml](pseudocode-validation-checklist.yaml) | Canonical checklist (categories, required/optional checks, order, gating rules, tailoring) |
| `tied/implementation-decisions.md` | Full writing rules: mandatory essence_pseudocode, vocabulary, sequence, token comments, collision detection |
| `tied/docs/agent-req-implementation-checklist.md` | S06.5a and SUB-PSEUDOCODE-VALIDATE: where validation runs in the agent flow |
| `tied/docs/impl-code-test-linkage.md` | Phase B (B5) and Phase C (C4): validation in the IMPL-to-code-and-tests linkage |
| `tied/processes.md` | [PROC-PSEUDOCODE_VALIDATION], [PROC-IMPL_PSEUDOCODE_TOKENS], [PROC-IMPL_CODE_TEST_SYNC] |
