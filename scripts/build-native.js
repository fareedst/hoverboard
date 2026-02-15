/**
 * [IMPL-NATIVE_HOST_WRAPPER] Build native host binary and copy artifacts to dist/native_host/
 * Requires Go. Run from project root.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const nativeDir = path.join(rootDir, 'native_host');
const destDir = path.join(rootDir, 'dist', 'native_host');

if (!fs.existsSync(nativeDir)) {
  console.error('native_host/ not found');
  process.exit(1);
}

console.log('Building native host (Go)...');
execSync('go build -o native_host .', { cwd: nativeDir, stdio: 'inherit' });

if (!fs.existsSync(path.join(rootDir, 'dist'))) {
  fs.mkdirSync(path.join(rootDir, 'dist'), { recursive: true });
}
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const artifacts = [
  'helper.sh',
  'helper.ps1',
  'com.hoverboard.native_host.json.template',
  'install.sh',
  'install.ps1'
];

for (const name of artifacts) {
  const src = path.join(nativeDir, name);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(destDir, name));
    console.log('Copied', name);
  }
}

// Go produces native_host on Unix, native_host.exe on Windows
const binaryWin = path.join(nativeDir, 'native_host.exe');
const binaryUnix = path.join(nativeDir, 'native_host');
if (fs.existsSync(binaryWin)) {
  fs.copyFileSync(binaryWin, path.join(destDir, 'native_host.exe'));
  console.log('Copied native_host.exe');
} else if (fs.existsSync(binaryUnix)) {
  fs.copyFileSync(binaryUnix, path.join(destDir, 'native_host'));
  console.log('Copied native_host');
}

console.log('Native host build complete:', destDir);
