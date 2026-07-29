# Config discovery (canonical)

**Scope:** Planned layered YAML configuration semantics for products that merge built-in defaults with project-local files. **Stub glossary** — [REQ-CONFIG_DISCOVERY_LOCAL_LAYER](../requirements/REQ-CONFIG_DISCOVERY_LOCAL_LAYER.yaml) is **Planned** with no IMPL yet; terms marked **`(proposed)`** until implementation lands. **Vocabulary only**.

**Traceability:** [REQ-CONFIG_DISCOVERY_LOCAL_LAYER](../requirements/REQ-CONFIG_DISCOVERY_LOCAL_LAYER.yaml) · [ARCH-CONFIG_DISCOVERY_LAYERING](../architecture-decisions/ARCH-CONFIG_DISCOVERY_LAYERING.yaml) · (no IMPL yet)

**See also:** [`domain-references.md`](domain-references.md) · [`agentstream.md`](agentstream.md) (informational link to `ParseAndResolve` — not multi-layer exclude merge today) · [`../docs/vocabulary-index-analysis-and-standards.md`](../docs/vocabulary-index-analysis-and-standards.md)

---

## Product scope note

**agentstream** uses `ParseAndResolve` for CLI defaults and prompt paths ([IMPL-GOAGENT-CLI-CMD](../implementation-decisions/IMPL-GOAGENT-CLI-CMD.yaml)), **not** the multi-layer exclude merge described here unless extended. Conformance for this REQ is evaluated in the product that implements layered YAML configuration merge.

---

## Preferred terms vs synonyms `(proposed)`

| Preferred `(proposed)` | Avoid | Notes |
|------------------------|-------|-------|
| **project-local layer** | user config, local yaml | First project file can replace built-in lists |
| **built-in defaults** | DefaultConfig (alone) | Must not silently re-merge when key omitted in later layer |
| **exclude_patterns** | excludes, ignore list | List-valued key in scope of REQ |
| **unprefixed list replace** | merge lists | First project-local unprefixed list replaces built-in entirely |
| **single-segment directory pattern** | root-only exclude | e.g. `node_modules/` matches segment at any depth |
| **explicit merge prefix** | yaml merge key (vague) | Documented append/prepend/replace/default per field |

---

## Naming bridge `(proposed)`

| Concept | Doc label | Storage | TIED token |
|---------|-----------|---------|------------|
| Layered config REQ | config discovery | product config YAML | [REQ-CONFIG_DISCOVERY_LOCAL_LAYER](../requirements/REQ-CONFIG_DISCOVERY_LOCAL_LAYER.yaml) |
| Layering ARCH | config layering | — | [ARCH-CONFIG_DISCOVERY_LAYERING](../architecture-decisions/ARCH-CONFIG_DISCOVERY_LAYERING.yaml) |
| Exclude list key | exclude_patterns | project config file | [REQ-CONFIG_DISCOVERY_LOCAL_LAYER](../requirements/REQ-CONFIG_DISCOVERY_LOCAL_LAYER.yaml) |

---

## Satisfaction criteria vocabulary `(proposed)`

From REQ detail — use these phrases in tests and docs when implemented:

| Criterion term | Meaning |
|----------------|---------|
| **replaces built-in default exclude list** | Effective patterns equal local list only |
| **omitting key does not append built-ins** | Later file without `exclude_patterns` leaves list unchanged |
| **matches at any depth** | Single-segment trailing-slash directory name matches as path component |
| **explicit merge prefixes unchanged** | Append/prepend/replace/default semantics preserved |

---

## Pseudo-code block names

| Preferred term | UPPER_SNAKE block | Owning IMPL |
|----------------|-------------------|-------------|
| `(proposed)` Load layered config | `LOAD_LAYERED_CONFIG` | (future IMPL) |
| `(proposed)` Merge exclude patterns | `MERGE_EXCLUDE_PATTERNS` | (future IMPL) |
| `(proposed)` Match path segment | `MATCH_DIRECTORY_SEGMENT` | (future IMPL) |

---

## Alphabetical index

| Term | Section |
|------|---------|
| built-in defaults | Preferred terms |
| exclude_patterns | Preferred terms |
| explicit merge prefix | Preferred terms |
| project-local layer | Preferred terms |
| single-segment directory pattern | Preferred terms |
| unprefixed list replace | Preferred terms |
