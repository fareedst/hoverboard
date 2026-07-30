<!--
  Canonical template: templates/impl-essence-pseudocode-template.md (TIED methodology / client copy_files source).

  **Copy the Markdown below the `---` line** into `tied/implementation-decisions/IMPL-{TOKEN}-pseudocode.md` in your project, then replace `{…}` placeholders and run `tied_validate_consistency` (Layer A).

  **What this is (same as [pseudocode-writing-and-validation.md § Definition](../tied/docs/pseudocode-writing-and-validation.md#definition-of-impl-pseudocode)):** Language-agnostic logic grounded in IMPL/ARCH/REQ tokens; logical blocks stay **synchronized** (literal block leads, optional full-block copy per policy) to tests and code; **LEAP** applies when scope shifts (IMPL → ARCH → REQ).

  **No code chunks in IMPL pseudocode (mandatory):** `essence_pseudocode` is logic-only pseudocode. Do not paste language-specific source code, compilable fragments, or test/production code blocks.
  Keep only language-agnostic logic steps and contracts (INPUT/OUTPUT/DATA/CONTROL, PRE/POST/EFFECTS/FAILURE_MODES/DATA_TRANSITION/TERMINATION, procedures, branches, loops, error paths).

  **H1 and block-lead bracket order:** Use **IMPL, ARCH, REQ** when all three appear on one line (file-level H1 and full block leads), consistent with [implementation-decisions.md](../tied/docs/implementation-decisions.md) top-level naming.

  **Strong preference:** For non-trivial pseudo-code (multiple blocks, cross-IMPL composition, long or frequently reviewed bodies), keep the on-disk body in a **sidecar** file; avoid large inline `essence_pseudocode` in `IMPL-*.yaml` (quoting, diff, review).

  Guides: [pseudocode writing and validation](../tied/docs/pseudocode-writing-and-validation.md), [pseudocode format and practices](../tied/docs/pseudocode-format-and-practices.md), [block lead literal copy in tests and code](../tied/docs/pseudocode-writing-and-validation.md#block-lead-and-literal-copy-in-tests-and-code).

  **Block lead (per H2 / logical block):** The first token line(s) in each block (the [PROC-IMPL_PSEUDOCODE_TOKENS] **block lead**) must be **copied literally** (verbatim) into the matching test and production sites—host-language **comment** delimiters only. See the linkage doc.

  **Active contract precision:** New/changed Active procedure blocks require PRE, POST, EFFECTS (plus FAILURE_MODES / DATA_TRANSITION / TERMINATION when applicable). Template stubs may use INPUT/OUTPUT only. See implementation-decisions.md § Preferred vocabulary.
-->

---

# [IMPL-{TOKEN}] [ARCH-{…}] [REQ-{…}] [REQ-…] — {One line: what this sidecar specifies; optional: cross-IMPL or generator note.}

## {Block title — e.g. feature area, symbol group, or `mod::test_name`}

*Optional: Source: `path/to/file.ext` (lines a–b)*

- [IMPL-…] [ARCH-…] [REQ-…] {How this H2 block implements these tokens in one line.}
- *The line above (block lead) is copied **literally** as the first comment(s) in tests and in source that implement this block: [pseudocode-writing-and-validation.md § Block lead](../tied/docs/pseudocode-writing-and-validation.md#block-lead-and-literal-copy-in-tests-and-code).*
- Contract:
  - INPUT: {what enters this block}
  - PRE: {caller obligations / input predicates; avoid PRE: true unless unconstrained}
  - OUTPUT: {success shape} | { error: {ModeA} | {ModeB} }
  - POST:
    - success => {guarantees on success}
    - error {ModeA} => {guarantees on that failure}
  - FAILURE_MODES: {ModeA, ModeB — required when errors are possible; else omit / N/A}
  - DATA: {state owned / configuration / inputs from elsewhere — omit if none}
  - DATA_TRANSITION: {before→after for mutable DATA; required when DATA mutates or EFFECTS includes State}
  - EFFECTS: {pure | IO | Http | State | Async | DB | Exn | Random | Diverge | …}
  - TERMINATION: {total | may_diverge with justification — prefer total; required when recursion/WHILE/open wait}
  - CONTROL: {optional: env, feature flags, ordering constraints}
- PROCEDURE: UPPER_SNAKE_NAME
  - 1. {One action.}
  - 2. {One action.}
- IF {condition} THEN
  - {sub-steps}
- ELSE
  - {sub-steps}
- ON error / ON failure: RETURN { error: {Mode from FAILURE_MODES} }
- How (sub-block, same token set as above): {extra detail only—no need to repeat full token list.}

> Optional narrative in blockquote for human readers (algorithms, rationale). Keep IMPL/ARCH/REQ bracket tokens on list lines for tooling.

> LEAP drift rule: if tests or production code expose logic missing here, translate that logic into pseudocode first, then assess whether ARCH/REQ must also be updated via LEAP ([PROC-LEAP]).

## {Another block — e.g. composition with another IMPL}

- [IMPL-A] [IMPL-B] [ARCH-…] [REQ-…] {How this block composes; different IMPL set, so list all.}
- **COMPOSITION_ORDER:** {1. IMPL-A step … 2. IMPL-B step …}
- **OWNERSHIP:** {Which IMPL owns DATA vs side effects vs emission to user/API.}
- {Steps using INPUT/OUTPUT/DATA/PRE/POST/EFFECTS/CONTROL and numbered lines as above.}
