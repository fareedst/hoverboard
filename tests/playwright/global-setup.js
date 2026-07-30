/**
 * === IMPL-FULL-BLOCK: IMPL-PLAYWRIGHT_E2E_EXTENSION ===
 * [IMPL-PLAYWRIGHT_E2E_EXTENSION] [ARCH-UI_TESTABILITY] [ARCH-MESSAGE_HANDLING] [REQ-UI_INSPECTION] [REQ-THIS_PAGE_TAG_SORT] [REQ-AI_TAGGING_POPUP] — How: build unpacked extension then drive Chromium persistent context for popup, messaging, overlay, options, side panel E2E.
 * 
 * ## LAUNCH_EXTENSION_CONTEXT
 * 
 * - [IMPL-PLAYWRIGHT_E2E_EXTENSION] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] How: global setup builds extension; fixture launches persistent context and resolves extension id.
 * - Contract:
 *   - INPUT: npm run test:e2e:extension; playwright.extension.config.js; built dist/ extension
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: pass/fail Playwright reports for extension surfaces; getExtensionId for page evaluation | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: tests/playwright/global-setup.js; extension-fixture.js; extension-*.spec.js
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: LAUNCH_EXTENSION_CONTEXT
 *   - AWAIT buildExtensionDist()
 *   - context = launchPersistentContext(userDataDir, args with --load-extension)
 *   - extensionId = AWAIT getExtensionId(context)
 *   - RETURN { context, extensionId }
 *   - How (sub-block): How: specs open popup/side panel/options pages and assert messaging/UI contracts without rewriting product logic.
 * 
 * ## RUN_EXTENSION_SPECS
 * 
 * - [IMPL-PLAYWRIGHT_E2E_EXTENSION] [ARCH-UI_TESTABILITY] [ARCH-MESSAGE_HANDLING] [REQ-UI_INSPECTION] [REQ-THIS_PAGE_TAG_SORT] [REQ-AI_TAGGING_POPUP] How: Implements RUN_EXTENSION_SPECS behavior for IMPL-PLAYWRIGHT_E2E_EXTENSION.
 * - Contract:
 *   - INPUT: npm run test:e2e:extension; playwright.extension.config.js; built dist/ extension
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: pass/fail Playwright reports for extension surfaces; getExtensionId for page evaluation | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: tests/playwright/global-setup.js; extension-fixture.js; extension-*.spec.js
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: RUN_EXTENSION_SPECS
 *   - FOR each extension-*.spec: use LAUNCH_EXTENSION_CONTEXT; exercise surface; ASSERT expectations
 *   - RETURN
 * 
 * === END IMPL-FULL-BLOCK: IMPL-PLAYWRIGHT_E2E_EXTENSION ===
 */
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '../..')

export default async function globalSetup () {
  execSync('npm run build:only', { cwd: rootDir, stdio: 'inherit' })
}
