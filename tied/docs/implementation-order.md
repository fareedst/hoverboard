# Mandatory Implementation Order

**Audience**: Developers and AI agents. This document states the **mandatory order** for implementing features in TIED: unit tests-first (TDD), then unit code, then composition tests and composition code for bindings, then E2E only when UI invocation is required. No code or tests are written here—only the sequence that must be followed.

## Order

1. **Unit tests first (TDD)**
   Unit tests are written to **conform to** the IMPL pseudo-code. No production code is written yet (or only the minimum needed to make the first test pass). Tests validate each IMPL block and carry the same REQ/ARCH/IMPL token references as the IMPL.

2. **Unit code via TDD**
   Code is written to **satisfy** the unit tests. The **entire** unit-testable IMPL pseudo-code is implemented **via TDD**: write test → make it pass → refactor; repeat until every unit-classified IMPL block is covered and all unit tests pass.

3. **Composition tests first**
   After unit tests pass, for every **binding between units** (event listeners, IPC channels, entry-point delegation, function wiring, platform hooks), write **failing** component, integration, or contract tests **before** writing composition code. Each composition test verifies trigger → correct unit called → correct arguments → correct effect **without invoking the UI**. Bindings are composition-testable, not E2E-only by default. Maintain a binding inventory (see `tied/docs/composition-coverage.md`).

4. **Composition code via TDD**
   Implement binding, wiring, and entry-point code **only** to satisfy the composition tests. No composition code without a preceding failing composition test. Keep composition code minimal; extract non-trivial logic into independently validated modules. Document any remaining glue that cannot be composition-tested with `e2e_only_reason` naming a specific platform constraint.

5. **E2E (UI-only, justified)**
   E2E tests cover behavior that **requires UI invocation** (native menus, visual rendering, platform surfaces that cannot be simulated below E2E). Each E2E test must justify why composition-level testing is insufficient. E2E does **not** substitute for composition tests of bindings and wiring.

6. **Closing the loop**
   When all tests pass and all requirements are met, update TIED data (REQ/ARCH/IMPL, `traceability.tests`, `code_locations`, `essence_pseudocode`) to match the implementation. Run consistency validation (e.g. `tied_validate_consistency`). See LEAP in `tied/docs/processes.md` § LEAP.

## References

- **Process**: `tied/docs/processes.md` § **PROC-TIED_DEV_CYCLE** (unit tests → unit code → composition tests → composition code → E2E → validate/sync).
- **Principles**: `tied/docs/ai-principles.md` § Phase 3 (mandatory implementation order).
- **Agents**: `AGENTS.md` (implementation order bullet).
- **Composition coverage**: `tied/docs/composition-coverage.md` (binding inventory and composition vs E2E).
- **README**: [README.md](../README.md) § "How TIED (with TDD) develops tests, code, and E2E, then closes the loop."
- **Unified checklist**: `tied/docs/agent-req-implementation-checklist.md` (`[PROC-AGENT_REQ_CHECKLIST]`) — the step-by-step procedure that sequences this mandatory order with CITDP, LEAP, and validation. A trackable YAML checklist is at `tied/docs/agent-req-implementation-checklist.yaml` (copy to a unique per-request file per its header).
