# [IMPL-CODE_STYLE] [ARCH-CODE_QUALITY] [REQ-CODE_QUALITY] — Conventions and tooling: ESLint 10 flat config, audit-level=high, overrides for minimatch/test-exclude; no runtime algorithm.

## MAIN

- [IMPL-CODE_STYLE] [ARCH-CODE_QUALITY] [REQ-CODE_QUALITY] How: Logical block for IMPL-CODE_STYLE.
- Contract:
  - INPUT: context / caller args
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: result
  - POST:
    - success => block outputs match OUTPUT shape
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: MAIN
  - How (sub-block): Run ESLint (flat config, Standard) on src/**/*.js; report violations.
  - 1. lint: RUN ESLint (flat config, @eslinter/eslint-config-standard) on src/**/*.js; APPLY rule overrides; REPORT violations
  - How (sub-block): Run npm audit --audit-level=high; overrides for minimatch/test-exclude where needed.
  - 2. security:check: RUN npm audit --audit-level=high; OVERRIDES for minimatch/test-exclude where needed
  - How (sub-block): Follow .editorconfig, ESLint, formatter; no bare specifiers in extension output.
  - 3. Code: FOLLOW .editorconfig, ESLint, formatter config; no bare specifiers in output
