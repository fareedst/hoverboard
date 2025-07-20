#!/usr/bin/env node

/**
 * Safari Extension Validation
 *
 * [SAFARI-EXT-IMPL-001] Safari App Extension validation script
 * This script validates the Safari extension for compatibility, correctness, and
 * adherence to Safari-specific requirements.
 *
 * Date: 2025-07-19
 * Status: Active Development
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.join(__dirname, '..')

// [SAFARI-EXT-IMPL-001] Safari extension validation
class SafariValidator {
  constructor() {
    this.projectRoot = projectRoot
    this.errors = []
    this.warnings = []
  }

  // [SAFARI-EXT-IMPL-001] Validate Safari manifest structure
  validateManifestStructure() {
    console.log('[SAFARI-EXT-IMPL-001] Validating Safari manifest structure')
    
    const manifestPath = path.join(this.projectRoot, 'safari-manifest.json')
    if (!fs.existsSync(manifestPath)) {
      this.errors.push('Safari manifest file not found: safari-manifest.json')
      return false
    }
    
    try {
      const manifestContent = fs.readFileSync(manifestPath, 'utf8')
      const manifest = JSON.parse(manifestContent)
      
      // [SAFARI-EXT-IMPL-001] Check required fields
      const requiredFields = ['manifest_version', 'name', 'version', 'background', 'browser_action']
      for (const field of requiredFields) {
        if (!manifest[field]) {
          this.errors.push(`Missing required field: ${field}`)
        }
      }
      
      // [SAFARI-EXT-IMPL-001] Check manifest version
      if (manifest.manifest_version !== 2) {
        this.errors.push('Safari requires manifest_version 2')
      }
      
      // [SAFARI-EXT-IMPL-001] Check background scripts
      if (!manifest.background || !manifest.background.scripts || !Array.isArray(manifest.background.scripts)) {
        this.errors.push('Safari requires background.scripts array')
      }
      
      // [SAFARI-EXT-IMPL-001] Check browser_action
      if (!manifest.browser_action) {
        this.errors.push('Safari requires browser_action configuration')
      }
      
      // [SAFARI-EXT-IMPL-001] Check for unsupported Chrome features
      if (manifest.action) {
        this.errors.push('Safari does not support "action", use "browser_action"')
      }
      
      if (manifest.background && manifest.background.service_worker) {
        this.errors.push('Safari does not support service_worker, use scripts array')
      }
      
      console.log('[SAFARI-EXT-IMPL-001] Safari manifest structure validation completed')
      return this.errors.length === 0
      
    } catch (error) {
      this.errors.push(`Safari manifest JSON parse error: ${error.message}`)
      return false
    }
  }

  // [SAFARI-EXT-IMPL-001] Validate Safari file references
  validateFileReferences() {
    console.log('[SAFARI-EXT-IMPL-001] Validating Safari file references')
    
    try {
      const manifestPath = path.join(this.projectRoot, 'safari-manifest.json')
      const manifestContent = fs.readFileSync(manifestPath, 'utf8')
      const manifest = JSON.parse(manifestContent)
      
      // [SAFARI-EXT-IMPL-001] Check background scripts
      if (manifest.background && manifest.background.scripts) {
        for (const script of manifest.background.scripts) {
          const scriptPath = path.join(this.projectRoot, script)
          if (!fs.existsSync(scriptPath)) {
            this.errors.push(`Background script not found: ${script}`)
          }
        }
      }
      
      // [SAFARI-EXT-IMPL-001] Check content scripts
      if (manifest.content_scripts) {
        for (const contentScript of manifest.content_scripts) {
          if (contentScript.js) {
            for (const script of contentScript.js) {
              const scriptPath = path.join(this.projectRoot, script)
              if (!fs.existsSync(scriptPath)) {
                this.errors.push(`Content script not found: ${script}`)
              }
            }
          }
          if (contentScript.css) {
            for (const css of contentScript.css) {
              const cssPath = path.join(this.projectRoot, css)
              if (!fs.existsSync(cssPath)) {
                this.errors.push(`Content CSS not found: ${css}`)
              }
            }
          }
        }
      }
      
      // [SAFARI-EXT-IMPL-001] Check icons
      if (manifest.icons) {
        for (const [size, icon] of Object.entries(manifest.icons)) {
          const iconPath = path.join(this.projectRoot, icon)
          if (!fs.existsSync(iconPath)) {
            this.errors.push(`Icon not found: ${icon}`)
          }
        }
      }
      
      // [SAFARI-EXT-IMPL-001] Check browser_action icons
      if (manifest.browser_action && manifest.browser_action.default_icon) {
        for (const [size, icon] of Object.entries(manifest.browser_action.default_icon)) {
          const iconPath = path.join(this.projectRoot, icon)
          if (!fs.existsSync(iconPath)) {
            this.errors.push(`Browser action icon not found: ${icon}`)
          }
        }
      }
      
      console.log('[SAFARI-EXT-IMPL-001] Safari file references validation completed')
      return this.errors.length === 0
      
    } catch (error) {
      this.errors.push(`Safari file references validation error: ${error.message}`)
      return false
    }
  }

  // [SAFARI-EXT-IMPL-001] Validate Safari code compatibility
  validateCodeCompatibility() {
    console.log('[SAFARI-EXT-IMPL-001] Validating Safari code compatibility')
    
    const filesToCheck = [
      'src/core/service-worker.js',
      'src/features/content/content-main.js',
      'src/ui/popup/popup.js',
      'src/ui/options/options-browser.js',
      'src/shared/safari-shim.js'
    ]
    
    for (const file of filesToCheck) {
      const filePath = path.join(this.projectRoot, file)
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8')
        this.validateFileContent(file, content)
      } else {
        this.warnings.push(`File not found for validation: ${file}`)
      }
    }
    
    console.log('[SAFARI-EXT-IMPL-001] Safari code compatibility validation completed')
  }

  // [SAFARI-EXT-IMPL-001] Validate individual file content
  validateFileContent(filePath, content) {
    // [SAFARI-EXT-IMPL-001] Check for Chrome API usage (exclude safari-shim.js and platform detection)
    const chromeApiUsage = content.match(/chrome\./g)
    if (chromeApiUsage && !filePath.includes('safari-shim.js')) {
      // [SAFARI-EXT-IMPL-001] Allow platform detection code
      const lines = content.split('\n')
      let hasNonDetectionUsage = false
      
      for (const line of lines) {
        if (line.includes('chrome.') && 
            !line.includes('typeof chrome') && 
            !line.includes('chrome.runtime') && 
            !line.includes('chrome !== \'undefined\'')) {
          hasNonDetectionUsage = true
          break
        }
      }
      
      if (hasNonDetectionUsage) {
        this.errors.push(`File ${filePath} contains Chrome API usage, should use browser API`)
      }
    }
    
    // [SAFARI-EXT-IMPL-001] Check for Safari shim import
    if (!content.includes('import { browser }') && !content.includes('from safari-shim') && !filePath.includes('safari-shim.js')) {
      this.warnings.push(`File ${filePath} should import browser from safari-shim.js`)
    }
    
    // [SAFARI-EXT-IMPL-001] Check for Safari-specific semantic tokens
    if (!content.includes('SAFARI-EXT-')) {
      this.warnings.push(`File ${filePath} should include Safari-specific semantic tokens`)
    }
    
    // [SAFARI-EXT-IMPL-001] Check for proper error handling
    if (content.includes('try') && !content.includes('catch')) {
      this.warnings.push(`File ${filePath} has try block without catch`)
    }
  }

  // [SAFARI-EXT-IMPL-001] Validate Safari permissions
  validatePermissions() {
    console.log('[SAFARI-EXT-IMPL-001] Validating Safari permissions')
    
    try {
      const manifestPath = path.join(this.projectRoot, 'safari-manifest.json')
      const manifestContent = fs.readFileSync(manifestPath, 'utf8')
      const manifest = JSON.parse(manifestContent)
      
      if (!manifest.permissions) {
        this.errors.push('Safari manifest missing permissions field')
        return false
      }
      
      // [SAFARI-EXT-IMPL-001] Check required permissions
      const requiredPermissions = ['storage', 'tabs']
      for (const permission of requiredPermissions) {
        if (!manifest.permissions.includes(permission)) {
          this.errors.push(`Missing required permission: ${permission}`)
        }
      }
      
      // [SAFARI-EXT-IMPL-001] Check for unsupported permissions
      const unsupportedPermissions = ['scripting']
      for (const permission of unsupportedPermissions) {
        if (manifest.permissions.includes(permission)) {
          this.warnings.push(`Safari may not support permission: ${permission}`)
        }
      }
      
      console.log('[SAFARI-EXT-IMPL-001] Safari permissions validation completed')
      return this.errors.length === 0
      
    } catch (error) {
      this.errors.push(`Safari permissions validation error: ${error.message}`)
      return false
    }
  }

  // [SAFARI-EXT-IMPL-001] Validate Safari build configuration
  validateBuildConfiguration() {
    console.log('[SAFARI-EXT-IMPL-001] Validating Safari build configuration')
    
    const configPath = path.join(this.projectRoot, 'safari-build-config.js')
    if (!fs.existsSync(configPath)) {
      this.errors.push('Safari build configuration not found: safari-build-config.js')
      return false
    }
    
    try {
      const configContent = fs.readFileSync(configPath, 'utf8')
      
      // [SAFARI-EXT-IMPL-001] Check for required configuration sections
      const requiredSections = ['manifestVersion', 'backgroundScripts', 'contentScripts', 'permissions']
      for (const section of requiredSections) {
        if (!configContent.includes(section)) {
          this.warnings.push(`Safari build config missing section: ${section}`)
        }
      }
      
      // [SAFARI-EXT-IMPL-001] Check for validation functions
      if (!configContent.includes('validateManifest')) {
        this.warnings.push('Safari build config missing manifest validation')
      }
      
      console.log('[SAFARI-EXT-IMPL-001] Safari build configuration validation completed')
      return true
      
    } catch (error) {
      this.errors.push(`Safari build configuration validation error: ${error.message}`)
      return false
    }
  }

  // [SAFARI-EXT-IMPL-001] Run complete Safari validation
  async run() {
    console.log('[SAFARI-EXT-IMPL-001] Starting Safari extension validation')
    
    // [SAFARI-EXT-IMPL-001] Run all validation checks
    this.validateManifestStructure()
    this.validateFileReferences()
    this.validateCodeCompatibility()
    this.validatePermissions()
    this.validateBuildConfiguration()
    
    // [SAFARI-EXT-IMPL-001] Report results
    console.log('\n[SAFARI-EXT-IMPL-001] Safari validation results:')
    
    if (this.errors.length > 0) {
      console.error('\n❌ Errors:')
      this.errors.forEach(error => console.error(`  - ${error}`))
    }
    
    if (this.warnings.length > 0) {
      console.warn('\n⚠️  Warnings:')
      this.warnings.forEach(warning => console.warn(`  - ${warning}`))
    }
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ Safari extension validation passed with no issues')
    } else if (this.errors.length === 0) {
      console.log('\n✅ Safari extension validation passed with warnings')
    } else {
      console.error('\n❌ Safari extension validation failed')
      process.exit(1)
    }
  }
}

// [SAFARI-EXT-IMPL-001] Run Safari validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new SafariValidator()
  validator.run()
}

export default SafariValidator 