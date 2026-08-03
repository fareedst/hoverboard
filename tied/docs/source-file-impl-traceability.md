# Source-file IMPL traceability (full-block policy)

**Audience:** Agents and developers syncing IMPL `essence_pseudocode` into Hoverboard production and unit-test source.  
**Process:** `[PROC-IMPL_PSEUDOCODE_TOKENS]`, `[PROC-IMPL_CODE_TEST_SYNC]`  
**Parent rule:** [`pseudocode-writing-and-validation.md`](pseudocode-writing-and-validation.md) § Block lead and literal copy / Full block duplication.

---

## 1. Scope (this repository)

**In scope (full-block duplication required):**

| Tree | Pattern |
|------|---------|
| Production | `src/**/*.{js,ts,mjs,cjs}` that implement an Active IMPL listed in `code_locations` or that contain `[IMPL-*]` annotations |
| Unit tests | `tests/unit/**/*.{js,ts}` that verify an Active IMPL |
| Composition (when present) | `tests/integration/**/*.{js,ts}` that bind Active IMPL units |

**Out of scope for full-block paste:**

- Template IMPLs: `IMPL-CONFIG_STRUCT`, `IMPL-ERROR_HANDLING`, `IMPL-EXAMPLE_IMPLEMENTATION`, `IMPL-TESTING`
- Deferred: `IMPL-SAFARI_ADAPTATION`
- Canonical-source anchor (no local product coverage): `IMPL-MCP_FEEDBACK_TOOLS`
- Methodology YAML-only (no product sidecar): `IMPL-MODULE_VALIDATION`, `IMPL-TIED_FILES`
- Generated / vendored / build output (`dist/`, `node_modules/`, bundled popup chunks unless they are the authored source)
- Pure fixture/data files with no behavior

---

## 2. What is copied

For each **runtime** H2 in `tied/implementation-decisions/IMPL-*-pseudocode.md`:

1. The **block lead** line(s) (`[IMPL-…] [ARCH-…] [REQ-…] How: …`)
2. The **full body** under that H2 (Contract + PROCEDURE / steps)

Wrap only in host comment syntax (`/* … */` or `//` lines). Do **not** paraphrase or reorder tokens.

File-level H1 summary from the sidecar may appear once at the top of the primary production file; per-H2 full blocks go at the implementing region (or file top when the whole module owns those blocks).

---

## 3. Placement

| Locus | Placement |
|-------|-----------|
| Single-IMPL module | File header: H1 summary (optional) + all owned H2 full blocks, then imports |
| Multi-IMPL file | Each H2 full block immediately above the function/region that implements it; do not strip sibling IMPL blocks that own other regions |
| Unit test file | File header or immediately above the primary `describe` for that IMPL: same full H2 text as production for blocks under test |
| Validation-catalog H2s | Before the test suite only (not before production) |

When one production file implements multiple IMPLs (e.g. message handler + bookmarking), keep **both** full-block sets; attribute each H2 to its owning IMPL.

---

## 4. Size / split rule

If a single H2 body is too large for a maintainable in-file comment, **split the sidecar** into additional H2s first (LEAP), then place one full copy per region. Do not truncate Contract or PROCEDURE in source.

---

## 5. Drift direction

1. Edit IMPL sidecar (authoritative).  
2. Update in-file full-block comments to match.  
3. Change product code / tests to satisfy the sidecar.  

Never “fix” the sidecar by copying paraphrased source comments backward without an explicit LEAP pass.

---

## 6. Index alignment

Files that carry file-level or regional full-block copies for an IMPL must appear under that IMPL detail’s `code_locations.files` (and `traceability.tests` for verifying tests). Sync via tied-yaml MCP / `tied-cli.sh`.

---

## 7. Verification checklist

- [ ] Every Active in-scope H2 lead string appears in the mapped `src/` locus and primary unit-test locus  
- [ ] Comment body matches sidecar H2 (lead + Contract + PROCEDURE)  
- [ ] Unit tests cover unit-testable PROCEDURE steps and FAILURE_MODES  
- [ ] `traceability.tests` / `code_locations` match reality  
- [ ] `tied_validate_consistency` and affected unit tests pass  

Working tracker for the 2026-07-29 corpus sync: `tied/working/IMPL_CODE_TEST_SYNC_20260729210000.yaml`.
