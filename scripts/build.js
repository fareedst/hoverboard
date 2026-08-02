/**
 * === IMPL-FULL-BLOCK: IMPL-POPUP_BUNDLE ===
 * [IMPL-POPUP_BUNDLE] [ARCH-EXTENSION_BUNDLED_ENTRY_POINTS] [REQ-EXTENSION_BUNDLED_ENTRY_POINTS] — Bundle popup entry and dependencies so no bare specifiers at runtime. Contract: source and deps in; single bundle out; build config and skip list.
 * 
 * ## MAIN
 * 
 * - [IMPL-POPUP_BUNDLE] [ARCH-EXTENSION_BUNDLED_ENTRY_POINTS] [REQ-EXTENSION_BUNDLED_ENTRY_POINTS] How: Logical block for IMPL-POPUP_BUNDLE.
 * - Contract:
 *   - INPUT: source src/ui/popup/popup.js and its dependency graph
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: single bundle dist/src/ui/popup/popup.js with all deps inlined; no bare specifiers at runtime
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: build config (e.g. rollup/vite); copyDir skip list for popup.js
 *   - EFFECTS: Http
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Bundle entry and all imports into single file.
 *   - 1. build:popup:
 *   - 2.   ENTRY = src/ui/popup/popup.js
 *   - 3.   BUNDLE ENTRY and all imports into dist/src/ui/popup/popup.js
 *   - 4.   INLINE fast-xml-parser, TagService, PinboardService, etc.
 *   - How (sub-block): Skip popup.js in copy so only bundle is in dist.
 *   - 5. copyDir (scripts/build.js):
 *   - 6.   SKIP src/ui/popup/popup.js so only the bundle is in dist
 * 
 * === END IMPL-FULL-BLOCK: IMPL-POPUP_BUNDLE ===
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Ensure dist directory exists
if (!fs.existsSync(path.join(rootDir, 'dist'))) {
    fs.mkdirSync(path.join(rootDir, 'dist'));
}

// Build service worker with dependencies
console.log('Building service worker...');
execSync('npm run build:sw', { stdio: 'inherit' });

// Build options page with dependencies
console.log('Building options page...');
execSync('npm run build:options', { stdio: 'inherit' });

// Build content scripts with dependencies
console.log('Building content scripts...');
execSync('npm run build:content', { stdio: 'inherit' });

// Build popup with dependencies (so fast-xml-parser etc. are bundled; unbundled popup would load raw pinboard-service.js)
console.log('Building popup...');
execSync('npm run build:popup', { stdio: 'inherit' });

/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_BUNDLE ===
 * [IMPL-SIDE_PANEL_BUNDLE] [ARCH-SIDE_PANEL_BUNDLE] [REQ-SIDE_PANEL_BUNDLE_SIZE] [IMPL-SIDE_PANEL_TABS] How: scripts/build.js writes build-info.js with BUILD_TIME_UTC then invokes BUILD_EXTENSION_ENTRIES for side-panel.
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_BUNDLE ===
 */
const buildInfoPath = path.join(rootDir, 'src', 'ui', 'side-panel', 'build-info.js');
const buildTimeUtc = new Date().toISOString().slice(0, 16).replace('T', ' ');
fs.writeFileSync(buildInfoPath, `/**
 * [IMPL-SIDE_PANEL_TABS] Build-time compile time (UTC). Overwritten by scripts/build.js before side-panel bundle.
 * Format: YYYY-MM-DD HH:mm
 */
export const BUILD_TIME_UTC = '${buildTimeUtc}'
`);
console.log('Building side panel...');
execSync('npm run build:side-panel', { stdio: 'inherit' });

// Copy manifest
fs.copyFileSync(
    path.join(rootDir, 'manifest.json'),
    path.join(rootDir, 'dist', 'manifest.json')
);

// Copy source files
const copyDir = (src, dest) => {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            // Skip files that are built separately
            if (entry.name === 'service-worker.js') continue;
            if (srcPath.includes('ui/options/options.js')) continue;
            if (srcPath.includes('features/content/content-main.js')) continue;
            if (srcPath.includes('ui/popup/popup.js')) continue;
            if (srcPath.includes('ui/side-panel/side-panel.js')) continue;
            fs.copyFileSync(srcPath, destPath);
        }
    }
};

// Copy necessary directories
  copyDir(path.join(rootDir, 'src'), path.join(rootDir, 'dist', 'src'));
copyDir(path.join(rootDir, 'icons'), path.join(rootDir, 'dist', 'icons'));
copyDir(path.join(rootDir, '_locales'), path.join(rootDir, 'dist', '_locales'));
// Copy UI root-level HTML and assets for extension
copyDir(path.join(rootDir, 'src/ui/popup'), path.join(rootDir, 'dist/ui/popup'));
copyDir(path.join(rootDir, 'src/ui/options'), path.join(rootDir, 'dist/ui/options'));

console.log('Build completed successfully!'); 