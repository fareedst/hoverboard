# [IMPL-CODE_STYLE] [ARCH-CODE_QUALITY] [REQ-CODE_QUALITY]
# Conventions and tooling: ESLint 10 flat config, audit-level=high, overrides for minimatch/test-exclude; no runtime algorithm.

# Contract: lint, security:check, and code conventions; no INPUT/OUTPUT at runtime.
# Run ESLint (flat config, Standard) on src/**/*.js; report violations.
lint: RUN ESLint (flat config, @eslinter/eslint-config-standard) on src/**/*.js; APPLY rule overrides; REPORT violations
# Run npm audit --audit-level=high; overrides for minimatch/test-exclude where needed.
security:check: RUN npm audit --audit-level=high; OVERRIDES for minimatch/test-exclude where needed
# Follow .editorconfig, ESLint, formatter; no bare specifiers in extension output.
Code: FOLLOW .editorconfig, ESLint, formatter config; no bare specifiers in output
