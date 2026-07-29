# TIED-First Implementation Procedure

**Audience**: AI agents and developers. Process token: `[PROC-TIED_FIRST_IMPLEMENTATION]`.

**Purpose**: Single reference for implementing when REQ+ARCH+IMPL have already been updated in TIED and implementation (tests + code) is pending. Ensures agents treat the updated IMPL as the source of truth, verify REQ/ARCH/IMPL completeness, then run impact analysis and strict TDD from the new design—replacing or rewriting existing tests and code to match.

---

## When This Procedure Applies

- REQ/ARCH/IMPL (and IMPL `essence_pseudocode` with block token comments) have been **authored or updated** in the TIED indexes and detail files.
- Tests and/or code still reflect a **prior design** or are **missing** for the new design.
- The remaining work is to **align tests and code** with the updated TIED stack.

---

## Relationship to the Agent Checklist

This procedure uses [agent-req-implementation-checklist.md](agent-req-implementation-checklist.md) (`[PROC-AGENT_REQ_CHECKLIST]`) as the base; the trackable YAML is [agent-req-implementation-checklist.yaml](agent-req-implementation-checklist.yaml) (copy to a unique per-request file per its header). It defines a **variant**: same step sequence (session-bootstrap–traceable-commit) with specific entry-point semantics and step modifiers. The agent executes the checklist from session-bootstrap; the following sections describe how change-definition–S06 differ when TIED is already prepared.

---

## Entry Point and Step Modifiers

### Entry point

**Start at session-bootstrap** (Session Bootstrap). Complete session-bootstrap as in the main checklist (read `tied/docs/ai-principles.md`, review semantic tokens, architecture and implementation indexes, implementation-decisions guide, confirm MCP paths and the mandatory IMPL→validation→persist→RED→GREEN order including implementation freeze).

### change-definition: Define Change

- **Current behavior**: Prior design—existing tests and code as they are today.
- **Desired behavior**: New design described by the **updated** REQ/ARCH/IMPL.
- **Unchanged behavior**: Explicit boundaries of what is not affected by this change.
- **Non-goals**: What this work intentionally does not address.
- **Success criteria**: All tests and code align to the **new** IMPL; three-way alignment (pseudo-code ↔ tests ↔ code) holds; `tied_validate_consistency` passes.

Use the **updated** TIED stack as the source of "desired behavior"; existing tests/code are "current behavior" to be replaced or updated.

### impact-discovery: Impact Analysis and IMPL Discovery

- Build impact and IMPL inventory from the **updated** REQ/ARCH/IMPL and related links (composed_with, depends_on, shared REQ/ARCH, code_locations, source grep for `[IMPL-*]`).
- **Do not** treat existing code as the source of truth for what to implement. The updated IMPL pseudo-code defines the target; existing code and tests are inputs to the impact table (files/functions that may need to change), not the specification.

### author-requirement–S06: REQ/ARCH/IMPL — Verify Only

REQ/ARCH/IMPL are already updated; do **not** re-author from scratch.

- **Verify** REQ/ARCH/IMPL index and detail files are complete (all required fields, tokens in `semantic-tokens.yaml`).
- **Verify** IMPL pseudo-code per checklist catalog-pseudocode-contracts–apply-token-comments:
  - Contracts: INPUT/OUTPUT/DATA (and CONTROL when present) declared; procedure names and key branches/loops/error paths present.
  - No insufficient specs: no missing contracts, undefined procedures, unhandled error paths, stub pseudo-code on Active IMPLs, or blocks without token comments.
  - No contradictory specs across IMPLs (shared DATA, ordering, OUTPUT types, duplicate logic).
  - **Every block** has a token comment per `[PROC-IMPL_PSEUDOCODE_TOKENS]` (top-level and sub-blocks naming REQ/ARCH/IMPL and how the block implements them).
- **If** something is missing or wrong: fix in IMPL first (then ARCH/REQ if scope changed); re-validate each changed YAML file with `lint_yaml` per [PROC-YAML_EDIT_LOOP] (`processes.md`); then proceed to tests/code. Do not proceed with gaps in pseudo-code.

### risk-assessment–traceable-commit: Execute as in Main Checklist

- **risk-assessment**: Risk analysis (risks with token references, mitigations).
- **test-strategy**: Test determination and planning (testability classification, test matrix, TDD sequence from **new** IMPL).
- **S09**: Unit TDD (Phases D–F): RED → GREEN → REFACTOR → SYNC per IMPL block; three-way alignment; sub-leap-micro-cycle if GREEN reveals pseudo-code wrong.
- **composition-integration**: Composition testing (bindings; failing composition test then composition code).
- **end-to-end-ui**: E2E (only for behavior requiring UI invocation; justify `e2e_only_reason`).
- **verification-gate**: Final validation (full suite, lint, token validation, three-way audit, IMPL metadata).
- **sync-tied-stack**: Sync TIED to code and tests; run `tied_validate_consistency`.
- **user-facing-release-notes**: README and CHANGELOG.
- **persist-citdp-record**: Persist CITDP record.
- **traceable-commit**: Commit per `[PROC-COMMIT_MESSAGES]`.

No changes to the task content of risk-assessment–traceable-commit; only the source of "what to implement" is the updated TIED stack.

---

## Strict TDD from New IMPL

- Tests are written to **conform to** the updated IMPL pseudo-code. They are written **before** production code (RED first).
- **Existing tests** that encode the **old** design must be **updated or removed** so they do not assert prior behavior that contradicts the new IMPL. Do not leave passing tests that validate the old design.
- Production code is written **only** to satisfy the new tests (GREEN). No production code without a preceding failing test.
- **Entire** IMPL pseudo-code is implemented via TDD: write failing test → make it pass → refactor; repeat until every IMPL block is covered and all unit tests pass.

---

## Three-Way Alignment and LEAP

- **Three-way alignment**: For every IMPL block, pseudo-code, test, and code must carry the **same** REQ/ARCH/IMPL token set with logically corresponding descriptions (what the block implements / what the test validates / how the code implements).
- **LEAP**: If during GREEN the pseudo-code is found incomplete, wrong, or missing a dependency: **sub-leap-micro-cycle**. Stop; update IMPL first; then test; then code. Never fix only in code and defer docs.

---

## Flow Diagram

```mermaid
flowchart TD
  session-bootstrap["session-bootstrap: Session Bootstrap\nRead TIED docs, confirm access"]
  change-definition["change-definition: Define Change\nCurrent = prior design\nDesired = updated REQ/ARCH/IMPL"]
  impact-discovery["impact-discovery: Impact from Updated TIED\nIMPL discovery, inventory table\nDo not use existing code as spec"]
  Verify["author-requirement–S06: Verify REQ/ARCH/IMPL\nCompleteness, block tokens\nFix gaps before tests/code"]
  test-strategy["test-strategy: Test Plan\nTest matrix, TDD sequence\nfrom new IMPL"]
  TDD["S09: Unit TDD\nRED then GREEN then SYNC\nper IMPL block"]
  composition-integration["composition-integration: Composition Tests\nFailing test then code"]
  e2e_ui["end-to-end-ui: E2E if UI-only"]
  verification-gate["verification-gate: Final Validation\nSuite, lint, token audit"]
  Sync["sync-tied-stack: Sync TIED\nDocs match code/tests\ntied_validate_consistency"]
  Commit["user-facing-release-notes–traceable-commit: README, CITDP, Commit"]

  session-bootstrap --> change-definition --> impact-discovery --> Verify --> test-strategy --> TDD --> composition-integration --> e2e_ui --> verification-gate --> Sync --> Commit
```

---

## References

| Document | What it provides |
|----------|------------------|
| [agent-req-implementation-checklist.md](agent-req-implementation-checklist.md) | Full step sequence session-bootstrap–traceable-commit; sub-yaml-edit-loop, sub-leap-micro-cycle; flow control |
| [pseudocode-writing-and-validation.md](pseudocode-writing-and-validation.md) | Three-way alignment, phases A–I, LEAP |
| [implementation-order.md](implementation-order.md) | Mandatory order: unit tests → unit code (TDD) → composition tests → composition code → E2E → close loop |
| [processes.md](processes.md) | § LEAP, § PROC-TIED_DEV_CYCLE, § PROC-IMPL_CODE_TEST_SYNC, § PROC-IMPL_PSEUDOCODE_TOKENS |
| [AGENTS.md](../../AGENTS.md) | Agent operating guide; session bootstrap; mandatory acknowledgment |
