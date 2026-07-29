# Mandatory Implementation Order

**Audience**: Developers and AI agents. This document states the **mandatory order** for implementing features in TIED: tests-first (TDD), then code, then binding/glue, then E2E. No code or tests are written here—only the sequence that must be followed.

## Order

1. **Tests first (TDD)**  
   Tests are written to **conform to** the IMPL pseudo-code. No production code is written yet (or only the minimum needed to make the first test pass). Tests validate each IMPL block and carry the same REQ/ARCH/IMPL token references as the IMPL.

2. **Code via TDD**  
   Code is written to **satisfy** the tests. The **entire** IMPL pseudo-code is implemented **via TDD**: write test → make it pass → refactor; repeat until every IMPL block is covered and all tests pass.

3. **Binding / glue**  
   After TDD is complete, write the **binding, non-unit-test-covered code** (entry points, platform wiring, manifest, etc.) so the full REQ/ARCH/IMPL can run. This code is not covered by unit or integration tests; it is necessary to make the feature possible end-to-end. Document any non-trivial glue in the IMPL (e.g. `e2e_only_reason` or `testability: e2e_only`).

4. **E2E**  
   E2E tests are written **after** binding code to **protect** (a) the non-TDD (glue) code and (b) operations that ensure the most basic features. E2E-only behavior is documented in the IMPL.

5. **Closing the loop**  
   When all tests pass and all requirements are met, update TIED data (REQ/ARCH/IMPL, `traceability.tests`, `code_locations`, `essence_pseudocode`) to match the implementation. Run consistency validation (e.g. `tied_validate_consistency`). See LEAP in `tied/docs/processes.md` § LEAP.

## References

- **Process**: `tied/docs/processes.md` § **PROC-TIED_DEV_CYCLE** (steps 3–10: tests, TDD, glue, E2E, validate, sync, README/CHANGELOG, commit).
- **Principles**: `tied/docs/ai-principles.md` § Phase 3 (mandatory implementation order).
- **Agents**: `AGENTS.md` (implementation order bullet).
- **README**: [README.md](../README.md) § "How TIED (with TDD) develops tests, code, and E2E, then closes the loop."
- **Unified checklist**: `tied/docs/agent-req-implementation-checklist.md` (`[PROC-AGENT_REQ_CHECKLIST]`) — the step-by-step procedure that sequences this mandatory order with CITDP, LEAP, and validation. A trackable YAML checklist is at `tied/docs/agent-req-implementation-checklist.yaml` (copy to a unique per-request file per its header).
