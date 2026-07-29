# TIED YAML Tool Reference

Complete catalog of tools exposed by the tied-yaml MCP server. Call any tool via:

```bash
.cursor/skills/tied-yaml/scripts/tied-cli.sh <tool_name> '<args_json>'
.cursor/skills/tied-yaml/scripts/tied-cli.sh <tool_name> @/path/to/args.json
```

Parameters marked **required** must be present in `args_json` (or in the JSON file when using `@path`). All `record`, `updates`, `index_record`, and `detail_record` params accept a JSON string.

**`tied-cli.sh` and large arguments:** For any tool args other than exactly `{}`, the shell writes the JSON to a **temp file** and the stdio client reads **`TIED_CLI_ARGS_FILE`** so payloads are not stuffed into the process environment (which would break large **`tied_token_create_with_detail`** calls). The JSON-RPC envelope is built in Node with **`JSON.stringify`**. Use **`@/path/to.json`** for the heaviest payloads.

---

## Config

### `tied_config_get_base_path`

Return the effective TIED base directory used for reads and writes (from `TIED_BASE_PATH` / server defaults). Call **before** any MCP write to confirm mutations target the intended project `tied/` tree (see repo `AGENTS.md` and `docs/yaml-update-mcp-runbook.md` §3).

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| _(none)_ | — | — | Pass `{}` as args. |

---

## Index tools

### `yaml_index_read`

Read an entire YAML index or a specific record by token. **Index rows do not include `essence_pseudocode`** (IMPL pseudo-code is on the detail file); use `yaml_detail_read` for that body.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `index` | string | yes | `requirements`, `architecture`, `implementation`, or `semantic-tokens` |
| `token` | string | no | Token ID to fetch a single record |

### `yaml_index_list_tokens`

List all tokens in a YAML index.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `index` | string | yes | Which index to list |
| `type` | string | no | For `semantic-tokens` only: filter by `REQ`, `ARCH`, `IMPL`, `PROC` |

### `yaml_index_filter`

Filter records by a top-level field value.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `index` | string | yes | Which index to filter |
| `field` | string | yes | Field name (e.g. `status`, `type`) |
| `value` | string | yes | Value to match (e.g. `Active`, `Implemented`) |

### `yaml_index_validate`

Validate YAML syntax of all TIED index files. No parameters.

### `yaml_index_insert`

Insert a new record into a YAML index. Fails if token already exists.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `index` | string | yes | Which index |
| `token` | string | yes | Token ID for the new record |
| `record` | string | yes | JSON string of the record object |

### `yaml_index_update`

Merge `updates` into an existing index record (fails if token missing). Object fields **`metadata`**, **`traceability`**, **`related_requirements`**, **`related_decisions`**, **`rationale`**, and **`implementation_approach`** are merged **one level** with the existing row; **`metadata.last_updated`** / **`metadata.last_validated`** merge an extra level when both sides are plain objects. Arrays and other top-level keys follow the usual replace/merge rules.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `index` | string | yes | Which index |
| `token` | string | yes | Token ID to update |
| `updates` | string | yes | JSON string of key-value pairs to merge |

---

## Detail file tools

### `yaml_detail_read`

Read a single detail YAML file by token.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | yes | Token ID (e.g. `REQ-TIED_SETUP`, `ARCH-TIED_STRUCTURE`) |

### `yaml_detail_read_many`

Read detail YAML for multiple tokens or all tokens of a type. Provide `tokens` or `type` (at least one).

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `tokens` | array | no | List of token IDs |
| `type` | string | no | `requirement`, `architecture`, or `implementation` |

### `yaml_detail_list`

List tokens that have a detail YAML file for the given type.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | yes | `requirement`, `architecture`, or `implementation` |

### `yaml_detail_create`

Create a new detail YAML file.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | yes | Token ID |
| `record` | string | yes | JSON string of the detail record |
| `sync_index` | boolean | no | Set `detail_file` on the index record (default: true) |

### `yaml_detail_update`

Merge `updates` into an existing detail YAML record. Same deep-merge whitelist as `yaml_index_update` (including **`rationale`** and **`implementation_approach`**; nested **`metadata.last_updated`** / **`metadata.last_validated`** object merge). If you include **`implementation_approach.details`**, you must send the **full** array (it replaces wholesale, like `cross_references`). To append bullets without re-sending the list, use **`yaml_detail_append_implementation_approach_details`**.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | yes | Token ID |
| `updates` | string | yes | JSON string of key-value pairs to merge |

### `yaml_detail_append_implementation_approach_details`

Append strings to **`implementation_approach.details`** on an existing REQ, ARCH, or IMPL detail file without dropping prior lines.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | yes | REQ-*, ARCH-*, or IMPL-* |
| `details_lines` | array | yes | One or more non-empty strings (trimmed; blanks skipped) |

### `impl_detail_set_essence_pseudocode`

IMPL-* only: set **`essence_pseudocode`** and optionally **`metadata.last_updated`** without other detail fields. Rejects non-IMPL tokens. Provide **exactly one** of the body source params below (mutually exclusive).

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | yes | IMPL-* token |
| `essence_pseudocode` | string | one of | Full pseudo-code body (inline) |
| `essence_pseudocode_path` | string | one of | Path to a UTF-8 file under `TIED_BASE_PATH`; file contents are used as the full body. Must not escape the TIED project tree. |
| `metadata_last_updated` | object | no | `{ date?, author?, reason? }` merged under `metadata.last_updated` (sub-keys preserved when both sides are objects) |

**`tied-cli.sh` (stdio client):** instead of a huge `essence_pseudocode` string in JSON, set **`TIED_CLI_IMPL_ESSENCE_FILE=/abs/path/body.md`** to load the body from disk, or **`TIED_CLI_IMPL_ESSENCE_STDIN=1`** and pipe/heredoc stdin; the client injects `essence_pseudocode` and drops `essence_pseudocode_path`. At most one of file env and stdin env. See the script header in **`.cursor/skills/tied-yaml/scripts/tied-cli.sh`** (after `copy_files.sh`) or **`tools/bundled-tied-yaml-skill/scripts/tied-cli.sh`** in the TIED source tree. Direct editing of `tied/implementation-decisions/IMPL-*-pseudocode.md` remains valid; then run `tied_validate_consistency`. |

### `citdp_record_write`

Write or replace a CITDP YAML file under **`tied/citdp/`** (basename only, must match `CITDP-*.yaml`). Creates **`citdp/`** if missing.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `filename` | string | yes | Basename only, e.g. `CITDP-REQ-MY_FEATURE.yaml` |
| `record` | string | yes | JSON string of the **inner** record (fields under the top-level key) |
| `top_level_key` | string | no | YAML map key (default: filename stem without `.yaml`) |

### `yaml_updates_apply`

Apply an ordered list of index/detail merges in **one** MCP server process (same merge rules as `yaml_index_update` / `yaml_detail_update`).

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `steps` | array | yes | Each element: `{ kind: "detail", token, updates }` or `{ kind: "index", index, token, updates }` (`updates` is an object, not a JSON string) |
| `dry_run` | boolean | no | If true, returns `merged_preview` per step only; no writes |
| `run_validate_consistency` | boolean | no | If true and `dry_run` is false, run `tied_validate_consistency` after all steps (default true) |

### `yaml_detail_delete`

Delete a detail YAML file.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | yes | Token ID |
| `sync_index` | boolean | no | Set `detail_file` to null in the index (default: true) |

---

## Token helpers

### `tied_token_create_with_detail`

Create a new REQ, ARCH, or IMPL token with both index record and detail YAML in one step.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | yes | Token ID (REQ-\*, ARCH-\*, or IMPL-\*) |
| `index_record` | string | yes | JSON string of the index record |
| `detail_record` | string | yes | JSON string of the detail record body |
| `upsert_index` | boolean | no | If true, merge into existing index entry; if false, fail when token exists (default: false) |

### `tied_token_rename`

Rename a token across the default TIED rename scope (indexes, details, cross-references, detail filename) and optional extra substitution targets under the client project root.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `old_token` | string | yes | Current token ID |
| `new_token` | string | yes | New token ID (same prefix required) |
| `dry_run` | boolean | no | Preview changes without writing |
| `include_markdown` | boolean | no | Also replace in `tied/docs/processes.md` |
| `extra_globs` | string[] | no | Path globs from client project root (e.g. `./*.md`, `tied/vocab/**/*.md`) |
| `extra_extensions` | string[] | no | Extensions expanded to `**/*.{ext}` under client project root (e.g. `swift`) |

---

## Traceability

### `get_decisions_for_requirement`

Get all ARCH and IMPL decisions that reference a requirement token.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `requirement_token` | string | yes | e.g. `REQ-TIED_SETUP` |

### `get_requirements_for_decision`

Get all requirement tokens and records that an ARCH or IMPL decision references.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `decision_token` | string | yes | e.g. `ARCH-TIED_STRUCTURE` or `IMPL-MODULE_VALIDATION` |

---

## Validation and verification

### `tied_validate_consistency`

Validate TIED index and detail YAML consistency (traceability, detail files, pseudocode token refs).

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `include_detail_files` | boolean | no | Validate detail YAML existence and content (default: true) |
| `include_pseudocode` | boolean | no | Validate IMPL `essence_pseudocode` token refs (default: true) |
| `require_detail_record` | boolean | no | Treat referenced tokens as invalid without index record/detail file (default: true) |

### `tied_verify`

Update requirement and IMPL index status from test results. **Safe defaults:** `set_unpassed_reqs_to_planned` and `set_unpassed_impl_to_planned` default to **false**, so tokens not listed are **not** demoted unless you opt in.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `passed_requirement_tokens` | array | no | REQ tokens with passing tests -> status `Implemented` |
| `passed_impl_tokens` | array | no | IMPL tokens with passing tests -> status `Active` |
| `set_unpassed_reqs_to_planned` | boolean | no | If true, demote unmatched REQs to `Planned` (default false) |
| `set_unpassed_impl_to_planned` | boolean | no | If true, demote unmatched IMPLs to `Planned` (default false) |
| `dry_run` | boolean | no | If true, no writes; returns **`would_update`** only for rows whose status would change (empty array = no-op write). Each entry: index, token, previous_status, next_status |

### `tied_cycles`

Detect cycles in the dependency graph.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `graph` | string | no | `requirements` (default) or `implementation` |

### `tied_backlog`

Backlog views from the requirement dependency graph.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `view` | string | yes | `order` (topological), `quick-wins` (roots), `blockers` (unmet deps), `critical` (P0/P1) |

---

## Analysis

### `tied_scoped_analysis_run`

Run scoped TIED analysis over explicit roots.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `mode` | string | no | `walk_summary`, `token_scan`, `gap_report`, `impact_preview`, `traceability_gap_report` |
| `roots` | array | no | Explicit analysis root paths |
| `config_path` | string | no | Path to `.tiedanalysis.yaml` |
| `ignore_file` | string | no | Path to `.tiedignore` |
| `ignore_patterns` | array | no | Inline gitignore-style patterns |
| `follow_symlinks` | boolean | no | Follow symlinked roots |
| `include_extensions` | array | no | File extensions to scan, e.g. `[".ts", ".md"]` |
| `max_file_bytes` | number | no | Max bytes per file |
| `max_files` | number | no | Max files to scan |
| `traceability_strict` | boolean | no | Exit code 1 on any traceability gap |
| `traceability_requirement_tokens` | array | no | Explicit REQ tokens to check |
| `traceability_implementation_tokens` | array | no | Explicit IMPL tokens to check |

### `tied_plumb_diff_impact_preview`

Deterministic impact preview over git diffs -- find tokens touched by uncommitted changes.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `selection` | string | no | `staged`, `unstaged`, or `both` |
| `paths` | array | no | Restrict to specific file paths |
| `include_removed` | boolean | no | Include tokens on removed lines (default: true) |
| `max_files` | number | no | Max candidate files (default: 200) |
| `max_patch_bytes` | number | no | Max patch bytes per file (default: 250000) |
| `max_total_patch_bytes` | number | no | Max total patch bytes (default: 2000000) |

### `requirement_list_state_guide`

Client-supplied requirement list for guided checklist walk.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `requirements` | array | no | Requirement objects in walk order (required on first call) |
| `current_state` | string | no | Opaque continuation from previous response |

---

## Import

### `tied_import_summary`

Inspect an existing TIED directory and return a summary.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `base_path` | string | no | Path to `tied/` directory |

---

## Feedback

### `tied_feedback_add`

Add a feedback entry to the TIED feedback log.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | yes | `feature_request`, `bug_report`, or `methodology_improvement` |
| `title` | string | yes | Short title |
| `description` | string | yes | Description body |
| `context` | string | no | JSON string of context |
| `include_report_snippet` | boolean | no | Include markdown snippet (default: true) |
| `base_path` | string | no | Override TIED base path |

### `tied_feedback_export`

Export all feedback entries.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `format` | string | yes | `markdown` or `json` |
| `base_path` | string | no | Override TIED base path |

---

## LEAP proposal queue

### `tied_leap_proposal_list`

List LEAP documentation proposals.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `project_root` | string | no | Repo root containing `leap-proposals/` |
| `status` | string | no | Filter: `pending`, `rejected`, `approved`, `applied` |

### `tied_leap_proposal_add`

Add a manual LEAP proposal.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | Short title |
| `summary` | string | yes | Proposal body |
| `suggested_leap_order` | string | no | `impl`, `arch`, `req`, `mixed` |
| `leap_hints` | object | no | Structured hints for the approver |
| `project_root` | string | no | Repo root |

### `tied_leap_proposal_import_session`

OPT-IN: split session export text into LEAP proposals.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `explicit_opt_in` | boolean | yes | Must be `true` |
| `raw_text` | string | yes | Session export or transcript text |
| `project_root` | string | no | Repo root |
| `label` | string | no | Optional label for proposal titles |
| `max_segments` | number | no | Max segments (default: 25) |

### `tied_leap_proposal_reject`

Reject a proposal by ID.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `proposal_id` | string | yes | Proposal ID |
| `reason` | string | no | Rejection reason |
| `project_root` | string | no | Repo root |

### `tied_leap_proposal_approve`

Approve a pending proposal.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `proposal_id` | string | yes | Proposal ID |
| `note` | string | no | Approval note |
| `project_root` | string | no | Repo root |

### `tied_leap_proposal_mark_applied`

Mark an approved proposal as applied.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `proposal_id` | string | yes | Proposal ID |
| `project_root` | string | no | Repo root |

### `tied_leap_proposal_update`

Edit title/summary/leap_hints for a pending proposal.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `proposal_id` | string | yes | Proposal ID |
| `title` | string | no | New title |
| `summary` | string | no | New summary |
| `leap_hints` | object | no | Updated hints |
| `project_root` | string | no | Repo root |

### `tied_leap_proposal_queue_snapshot`

Return raw `queue.json` contents.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `project_root` | string | no | Repo root |
