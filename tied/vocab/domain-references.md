# Domain vocabulary index (full catalog, on-demand)

> **Primary directory entry:** [`routing.md`](routing.md) (~70 lines). Agents MUST read that file at session start (PRELOAD). Do **not** read this full catalog at bootstrap. Use this file only for the Priority/Document/Scope table, authoring-guide links, and **Cross-topic** notes when a concern spans glossaries.

**Scope:** Full on-demand directory for all domain vocabulary glossaries under `tied/vocab/`. Lists priority, scope, and cross-topic notes. This page is an **index only** — canonical terms live in the linked sibling files. Algorithms and step-by-step behavior stay in `tied/implementation-decisions/*-pseudocode.md`.

**Checklist path:** [`../docs/agent-req-implementation-checklist.yaml`](../docs/agent-req-implementation-checklist.yaml) sets `VOCAB_INDEX: ./tied/vocab`. Agents **CALL** `sub-vocabulary-sync` per [`../docs/processes.md`](../docs/processes.md) § `[PROC-VOCABULARY_INDEX]` at **three touchpoints**: **RESOLVE** at prompt intake (`translate-sponsor-intent`, `change-definition`); **PRELOAD** before reading TIED/docs/code (`session-bootstrap`, `impact-discovery`); **VALIDATE** before commit (`traceable-commit`). Inline during work: RESOLVE before naming; RECORD after artifact edits.

**Standards:** [`../docs/vocabulary-index-analysis-and-standards.md`](../docs/vocabulary-index-analysis-and-standards.md).

**See also:** [`routing.md`](routing.md) (primary entry / PRELOAD) · [`../docs/client-development-index.md`](../docs/client-development-index.md) · [`tied-methodology.md`](tied-methodology.md) · [`tied-yaml-mcp.md`](tied-yaml-mcp.md) · [`feedback-to-tied.md`](feedback-to-tied.md) · [`leap-proposal-queue.md`](leap-proposal-queue.md) · [`agentstream.md`](agentstream.md) · [`agent-stream-ruby.md`](agent-stream-ruby.md) · [`pseudocode-and-citdp.md`](pseudocode-and-citdp.md) · [`storage-backends.md`](storage-backends.md) · [`bookmarks.md`](bookmarks.md) · [`bookmarks-index.md`](bookmarks-index.md) · [`tags.md`](tags.md) · [`side-panel.md`](side-panel.md) · [`ui-surfaces.md`](ui-surfaces.md) · [`ipc-messaging.md`](ipc-messaging.md) · [`config-and-privacy.md`](config-and-privacy.md) · [`config-discovery.md`](config-discovery.md)

---

## Directory entry (bootstrap)

| Document | Role |
|----------|------|
| [`routing.md`](routing.md) | **Primary** `tied/vocab/` entry — keyword → glossary routing for PRELOAD |

---

## Canonical glossaries

| Priority | Document | Scope |
|----------|----------|-------|
| 0 | [`domain-references.md`](domain-references.md) | This full catalog (on-demand) |
| 1 | [`tied-methodology.md`](tied-methodology.md) | TIED layout, semantic tokens, module validation, bootstrap, methodology vs project YAML, PROC-* process names |
| 2 | [`tied-yaml-mcp.md`](tied-yaml-mcp.md) | TIED YAML MCP server, `tied-cli`, bundled skill, validation/verify/cycles/backlog/scoped analysis |
| 2b | [`feedback-to-tied.md`](feedback-to-tied.md) | Upstream feedback artifact (`feedback.yaml`) and MCP export |
| 3 | [`leap-proposal-queue.md`](leap-proposal-queue.md) | Non-canonical LEAP proposals, audit, diff/session import |
| 4 | [`agentstream.md`](agentstream.md) | Go `agentstream` CLI: pipeline, turns, checklist render, executor, HTML format, MCP preflight |
| 4b | [`agent-stream-ruby.md`](agent-stream-ruby.md) | Ruby ATDD runner parity with Go |
| 5 | [`pseudocode-and-citdp.md`](pseudocode-and-citdp.md) | Domain vocab vs IMPL grammar; three-way alignment; CITDP record naming |
| 6 | [`storage-backends.md`](storage-backends.md) | Storage backends, storage index, BookmarkRouter, native host / File path |
| 7 | [`bookmarks.md`](bookmarks.md) | Pinboard-shaped pin model, badge, usage tracking, state sync |
| 7b | [`bookmarks-index.md`](bookmarks-index.md) | Local Bookmarks Index, import/export, Netscape HTML, Browser Bookmark Import |
| 8 | [`tags.md`](tags.md) | Current/Recent/Suggested/Session tags, sort, AI tagging |
| 9 | [`side-panel.md`](side-panel.md) | Side panel tabs: This Page, By Tag, Tabs, Bookmarks, Usage |
| 10 | [`ui-surfaces.md`](ui-surfaces.md) | Overlay, popup, theme, badge, quick access, icon click |
| 11 | [`ipc-messaging.md`](ipc-messaging.md) | MESSAGE_TYPES, content messages, action→message bridges |
| 12 | [`config-and-privacy.md`](config-and-privacy.md) | ConfigManager keys, inhibit URLs, feature flags, AI/auth settings |
| — | [`config-discovery.md`](config-discovery.md) | Planned layered YAML config (stub; `(proposed)` terms) |

---

## Authoring guides (not glossaries)

| Document | Role |
|----------|------|
| [`../docs/client-development-index.md`](../docs/client-development-index.md) | Minimal named set for CITDP + LEAP + TIED (Core six) |
| [`../docs/vocabulary-index-analysis-and-standards.md`](../docs/vocabulary-index-analysis-and-standards.md) | Meta-standard for glossary structure and TIED integration |
| [`../docs/vocabulary-layer-tied-leap-citdp.md`](../docs/vocabulary-layer-tied-leap-citdp.md) | Outreach: Vocab understanding vs TIED intent vs CITDP vs LEAP |
| [`../docs/tied-domain-vocabulary-research-prompt.md`](../docs/tied-domain-vocabulary-research-prompt.md) | Copy-paste agent prompt to author vocab corpora in client repos |
| [`../docs/pseudocode-writing-and-validation.md`](../docs/pseudocode-writing-and-validation.md) | IMPL pseudo-code lifecycle (not domain term registry) |
| [`../docs/implementation-decisions.md`](../docs/implementation-decisions.md) | IMPL grammar vocabulary (INPUT/OUTPUT/DATA) — distinct from domain vocab |

---

## Cross-topic notes

- **STDD / TIED repository layout:** canonical domain glossaries live at `tied/vocab/<topic>.md` (no `-vocabulary` filename suffix). Meta-standard: [`../docs/vocabulary-index-analysis-and-standards.md`](../docs/vocabulary-index-analysis-and-standards.md) § STDD convention. Other TIED client repos may use `docs/*-vocabulary.md` per the replication prompt; this repo uses `tied/vocab/`.
- **agentstream** (Go product/CLI name) vs **agent-stream** (Ruby directory/package) vs **run-feature-batch** driver scripts — define once in [`agentstream.md`](agentstream.md) and [`agent-stream-ruby.md`](agent-stream-ruby.md); link from both.
- **Domain vocabulary** (this tree) vs **IMPL grammar vocabulary** (INPUT/OUTPUT/DATA keywords) — define once in [`pseudocode-and-citdp.md`](pseudocode-and-citdp.md).
- **TIED base path** / **project YAML** vs **methodology YAML** — define once in [`tied-methodology.md`](tied-methodology.md); referenced from [`tied-yaml-mcp.md`](tied-yaml-mcp.md).
- **Non-canonical LEAP proposals** (`leap-proposals/`) never mutate project TIED YAML — see [`leap-proposal-queue.md`](leap-proposal-queue.md).
- **Local (storage backend)** vs **Local Bookmarks Index** — backend `local` (`hoverboard_local_bookmarks`) is defined in [`storage-backends.md`](storage-backends.md); the management page is [`bookmarks-index.md`](bookmarks-index.md).
- **Sync (storage backend)** vs **bookmark state synchronization** — backend `sync` (`chrome.storage.sync`) in [`storage-backends.md`](storage-backends.md); cross-surface pin/tag broadcast (`BOOKMARK_UPDATED`) in [`bookmarks.md`](bookmarks.md) / [`ipc-messaging.md`](ipc-messaging.md).
- **pin / bookmark** vs **Pinboard** — pin record shape and UI dual names in [`bookmarks.md`](bookmarks.md); Pinboard as product/API/backend in [`bookmarks.md`](bookmarks.md) and [`storage-backends.md`](storage-backends.md).
- **Bookmarks overloaded** — Hoverboard-stored pins ([`bookmarks.md`](bookmarks.md)), side-panel **Bookmarks** tab (Chrome tree UI, [`side-panel.md`](side-panel.md) / [REQ-SIDE_PANEL_BROWSER_BOOKMARKS](../requirements/REQ-SIDE_PANEL_BROWSER_BOOKMARKS.yaml)), **Local Bookmarks Index** ([`bookmarks-index.md`](bookmarks-index.md)), and **Browser storage (backend)** / Store B ([`storage-backends.md`](storage-backends.md) / [REQ-BROWSER_BOOKMARK_STORAGE](../requirements/REQ-BROWSER_BOOKMARK_STORAGE.yaml)) are distinct. **Browser Bookmark Import** copies FROM the Chrome tree INTO Local|File|Sync only (Browser excluded as Import-to target).
- **hover / overlay** vs **Hoverboard** — product name vs on-page overlay UI; preferred terms in [`ui-surfaces.md`](ui-surfaces.md).
- **Recent Tags** vs **getRecentBookmarks** — recent tag chips ([`tags.md`](tags.md)) vs aggregated recent pin list ([`storage-backends.md`](storage-backends.md) / [`ipc-messaging.md`](ipc-messaging.md)).
- **browser API shim** vs **Safari App Extension (deferred)** — shared `browser` export in `src/shared/safari-shim.js` (historical filename) is Chrome-first under [REQ-CROSS_BROWSER](../requirements/REQ-CROSS_BROWSER.yaml) / [`platform-targets.md`](platform-targets.md); Safari product package is Deferred ([REQ-SAFARI_ADAPTATION](../requirements.yaml)). **API availability checks** are not Safari product support.

---

## Preferred terms vs synonyms (directory entry)

| Preferred | Avoid | Notes |
|-----------|-------|-------|
| **routing.md** | `domain-references-routing.md` | Primary `tied/vocab/` directory entry; PRELOAD starts here |
| **routing index** / **Vocab directory routing index** | Domain vocabulary routing index (old title) | Lightweight keyword → glossary table in `routing.md` |
| **full catalog** / **domain-references.md** (on-demand) | “canonical index read at bootstrap” | This file — Priority table, authoring guides, cross-topic notes only |

---

## Alphabetical index

| Term | Section |
|------|---------|
| agent-stream | Cross-topic notes |
| agentstream | Cross-topic notes |
| API availability check | Cross-topic notes |
| Bookmarks overloaded | Cross-topic notes |
| browser API shim vs Safari App Extension | Cross-topic notes |
| Domain vocabulary index | Title |
| domain-references.md | Preferred terms (directory entry) |
| full catalog | Preferred terms (directory entry) |
| hover / overlay vs Hoverboard | Cross-topic notes |
| IMPL grammar vocabulary | Authoring guides |
| Local vs Local Bookmarks Index | Cross-topic notes |
| pin vs Pinboard | Cross-topic notes |
| Recent Tags vs getRecentBookmarks | Cross-topic notes |
| routing index | Preferred terms (directory entry) |
| routing.md | Directory entry (bootstrap) |
| sub-vocabulary-sync | Scope |
| Sync vs state synchronization | Cross-topic notes |
| VOCAB_INDEX | Scope |
| Vocab directory routing index | Preferred terms (directory entry) |
