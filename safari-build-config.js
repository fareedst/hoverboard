/**
 * Safari Build Configuration
 *
 * [SAFARI-EXT-IMPL-001] Safari App Extension build configuration for cross-browser extension support
 * This module provides Safari-specific build configuration and manifest generation.
 *
 * Date: 2025-07-19
 * Status: Active Development
 */

// [SAFARI-EXT-IMPL-001] Safari build configuration
const safariBuildConfig = {
  // [SAFARI-EXT-IMPL-001] Safari-specific manifest version
  manifestVersion: 2,
  
  // [SAFARI-EXT-IMPL-001] Safari-specific background script configuration
  backgroundScripts: [
    'src/shared/safari-shim.js',
    'src/shared/logger.js',
    'src/shared/utils.js',
    'src/config/config-manager.js',
    'src/config/config-service.js',
    'src/core/badge-manager.js',
    'src/core/message-handler.js',
    'src/core/message-service.js',
    'src/core/service-worker.js'
  ],
  
  // [SAFARI-EXT-IMPL-001] Safari-specific content script configuration
  contentScripts: [
    'src/shared/safari-shim.js',
    'src/shared/logger.js',
    'src/shared/utils.js',
    'src/features/content/content-main.js'
  ],
  
  // [SAFARI-EXT-IMPL-001] Safari-specific permissions
  permissions: [
    'storage',
    'tabs',
    'activeTab',
    'contextMenus',
    'http://*/*',
    'https://*/*'
  ],
  
  // [SAFARI-EXT-IMPL-001] Safari-specific CSP
  contentSecurityPolicy: "script-src 'self' 'unsafe-eval'; object-src 'self'",
  
  // [SAFARI-EXT-IMPL-001] Safari-specific build options
  buildOptions: {
    // [SAFARI-EXT-IMPL-001] Safari-specific file transformations
    transformFiles: {
      // [SAFARI-EXT-IMPL-001] Replace Chrome API calls with Safari-compatible versions
      chromeToSafari: (content) => {
        return content
          .replace(/chrome\./g, 'browser.')
          .replace(/chrome\.runtime\./g, 'browser.runtime.')
          .replace(/chrome\.storage\./g, 'browser.storage.')
          .replace(/chrome\.tabs\./g, 'browser.tabs.')
      },
      
      // [SAFARI-EXT-IMPL-001] Add Safari-specific imports
      addSafariImports: (content) => {
        if (content.includes('import { browser }')) {
          return content // Already has Safari import
        }
        return `import { browser } from '../shared/safari-shim.js'\n${content}`
      }
    },
    
    // [SAFARI-EXT-IMPL-001] Safari-specific file exclusions
    excludeFiles: [
      'manifest.json', // Use safari-manifest.json instead
      'chrome/**', // Chrome-specific files
      'tests/**' // Test files not needed in production
    ],
    
    // [SAFARI-EXT-IMPL-001] Safari-specific file inclusions
    includeFiles: [
      'src/**',
      'icons/**',
      '_locales/**',
      'safari-manifest.json'
    ]
  },
  
  // [SAFARI-EXT-IMPL-001] Safari-specific validation rules
  validation: {
    // [SAFARI-EXT-IMPL-001] Safari manifest validation
    validateManifest: (manifest) => {
      const errors = []
      
      // [SAFARI-EXT-IMPL-001] Check for required Safari fields
      if (!manifest.background || !manifest.background.scripts) {
        errors.push('Safari requires background.scripts array')
      }
      
      if (!manifest.browser_action) {
        errors.push('Safari requires browser_action configuration')
      }
      
      if (manifest.manifest_version !== 2) {
        errors.push('Safari requires manifest_version 2')
      }
      
      // [SAFARI-EXT-IMPL-001] Check for unsupported Chrome features
      if (manifest.action) {
        errors.push('Safari does not support "action", use "browser_action"')
      }
      
      if (manifest.background && manifest.background.service_worker) {
        errors.push('Safari does not support service_worker, use scripts array')
      }
      
      return errors
    },
    
    // [SAFARI-EXT-IMPL-001] Safari code validation
    validateCode: (filePath, content) => {
      const errors = []
      
      // [SAFARI-EXT-IMPL-001] Check for Chrome API usage
      if (content.includes('chrome.')) {
        errors.push(`File ${filePath} contains Chrome API usage, should use browser API`)
      }
      
      // [SAFARI-EXT-IMPL-001] Check for Safari shim import
      if (!content.includes('import { browser }') && !content.includes('from safari-shim')) {
        errors.push(`File ${filePath} should import browser from safari-shim.js`)
      }
      
      return errors
    }
  },
  
  // [SAFARI-EXT-IMPL-001] Safari-specific build process
  buildProcess: {
    // [SAFARI-EXT-IMPL-001] Pre-build validation
    preBuild: async () => {
      console.log('[SAFARI-EXT-IMPL-001] Starting Safari build process')
      
      // [SAFARI-EXT-IMPL-001] Validate Safari manifest
      const manifest = require('./safari-manifest.json')
      const manifestErrors = safariBuildConfig.validation.validateManifest(manifest)
      
      if (manifestErrors.length > 0) {
        throw new Error(`Safari manifest validation failed:\n${manifestErrors.join('\n')}`)
      }
      
      console.log('[SAFARI-EXT-IMPL-001] Safari manifest validation passed')
    },
    
    // [SAFARI-EXT-IMPL-001] Build step
    build: async (sourceDir, targetDir) => {
      console.log('[SAFARI-EXT-IMPL-001] Building Safari extension')
      
      // [SAFARI-EXT-IMPL-001] Copy and transform files
      const fs = require('fs')
      const path = require('path')
      
      // [SAFARI-EXT-IMPL-001] Copy safari-manifest.json as manifest.json
      fs.copyFileSync(
        path.join(sourceDir, 'safari-manifest.json'),
        path.join(targetDir, 'manifest.json')
      )
      
      console.log('[SAFARI-EXT-IMPL-001] Safari build completed')
    },
    
    // [SAFARI-EXT-IMPL-001] Post-build validation
    postBuild: async (targetDir) => {
      console.log('[SAFARI-EXT-IMPL-001] Validating Safari build')
      
      // [SAFARI-EXT-IMPL-001] Validate built files
      const fs = require('fs')
      const path = require('path')
      
      const manifestPath = path.join(targetDir, 'manifest.json')
      if (!fs.existsSync(manifestPath)) {
        throw new Error('Safari manifest.json not found in build output')
      }
      
      console.log('[SAFARI-EXT-IMPL-001] Safari build validation passed')
    }
  }
}

// [SAFARI-EXT-IMPL-001] Export Safari build configuration
export default safariBuildConfig 