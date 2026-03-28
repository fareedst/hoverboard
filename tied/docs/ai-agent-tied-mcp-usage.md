# AI Agent Directive: TIED Data via MCP

**Audience**: AI agents operating in TIED projects. **Do not treat this as human-facing prose.**

**Purpose**: Define how TIED directs the build, and require the TIED MCP server as the primary interface to TIED data. Direct file access remains allowed when necessary; such cases are candidates for new MCP tools.

---

## 1. TIED directs the build

**Hard rules (project TIED YAML)** — Read this block first:

- **MCP for every mutation** of project-owned YAML under the TIED base path (`yaml_detail_*`, `yaml_index_*`, `tied_token_create_with_detail`, etc.); do not use IDE `apply_patch` / `Write` when a tool covers the operation ([yaml-update-mcp-runbook.md](yaml-update-mcp-runbook.md)).
- **Why hand edits fail**: models often break indentation, quoting (values with `:`), duplicate keys, and index/detail alignment; the MCP server emits **safe YAML**.
- **On MCP errors**: follow the runbook failure playbook (fix JSON in `record`/`updates`, narrow scope, retry)—do **not** silently fall back to direct file edit on the same path.
- **`tied/methodology/`** is read-only in client projects; when MCP rejects a methodology write, do not “fix” it with `Write`.

- The TIED **database** (YAML indexes and detail files under `tied/` or `TIED_BASE_PATH`) **controls and directs** the creation of code and tests.
- **All code of significance is created in TIED first**: requirements (REQ), then architecture (ARCH) and implementation (IMPL) decisions, with full traceability. Only then is it implemented in source and tests using **TDD**.
- The flow is: **TIED data → tests → code**. TIED is the source of truth for intent; tests and code realize it.

### 1.1 YAML detail storage, MCP, and cognitive load

- REQ, ARCH, and IMPL **detail is maintained in YAML files** (indexes + detail files per token), giving a standard, flexible record. The TIED MCP optimizes use of this YAML db by presenting R/A/I via **indexes** and **CRUD+ actions**, including **validation of the entire db**.
- **Complex tasks**: Collect all **related R/A/I index records and detail records** via MCP (index reads, filters, traceability tools). Then **only the pseudo-code for the necessary IMPL** needs to be comprehended to develop an ideal solution. **Updating the code to match the new IMPL pseudo-code is a separate task**—design in TIED first, then implement.
- **Rationale**: The cognitive load of processing a **handful of IMPL** records should be **smaller** than the task of parsing an arbitrary number of source code files to guess at side effects. When that holds, intent and logic live in the R/A/I YAML and IMPL pseudo-code, and code remains the implementation of that record. The MCP makes it practical to work from the YAML db (indexes + CRUD + validation) instead of scattering logic across many source files.

### 1.2 Preload samples, hook logs, and workspace path

- **Re-ground the TIED base path every session** — Call `tied_config_get_base_path` (or rely on a correctly configured `TIED_BASE_PATH` for the **active** workspace). Treat absolute `tied/` paths in pasted `agent_preload` YAML, demo snapshots, or copied checklist text as **hints only** if they might refer to another clone or repo.
- **Hook export YAML is not the TIED database** — Files such as `~/.cursor/logs/conv_*.yaml` are Cursor hook/conversation exports (large root-level lists and block scalars). Do not patch or rewrite them with IDE tools as if they were project TIED YAML; use offline tooling to shrink or analyze them (e.g. `scripts/dedupe_transcript_yaml.rb` in this repository). YAML-looking lines inside transcript `text` fields are **string payload**, not live R/A/I records; confusing layers causes invalid YAML (see [conversation-log-yaml-structure-and-agent-difficulties.md](conversation-log-yaml-structure-and-agent-difficulties.md)).
- **Avoid redundant discovery** — When bootstrap or preload already recorded paths and MCP batch reads, skip repeating the same Grep/`yaml_detail_read_many` work; it adds noise without improving YAML safety.

---

## 2. Primary interface: TIED MCP server

- **Use the TIED MCP server as the primary way to read and write TIED data** for the project.
- **Avoid direct edits to `tied/**/*.yaml` for writes;** use MCP write tools so the server can emit valid YAML (e.g. values with colons are quoted correctly).
- **Hard rule (project-owned YAML only)**: Do not use IDE `apply_patch` / `Write` on project index or detail YAML under the TIED base path when a tool in § 2 covers the operation. If MCP errors, follow the failure playbook in [yaml-update-mcp-runbook.md](yaml-update-mcp-runbook.md); do not silently switch to direct file edit.
- Prefer **MCP tools** for:
  - Reading indexes and records: `yaml_index_read`, `yaml_index_list_tokens`, `yaml_index_filter`, `get_decisions_for_requirement`, `get_requirements_for_decision`
  - Reading/writing detail files: `yaml_detail_read`, `yaml_detail_read_many`, `yaml_detail_list`, `yaml_detail_create`, `yaml_detail_update`, `yaml_detail_delete`
  - Creating or updating index records: `yaml_index_insert`, `yaml_index_update`, `tied_token_create_with_detail`
  - Validation: `yaml_index_validate`, `tied_validate_consistency`, `tied_config_get_base_path`
  - Conversion and inspection: `convert_monolithic_*`, `convert_detail_markdown_to_yaml`, `tied_import_summary`
- Prefer **MCP resources** (e.g. `tied://requirements`, `tied://requirement/{token}/detail`) when loading TIED context for reasoning or tool input.
- Before changing TIED content, **read** the current state via MCP (tools or resources); after changing it, use the appropriate **write** or **update** tool so the on-disk TIED db stays consistent.

---

## 3. When direct file access is allowed

- **Direct read/write of TIED files** (e.g. under `tied/` or the path reported by `tied_config_get_base_path`) is **allowed only when**:
  - No MCP tool or resource exists that can perform the needed operation, or
  - The operation is one-off or exploratory and will be replaced by MCP usage once a tool exists.
- When you use direct file access:
  - Prefer the path returned by `tied_config_get_base_path` (or the configured `TIED_BASE_PATH`) so behavior matches the server.
  - Treat the case as a **candidate for a new MCP tool**: the gap should be noted (e.g. in implementation decisions or a short note) so maintainers can extend the MCP server to cover it and eventually provide full support via tools.

---

## 4. Agent workflow summary

| Action | Use |
|--------|-----|
| Discover or confirm TIED base path | `tied_config_get_base_path` |
| Read requirements, architecture, implementation, or semantic-tokens index | `yaml_index_read` or resources `tied://requirements`, etc. |
| Read/write a single REQ/ARCH/IMPL detail | `yaml_detail_read`, `yaml_detail_create`, `yaml_detail_update`, `yaml_detail_delete` |
| Traceability (REQ ↔ ARCH/IMPL) | `get_decisions_for_requirement`, `get_requirements_for_decision` |
| Create new token with index + detail | `tied_token_create_with_detail` |
| Validate index YAML | `yaml_index_validate` |
| Validate REQ/ARCH/IMPL consistency (tokens, traceability, detail files, pseudo-code) | `tied_validate_consistency` |
| Migrate monolithic docs or detail markdown | `convert_monolithic_*`, `convert_detail_markdown_to_yaml` |
| Operation not covered by any tool | Direct file access; document the gap for future tooling |
| How to mutate project YAML without invalid files / MCP abandonment | [yaml-update-mcp-runbook.md](yaml-update-mcp-runbook.md) |
| Walk an ordered multi-requirement backlog (list on first call, then `continuation_state`) | `requirement_list_state_guide` — see [requirement-list-state-guide-agent-workflow.md](requirement-list-state-guide-agent-workflow.md) |
| Single-requirement checklist S01–S16 | Follow [agent-req-implementation-checklist.md](agent-req-implementation-checklist.md) in the repo (no dedicated MCP tool for the linear step sequence) |

---

## 5. References

- **YAML mutation routing, cheat sheet, MCP failure playbook**: [yaml-update-mcp-runbook.md](yaml-update-mcp-runbook.md)
- **Tool and resource list**: [mcp-server/README.md](../mcp-server/README.md)
- **Multi-requirement walk + per-REQ checklist**: [requirement-list-state-guide-agent-workflow.md](requirement-list-state-guide-agent-workflow.md)
- **Setup and passes**: [adding-tied-mcp-and-invoking-passes.md](adding-tied-mcp-and-invoking-passes.md)
- **Agent operating guide**: [AGENTS.md](../AGENTS.md); **principles**: [ai-principles.md](../ai-principles.md)
