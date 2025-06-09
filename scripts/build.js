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

// Copy manifest
fs.copyFileSync(
    path.join(rootDir, 'manifest.v3.json'),
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
            fs.copyFileSync(srcPath, destPath);
        }
    }
};

// Copy necessary directories
copyDir(path.join(rootDir, 'src-new'), path.join(rootDir, 'dist', 'src-new'));
copyDir(path.join(rootDir, 'icons'), path.join(rootDir, 'dist', 'icons'));
copyDir(path.join(rootDir, '_locales'), path.join(rootDir, 'dist', '_locales'));

console.log('Build completed successfully!'); 