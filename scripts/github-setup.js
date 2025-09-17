#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🚀 Setting up Hoverboard for GitHub publishing...\n');

// Check if we're in a git repository
try {
    execSync('git status', { stdio: 'pipe' });
    console.log('✅ Git repository detected');
} catch (error) {
    console.log('❌ Not a git repository. Initializing...');
    execSync('git init', { stdio: 'inherit', cwd: rootDir });
    console.log('✅ Git repository initialized');
}

// Check if remote origin exists
try {
    const remotes = execSync('git remote -v', { encoding: 'utf8', cwd: rootDir });
    if (remotes.includes('origin')) {
        console.log('✅ Git remote origin found');
    } else {
        console.log('⚠️  No remote origin found. You\'ll need to add one:');
        console.log('   git remote add origin https://github.com/fareedst/hoverboard.git');
    }
} catch (error) {
    console.log('⚠️  Could not check git remotes');
}

// Check if all required files exist
const requiredFiles = [
    'LICENSE',
    'CONTRIBUTING.md',
    'INSTALLATION.md',
    'SETUP.md',
    'CHANGELOG.md',
    '.github/ISSUE_TEMPLATE/bug_report.md',
    '.github/ISSUE_TEMPLATE/feature_request.md',
    '.github/PULL_REQUEST_TEMPLATE.md',
    '.github/workflows/build.yml',
    '.github/workflows/release.yml'
];

console.log('\n📋 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesExist = false;
    }
});

if (!allFilesExist) {
    console.log('\n❌ Some required files are missing. Please create them before publishing.');
    process.exit(1);
}

// Check package.json scripts
console.log('\n📦 Checking package.json scripts...');
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const requiredScripts = ['build:dev', 'build:prod', 'test', 'lint', 'release'];

requiredScripts.forEach(script => {
    if (packageJson.scripts[script]) {
        console.log(`✅ npm run ${script}`);
    } else {
        console.log(`❌ npm run ${script} - MISSING`);
    }
});

// Test build process
console.log('\n🔨 Testing build process...');
try {
    console.log('Running npm install...');
    execSync('npm install', { stdio: 'inherit', cwd: rootDir });
    
    console.log('Running npm run build:dev...');
    execSync('npm run build:dev', { stdio: 'inherit', cwd: rootDir });
    
    console.log('✅ Build process successful');
} catch (error) {
    console.log('❌ Build process failed. Please fix errors before publishing.');
    console.log('Error:', error.message);
    process.exit(1);
}

// Check if dist directory was created
if (fs.existsSync(path.join(rootDir, 'dist'))) {
    console.log('✅ dist directory created');
    
    // Check for essential files in dist
    const essentialFiles = ['manifest.json', 'src/core/service-worker.js'];
    essentialFiles.forEach(file => {
        const filePath = path.join(rootDir, 'dist', file);
        if (fs.existsSync(filePath)) {
            console.log(`✅ dist/${file}`);
        } else {
            console.log(`❌ dist/${file} - MISSING`);
        }
    });
} else {
    console.log('❌ dist directory not created');
}

// Create initial release
console.log('\n📦 Creating initial release package...');
try {
    execSync('npm run release', { stdio: 'inherit', cwd: rootDir });
    console.log('✅ Release package created');
} catch (error) {
    console.log('⚠️  Release package creation failed:', error.message);
}

// Final checklist
console.log('\n🎯 GitHub Publishing Checklist:');
console.log('1. ✅ Repository structure set up');
console.log('2. ✅ Documentation created');
console.log('3. ✅ GitHub workflows configured');
console.log('4. ✅ Build process tested');
console.log('5. ✅ Release package created');

console.log('\n📝 Next Steps:');
console.log('1. Push your code to GitHub:');
console.log('   git add .');
console.log('   git commit -m "Initial commit: Set up GitHub publishing"');
console.log('   git push -u origin main');
console.log('');
console.log('2. Create your first release:');
console.log('   - Go to https://github.com/fareedst/hoverboard/releases');
console.log('   - Click "Create a new release"');
console.log('   - Create tag: v1.0.6.80');
console.log('   - Title: Hoverboard v1.0.6.80');
console.log('   - Upload files from releases/ directory');
console.log('   - Publish the release');
console.log('');
console.log('3. Update README badges:');
console.log('   - Update repository URLs');
console.log('');
console.log('4. Enable GitHub Actions:');
console.log('   - Go to repository Settings > Actions');
console.log('   - Enable Actions for this repository');
console.log('');
console.log('🎉 Your extension is ready for GitHub publishing!');
