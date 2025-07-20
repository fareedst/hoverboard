/**
 * Safari Build Script
 *
 * [SAFARI-EXT-IMPL-001] Safari App Extension build and packaging script
 * This module provides comprehensive Safari extension building, validation, and packaging.
 *
 * Date: 2025-07-20
 * Status: Active Development
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// [SAFARI-EXT-IMPL-001] Safari build configuration
const safariBuildConfig = {
  // [SAFARI-EXT-IMPL-001] Safari-specific build options
  buildOptions: {
    sourceDir: path.join(__dirname, '..'),
    targetDir: path.join(__dirname, '../dist/safari'),
    safariDir: path.join(__dirname, '../safari'),
    manifestFile: 'safari-manifest.json',
    packageName: 'hoverboard-safari-extension',
    version: '1.0.6.65'
  },

  // [SAFARI-EXT-IMPL-001] Safari-specific file transformations
  transformFiles: {
    // [SAFARI-EXT-IMPL-001] Replace Chrome API calls with Safari-compatible versions
    chromeToSafari: (content) => {
      return content
        .replace(/chrome\./g, 'browser.')
        .replace(/chrome\.runtime\./g, 'browser.runtime.')
        .replace(/chrome\.storage\./g, 'browser.storage.')
        .replace(/chrome\.tabs\./g, 'browser.tabs.')
        .replace(/chrome\.browserAction\./g, 'browser.browserAction.')
    },

    // [SAFARI-EXT-IMPL-001] Add Safari-specific imports
    addSafariImports: (content) => {
      if (content.includes('import { browser }') || content.includes('from safari-shim')) {
        return content // Already has Safari import
      }
      return `import { browser } from '../shared/safari-shim.js'\n${content}`
    },

    // [SAFARI-EXT-IMPL-001] Transform manifest V3 to V2
    transformManifest: (manifest) => {
      const safariManifest = {
        ...manifest,
        manifest_version: 2,
        browser_action: manifest.action || {
          default_icon: manifest.icons,
          default_popup: manifest.action?.default_popup,
          default_title: manifest.action?.default_title
        },
        background: {
          scripts: manifest.background?.service_worker ? 
            ['src/shared/safari-shim.js', 'src/core/service-worker.js'] :
            manifest.background?.scripts || ['src/shared/safari-shim.js'],
          persistent: false
        }
      }

      // [SAFARI-EXT-IMPL-001] Remove V3-specific fields
      delete safariManifest.action
      delete safariManifest.background?.service_worker
      delete safariManifest.manifest_version

      return safariManifest
    }
  },

  // [SAFARI-EXT-IMPL-001] Safari-specific validation rules
  validation: {
    // [SAFARI-EXT-IMPL-001] Validate Safari manifest structure
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

    // [SAFARI-EXT-IMPL-001] Validate Safari code compatibility
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
  }
}

class SafariBuilder {
  constructor() {
    this.config = safariBuildConfig
    this.projectRoot = path.join(__dirname, '..')
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

  // [SAFARI-EXT-IMPL-001] Transform file content for Safari
  transformFile(sourcePath, targetPath) {
    let content = fs.readFileSync(sourcePath, 'utf8')

    // [SAFARI-EXT-IMPL-001] Apply Chrome to Safari transformations
    content = this.config.transformFiles.chromeToSafari(content)
    content = this.config.transformFiles.addSafariImports(content)

    // [SAFARI-EXT-IMPL-001] Ensure target directory exists
    const targetDir = path.dirname(targetPath)
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    fs.writeFileSync(targetPath, content)
  }

  // [SAFARI-EXT-IMPL-001] Validate Safari build
  async validateBuild() {
    console.log('[SAFARI-EXT-IMPL-001] Validating Safari build')

    const errors = []
    const warnings = []

    // [SAFARI-EXT-IMPL-001] Validate manifest
    const manifestPath = path.join(this.config.buildOptions.targetDir, 'manifest.json')
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      const manifestErrors = this.config.validation.validateManifest(manifest)
      errors.push(...manifestErrors)
    } else {
      errors.push('Safari manifest.json not found in build output')
    }

    // [SAFARI-EXT-IMPL-001] Validate source files
    const sourceFiles = this.getSourceFiles()
    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, 'utf8')
      const fileErrors = this.config.validation.validateCode(filePath, content)
      errors.push(...fileErrors)
    }

    // [SAFARI-EXT-IMPL-001] Report validation results
    if (errors.length > 0) {
      console.error('[SAFARI-EXT-IMPL-001] Safari build validation failed:')
      errors.forEach(error => console.error(`  ❌ ${error}`))
      throw new Error(`Safari build validation failed: ${errors.length} errors`)
    }

    if (warnings.length > 0) {
      console.warn('[SAFARI-EXT-IMPL-001] Safari build warnings:')
      warnings.forEach(warning => console.warn(`  ⚠️ ${warning}`))
    }

    console.log('[SAFARI-EXT-IMPL-001] Safari build validation passed')
  }

  // [SAFARI-EXT-IMPL-001] Get all source files for validation
  getSourceFiles() {
    const sourceFiles = []
    const sourceDir = this.config.buildOptions.sourceDir

    const walkDir = (dir) => {
      const items = fs.readdirSync(dir)
      for (const item of items) {
        const fullPath = path.join(dir, item)
        if (fs.statSync(fullPath).isDirectory()) {
          walkDir(fullPath)
        } else if (item.endsWith('.js') || item.endsWith('.mjs')) {
          sourceFiles.push(fullPath)
        }
      }
    }

    walkDir(path.join(sourceDir, 'src'))
    return sourceFiles
  }

  // [SAFARI-EXT-IMPL-001] Build Safari extension
  async build() {
    console.log('[SAFARI-EXT-IMPL-001] Starting Safari extension build')

    try {
      // [SAFARI-EXT-IMPL-001] Create target directory
      if (!fs.existsSync(this.config.buildOptions.targetDir)) {
        fs.mkdirSync(this.config.buildOptions.targetDir, { recursive: true })
      }

      // [SAFARI-EXT-IMPL-001] Copy and transform source files
      const sourceDirs = ['src', 'icons', '_locales']
      for (const sourceDir of sourceDirs) {
        const sourcePath = path.join(this.config.buildOptions.sourceDir, sourceDir)
        const targetPath = path.join(this.config.buildOptions.targetDir, sourceDir)

        if (fs.existsSync(sourcePath)) {
          this.copyDirectory(sourcePath, targetPath)
          console.log(`[SAFARI-EXT-IMPL-001] Copied ${sourceDir} directory`)
        }
      }

      // [SAFARI-EXT-IMPL-001] Transform manifest
      const sourceManifestPath = path.join(this.config.buildOptions.sourceDir, this.config.buildOptions.manifestFile)
      const targetManifestPath = path.join(this.config.buildOptions.targetDir, 'manifest.json')

      if (fs.existsSync(sourceManifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(sourceManifestPath, 'utf8'))
        const safariManifest = this.config.transformFiles.transformManifest(manifest)
        fs.writeFileSync(targetManifestPath, JSON.stringify(safariManifest, null, 2))
        console.log('[SAFARI-EXT-IMPL-001] Transformed manifest for Safari')
      }

      // [SAFARI-EXT-IMPL-001] Transform JavaScript files
      const jsFiles = this.getSourceFiles()
      for (const filePath of jsFiles) {
        const relativePath = path.relative(this.config.buildOptions.sourceDir, filePath)
        const targetPath = path.join(this.config.buildOptions.targetDir, relativePath)
        this.transformFile(filePath, targetPath)
      }

      // [SAFARI-EXT-IMPL-001] Validate build
      await this.validateBuild()

      console.log('[SAFARI-EXT-IMPL-001] Safari extension build completed successfully')
      console.log(`[SAFARI-EXT-IMPL-001] Build output: ${this.config.buildOptions.targetDir}`)

    } catch (error) {
      console.error('[SAFARI-EXT-IMPL-001] Safari build failed:', error.message)
      throw error
    }
  }

  // [SAFARI-EXT-IMPL-001] Package Safari extension
  async package() {
    console.log('[SAFARI-EXT-IMPL-001] Packaging Safari extension')

    try {
      const packagePath = path.join(this.config.buildOptions.targetDir, `${this.config.buildOptions.packageName}-${this.config.buildOptions.version}.zip`)
      
      // [SAFARI-EXT-IMPL-001] Create zip package
      const archiver = await import('archiver')
      const output = fs.createWriteStream(packagePath)
      const archive = archiver.default('zip', { zlib: { level: 9 } })

      output.on('close', () => {
        console.log(`[SAFARI-EXT-IMPL-001] Safari extension packaged: ${packagePath}`)
        console.log(`[SAFARI-EXT-IMPL-001] Package size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`)
      })

      archive.on('error', (err) => {
        throw err
      })

      archive.pipe(output)
      archive.directory(this.config.buildOptions.targetDir, false)
      await archive.finalize()

      return packagePath

    } catch (error) {
      console.error('[SAFARI-EXT-IMPL-001] Safari packaging failed:', error.message)
      throw error
    }
  }

  // [SAFARI-EXT-IMPL-001] Deploy Safari extension
  async deploy() {
    console.log('[SAFARI-EXT-IMPL-001] Preparing Safari extension for deployment')

    try {
      // [SAFARI-EXT-IMPL-001] Build extension
      await this.build()

      // [SAFARI-EXT-IMPL-001] Package extension
      const packagePath = await this.package()

      // [SAFARI-EXT-IMPL-001] Create deployment metadata
      const deploymentMetadata = {
        version: this.config.buildOptions.version,
        buildDate: new Date().toISOString(),
        packagePath: packagePath,
        targetDir: this.config.buildOptions.targetDir,
        safariCompatible: true,
        manifestVersion: 2,
        features: [
          'Safari App Extension support',
          'Cross-browser compatibility',
          'Enhanced error handling',
          'Performance monitoring',
          'Accessibility features'
        ]
      }

      const metadataPath = path.join(this.config.buildOptions.targetDir, 'deployment-metadata.json')
      fs.writeFileSync(metadataPath, JSON.stringify(deploymentMetadata, null, 2))

      console.log('[SAFARI-EXT-IMPL-001] Safari extension deployment preparation completed')
      console.log(`[SAFARI-EXT-IMPL-001] Deployment metadata: ${metadataPath}`)

      return {
        packagePath,
        metadataPath,
        targetDir: this.config.buildOptions.targetDir
      }

    } catch (error) {
      console.error('[SAFARI-EXT-IMPL-001] Safari deployment preparation failed:', error.message)
      throw error
    }
  }
}

// [SAFARI-EXT-IMPL-001] Main execution
async function main() {
  const builder = new SafariBuilder()
  const command = process.argv[2] || 'build'

  try {
    switch (command) {
      case 'build':
        await builder.build()
        break
      case 'package':
        await builder.package()
        break
      case 'deploy':
        await builder.deploy()
        break
      default:
        console.error('[SAFARI-EXT-IMPL-001] Unknown command:', command)
        console.log('[SAFARI-EXT-IMPL-001] Available commands: build, package, deploy')
        process.exit(1)
    }
  } catch (error) {
    console.error('[SAFARI-EXT-IMPL-001] Command failed:', error.message)
    process.exit(1)
  }
}

// [SAFARI-EXT-IMPL-001] Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export default SafariBuilder 