# Agent workflow: `requirement_list_state_guide`

**Audience**: AI agents. This tool walks a **client-supplied ordered list** of requirements.

---

## Tool contract

| | `requirement_list_state_guide` |
|---|--------------------------------|
| **First call** | **Must** pass non-empty `requirements` (omit or clear `current_state`) |
| **Advance** | Next call: `current_state` = prior response **`continuation_state`** (opaque token) |
| **End** | Synthetic `id: end_requirement_list`, `is_end: true` |
| **Error** | Empty list, bad token, validation fail → `state: error` |

---

## Mandatory agent procedure

1. **Initialize** — First MCP call: pass **`requirements`** as a non-empty array in **implementation order** (respect `depends_on` in your ordering). Each element must satisfy the tool schema: `id`, `name`, `depends_on`, `summary`, `rationale`, `inputs`, `outputs`, `functional_requirements`, `acceptance_criteria`, `test_scope`. Do **not** pass `current_state` on this call.

2. **Advance the list** — After each response that is **not** `end_requirement_list` and **not** `error`, store `continuation_state`. When you are ready for the **next** requirement in the list, call again with **only** `current_state` set to that **`continuation_state`** string. (`requirements` is ignored once `current_state` is set.)

3. **Uninterrupted list pass** — From first call through list exhaustion, **keep calling in sequence** without deferring the walk: each call returns one requirement (or the terminal **`end_requirement_list`** record). Do not stop mid-sequence for unrelated work unless the user interrupts. Stop the **list** walk only when:
   - **`is_end: true`** and **`id: end_requirement_list`** — list complete; or
   - **`state: error`** — fix input or restart with a fresh `requirements` array (omit `current_state`).

4. **Building the app** — The sequence above is how multiple requirements compose into a **working app**: each requirement is fully specified in TIED (as the checklist demands), implemented with tests-first code, validated, then the next requirement is pulled from the list.

---

## References

- Tool descriptor: `mcp-server/tool-descriptors/requirement_list_state_guide.json`
- Operating guide: `AGENTS.md`, `ai-principles.md`
