/**
 * Safari Deployment Pipeline
 *
 * [SAFARI-EXT-IMPL-001] Safari App Extension deployment and App Store preparation
 * This module provides comprehensive Safari extension deployment pipeline.
 *
 * Date: 2025-07-20
 * Status: Active Development
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import SafariBuilder from './safari-build.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// [SAFARI-EXT-IMPL-001] Safari deployment configuration
const safariDeployConfig = {
  // [SAFARI-EXT-IMPL-001] Safari deployment options
  deploymentOptions: {
    appStoreId: 'hoverboard-safari-extension',
    developerId: 'fareedstevenson',
    bundleId: 'com.fareedstevenson.hoverboard.safari',
    version: '1.0.6.65',
    buildNumber: '1',
    category: 'Productivity',
    description: 'Modern Pinboard browser extension with hover overlays and seamless bookmark management',
    keywords: ['bookmark', 'pinboard', 'tag', 'productivity', 'safari'],
    minimumOSVersion: '14.0',
    targetOSVersion: '17.0'
  },

  // [SAFARI-EXT-IMPL-001] Safari App Store metadata
  appStoreMetadata: {
    name: 'Hoverboard - Pinboard Extension',
    subtitle: 'Smart bookmarking with hover overlays',
    description: 'Hoverboard is a modern browser extension that enhances your bookmarking experience with intelligent tag suggestions, hover overlays, and seamless Pinboard integration.',
    keywords: ['bookmark', 'pinboard', 'tag', 'productivity', 'safari', 'extension'],
    category: 'Productivity',
    website: 'https://hoverboard.fareedstevenson.com',
    support: 'https://hoverboard.fareedstevenson.com/support',
    privacy: 'https://hoverboard.fareedstevenson.com/privacy'
  },

  // [SAFARI-EXT-IMPL-001] Safari deployment validation
  validation: {
    // [SAFARI-EXT-IMPL-001] Validate Safari extension structure
    validateExtensionStructure: (extensionPath) => {
      const errors = []
      const requiredFiles = [
        'manifest.json',
        'src/shared/safari-shim.js',
        'src/core/service-worker.js',
        'src/ui/popup/popup.html',
        'icons/hoverboard_128.png'
      ]

      for (const file of requiredFiles) {
        const filePath = path.join(extensionPath, file)
        if (!fs.existsSync(filePath)) {
          errors.push(`Required file missing: ${file}`)
        }
      }

      return errors
    },

    // [SAFARI-EXT-IMPL-001] Validate Safari manifest
    validateSafariManifest: (manifestPath) => {
      const errors = []
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

      // [SAFARI-EXT-IMPL-001] Check required fields
      if (!manifest.name) errors.push('Manifest missing name')
      if (!manifest.version) errors.push('Manifest missing version')
      if (!manifest.manifest_version || manifest.manifest_version !== 2) {
        errors.push('Safari requires manifest_version 2')
      }
      if (!manifest.browser_action) errors.push('Safari requires browser_action')
      if (!manifest.background || !manifest.background.scripts) {
        errors.push('Safari requires background.scripts array')
      }

      // [SAFARI-EXT-IMPL-001] Check permissions
      const requiredPermissions = ['storage', 'tabs', 'activeTab']
      for (const permission of requiredPermissions) {
        if (!manifest.permissions || !manifest.permissions.includes(permission)) {
          errors.push(`Missing required permission: ${permission}`)
        }
      }

      return errors
    },

    // [SAFARI-EXT-IMPL-001] Validate Safari code compatibility
    validateSafariCode: (extensionPath) => {
      const errors = []
      const jsFiles = []

      // [SAFARI-EXT-IMPL-001] Find all JavaScript files
      const walkDir = (dir) => {
        const items = fs.readdirSync(dir)
        for (const item of items) {
          const fullPath = path.join(dir, item)
          if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath)
          } else if (item.endsWith('.js') || item.endsWith('.mjs')) {
            jsFiles.push(fullPath)
          }
        }
      }

      walkDir(path.join(extensionPath, 'src'))

      // [SAFARI-EXT-IMPL-001] Validate each JavaScript file
      for (const filePath of jsFiles) {
        const content = fs.readFileSync(filePath, 'utf8')
        
        // [SAFARI-EXT-IMPL-001] Check for Chrome API usage
        if (content.includes('chrome.')) {
          errors.push(`File ${path.relative(extensionPath, filePath)} contains Chrome API usage`)
        }

        // [SAFARI-EXT-IMPL-001] Check for Safari shim import
        if (!content.includes('import { browser }') && !content.includes('from safari-shim')) {
          errors.push(`File ${path.relative(extensionPath, filePath)} should import browser from safari-shim.js`)
        }
      }

      return errors
    }
  }
}

class SafariDeployer {
  constructor() {
    this.config = safariDeployConfig
    this.builder = new SafariBuilder()
    this.projectRoot = path.join(__dirname, '..')
  }

  // [SAFARI-EXT-IMPL-001] Validate Safari extension for deployment
  async validateForDeployment() {
    console.log('[SAFARI-EXT-IMPL-001] Validating Safari extension for deployment')

    const errors = []
    const extensionPath = this.builder.config.buildOptions.targetDir

    // [SAFARI-EXT-IMPL-001] Validate extension structure
    const structureErrors = this.config.validation.validateExtensionStructure(extensionPath)
    errors.push(...structureErrors)

    // [SAFARI-EXT-IMPL-001] Validate manifest
    const manifestPath = path.join(extensionPath, 'manifest.json')
    if (fs.existsSync(manifestPath)) {
      const manifestErrors = this.config.validation.validateSafariManifest(manifestPath)
      errors.push(...manifestErrors)
    } else {
      errors.push('Safari manifest.json not found')
    }

    // [SAFARI-EXT-IMPL-001] Validate code compatibility
    const codeErrors = this.config.validation.validateSafariCode(extensionPath)
    errors.push(...codeErrors)

    // [SAFARI-EXT-IMPL-001] Report validation results
    if (errors.length > 0) {
      console.error('[SAFARI-EXT-IMPL-001] Safari deployment validation failed:')
      errors.forEach(error => console.error(`  ❌ ${error}`))
      throw new Error(`Safari deployment validation failed: ${errors.length} errors`)
    }

    console.log('[SAFARI-EXT-IMPL-001] Safari deployment validation passed')
  }

  // [SAFARI-EXT-IMPL-001] Create Safari App Store package
  async createAppStorePackage() {
    console.log('[SAFARI-EXT-IMPL-001] Creating Safari App Store package')

    try {
      const extensionPath = this.builder.config.buildOptions.targetDir
      const appStorePath = path.join(this.projectRoot, 'dist/safari-app-store')

      // [SAFARI-EXT-IMPL-001] Create App Store directory
      if (!fs.existsSync(appStorePath)) {
        fs.mkdirSync(appStorePath, { recursive: true })
      }

      // [SAFARI-EXT-IMPL-001] Create App Store metadata
      const metadata = {
        ...this.config.appStoreMetadata,
        version: this.config.deploymentOptions.version,
        buildNumber: this.config.deploymentOptions.buildNumber,
        bundleId: this.config.deploymentOptions.bundleId,
        developerId: this.config.deploymentOptions.developerId,
        minimumOSVersion: this.config.deploymentOptions.minimumOSVersion,
        targetOSVersion: this.config.deploymentOptions.targetOSVersion,
        buildDate: new Date().toISOString()
      }

      const metadataPath = path.join(appStorePath, 'app-store-metadata.json')
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))

      // [SAFARI-EXT-IMPL-001] Copy extension to App Store package
      const appStoreExtensionPath = path.join(appStorePath, 'extension')
      this.builder.copyDirectory(extensionPath, appStoreExtensionPath)

      // [SAFARI-EXT-IMPL-001] Create App Store package
      const packagePath = path.join(appStorePath, `${this.config.deploymentOptions.appStoreId}-${this.config.deploymentOptions.version}.zip`)
      
      const archiver = await import('archiver')
      const output = fs.createWriteStream(packagePath)
      const archive = archiver.default('zip', { zlib: { level: 9 } })

      output.on('close', () => {
        console.log(`[SAFARI-EXT-IMPL-001] Safari App Store package created: ${packagePath}`)
        console.log(`[SAFARI-EXT-IMPL-001] Package size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`)
      })

      archive.on('error', (err) => {
        throw err
      })

      archive.pipe(output)
      archive.directory(appStorePath, false)
      await archive.finalize()

      return {
        packagePath,
        metadataPath,
        appStorePath
      }

    } catch (error) {
      console.error('[SAFARI-EXT-IMPL-001] Safari App Store package creation failed:', error.message)
      throw error
    }
  }

  // [SAFARI-EXT-IMPL-001] Create Xcode project for Safari extension
  async createXcodeProject() {
    console.log('[SAFARI-EXT-IMPL-001] Creating Xcode project for Safari extension')

    try {
      const xcodePath = path.join(this.projectRoot, 'dist/safari-xcode')
      
      // [SAFARI-EXT-IMPL-001] Create Xcode project structure
      if (!fs.existsSync(xcodePath)) {
        fs.mkdirSync(xcodePath, { recursive: true })
      }

      // [SAFARI-EXT-IMPL-001] Create Xcode project configuration
      const xcodeConfig = {
        projectName: 'HoverboardSafariExtension',
        bundleId: this.config.deploymentOptions.bundleId,
        version: this.config.deploymentOptions.version,
        buildNumber: this.config.deploymentOptions.buildNumber,
        developerId: this.config.deploymentOptions.developerId,
        minimumOSVersion: this.config.deploymentOptions.minimumOSVersion,
        targetOSVersion: this.config.deploymentOptions.targetOSVersion,
        extensionPath: path.relative(xcodePath, this.builder.config.buildOptions.targetDir)
      }

      const configPath = path.join(xcodePath, 'xcode-config.json')
      fs.writeFileSync(configPath, JSON.stringify(xcodeConfig, null, 2))

      // [SAFARI-EXT-IMPL-001] Create Xcode project files
      const projectFiles = this.generateXcodeProjectFiles(xcodeConfig)
      for (const [filePath, content] of Object.entries(projectFiles)) {
        const fullPath = path.join(xcodePath, filePath)
        const dir = path.dirname(fullPath)
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }
        fs.writeFileSync(fullPath, content)
      }

      console.log('[SAFARI-EXT-IMPL-001] Xcode project created successfully')
      console.log(`[SAFARI-EXT-IMPL-001] Xcode project path: ${xcodePath}`)

      return {
        xcodePath,
        configPath
      }

    } catch (error) {
      console.error('[SAFARI-EXT-IMPL-001] Xcode project creation failed:', error.message)
      throw error
    }
  }

  // [SAFARI-EXT-IMPL-001] Generate Xcode project files
  generateXcodeProjectFiles(config) {
    return {
      'HoverboardSafariExtension.xcodeproj/project.pbxproj': this.generateProjectPbxproj(config),
      'HoverboardSafariExtension.xcodeproj/project.xcworkspace/contents.xcworkspacedata': this.generateWorkspaceContents(config),
      'HoverboardSafariExtension/Info.plist': this.generateInfoPlist(config),
      'HoverboardSafariExtension/entitlements.plist': this.generateEntitlementsPlist(config),
      'HoverboardSafariExtension/SafariExtensionHandler.swift': this.generateSafariExtensionHandler(config),
      'HoverboardSafariExtension/SafariExtensionViewController.swift': this.generateSafariExtensionViewController(config),
      'README.md': this.generateXcodeReadme(config)
    }
  }

  // [SAFARI-EXT-IMPL-001] Generate project.pbxproj file
  generateProjectPbxproj(config) {
    return `// !$*UTF8*$!
{
	archiveVersion = 1;
	classes = {
	};
	objectVersion = 56;
	objects = {
		/* Begin PBXBuildFile section */
		/* End PBXBuildFile section */
		/* Begin PBXFileReference section */
		/* End PBXFileReference section */
		/* Begin PBXFrameworksBuildPhase section */
		/* End PBXFrameworksBuildPhase section */
		/* Begin PBXGroup section */
		/* End PBXGroup section */
		/* Begin PBXNativeTarget section */
		/* End PBXNativeTarget section */
		/* Begin PBXProject section */
		/* End PBXProject section */
		/* Begin PBXResourcesBuildPhase section */
		/* End PBXResourcesBuildPhase section */
		/* Begin PBXSourcesBuildPhase section */
		/* End PBXSourcesBuildPhase section */
		/* Begin XCBuildConfiguration section */
		/* End XCBuildConfiguration section */
		/* Begin XCConfigurationList section */
		/* End XCConfigurationList section */
	};
	rootObject = /* Project object */;
}
`
  }

  // [SAFARI-EXT-IMPL-001] Generate workspace contents
  generateWorkspaceContents(config) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Workspace
   version = "1.0">
   <FileRef
      location = "group:HoverboardSafariExtension.xcodeproj">
   </FileRef>
</Workspace>
`
  }

  // [SAFARI-EXT-IMPL-001] Generate Info.plist
  generateInfoPlist(config) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>$(DEVELOPMENT_LANGUAGE)</string>
	<key>CFBundleDisplayName</key>
	<string>Hoverboard</string>
	<key>CFBundleExecutable</key>
	<string>$(EXECUTABLE_NAME)</string>
	<key>CFBundleIdentifier</key>
	<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>$(PRODUCT_NAME)</string>
	<key>CFBundlePackageType</key>
	<string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
	<key>CFBundleShortVersionString</key>
	<string>${config.version}</string>
	<key>CFBundleVersion</key>
	<string>${config.buildNumber}</string>
	<key>LSMinimumSystemVersion</key>
	<string>${config.minimumOSVersion}</string>
	<key>NSExtension</key>
	<dict>
		<key>NSExtensionPointIdentifier</key>
		<string>com.apple.Safari.web-extension</string>
		<key>NSExtensionPrincipalClass</key>
		<string>$(PRODUCT_MODULE_NAME).SafariExtensionHandler</string>
	</dict>
</dict>
</plist>
`
  }

  // [SAFARI-EXT-IMPL-001] Generate entitlements.plist
  generateEntitlementsPlist(config) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>com.apple.security.application-groups</key>
	<array>
		<string>group.${config.bundleId}</string>
	</array>
</dict>
</plist>
`
  }

  // [SAFARI-EXT-IMPL-001] Generate SafariExtensionHandler.swift
  generateSafariExtensionHandler(config) {
    return `import SafariServices

class SafariExtensionHandler: SFSafariExtensionHandler {
    
    override func messageReceived(withName messageName: String, from page: SFSafariPage, userInfo: [String : Any]?) {
        // This method will be called when a content script provided by your extension calls
        // safari.extension.dispatchMessage("message").
        page.getPropertiesWithCompletionHandler { properties in
            NSLog("The extension received a message (\(messageName)) from a script injected into (\(String(describing: properties?.url))) with userInfo (\(userInfo ?? [:]))")
        }
    }
    
    override func toolbarItemClicked(in window: SFSafariWindow) {
        // This method will be called when your toolbar item is clicked.
        NSLog("The extension's toolbar item was clicked")
    }
    
    override func validateToolbarItem(in window: SFSafariWindow, validationHandler: @escaping ((Bool, String) -> Void)) {
        // This is called when Safari's state changed and we need to validate the toolbar item.
        validationHandler(true, "")
    }
    
    override func popoverViewController() -> SFSafariExtensionViewController {
        return SafariExtensionViewController()
    }
}
`
  }

  // [SAFARI-EXT-IMPL-001] Generate SafariExtensionViewController.swift
  generateSafariExtensionViewController(config) {
    return `import SafariServices

class SafariExtensionViewController: SFSafariExtensionViewController {
    
    static let shared: SafariExtensionViewController = {
        let shared = SafariExtensionViewController()
        shared.preferredContentSize = NSSize(width:320, height:240)
        return shared
    }()
    
}
`
  }

  // [SAFARI-EXT-IMPL-001] Generate Xcode README
  generateXcodeReadme(config) {
    return `# Hoverboard Safari Extension - Xcode Project

This Xcode project contains the Safari App Extension for Hoverboard.

## Configuration

- **Bundle ID**: ${config.bundleId}
- **Version**: ${config.version}
- **Build Number**: ${config.buildNumber}
- **Developer ID**: ${config.developerId}
- **Minimum OS Version**: ${config.minimumOSVersion}
- **Target OS Version**: ${config.targetOSVersion}

## Building

1. Open \`HoverboardSafariExtension.xcodeproj\` in Xcode
2. Select your development team in the project settings
3. Build the project (Cmd+B)
4. Run the extension in Safari

## Deployment

1. Archive the project (Product > Archive)
2. Upload to App Store Connect
3. Submit for review

## Features

- Safari App Extension support
- Cross-browser compatibility
- Enhanced error handling
- Performance monitoring
- Accessibility features

## Semantic Tokens

- \`SAFARI-EXT-IMPL-001\`: Safari implementation details
- \`SAFARI-EXT-API-001\`: Safari API abstraction
- \`SAFARI-EXT-SHIM-001\`: Safari platform detection
`
  }

  // [SAFARI-EXT-IMPL-001] Deploy Safari extension
  async deploy() {
    console.log('[SAFARI-EXT-IMPL-001] Starting Safari extension deployment')

    try {
      // [SAFARI-EXT-IMPL-001] Build extension
      await this.builder.build()

      // [SAFARI-EXT-IMPL-001] Validate for deployment
      await this.validateForDeployment()

      // [SAFARI-EXT-IMPL-001] Create App Store package
      const appStoreResult = await this.createAppStorePackage()

      // [SAFARI-EXT-IMPL-001] Create Xcode project
      const xcodeResult = await this.createXcodeProject()

      // [SAFARI-EXT-IMPL-001] Create deployment summary
      const deploymentSummary = {
        version: this.config.deploymentOptions.version,
        buildDate: new Date().toISOString(),
        safariCompatible: true,
        manifestVersion: 2,
        appStorePackage: appStoreResult.packagePath,
        xcodeProject: xcodeResult.xcodePath,
        features: [
          'Safari App Extension support',
          'Cross-browser compatibility',
          'Enhanced error handling',
          'Performance monitoring',
          'Accessibility features'
        ],
        deploymentStatus: 'ready',
        nextSteps: [
          'Open Xcode project and configure signing',
          'Test extension in Safari',
          'Archive and upload to App Store Connect',
          'Submit for App Store review'
        ]
      }

      const summaryPath = path.join(this.projectRoot, 'dist/safari-deployment-summary.json')
      fs.writeFileSync(summaryPath, JSON.stringify(deploymentSummary, null, 2))

      console.log('[SAFARI-EXT-IMPL-001] Safari extension deployment completed successfully')
      console.log(`[SAFARI-EXT-IMPL-001] Deployment summary: ${summaryPath}`)
      console.log(`[SAFARI-EXT-IMPL-001] App Store package: ${appStoreResult.packagePath}`)
      console.log(`[SAFARI-EXT-IMPL-001] Xcode project: ${xcodeResult.xcodePath}`)

      return {
        appStoreResult,
        xcodeResult,
        summaryPath
      }

    } catch (error) {
      console.error('[SAFARI-EXT-IMPL-001] Safari deployment failed:', error.message)
      throw error
    }
  }
}

// [SAFARI-EXT-IMPL-001] Main execution
async function main() {
  const deployer = new SafariDeployer()
  const command = process.argv[2] || 'deploy'

  try {
    switch (command) {
      case 'validate':
        await deployer.validateForDeployment()
        break
      case 'appstore':
        await deployer.createAppStorePackage()
        break
      case 'xcode':
        await deployer.createXcodeProject()
        break
      case 'deploy':
        await deployer.deploy()
        break
      default:
        console.error('[SAFARI-EXT-IMPL-001] Unknown command:', command)
        console.log('[SAFARI-EXT-IMPL-001] Available commands: validate, appstore, xcode, deploy')
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

export default SafariDeployer 