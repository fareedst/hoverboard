# Agent workflow: `req_impl_state_guide`

**Audience**: AI agents. This tool **combines** the outer loop of `requirement_list_state_guide` (ordered client-supplied specifications) with the inner loop of `agent_req_state_guide` (fixed checklist session-bootstrap through `end_agent_req`) in **one MCP tool** and **one continuation token**.

---

## When to use which tool

| Tool | Use case |
|------|----------|
| **`req_impl_state_guide`** | Drive the full backlog in one linear sequence: for each spec, every checklist step, then next spec, until **`end_req_impl`**. Prefer when the agent should advance state **only via this tool** (single continuation). |
| **`requirement_list_state_guide` + `agent_req_state_guide`** | Outer walk returns one requirement at a time; the agent manually runs `agent_req_state_guide` per requirement until `end_agent_req`, then advances the list. Same work, two tools. |

---

## Tool contract

| | Detail |
|---|--------|
| **First call** | Non-empty **`requirements`** (same shape as `requirement_list_state_guide`: `id`, `name`, `depends_on`, `summary`, `rationale`, `inputs`, `outputs`, `functional_requirements`, `acceptance_criteria`, `test_scope`). Omit **`current_state`**. |
| **Advance** | **`current_state`** = prior response **`continuation_state`** (opaque base64url JSON). **`requirements`** is ignored when `current_state` is set. |
| **Per response** | **`spec`**: full requirement object for the current specification. **`agent_step`**: current checklist step (`id`, `title`, `stage`, `goals`, `tasks`, `outcomes`). **`state`**: composite `specId__stepId` (e.g. `REQ-AUTH__catalog-pseudocode-contracts`). |
| **End** | After the last spec’s **`end_agent_req`** step, the next call returns **`state: end_req_impl`**, **`is_end: true`**. Passing the same **`continuation_state`** again stays at terminal (idempotent). |
| **Error** | Empty list, bad token, validation failure, out-of-range continuation → **`state: error`**, **`is_end: true`**. |

---

## Mandatory agent procedure

1. **Initialize** — First call with **`requirements`** in implementation order (respect `depends_on`). Do not pass **`current_state`**.

2. **Uninterrupted walk** — After each non-terminal response, call again with **`current_state`** = **`continuation_state`**. Continue **back-to-back** until **`is_end`** with **`end_req_impl`** or **`state: error`**. Do not abandon mid-sequence unless the user interrupts.

3. **Per cell** — Execute the work implied by **`agent_step`** for the current **`spec`** (TIED authoring, TDD, validation per `[PROC-AGENT_REQ_CHECKLIST]`). Treat phases that imply code as **strict TDD**.

4. **Terminal** — When **`end_req_impl`**: all specifications have been walked through the full checklist. No further steps unless the user restarts with a new **`requirements`** array.

---

## References

- Tool descriptor: `mcp-server/tool-descriptors/req_impl_state_guide.json`
- List-only outer walk: `requirement_list_state_guide`
- Checklist-only inner walk: `agent_req_state_guide`
- Operating guide: `AGENTS.md`, `tied/docs/ai-principles.md`
