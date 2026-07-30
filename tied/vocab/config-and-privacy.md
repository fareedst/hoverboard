# Config, privacy, and site management (canonical)

**Scope:** **ConfigManager** storage keys and default settings (`hoverboard_settings`, storage mode, theme, badge, recent-tags, AI, icon-click), **inhibit URLs** / **site management**, privacy-related defaults, backup/restore, migration, and feature flags. **Vocabulary only** — merge/migrate algorithms stay in IMPL.

**Excludes:** Overlay/popup chrome labels (see [`ui-surfaces.md`](ui-surfaces.md)); backend routing semantics (see [`storage-backends.md`](storage-backends.md)); AI chip UX beyond config keys (see [`tags.md`](tags.md)).

**Traceability:** [REQ-CONFIGURATION](../requirements/REQ-CONFIGURATION.yaml) · [REQ-CONFIG_PORTABILITY](../requirements/REQ-CONFIG_PORTABILITY.yaml) · [REQ-SITE_MANAGEMENT](../requirements/REQ-SITE_MANAGEMENT.yaml) · [REQ-PRIVACY_CONTROLS](../requirements/REQ-PRIVACY_CONTROLS.yaml) · [REQ-STORAGE_MODE_DEFAULT](../requirements/REQ-STORAGE_MODE_DEFAULT.yaml) · [REQ-BROWSER_BOOKMARK_STORAGE](../requirements/REQ-BROWSER_BOOKMARK_STORAGE.yaml) · [REQ-AI_TAGGING_CONFIG](../requirements/REQ-AI_TAGGING_CONFIG.yaml) · [REQ-ICON_CLICK_BEHAVIOR](../requirements/REQ-ICON_CLICK_BEHAVIOR.yaml) · [ARCH-CONFIG_STRUCTURE](../architecture-decisions/ARCH-CONFIG_STRUCTURE.yaml) · [ARCH-PRIVACY](../architecture-decisions/ARCH-PRIVACY.yaml) · [ARCH-SITE_MGMT](../architecture-decisions/ARCH-SITE_MGMT.yaml) · [IMPL-CONFIG_STRUCT](../implementation-decisions/IMPL-CONFIG_STRUCT.yaml) · [IMPL-CONFIG_BACKUP_RESTORE](../implementation-decisions/IMPL-CONFIG_BACKUP_RESTORE.yaml) · [IMPL-CONFIG_MIGRATION](../implementation-decisions/IMPL-CONFIG_MIGRATION.yaml) · [IMPL-FEATURE_FLAGS](../implementation-decisions/IMPL-FEATURE_FLAGS.yaml) · [IMPL-URL_INHIBITION](../implementation-decisions/IMPL-URL_INHIBITION.yaml) · [IMPL-PRIVACY](../implementation-decisions/IMPL-PRIVACY.yaml) · [IMPL-AI_CONFIG_OPTIONS](../implementation-decisions/IMPL-AI_CONFIG_OPTIONS.yaml)

**See also:** [`storage-backends.md`](storage-backends.md) · [`ui-surfaces.md`](ui-surfaces.md) · [`tags.md`](tags.md) · [`ipc-messaging.md`](ipc-messaging.md) · [`domain-references.md`](domain-references.md) · `src/config/config-manager.js` · `src/ui/options/options.html`

---

## Preferred terms vs synonyms

| Preferred | Avoid / demote | Notes |
|-----------|----------------|-------|
| **ConfigManager** | settings manager | Owns keys, defaults, merge |
| **Chrome storage settings** ([ARCH-STORAGE](../architecture-decisions/ARCH-STORAGE.yaml)) | storage strategy (alone), bookmark storage | `chrome.storage.sync`/`local` for settings and config portability — **not** bookmark **storage backends** ([`storage-backends.md`](storage-backends.md) / [ARCH-STORAGE_INDEX_AND_ROUTER](../architecture-decisions/ARCH-STORAGE_INDEX_AND_ROUTER.yaml)) |
| **hoverboard_settings** | settings blob | Primary merged settings object key |
| **storage mode** | storage backend default | Global default; key `hoverboard_storage_mode`; values `pinboard` \| `local` \| `file` \| `sync` \| `browser` (see [`storage-backends.md`](storage-backends.md); **Browser** ≠ **Local**) |
| **inhibit URL** / **disabled sites** | blocklist | User-configured domains where extension will not activate — **not** browser **non-scriptable URL** ([`side-panel.md`](side-panel.md) / [`ui-surfaces.md`](ui-surfaces.md)) |
| **non-scriptable URL** | restricted host (alone) | Chrome forbids scripting (schemes + Web Store / gallery); classifier in `script-injection-eligibility.js`; distinct from **inhibit URL** |
| **site management** | inhibit list UI | Options section for disabled sites |
| **URL inhibition** | inhibit on load | Implementation of disabled sites (`INHIBIT_URL`) |
| **feature flags** | toggles | Config booleans such as `showHoverOnPageLoad` |
| **backup / restore** | export settings | Config portability |
| **config migration** | settings upgrade | Schema/key migrations across versions |
| **Pinboard API Token** | auth token (UI) | `username:XXXXXXXX`; key `hoverboard_auth_token` |
| **AI API key** | provider secret | `aiApiKey`; empty disables AI tagging |

---

## Naming bridge: storage keys and config fields

| Canonical concept | Options UI | Storage key / field | Default (notable) |
|-------------------|------------|---------------------|-------------------|
| Merged settings | Options page | `hoverboard_settings` | see `getDefaultConfiguration` |
| Auth token | Authentication | `hoverboard_auth_token` | — |
| Default backend | Storage Mode (Local / Pinboard / File / Sync / Browser) | `hoverboard_storage_mode` / `storageMode` | `local` (`pinboard`\|`local`\|`file`\|`sync`\|`browser`; [REQ-BROWSER_BOOKMARK_STORAGE](../requirements/REQ-BROWSER_BOOKMARK_STORAGE.yaml)) |
| Disabled sites | Site Management | `hoverboard_inhibit_urls` | — |
| Legacy recent tags key | — | `hoverboard_recent_tags` | — |
| Tag frequency | — | `hoverboard_tag_frequency` | — |
| Shared recent tags | — | `recentTagsSharedMemoryKey` → `hoverboard_recent_tags_shared` | — |
| Auto-show overlay | Show on page load | `showHoverOnPageLoad` | `false` |
| Theme | Dark/Light | `defaultVisibilityTheme` | `light-on-dark` |
| Transparency | Opacity | `defaultTransparencyEnabled`, `defaultBackgroundOpacity` | `false`, `90` |
| Badge texts | Badge Settings | `badgeTextIfNotBookmarked`, `badgeTextIfPrivate`, `badgeTextIfQueued`, `badgeTextIfBookmarkedNoTags` | `-`, `*`, `!`, `0` |
| AI | AI Tagging | `aiApiKey`, `aiProvider`, `aiTagLimit` | `''`, `openai`, `64` |
| Icon click | Extension icon | `iconClickOpensSidePanel` | `true` |
| File path | File storage path | `hoverboard_file_storage_path` | `~/.hoverboard` |
| File configured | — | `hoverboard_file_storage_configured` | — |
| Strip URL hash | Advanced | `uxUrlStripHash` | `false` |
| Auto-close timeout | Advanced | `uxAutoCloseTimeout` | `0` |

---

## Named concepts

- **ConfigManager** — Loads/saves prefixed keys; supplies defaults for all feature flags.
- **inhibit URL** — Domain entry preventing activation; message `INHIBIT_URL`.
- **privacy controls** — Defaults and UI favoring private bookmarks and minimal auto-show.
- **feature flags** — Boolean and numeric settings controlling overlay, recent rows, badge, AI, icon click.
- **backup / restore** — Portable config export/import ([REQ-CONFIG_PORTABILITY](../requirements/REQ-CONFIG_PORTABILITY.yaml)).
- **config migration** — Upgrades older key shapes to current schema.
- **Test API key** — Options control validating AI credentials without tagging a page.

---

## Pseudo-code block names

| Preferred term / concept | Procedure / block (existing) | Owning IMPL |
|--------------------------|------------------------------|-------------|
| Default configuration | `getDefaultConfiguration` | [IMPL-CONFIG_STRUCT](../implementation-decisions/IMPL-CONFIG_STRUCT.yaml) / [IMPL-FEATURE_FLAGS](../implementation-decisions/IMPL-FEATURE_FLAGS.yaml) |
| Backup/restore | `(proposed) CONFIG_BACKUP_RESTORE` | [IMPL-CONFIG_BACKUP_RESTORE](../implementation-decisions/IMPL-CONFIG_BACKUP_RESTORE.yaml) |
| Migration | `(proposed) CONFIG_MIGRATE` | [IMPL-CONFIG_MIGRATION](../implementation-decisions/IMPL-CONFIG_MIGRATION.yaml) |
| Inhibit URL | `(proposed) INHIBIT_URL_APPLY` | [IMPL-URL_INHIBITION](../implementation-decisions/IMPL-URL_INHIBITION.yaml) |

---

## Alphabetical index

| Term | Section |
|------|---------|
| AI API key | Preferred terms |
| backup / restore | Preferred terms |
| ConfigManager | Preferred terms |
| config migration | Preferred terms |
| feature flags | Preferred terms |
| hoverboard_settings | Preferred terms |
| inhibit URL | Preferred terms |
| non-scriptable URL | Preferred terms |
| Pinboard API Token | Preferred terms |
| site management | Preferred terms |
| storage mode | Preferred terms |
| Test API key | Named concepts |
| URL inhibition | Preferred terms |
