#!/usr/bin/env node

/**
 * Safari Development Environment Setup
 *
 * [SAFARI-EXT-IMPL-001] Safari App Extension development environment setup
 * This script prepares the codebase for Safari extension development by setting up
 * the necessary files, configurations, and validation.
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

// [SAFARI-EXT-IMPL-001] Safari development environment setup
class SafariSetup {
  constructor() {
    this.projectRoot = projectRoot
    this.safariConfig = null
  }

  // [SAFARI-EXT-IMPL-001] Load Safari build configuration
  async loadSafariConfig() {
    try {
      const configPath = path.join(this.projectRoot, 'safari-build-config.js')
      const configModule = await import(configPath)
      this.safariConfig = configModule.default
      console.log('[SAFARI-EXT-IMPL-001] Loaded Safari build configuration')
    } catch (error) {
      console.error('[SAFARI-EXT-IMPL-001] Failed to load Safari config:', error.message)
      throw error
    }
  }

  // [SAFARI-EXT-IMPL-001] Validate Safari manifest
  async validateSafariManifest() {
    console.log('[SAFARI-EXT-IMPL-001] Validating Safari manifest')
    
    try {
      const manifestPath = path.join(this.projectRoot, 'safari-manifest.json')
      const manifestContent = fs.readFileSync(manifestPath, 'utf8')
      const manifest = JSON.parse(manifestContent)
      
      const errors = this.safariConfig.validation.validateManifest(manifest)
      
      if (errors.length > 0) {
        console.error('[SAFARI-EXT-IMPL-001] Safari manifest validation failed:')
        errors.forEach(error => console.error(`  - ${error}`))
        throw new Error('Safari manifest validation failed')
      }
      
      console.log('[SAFARI-EXT-IMPL-001] Safari manifest validation passed')
      return manifest
    } catch (error) {
      console.error('[SAFARI-EXT-IMPL-001] Safari manifest validation error:', error.message)
      throw error
    }
  }

  // [SAFARI-EXT-IMPL-001] Validate Safari code compatibility
  async validateSafariCode() {
    console.log('[SAFARI-EXT-IMPL-001] Validating Safari code compatibility')
    
    const errors = []
    const warnings = []
    const filesToCheck = [
      'src/core/service-worker.js',
      'src/features/content/content-main.js',
      'src/ui/popup/popup.js',
      'src/ui/options/options-browser.js'
    ]
    
    for (const file of filesToCheck) {
      const filePath = path.join(this.projectRoot, file)
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8')
        this.validateFileContent(file, content, errors, warnings)
      }
    }
    
    if (errors.length > 0) {
      console.error('[SAFARI-EXT-IMPL-001] Safari code validation failed:')
      errors.forEach(error => console.error(`  - ${error}`))
      throw new Error('Safari code validation failed')
    }
    
    if (warnings.length > 0) {
      console.warn('[SAFARI-EXT-IMPL-001] Safari code validation warnings:')
      warnings.forEach(warning => console.warn(`  - ${warning}`))
    }
    
    console.log('[SAFARI-EXT-IMPL-001] Safari code validation passed')
  }

  // [SAFARI-EXT-IMPL-001] Validate individual file content (same logic as validation script)
  validateFileContent(filePath, content, errors, warnings) {
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
        errors.push(`File ${filePath} contains Chrome API usage, should use browser API`)
      }
    }
    
    // [SAFARI-EXT-IMPL-001] Check for Safari shim import
    if (!content.includes('import { browser }') && !content.includes('from safari-shim') && !filePath.includes('safari-shim.js')) {
      warnings.push(`File ${filePath} should import browser from safari-shim.js`)
    }
    
    // [SAFARI-EXT-IMPL-001] Check for Safari-specific semantic tokens
    if (!content.includes('SAFARI-EXT-')) {
      warnings.push(`File ${filePath} should include Safari-specific semantic tokens`)
    }
    
    // [SAFARI-EXT-IMPL-001] Check for proper error handling
    if (content.includes('try') && !content.includes('catch')) {
      warnings.push(`File ${filePath} has try block without catch`)
    }
  }

  // [SAFARI-EXT-IMPL-001] Create Safari development directory structure
  async createSafariStructure() {
    console.log('[SAFARI-EXT-IMPL-001] Creating Safari development structure')
    
    const safariDir = path.join(this.projectRoot, 'safari')
    const safariSrcDir = path.join(safariDir, 'src')
    const safariIconsDir = path.join(safariDir, 'icons')
    
    // [SAFARI-EXT-IMPL-001] Create directories
    const directories = [safariDir, safariSrcDir, safariIconsDir]
    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        console.log(`[SAFARI-EXT-IMPL-001] Created directory: ${dir}`)
      }
    }
    
    // [SAFARI-EXT-IMPL-001] Copy Safari manifest
    const sourceManifest = path.join(this.projectRoot, 'safari-manifest.json')
    const targetManifest = path.join(safariDir, 'manifest.json')
    fs.copyFileSync(sourceManifest, targetManifest)
    console.log('[SAFARI-EXT-IMPL-001] Copied Safari manifest')
    
    // [SAFARI-EXT-IMPL-001] Copy source files
    const sourceDirs = ['src', 'icons', '_locales']
    for (const sourceDir of sourceDirs) {
      const sourcePath = path.join(this.projectRoot, sourceDir)
      const targetPath = path.join(safariDir, sourceDir)
      
      if (fs.existsSync(sourcePath)) {
        this.copyDirectory(sourcePath, targetPath)
        console.log(`[SAFARI-EXT-IMPL-001] Copied ${sourceDir} directory`)
      }
    }
    
    console.log('[SAFARI-EXT-IMPL-001] Safari development structure created')
  }

  // [SAFARI-EXT-IMPL-001] Copy directory recursively
  copyDirectory(source, target) {
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true })
    }
    
    const items = fs.readdirSync(source)
    for (const item of items) {
      const sourcePath = path.join(source, item)
      const targetPath = path.join(target, item)
      
      if (fs.statSync(sourcePath).isDirectory()) {
        this.copyDirectory(sourcePath, targetPath)
      } else {
        fs.copyFileSync(sourcePath, targetPath)
      }
    }
  }

  // [SAFARI-EXT-IMPL-001] Create Safari package.json
  async createSafariPackageJson() {
    console.log('[SAFARI-EXT-IMPL-001] Creating Safari package.json')
    
    const safariDir = path.join(this.projectRoot, 'safari')
    const packageJson = {
      name: 'hoverboard-safari',
      version: '1.0.6.65',
      description: 'Hoverboard Safari Extension',
      author: 'Fareed Stevenson',
      scripts: {
        'build': 'node ../scripts/safari-build.js',
        'validate': 'node ../scripts/safari-validate.js',
        'test': 'npm run validate'
      },
      devDependencies: {
        'web-ext': '^7.0.0'
      }
    }
    
    const packagePath = path.join(safariDir, 'package.json')
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2))
    console.log('[SAFARI-EXT-IMPL-001] Created Safari package.json')
  }

  // [SAFARI-EXT-IMPL-001] Create Safari README
  async createSafariReadme() {
    console.log('[SAFARI-EXT-IMPL-001] Creating Safari README')
    
    const safariDir = path.join(this.projectRoot, 'safari')
    const readmeContent = `# Hoverboard Safari Extension

This directory contains the Safari App Extension version of Hoverboard.

## Development

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Build the extension:
   \`\`\`bash
   npm run build
   \`\`\`

3. Validate the extension:
   \`\`\`bash
   npm run validate
   \`\`\`

## Loading in Safari

1. Open Safari
2. Go to Safari > Preferences > Advanced
3. Check "Show Develop menu in menu bar"
4. Go to Develop > Show Extension Builder
5. Click the + button and select "Add Extension"
6. Navigate to this directory and select it

## Architecture

This Safari extension uses the same codebase as the Chrome extension but with Safari-specific adaptations:

- Uses Manifest V2 instead of V3
- Uses background scripts instead of service workers
- Uses browser_action instead of action
- Includes Safari-specific API shims

## Semantic Tokens

- \`SAFARI-EXT-IMPL-001\`: Safari implementation details
- \`SAFARI-EXT-API-001\`: Safari API abstraction
- \`SAFARI-EXT-SHIM-001\`: Safari platform detection
- \`SAFARI-EXT-STORAGE-001\`: Safari storage management
- \`SAFARI-EXT-MESSAGING-001\`: Safari message passing
`
    
    const readmePath = path.join(safariDir, 'README.md')
    fs.writeFileSync(readmePath, readmeContent)
    console.log('[SAFARI-EXT-IMPL-001] Created Safari README')
  }

  // [SAFARI-EXT-IMPL-001] Run complete Safari setup
  async run() {
    console.log('[SAFARI-EXT-IMPL-001] Starting Safari development environment setup')
    
    try {
      // [SAFARI-EXT-IMPL-001] Load configuration
      await this.loadSafariConfig()
      
      // [SAFARI-EXT-IMPL-001] Validate existing files
      await this.validateSafariManifest()
      await this.validateSafariCode()
      
      // [SAFARI-EXT-IMPL-001] Create Safari structure
      await this.createSafariStructure()
      await this.createSafariPackageJson()
      await this.createSafariReadme()
      
      console.log('[SAFARI-EXT-IMPL-001] Safari development environment setup completed successfully')
      console.log('[SAFARI-EXT-IMPL-001] Safari extension ready for development in ./safari/ directory')
      
    } catch (error) {
      console.error('[SAFARI-EXT-IMPL-001] Safari setup failed:', error.message)
      process.exit(1)
    }
  }
}

// [SAFARI-EXT-IMPL-001] Run Safari setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new SafariSetup()
  setup.run()
}

export default SafariSetup 