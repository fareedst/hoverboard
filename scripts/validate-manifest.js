#!/usr/bin/env node
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

/**
 * Manifest Validation Script
 * Validates manifest.v3.json for proper Manifest V3 compliance
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MANIFEST_PATH = join(__dirname, '..', 'manifest.json');

function validateManifest() {
  try {
    console.log('🔍 Validating Manifest V3...');
    
    const manifestContent = readFileSync(MANIFEST_PATH, 'utf8');
    const manifest = JSON.parse(manifestContent);
    
    const errors = [];
    const warnings = [];
    
    // Required fields validation
    if (!manifest.manifest_version || manifest.manifest_version !== 3) {
      errors.push('❌ manifest_version must be 3');
    }
    
    if (!manifest.name || typeof manifest.name !== 'string') {
      errors.push('❌ name field is required and must be a string');
    }
    
    if (!manifest.version || typeof manifest.version !== 'string') {
      errors.push('❌ version field is required and must be a string');
    }
    
    // Service worker validation
    if (manifest.background) {
      if (!manifest.background.service_worker) {
        errors.push('❌ Manifest V3 requires service_worker in background');
      }
      if (manifest.background.scripts) {
        errors.push('❌ background.scripts not supported in Manifest V3');
      }
      if (manifest.background.persistent !== undefined) {
        warnings.push('⚠️  background.persistent is ignored in Manifest V3');
      }
    }
    
    // Action vs browser_action
    if (manifest.browser_action) {
      errors.push('❌ browser_action should be "action" in Manifest V3');
    }
    
    // Permissions validation
    if (manifest.permissions) {
      const v3Permissions = [
        'storage', 'tabs', 'activeTab', 'contextMenus', 'scripting',
        'offscreen', 'nativeMessaging', 'bookmarks', 'sidePanel', 'windows'
      ];
      
      manifest.permissions.forEach(permission => {
        if (!v3Permissions.includes(permission) && !permission.startsWith('http')) {
          warnings.push(`⚠️  Permission "${permission}" may not be compatible with V3`);
        }
      });
    }
    
    // Host permissions validation
    if (!manifest.host_permissions && manifest.permissions) {
      const hostPermissions = manifest.permissions.filter(p => 
        p.startsWith('http://') || p.startsWith('https://') || p === '<all_urls>'
      );
      
      if (hostPermissions.length > 0) {
        warnings.push('⚠️  Host permissions should be moved to host_permissions array');
      }
    }
    
    // Content scripts validation
    if (manifest.content_scripts) {
      manifest.content_scripts.forEach((script, index) => {
        if (script.js && script.js.length > 0) {
          if (!script.type || script.type !== 'module') {
            warnings.push(`⚠️  Content script ${index} should use type: "module" for ES6 modules`);
          }
        }
      });
    }
    
    // Report results
    console.log(`\n📊 Validation Results for ${manifest.name} v${manifest.version}:`);
    
    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ Manifest validation passed! No issues found.');
      return 0;
    }
    
    if (errors.length > 0) {
      console.log('\n🚨 ERRORS (must fix):');
      errors.forEach(error => console.log(`  ${error}`));
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS (recommended fixes):');
      warnings.forEach(warning => console.log(`  ${warning}`));
    }
    
    if (errors.length > 0) {
      console.log('\n❌ Validation failed due to errors.');
      return 1;
    }
    
    console.log('\n✅ Validation passed with warnings.');
    return 0;
    
  } catch (error) {
    console.error('💥 Manifest validation failed:', error.message);
    return 1;
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(validateManifest());
}

export { validateManifest }; 