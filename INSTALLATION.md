# Installation Guide

## Chrome Extension Installation

### Method 1: Install from GitHub Releases (Recommended)

1. **Download the Extension**
   - Go to the [Releases page](https://github.com/fareedst/hoverboard/releases)
   - Download the latest `hoverboard-chrome-extension.zip` file

2. **Extract the Extension**
   - Extract the downloaded zip file to a folder on your computer
   - Remember the location of the extracted folder

3. **Install in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top right)
   - Click "Load unpacked"
   - Select the folder where you extracted the extension
   - The Hoverboard extension should now appear in your extensions list

### Method 2: Build from Source

1. **Prerequisites**
   - Node.js 18+ installed
   - Git installed

2. **Clone and Build**
   ```bash
   git clone https://github.com/fareedst/hoverboard.git
   cd hoverboard
   npm install
   npm run build:dev
   ```

3. **Install in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder from the cloned repository

## Safari Extension Installation

### Prerequisites
- macOS with Safari 14+ 
- Xcode (for building from source)

### Method 1: Install from GitHub Releases

1. **Download the Extension**
   - Go to the [Releases page](https://github.com/fareedst/hoverboard/releases)
   - Download the latest `hoverboard-safari-extension.zip` file

2. **Extract and Install**
   - Extract the downloaded zip file
   - Double-click the `.safariextz` file to install in Safari
   - Follow Safari's installation prompts

### Method 2: Build from Source

1. **Build the Safari Extension**
   ```bash
   git clone https://github.com/fareedst/hoverboard.git
   cd hoverboard
   npm install
   npm run safari:build
   ```

2. **Install in Safari**
   - Open Safari
   - Go to Safari > Preferences > Extensions
   - Click "Turn On" next to Hoverboard
   - Grant necessary permissions when prompted

## First-Time Setup

1. **Pin the Extension**
   - Click the puzzle piece icon in Chrome's toolbar
   - Find Hoverboard and click the pin icon
   - Or right-click the extension icon and select "Pin"

2. **Configure Settings**
   - Click the Hoverboard icon in your browser toolbar
   - Click the settings/gear icon to open options
   - Configure your preferences:
     - Theme (Dark/Light)
     - Overlay transparency
     - Tag suggestions
     - Keyboard shortcuts

3. **Start Using**
   - Visit any webpage
   - Hover over elements to see the overlay
   - Click the extension icon to access bookmarks and tags
   - Use keyboard shortcuts for quick actions

## Troubleshooting

### Chrome Extension Issues

**Extension not loading:**
- Ensure you're using Chrome 88+ (Manifest V3 support)
- Check that Developer mode is enabled
- Try refreshing the extensions page

**Overlay not appearing:**
- Check that the extension has permission to run on the current site
- Try refreshing the page
- Check the browser console for errors

**Bookmarks not saving:**
- Ensure you have internet connectivity
- Check that the extension has storage permissions
- Try clearing extension data and reconfiguring

### Safari Extension Issues

**Extension not installing:**
- Ensure you're using Safari 14+
- Check that the extension file isn't corrupted
- Try rebuilding from source

**Performance issues:**
- The extension includes performance monitoring
- Check the extension's options for performance settings
- Consider disabling some features if needed

## Support

- **Issues:** [GitHub Issues](https://github.com/fareedst/hoverboard/issues)
- **Discussions:** [GitHub Discussions](https://github.com/fareedst/hoverboard/discussions)
- **Documentation:** [Project Wiki](https://github.com/fareedst/hoverboard/wiki)

## Uninstallation

### Chrome
1. Go to `chrome://extensions/`
2. Find Hoverboard in the list
3. Click "Remove"
4. Confirm removal

### Safari
1. Go to Safari > Preferences > Extensions
2. Find Hoverboard in the list
3. Click "Turn Off"
4. Optionally delete the extension file

## Privacy

Hoverboard respects your privacy:
- All data is stored locally in your browser
- No data is sent to external servers
- The extension only requests necessary permissions
- You can review all permissions in your browser's extension settings
