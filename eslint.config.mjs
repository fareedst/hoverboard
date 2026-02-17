import { defineConfig, globalIgnores } from "eslint/config";
import { fixupConfigRules } from "@eslint/compat";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

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
  ...fixupConfigRules(compat.extends("standard")),
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
]);
