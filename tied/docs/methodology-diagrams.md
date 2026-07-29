# LEAP+TIED+CITDP Methodology Diagrams

**TIED Methodology Version**: 2.2.0

Six diagrams capture the core methodology: the traceability stack, the three development phases, the LEAP bidirectional loop, the full dev-cycle session workflow, the TDD inner loop, and the CITDP change-analysis procedure. A short **New client setup — Cursor** section at the end shows bootstrap and `agent enable tied-yaml` for MCP.

**Related documents**: [LEAP.md](LEAP.md), [implementation-order.md](implementation-order.md), [processes.md](processes.md), [ai-principles.md](./ai-principles.md)

---

## Diagram 1 — TIED Traceability Stack with LEAP Propagation

The core DAG (REQ → ARCH → IMPL → Tests/Code) and the LEAP bidirectional arrows. This is the foundational mental model: top-down creation flows requirements into architecture, then implementation pseudo-code, then tests and code. When TDD or E2E reveal divergence, LEAP propagates changes bottom-up through the same stack.

```mermaid
flowchart TB
    subgraph topDown ["Top-Down Creation"]
        REQ["[REQ-*]\nRequirements\n(WHAT + WHY)"]
        ARCH["[ARCH-*]\nArchitecture Decisions\n(High-level HOW)"]
        IMPL["[IMPL-*]\nImplementation Decisions\n+ essence_pseudocode\n(Detailed HOW)"]
        Tests["Tests\n(Validation)"]
        Code["Code\n(Implementation)"]

        REQ -->|"cross-ref"| ARCH
        ARCH -->|"cross-ref"| IMPL
        IMPL -->|"prescribes"| Tests
        IMPL -->|"prescribes"| Code
    end

    subgraph bottomUp ["LEAP Bottom-Up Refinement"]
        Code2["Code / Tests\n(diverge from IMPL)"]
        IMPL2["Update IMPL\nessence_pseudocode"]
        ARCH2["Update ARCH\n(if scope changed)"]
        REQ2["Update REQ\n(if scope changed)"]

        Code2 -->|"1. Elevate"| IMPL2
        IMPL2 -->|"2. Propagate"| ARCH2
        ARCH2 -->|"3. Propagate"| REQ2
    end

    subgraph registry ["Token Registry"]
        ST["semantic-tokens.yaml\n(canonical registry)"]
    end

    REQ ---|"registered in"| ST
    ARCH ---|"registered in"| ST
    IMPL ---|"registered in"| ST
```

---

## Diagram 2 — Three Development Phases

The high-level flow from requirements through planning to implementation, with LEAP feeding back. Phase 1 produces the documentation and pseudo-code. Phase 2 breaks work into prioritized, token-referenced steps. Phase 3 implements via strict TDD with composition and E2E layers. LEAP closes the loop when code diverges from IMPL.

```mermaid
flowchart LR
    subgraph P1 ["Phase 1: Requirements to Pseudo-Code"]
        R1["Identify REQ\nwith semantic token"]
        R2["Document ARCH\nwith cross-refs"]
        R3["Document IMPL\nwith cross-refs"]
        R4["Identify modules\nand boundaries"]
        R5["Resolve logic in\nIMPL pseudo-code"]
        R6["Token comments\nin every block"]
        R7["Update\nsemantic-tokens.yaml"]

        R1 --> R2 --> R3 --> R4 --> R5 --> R6 --> R7
    end

    subgraph P2 ["Phase 2: Planning"]
        P2a["Break work into\ntoken-referenced steps"]
        P2b["Identify implementation\nsequence and modules"]
        P2c["Prioritize\nP0 > P1 > P2 > P3"]

        P2a --> P2b --> P2c
    end

    subgraph P3 ["Phase 3: Implementation"]
        P3a["Unit tests first\n(strict TDD)"]
        P3b["Unit code via TDD"]
        P3c["Composition tests\n(bindings)"]
        P3d["Composition code\nvia TDD"]
        P3e["E2E tests\n(UI-only, justified)"]
        P3f["Validate + Sync\nTIED stack"]

        P3a --> P3b --> P3c --> P3d --> P3e --> P3f
    end

    P1 --> P2 --> P3
    P3 -.->|"LEAP: if code diverges\nfrom IMPL, propagate\nIMPL -> ARCH -> REQ"| P1
```

---

## Diagram 3 — PROC-TIED_DEV_CYCLE (Full Session Workflow)

All 11 steps of a development session. Steps 1–2 are documentation-first (plan and author TIED docs with pseudo-code). Steps 3–7 form the code-generation inner loop governed by TDD (see Diagram 4 for the per-iteration cycle). Steps 8–11 validate, sync, and commit. The LEAP arrow from step 9 back to step 2 fires when code diverged from IMPL during TDD.

**Mermaid:** Flowchart node IDs must not match reserved words or hyphen-split into tokens such as `end` (which closes `subgraph`). Use safe IDs (for example `e2e_ui`) and keep checklist step names only inside `["…"]` labels.

```mermaid
flowchart TD
    Start(["Session Start"]) --> S1

    S1["1. Plan from TIED\nRead REQ/ARCH/IMPL\nResolve logic in pseudo-code"]
    S2["2. Author TIED docs\nUpdate REQ/ARCH/IMPL\nComplete essence_pseudocode\nToken comments in every block"]

    S1 --> S2

    S2 --> S3

    subgraph innerLoop ["Code-Generation Inner Loop (steps 3-7)"]
        S3["3. Unit tests first\nConform to IMPL pseudo-code\nStrict TDD: tests before code"]
        S4["4. Unit code via TDD\nCode satisfies tests\nLogic in testable modules"]
        S5["5. Composition tests first\nFor every binding between units\nFailing test before composition code"]
        S6["6. Composition code via TDD\nWiring/binding satisfies tests\nNo composition code without failing test"]
        S7["7. E2E tests\nOnly for UI-invocation behavior\nJustify why not composition-level"]

        S3 --> S4 --> S5 --> S6 --> S7
    end

    S7 --> S8
    S8["8. Validate + close test gaps\nRun full test suite\nRun PROC-TOKEN_VALIDATION"]
    S9["9. Sync TIED to code/tests\nUpdate REQ/ARCH/IMPL to match\nSync semantic-tokens.yaml"]
    composition-integration["10. Update README + CHANGELOG"]
    e2e_ui["11. Write commit message\nper PROC-COMMIT_MESSAGES"]

    S8 --> S9 --> composition-integration --> e2e_ui

    e2e_ui --> Done(["Session Complete"])

    S9 -.->|"LEAP: if code diverged\nfrom IMPL during TDD\nupdate IMPL -> ARCH -> REQ"| S2
```

---

## Diagram 4 — TDD Inner Loop (RED-GREEN-REFACTOR per Iteration)

Each iteration within steps 3–7 of the dev cycle follows this mandatory cycle. RED is the only entry point: every iteration starts with a failing test. GREEN writes minimum production code. A lint gate (language-specific: Rust via `bun run lint:rust`, TypeScript via `bunx tsc -b`) blocks progress until tests pass and lint is clean. REFACTOR is optional. The loop repeats until all behavior for the current step is covered.

```mermaid
flowchart TD
    Entry(["Iteration Start"]) --> RED

    RED["RED (mandatory entry)\nWrite/update a failing test\nRun test suite\nConfirm test fails for expected reason\nNo production code in this step"]

    GREEN["GREEN\nWrite minimum production code\nto make failing test pass\nRun tests + language-specific lint\nRust: bun run lint:rust\nTS: bunx tsc -b"]

    REFACTOR["REFACTOR (optional)\nClean up test or production code\nRe-run tests + lint\nConfirm no regressions"]

    NEXT{"More behavior\nto implement?"}

    LintCheck{"Tests pass\nAND lint clean?"}
    LintFix["Fix lint/test\nfailures"]

    RED --> GREEN
    GREEN --> LintCheck
    LintCheck -->|"No"| LintFix
    LintFix --> GREEN
    LintCheck -->|"Yes"| REFACTOR
    REFACTOR --> NEXT
    NEXT -->|"Yes"| RED
    NEXT -->|"No"| Done(["Proceed to\nnext step"])
```

---

## Diagram 5 — CITDP Change Impact and Test Design Procedure

The 8-step `[PROC-CITDP]` procedure for analyzing and planning behavior changes. Steps 1–5 produce the analysis record (change definition, impact, pseudo-code authoring, risk, test determination). Step 6 executes the TDD sequence via PROC-TIED_DEV_CYCLE. Step 7 runs completion gates (lint, token validation, consistency, module validation) and records LEAP feedback when divergences occurred. Step 8 persists the CITDP YAML record through the YAML edit loop.

```mermaid
flowchart TD
    Start(["Change Request"]) --> C1

    C1["1. Define Change\nCurrent behavior\nDesired behavior\nUnchanged behavior\nNon-goals + success criteria"]

    C2["2. Impact Analysis\nAffected modules/functions\nwith tied_tokens\nModule boundaries\ntied_context: tokens affected + new"]

    C3["3. IMPL Pseudo-Code Authoring\nRead/update essence_pseudocode\nfor affected IMPLs\nEvery block: token comments\nPseudo-code authoritative before tests"]

    C4["4. Risk Analysis\nRisks with\ntied_token_references"]

    C5["5. Test Determination\nPer PROC-TEST_STRATEGY\nTest matrix with\nimpl_block_reference\ntestability_classification"]

    C6["6. TDD Sequence\nPseudo-code first\nUnit tests -> Unit code\nComposition tests -> Composition code\nE2E for UI-only\nValidate + LEAP sync"]

    C7["7. Completion\nLanguage-specific lint\nPROC-TOKEN_VALIDATION\ntied_validate_consistency\nModule validation\nLEAP feedback record"]

    C8["8. Persistence\nStore CITDP YAML record\nValidate per PROC-YAML_EDIT_LOOP\nlint_yaml"]

    C1 --> C2 --> C3 --> C4 --> C5 --> C6 --> C7 --> C8

    C6 -.->|"Executes\nPROC-TIED_DEV_CYCLE\nsteps 3-7"| TDD["TDD Inner Loop\n(Diagram 4)"]

    C7 -.->|"LEAP feedback:\ndivergences trigger\nIMPL -> ARCH -> REQ\nupdates"| C3

    C8 --> Done(["Change Complete\nRecord stored"])
```

---

## Diagram 6 — YAML Edit Loop and Token Validation

The `[PROC-YAML_EDIT_LOOP]` that governs all TIED YAML changes. No TIED record (index or detail) is valid for use until it passes this loop. Step 1 edits the file. Step 2 validates syntax and canonicalizes formatting with **`lint_yaml`** (see `processes.md` for definition; each path processed independently—never raw multi-argument `yq` pretty-print). On failure, fix and repeat. Step 3 marks the file as valid for use by MCP, scripts, and downstream steps. Step 4 optionally runs `tied_validate_consistency` to check cross-file traceability; failures feed back to step 1.

```mermaid
flowchart TD
    Start(["Create or modify\nTIED YAML"]) --> Edit

    Edit["1. Edit\nCreate or modify YAML\n(index or detail file)"]

    Validate["2. Validate + Pretty-Print\nlint_yaml\nValidates syntax\nCanonicalizes formatting"]

    ValidOK{"Validation\npassed?"}

    Use["3. Use\nFile is valid for use\nby MCP, scripts,\nand downstream steps"]

    ConsistencyCheck["4. Optional: Run\ntied_validate_consistency\nCheck REQ/ARCH/IMPL\ntraceability and detail files"]

    ConsistOK{"Consistency\npassed?"}

    FixYAML["Fix YAML syntax\nor content errors"]

    FixConsist["Fix consistency\nissues in TIED stack"]

    Edit --> Validate --> ValidOK
    ValidOK -->|"No"| FixYAML --> Edit
    ValidOK -->|"Yes"| Use --> ConsistencyCheck
    ConsistencyCheck --> ConsistOK
    ConsistOK -->|"No"| FixConsist --> Edit
    ConsistOK -->|"Yes"| Done(["TIED YAML\nvalid and consistent"])
```

---

## New client setup — Cursor

Sequence for configuring a **new TIED client** when using **Cursor**: bootstrap writes `.cursor/mcp.json`; the **Cursor Agent CLI** step enables the MCP server in the workspace.

```mermaid
flowchart LR
  CopyFiles["copy_files.sh"]
  AgentEnable["agent enable tied-yaml"]
  Approve["Approve project\nMCP config"]
  Quit["quit"]
  UseMcp["Use tied-yaml\nMCP tools"]
  CopyFiles --> AgentEnable --> Approve --> Quit --> UseMcp
```

Run `agent enable tied-yaml` from the **client project** directory after `copy_files.sh`. Approve the update when Cursor prompts you. Type **`quit`** to exit the `agent` UI. See [README.md](../README.md) (Getting Started with a New Project) and [adding-tied-mcp-and-invoking-passes.md](adding-tied-mcp-and-invoking-passes.md).
