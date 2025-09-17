#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Read package.json to get version
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const version = packageJson.version;

console.log(`Creating release for version ${version}...`);

// Ensure dist directory exists
if (!fs.existsSync(path.join(rootDir, 'dist'))) {
    console.log('Building extension...');
    execSync('npm run build:prod', { stdio: 'inherit', cwd: rootDir });
}

// Create releases directory
const releasesDir = path.join(rootDir, 'releases');
if (!fs.existsSync(releasesDir)) {
    fs.mkdirSync(releasesDir);
}

// Create Chrome extension zip
console.log('Creating Chrome extension zip...');
const chromeZipPath = path.join(releasesDir, `hoverboard-chrome-extension-v${version}.zip`);
execSync(`cd dist && zip -r "${chromeZipPath}" .`, { stdio: 'inherit' });

// Create Safari extension zip if Safari build exists
const safariDistPath = path.join(rootDir, 'safari', 'dist');
if (fs.existsSync(safariDistPath)) {
    console.log('Creating Safari extension zip...');
    const safariZipPath = path.join(releasesDir, `hoverboard-safari-extension-v${version}.zip`);
    execSync(`cd safari/dist && zip -r "${safariZipPath}" .`, { stdio: 'inherit' });
}

// Create source zip
console.log('Creating source zip...');
const sourceZipPath = path.join(releasesDir, `hoverboard-source-v${version}.zip`);
execSync(`git archive --format=zip --output="${sourceZipPath}" HEAD`, { stdio: 'inherit', cwd: rootDir });

console.log('Release files created:');
console.log(`- Chrome Extension: ${chromeZipPath}`);
if (fs.existsSync(safariDistPath)) {
    console.log(`- Safari Extension: ${path.join(releasesDir, `hoverboard-safari-extension-v${version}.zip`)}`);
}
console.log(`- Source Code: ${sourceZipPath}`);

console.log('\nTo create a GitHub release:');
console.log('1. Go to https://github.com/fareedst/hoverboard/releases');
console.log('2. Click "Create a new release"');
console.log(`3. Create tag: v${version}`);
console.log(`4. Title: Hoverboard v${version}`);
console.log('5. Upload the zip files from the releases/ directory');
console.log('6. Publish the release');
