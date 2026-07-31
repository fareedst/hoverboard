# Composition edge classification (seed inventory)

**Date:** 2026-07-30
**Tokens:** [REQ-COMPOSITION_TEST_RECOGNITION] · [ARCH-COMPOSITION_TEST_PATTERNS] · [IMPL-COMPOSITION_TEST_PATTERNS]
**Vocab:** [`tied/vocab/test-composition.md`](../vocab/test-composition.md)
**Report:** `npm run composition:plan` regenerates live status from Active IMPLs + integration suites.

Status values: `covered` | `partial` | `unit-only` | `candidate` | `e2e_only`.

---

## Covered (dedicated composition / integration suite)

| Pattern | Edge (source → target / units) | Suite |
|---------|--------------------------------|-------|
| `MESSAGE_DISPATCH` | MessageHandler / SW message → handler → response | `message-handler-router-storage.integration.test.js`, `link-health.integration.test.js`, `local-query-api-snapshot.integration.test.js` |
| `ROUTER_STORAGE` | MessageHandler → BookmarkRouter → StorageIndex → provider | `message-handler-router-storage.integration.test.js`, `move-bookmark-preferred-backend.integration.test.js` |
| `UI_EMIT_COMMAND` | UIManager emit → PopupController → sendMessage | `library-search-entry.integration.test.js`, `bookmark-notes-ui.integration.test.js` |
| `ORCHESTRATOR_STATUS` | Index helper → message → status DOM / callback | `bookmarks-table-bulk-delete-composition.integration.test.js`, `bookmarks-table-link-health-composition.integration.test.js`, `bookmarks-table-api-snapshot-composition.integration.test.js` |
| `LAZY_INIT_GUARD` | Side-panel tab switch → one-shot Tabs init | `browser-tabs-tab-composition.integration.test.js` |
| `EVENT_REFRESH_GUARD` | Window focus / tab change → guards → refresh | `window-focus-recent-tags-composition.integration.test.js`, `side-panel-tab-change-injection.integration.test.js` |
| `ORDERED_ASYNC_HANDOFF` | PopupController load/sort → ordered UI paint | `this-page-tag-sort-composition.integration.test.js` |
| `NATIVE_ADAPTER_CALLBACK` | SW → native/file → normalized result | `local-query-api-snapshot-write.integration.test.js` |
| `SCOPED_DOM_BINDING` | `createPopup({ container })` → scoped UIManager | `side-panel-create-popup-scoped-composition.integration.test.js` |
| Config load path | ConfigManager ↔ storage load | `config-manager-load.integration.test.js` |
| `MESSAGE_DISPATCH` + timeout | Popup sendToTab timeout / selection | `popup-message-timeout-composition.integration.test.js` |
| `UI_EMIT_COMMAND` | openTagsTree → OPEN_SIDE_PANEL | `popup-open-tags-tree-composition.integration.test.js` |
| `UI_EMIT_COMMAND` | Suggested-tag chip → addTag | `suggested-tag-chip-composition.integration.test.js` |
| `MESSAGE_DISPATCH` | missing message response unwrap | `message-response-missing-composition.integration.test.js` |
| Capture UI health hint | PopupController → GET_LINK_HEALTH → setLinkHealthHint | `popup-link-health-hint-composition.integration.test.js` |

## Partial / unit-adjacent

| Pattern | Edge | Evidence | Notes |
|---------|------|----------|-------|
| Notes save UI | UIManager notes → PopupController | `bookmark-notes-ui.integration.test.js` | UI emit covered; full notes → router → provider chain is candidate |
| Options link-health checkbox | OptionsController load/save ↔ ConfigManager | `tests/unit/options-link-health.test.js` | Unit covers checkbox ↔ `linkHealthChecksEnabled`; no options.html E2E |

## Candidates (prioritized for composition suites)

| Pattern | Edge | Suggested suite path |
|---------|------|----------------------|
| `ORCHESTRATOR_STATUS` / Index | Index add-tags / import / export / regex-replace orchestrators | `tests/integration/bookmarks-table-*-composition.integration.test.js` (extend family) |
| `MESSAGE_DISPATCH` | Browser-tabs batch bookmark + referrer contracts | `tests/integration/browser-tabs-batch-bookmark-composition.integration.test.js` |
| `ROUTER_STORAGE` | Notes-save through message → router → provider | `tests/integration/notes-save-router-composition.integration.test.js` |
| Config / flags | Migration / backup / feature-flag boundaries | classify via report; add composition only when binding is real |

## Justified e2e_only

| Edge | Constraint |
|------|------------|
| Safari App Extension packaging (`IMPL-SAFARI_ADAPTATION`) | Separate Safari product host; not Chromium MV3 composition-simulable |
| Web Store / multi-window OS chrome | Real browser chrome / store surfaces cannot be faithfully simulated in JSDOM composition |
| Native OS dialogs where no adapter mock exists | Named platform constraint in IMPL `e2e_only_reason` |

---

## Regeneration note

Treat this file as the **seed** classification. After tooling lands, prefer the machine report from `scripts/composition-test-plan.js` and update this inventory only when human overrides (especially `e2e_only` justifications) change.
