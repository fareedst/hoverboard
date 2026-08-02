# Composition coverage — binding inventory and E2E exclusion

**Audience**: Developers and AI agents. Process tokens: `[PROC-TEST_STRATEGY]`, `[PROC-TIED_DEV_CYCLE]`, `[PROC-IMPL_CODE_TEST_SYNC]` Phase G, `[REQ-MODULE_VALIDATION]`.

**Purpose**: Define how to inventory bindings between validated modules, prove each binding with a composition test (no UI), and reserve E2E for named platform constraints only. Referenced by `composition-integration` in `[PROC-AGENT_REQ_CHECKLIST]`.

---

## What counts as a binding

A **binding** connects two or more units that were validated independently (unit TDD). Examples:

| Binding kind | Trigger | Typical collaborators |
|---|---|---|
| Event listener / callback | Event fires | Publisher → handler module |
| IPC / message channel | Message received | Sender → router → handler |
| Entry-point delegation | CLI/argv or API call | Entry point → pipeline/lib |
| Function wiring | Direct call | Orchestrator → collaborator |
| Platform hook | Hook invoked (programmatically) | Host → feature module |

If the trigger can be fired programmatically (function call, message, synthetic event) and the effect observed without a browser/UI, the binding is **composition-testable**.

---

## Binding inventory table

Maintain one row per binding in scope (CITDP `test_strategy`, IMPL notes, or this project's inventory for the change). Columns:

| Binding ID | Trigger | Callee / collaborator | Arguments asserted | Effect asserted | Ordering / PRE | Failure mode | Composition test | E2E? |
|---|---|---|---|---|---|---|---|---|
| *(example)* `CLI→pipeline.Build` | `main` after parse | `pipeline.Build` | argv paths, checklist path | turns assembled | parse before build | invalid YAML → exit | `pipeline_test.go` / cmd composition | no |

**Done when:** every binding in the change has a composition test that carries IMPL block token comments and verifies trigger → callee → arguments → effect. Missing rows are gaps under `[PROC-TEST_STRATEGY]`.

### Machine validation contract

The `binding_inventory_validate` validator accepts the same rows as structured data. Every row must contain non-empty `id`, `trigger`, `callee`, `arguments`, `effect`, `ordering`, and `failure_behavior`. A composition-testable row must also contain `composition_test`. A row may set `e2e_only: true` only when `e2e_only_reason` names a platform constraint such as native OS, window-server, visual, browser, file-dialog, or filesystem behavior.

The validator proves inventory completeness and E2E justification only. It does not prove that the callee works, that arguments are semantically correct, or that the composition test passes.

---

## Composition test contract (UI-free)

Each composition test MUST:

1. Carry the IMPL block lead (literal copy) for the composition block.
2. Fire the trigger **without** invoking UI (no browser, no OS menu click).
3. Assert the correct unit is called (or observable result of that call).
4. Assert arguments / INPUT shape match the IMPL PRE/INPUT.
5. Assert OUTPUT / POST / EFFECTS (or FAILURE_MODES) match the IMPL.
6. Fail if the binding is missing or miswired (RED before composition code).

Use fakes, stubs, and in-process doubles. Prefer package-level or cmd-level composition tests over subprocess E2E.

---

## E2E exclusion rule

Mark `testability: e2e_only` and `e2e_only_reason` **only** when a **named platform constraint** prevents composition testing, for example:

- Native OS file dialog / menu cannot be triggered programmatically in the test environment.
- Visual rendering or window-server behavior that cannot be observed below E2E.

**Not sufficient reasons:** "complex UI flow", "entry-point wiring", "integration feels hard", "we already have Playwright". Those bindings belong in the composition inventory.

E2E may still cover a critical user journey **in addition to** composition tests; it must not replace them.

---

## Decision gate

> Can I fire this trigger programmatically (function call, message, or synthetic event) and observe the effect without a browser/UI?

| Answer | Layer |
|---|---|
| Yes | Composition test (`composition-integration`) |
| No — named platform constraint | E2E (`end-to-end-ui`) with `e2e_only_reason` |
| Unclear | Assume composition; document why UI would be required before choosing E2E |

---

## Project inventory (STDD / agentstream)

High-value composition bindings already exercised (extend when adding features):

| Binding ID | Location | Notes |
|---|---|---|
| `CLI→pipeline.Build` | `tools/agentstream/cmd/agentstream` + `pipeline/` | Argv/config → turn assembly |
| `pipeline→checklist.LoadTurns` | `pipeline` + `checklist` | Lead checklist YAML → turns; bounds/vars propagate |
| `pipeline→executor.Run` | `cmd` + `executor` | Live loop with fake agent |
| `control goto → ReplaceRemainingFromStep` | `cmd` + `control` + `pipeline` | Checklist control trailer; missing target fails closed |
| `ApplyPromptFilePreload → non-compact HTML` | `cmd` compose_noncompact | Composition after preload |
| `canonical checklist composition gate` | `checklist/composition_coverage_test.go`, `pipeline/composition_coverage_test.go` | Ordering unit→composition→E2E; rendered binding + E2E justification |
| `ATDD argv → TddLoopPrompts` | Ruby/ATDD COMPOS IMPLs | Documented in `docs/run-agent-stream-impl-composition.md` |

When changing these seams, re-run composition tests and update this inventory if bindings are added or removed.

The methodology repository exposes the structured contract through `binding_inventory_validate`; callers should run it before composition wiring and retain its diagnostics in the verification evidence manifest.

---

## References

- `tied/docs/processes.md` § `[PROC-TEST_STRATEGY]`, `[PROC-TIED_DEV_CYCLE]`, `[PROC-IMPL_CODE_TEST_SYNC]` Phase G
- `tied/docs/implementation-order.md`
- `tied/docs/agent-req-implementation-checklist.md` step `composition-integration`
- `tied/docs/pseudocode-writing-and-validation.md` § Composition and E2E expansion
