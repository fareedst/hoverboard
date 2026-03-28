# LEAP: Logic Elevation And Propagation

**Audience**: Expert programmers and engineering leaders. Process token: `[PROC-LEAP]`.

**Summary**: LEAP is the primary loop in TIED. Logic is **elevated** into IMPL pseudo-code (out of source code); all changes **propagate** through the REQ/ARCH/IMPL stack so that IMPL remains the single logical representation of the solution, bounded by R/A/I tokens. This document explains why that discipline pays off and why an AI agent reading accurate IMPL pseudo-code is more efficient than hunting the correct logic across many source files.

---

## 1. What LEAP Is

- **Logic Elevation**: The tasks of coding the solution live in **IMPL pseudo-code** (`essence_pseudocode` in implementation decision detail files), not in the source. Design and behavior are authored there first; source code implements that record.
- **Propagation**: Changes are **distributed and validated** through the stack. Top-down: REQ → ARCH → IMPL. Bottom-up (when TDD/E2E reveal divergence): IMPL → ARCH → REQ, in the same work item. Work can start at any layer, but for the work to be **complete**, the full stack (REQ, ARCH, IMPL, tests, code) must be consistent and traceable via tokens.
- **Validity**: Code is valid only when **all tests pass** and **all requirements are met**. Validity implies the stack is consistent and the written record (R/A/I) matches the implementation.

See `tied/processes.md` § LEAP for the canonical process definition and rules. For the executable LEAP procedure (what to do when code/tests diverge from IMPL), follow that section.

---

## 2. Why IMPL Pseudo-Code Beats Hunting Through Source

### 2.1 The cost of inferring logic from code

In a typical codebase:

- **Logic is scattered**: One feature may touch many files (handlers, services, utils, models). An agent must open and reason over each to infer behavior, ordering, and side effects.
- **No single source of truth**: Comments and names can lie or drift. The only ground truth is execution (tests, runtime). Reconstructing "what this feature does" requires tracing call graphs, state, and data flow across files.
- **Context window and latency**: Loading N source files burns context and time. The agent may still miss a branch, an edge case, or an interaction with another module.
- **Side effects and ordering**: Understanding "what happens when" often requires reading multiple modules and guessing at side effects. Code does not declare intent; it only declares mechanism.

### 2.2 What IMPL pseudo-code provides

- **One place per decision**: Each IMPL has a single detail file with `essence_pseudocode`. The **logical** behavior of that decision is written there in language-agnostic, step-wise form (INPUT/OUTPUT/DATA, control flow, procedure names). No need to open 10 source files to guess.
- **Bounded by R/A/I**: REQ and ARCH tokens tell the agent *why* this IMPL exists and *what* requirement/architecture it satisfies. The agent can read REQ → ARCH → IMPL in order and get the full chain of intent before touching code.
- **Stable vocabulary**: IMPL pseudo-code uses a consistent vocabulary (see `implementation-decisions.md` § Mandatory essence_pseudocode). That makes blocks comparable and reduces ambiguity (e.g. "RETURN error" vs "ON error" vs ad-hoc prose).
- **Collision detection**: When multiple IMPLs interact, comparing their `essence_pseudocode` blocks reveals overlapping steps, shared data, and ordering dependencies. Doing the same from raw source requires deep execution tracing.

### 2.3 Efficiency for AI agents

- **Targeted load**: For a given task, the agent collects **related** R/A/I index and detail records (via MCP or file read). Only the **necessary IMPL** pseudo-code needs to be comprehended to design the solution. That is a small, fixed set of records instead of an open-ended set of source files.
- **Design then implement**: The agent designs the solution from IMPL (and linked ARCH/REQ). Updating the code to match the new IMPL is a **separate task**. So the cognitive load is split: (1) reason in the space of pseudo-code and tokens, (2) translate that into code and tests. No need to reverse-engineer behavior from code first.
- **Fewer hallucinations**: When the authoritative description of behavior is in one place (IMPL), the agent is less likely to invent behavior that contradicts another file it never read. The pseudo-code is the contract; code and tests are checked against it.

**Bottom line**: Reading a handful of IMPL records (with their REQ/ARCH context) is **more efficient** than parsing an arbitrary number of source files to guess at side effects and intent. LEAP enforces that the former stays accurate so that the latter remains a pure implementation step.

---

## 3. LEAP in Practice

### 3.1 When LEAP runs

Every time a change occurs to:

- The TIED db (REQ/ARCH/IMPL YAML indexes or detail files), or
- Its outputs (code, tests, or documents that reference tokens),

the LEAP rules apply: keep the stack consistent; elevate logic into IMPL; propagate changes up and down as needed.

### 3.2 Bottom-up (refinement from tests/code)

When code or tests written during TDD or E2E **differ** from the IMPL pseudo-code:

1. **Elevate** the new logic into IMPL (update `essence_pseudocode` and any IMPL detail fields).
2. If the change affects architecture or requirement scope, **propagate** to ARCH, then to REQ, in the same work item.
3. Ensure tokens and traceability (e.g. `traceability.requirements`, `traceability.architecture`, `code_annotations`) stay correct. Run `tied_validate_consistency` (or equivalent) before considering the work complete.

### 3.3 Top-down (creation)

When creating a new feature or decision:

1. Add or update REQ; then ARCH; then IMPL with full pseudo-code **before** writing tests or code.
2. Implement and test (TDD); if tests force a behavior change, apply bottom-up (above) so IMPL stays the logical representation.

### 3.4 YAML and MCP

- REQ, ARCH, and IMPL detail live in **YAML** (indexes + detail files per token). The TIED MCP exposes indexes and CRUD+ validation so agents can read/write TIED data without editing YAML by hand.
- For a complex task: use MCP (or index/detail reads) to collect all related R/A/I records; reason from the **necessary IMPL** pseudo-code only; then treat "update code to match IMPL" as a separate step. See `tied/docs/ai-agent-tied-mcp-usage.md` for the MCP workflow.

---

## 4. Summary for Experts

| Concept | Meaning |
|--------|--------|
| **Elevation** | Logic lives in IMPL pseudo-code; source code implements it. |
| **Propagation** | Changes move through the stack (REQ ↔ ARCH ↔ IMPL ↔ tests ↔ code) so the stack stays consistent. |
| **Efficiency** | An agent that reads accurate IMPL pseudo-code (and R/A/I context) can design and implement without hunting logic across many source files. |
| **Validity** | Code is valid only when all tests pass, all requirements are met, and the TIED db matches the implementation (LEAP applied). |

LEAP is the loop that keeps TIED’s promise: **one logical representation of the solution (IMPL), bounded by R/A/I tokens, with code and tests as the implementation and validation of that record.**
