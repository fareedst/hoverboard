/**
 * [IMPL-PLAYWRIGHT_E2E_EXTENSION] Global setup: build extension so dist/ exists for extension E2E project.
 */
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '../..')

export default async function globalSetup () {
  execSync('npm run build:only', { cwd: rootDir, stdio: 'inherit' })
}
