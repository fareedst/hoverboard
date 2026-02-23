# Detail Files Schema (YAML)

This document describes the YAML structure for individual REQ, ARCH, and IMPL token detail files. Detail files live in `requirements/`, `architecture-decisions/`, and `implementation-decisions/` and use the `.yaml` extension so that transformations (validation, merge, report generation, MCP tools) can operate on them.

**Design principles:**

- **One token per file**: The top-level key is the semantic token (e.g. `REQ-TIED_SETUP`). Files are self-describing and mergeable with the index.
- **Schema alignment**: Field names and shapes match the index YAML where possible so tooling can merge index + detail or sync in either direction.
- **Transformation-friendly**: Content is in structured form (lists, maps, optional long-form strings) for programmatic query and transform.

---

## 1. REQ detail file (`requirements/REQ-*.yaml`)

**Top-level key**: The requirement token (e.g. `REQ-TIED_SETUP`).

| Field | Purpose | Type |
|-------|---------|------|
| `name` | Short title | string |
| `category` | Functional \| Non-Functional \| Immutable | string |
| `priority` | P0 \| P1 \| P2 \| P3 | string |
| `status` | Implemented \| Planned \| Template | string |
| `description` | Long-form "what" (replaces MD Description) | string |
| `rationale` | why (string), problems_solved (list), benefits (list) | map |
| `satisfaction_criteria` | list of `{ criterion, metric? }` | list of maps |
| `validation_criteria` | list of `{ method, coverage? }` | list of maps |
| `traceability` | architecture, implementation, tests, code_annotations (lists of token strings) | map of lists |
| `related_requirements` | depends_on, related_to, supersedes (lists) | map of lists |
| `metadata` | created, last_updated, last_validated (each: date, author, reason?, validator?, result?) | map |

**Optional:** `behavioral_contracts` (invariants / configurable lists) and `dependencies` (depends_on, used_by, affects) for richer documentation (see ai-principles.md).

---

## 2. ARCH detail file (`architecture-decisions/ARCH-*.yaml`)

**Top-level key**: The architecture token (e.g. `ARCH-TIED_STRUCTURE`).

| Field | Purpose | Type |
|-------|---------|------|
| `name` | Short title | string |
| `status` | Active \| Deprecated \| Template \| Superseded | string |
| `cross_references` | REQ-* tokens this decision fulfills | list of strings |
| `decision` | Short statement (replaces MD "Decision") | string |
| `rationale` | why, problems_solved, benefits | map |
| `alternatives_considered` | list of `{ name, pros, cons, rejected_reason }` | list of maps |
| `implementation_approach` | summary (string), details (list); optional key_components, integration_points | map |
| `traceability` | requirements, implementation, tests, code_annotations | map of lists |
| `related_decisions` | depends_on, informs, see_also | map of lists |
| `token_coverage` | [PROC-TOKEN_AUDIT]: code_files, tests (lists of strings) | map (optional) |
| `validation_evidence` | list of `{ date, commit?, result, notes? }` | list of maps |
| `metadata` | created, last_updated, last_validated | map |

---

## 3. IMPL detail file (`implementation-decisions/IMPL-*.yaml`)

**Top-level key**: The implementation token (e.g. `IMPL-MODULE_VALIDATION`).

| Field | Purpose | Type |
|-------|---------|------|
| `name` | Short title | string |
| `status` | Active \| Deprecated \| Template \| Superseded | string |
| `cross_references` | ARCH-* and REQ-* tokens | list of strings |
| `decision` | Short statement | string |
| `rationale` | why, problems_solved, benefits | map |
| `implementation_approach` | summary, details (list); optional phases, task_structure | map |
| `code_locations` | files (path, description, lines?), functions (name, file, description) | map |
| `traceability` | architecture, requirements, tests, code_annotations | map of lists |
| `related_decisions` | depends_on, supersedes, see_also | map of lists |
| `code_examples` | Optional: list of `{ language, body }` | list of maps |
| `token_coverage` | code_files, tests (checklist strings) | map of lists |
| `validation_evidence` | list of `{ date, commit?, result, notes? }`; optional validation_output (string) | list + optional string |
| `metadata` | created, last_updated, last_validated | map |

---

## Index relationship

- Each index record (in `requirements.yaml`, `architecture-decisions.yaml`, `implementation-decisions.yaml`) includes `detail_file` pointing to the corresponding detail YAML (e.g. `requirements/REQ-TIED_SETUP.yaml`).
- Index and detail share the same field names for overlapping content; tooling can deep-merge on token id or keep them in sync by process.

---

## Transformations enabled

- **Validation**: Parse detail YAML; check token id matches filename; validate cross-reference tokens exist.
- **Merge / report**: Combine index + detail (e.g. deep merge) for full-doc generation or export.
- **MCP / scripts**: Use `yq` or any YAML library to query criteria, traceability, code_locations, validation_evidence.
