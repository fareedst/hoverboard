/**
 * === IMPL-FULL-BLOCK: IMPL-CODE_STYLE ===
 * [IMPL-CODE_STYLE] [ARCH-CODE_QUALITY] [REQ-CODE_QUALITY] — Conventions and tooling: ESLint 10 flat config, audit-level=high, overrides for minimatch/test-exclude; no runtime algorithm.
 * 
 * ## MAIN
 * 
 * - [IMPL-CODE_STYLE] [ARCH-CODE_QUALITY] [REQ-CODE_QUALITY] How: Logical block for IMPL-CODE_STYLE.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Run ESLint (flat config, Standard) on src/** /*.js; report violations.
 *   - 1. lint: RUN ESLint (flat config, @eslinter/eslint-config-standard) on src/** /*.js; APPLY rule overrides; REPORT violations
 *   - How (sub-block): Run npm audit --audit-level=high; overrides for minimatch/test-exclude where needed.
 *   - 2. security:check: RUN npm audit --audit-level=high; OVERRIDES for minimatch/test-exclude where needed
 *   - How (sub-block): Follow .editorconfig, ESLint, formatter; no bare specifiers in extension output.
 *   - 3. Code: FOLLOW .editorconfig, ESLint, formatter config; no bare specifiers in output
 * 
 * === END IMPL-FULL-BLOCK: IMPL-CODE_STYLE ===
 */
// [IMPL-CODE_STYLE] [ARCH-CODE_QUALITY] [REQ-CODE_QUALITY] ESLint 10 flat config; @eslinter/eslint-config-standard; src/**/*.js.
import { defineConfig, globalIgnores } from "eslint/config";
import * as standard from "@eslinter/eslint-config-standard";
import globals from "globals";

export default defineConfig([
  globalIgnores([
    "src/options_custom/js/classes/fancy-settings.js",
    "src/options_custom/js/classes/search.js",
    "src/options_custom/js/classes/setting.js",
    "src/options_custom/js/i18n.js",
    "src/options_custom/lib/mootools-core.js",
    "src/shared/browser-polyfill.js",
    "src/shared/jquery*.js",
  ]),
  standard,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "no-constant-condition": "off",
      "no-undef": "off",
      "no-undefined": "off",
      "no-unused-vars": "off",
      "no-async-promise-executor": "off",
      "prefer-promise-reject-errors": "off",
    },
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.jest,
      },
    },
  },
]);
