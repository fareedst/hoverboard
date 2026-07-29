# [IMPL-PLAYWRIGHT_E2E_EXTENSION] [ARCH-UI_TESTABILITY] [ARCH-MESSAGE_HANDLING] [REQ-UI_INSPECTION] [REQ-THIS_PAGE_TAG_SORT] [REQ-AI_TAGGING_POPUP]
# How: build unpacked extension then drive Chromium persistent context for popup, messaging, overlay, options, side panel E2E.
INPUT: npm run test:e2e:extension; playwright.extension.config.js; built dist/ extension
OUTPUT: pass/fail Playwright reports for extension surfaces; getExtensionId for page evaluation
DATA: tests/playwright/global-setup.js; extension-fixture.js; extension-*.spec.js

# [IMPL-PLAYWRIGHT_E2E_EXTENSION] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION]
# How: global setup builds extension; fixture launches persistent context and resolves extension id.
LAUNCH_EXTENSION_CONTEXT:
  AWAIT buildExtensionDist()
  context = launchPersistentContext(userDataDir, args with --load-extension)
  extensionId = AWAIT getExtensionId(context)
  RETURN { context, extensionId }

# How: specs open popup/side panel/options pages and assert messaging/UI contracts without rewriting product logic.
RUN_EXTENSION_SPECS:
  FOR each extension-*.spec: use LAUNCH_EXTENSION_CONTEXT; exercise surface; ASSERT expectations
  RETURN
