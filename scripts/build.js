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