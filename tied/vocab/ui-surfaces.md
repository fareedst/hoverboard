# UI surfaces: overlay, popup, badge, quick access (canonical)

**Scope:** On-page **overlay** / **hover**, toolbar **popup**, **badge**, **theme**, **quick access** (extension commands + context menu), and **icon-click** behavior (side panel vs popup). **Vocabulary only** — show/hide and action-dispatch algorithms stay in IMPL.

**Excludes:** Side-panel tab interiors (see [`side-panel.md`](side-panel.md)); Options site-management and AI keys (see [`config-and-privacy.md`](config-and-privacy.md)); pin field semantics (see [`bookmarks.md`](bookmarks.md)).

**Traceability:** [REQ-OVERLAY_SYSTEM](../requirements/REQ-OVERLAY_SYSTEM.yaml) · [REQ-OVERLAY_AUTO_SHOW_CONTROL](../requirements/REQ-OVERLAY_AUTO_SHOW_CONTROL.yaml) · [REQ-OVERLAY_CONTROL_LAYOUT](../requirements/REQ-OVERLAY_CONTROL_LAYOUT.yaml) · [REQ-OVERLAY_REFRESH_ACTION](../requirements/REQ-OVERLAY_REFRESH_ACTION.yaml) · [REQ-POPUP_PERSISTENT_SESSION](../requirements/REQ-POPUP_PERSISTENT_SESSION.yaml) · [REQ-DARK_THEME](../requirements/REQ-DARK_THEME.yaml) · [REQ-BADGE_INDICATORS](../requirements/REQ-BADGE_INDICATORS.yaml) · [REQ-QUICK_ACCESS_ENTRY](../requirements/REQ-QUICK_ACCESS_ENTRY.yaml) · [REQ-ICON_CLICK_BEHAVIOR](../requirements/REQ-ICON_CLICK_BEHAVIOR.yaml) · [REQ-PAGE_ARCHIVE_STORAGE](../requirements/REQ-PAGE_ARCHIVE_STORAGE.yaml) · [ARCH-OVERLAY](../architecture-decisions/ARCH-OVERLAY.yaml) · [ARCH-POPUP_SESSION](../architecture-decisions/ARCH-POPUP_SESSION.yaml) · [ARCH-THEME](../architecture-decisions/ARCH-THEME.yaml) · [ARCH-QUICK_ACCESS_ENTRY](../architecture-decisions/ARCH-QUICK_ACCESS_ENTRY.yaml) · [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION](../architecture-decisions/ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION.yaml) · [IMPL-OVERLAY](../implementation-decisions/IMPL-OVERLAY.yaml) · [IMPL-POPUP_SESSION](../implementation-decisions/IMPL-POPUP_SESSION.yaml) · [IMPL-THEME](../implementation-decisions/IMPL-THEME.yaml) · [IMPL-ICON_CLICK_BEHAVIOR](../implementation-decisions/IMPL-ICON_CLICK_BEHAVIOR.yaml) · [IMPL-UI_ACTION_CONTRACT](../implementation-decisions/IMPL-UI_ACTION_CONTRACT.yaml) · [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION](../implementation-decisions/IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION.yaml)

**See also:** [`side-panel.md`](side-panel.md) · [`bookmarks.md`](bookmarks.md) · [`tags.md`](tags.md) · [`ipc-messaging.md`](ipc-messaging.md) · [`config-and-privacy.md`](config-and-privacy.md) · [`domain-references.md`](domain-references.md)

---

## Preferred terms vs synonyms

| Preferred | Avoid / demote | Notes |
|-----------|----------------|-------|
| **Hoverboard** | the extension (alone) | Product name |
| **overlay** | hover overlay, bottom bar | On-page bookmark UI — preferred technical term |
| **Show Hover** | show overlay (UI) | Preferred action label to display overlay |
| **hover** | — | Acceptable synonym in UI copy (“Show Hover”); do not confuse with product name |
| **Show on page load** | Hover Auto-Show (UI) | Checkbox / config `showHoverOnPageLoad` |
| **popup** | toolbar popup | Extension action popup; persistent session (no `window.close` on actions) |
| **PopupController** / **UIManager** / **StateManager** | popup MVC pieces | Code roles in popup |
| **dark theme** / **light theme** | dark mode (alone) | Overlay/popup theme; config `defaultVisibilityTheme` |
| **badge** | toolbar badge | Icon badge text/indicators |
| **quick access** | shortcuts entry | Commands + context menu openers |
| **icon click opens side panel** | action click | Config `iconClickOpensSidePanel` (default true) |
| **tools toolbar** | non-web tools popup | Badge `action` popup on non-**web protocol** tabs (`tools-toolbar.html`); see [`side-panel.md`](side-panel.md) ([REQ-NON_WEB_TOOLS_TOOLBAR]) |
| **tool page shell** | standalone tool chrome | Shared full-page chrome for Index / Import / Options / Browser Bookmarks / Visit History; see [`side-panel.md`](side-panel.md) |
| **Quick Actions** | action row | Show Hover, Toggle Privacy, Read Later, Delete |
| **non-scriptable URL** | cannot inject (alone) | Browser-forbidden scripting target (restricted schemes + extensions gallery); see [`side-panel.md`](side-panel.md); not user **inhibit URL** |
| **injectionOutcome** | inject log (alone) | UI inspector `recordAction` id for precheck/skip/fail of content or suggested-tags scripting |
| **Search Bookmarks** | library search, search library | Capture UI control opening Local Bookmarks Index with `?q=`; **not** Search tabs (`search` / `SEARCH_TABS`) — [REQ-LIBRARY_SEARCH_ENTRY] |
| **Title/Notes Details** | details section | Popup/This Page Title (`description`) + Notes (`extended`) editors — [REQ-BOOKMARK_NOTES_UI] |
| **link health hint** | health status line | Compact This Page/popup “Health: …” from stored map when **linkHealthChecksEnabled** — [REQ-LINK_HEALTH] |
| **Offline Reader** | archive reader | Dedicated extension page rendering stored sanitized archive content |
| **Save page archive** | archive capture | Explicit Quick Action for Local/File readable archive capture |
| **archive association feedback** | archive result message | Popup/This Page feedback distinguishing “archive saved” from “bookmark and archive saved” |
| **Save page screenshot** | screenshot capture | Explicit Quick Action for separate Local/File product screenshot capture |

---

## Naming bridge: surfaces and actions

| Canonical concept | UI label | Config key | Action / message id | Code |
|-------------------|----------|------------|---------------------|------|
| Show overlay | Show Hover | — | `POPUP_ACTION_IDS.showHoverboard` → `TOGGLE_HOVER` | ui-action-contract |
| Auto-show overlay | Show on page load | `showHoverOnPageLoad` | `showHoverOnPageLoadChange` → `UPDATE_OVERLAY_CONFIG` | ConfigManager |
| Overlay refresh | Refresh | — | `OVERLAY_ACTION_IDS.refresh` | overlay |
| Overlay close | Close | — | `OVERLAY_ACTION_IDS.close` / `HIDE_OVERLAY` | overlay |
| Toggle private (overlay) | — | — | `OVERLAY_ACTION_IDS.togglePrivate` | overlay |
| Toggle read later (overlay) | — | — | `OVERLAY_ACTION_IDS.toggleReadLater` | overlay |
| Theme | Dark / Light | `defaultVisibilityTheme` (`light-on-dark` \| `dark-on-light`) | — | theme CSS |
| Transparency | Opacity | `defaultTransparencyEnabled`, `defaultBackgroundOpacity` | `updateOverlayTransparency` | overlay |
| Icon → side panel | Extension icon option | `iconClickOpensSidePanel` | `OPEN_SIDE_PANEL` / `REQUEST_SIDE_PANEL_CLOSE` | [IMPL-ICON_CLICK_BEHAVIOR](../implementation-decisions/IMPL-ICON_CLICK_BEHAVIOR.yaml) |
| Tools toolbar (non-web) | Tools | — | `action.setPopup` → `tools-toolbar.html` | [IMPL-NON_WEB_TOOLS_TOOLBAR](../implementation-decisions/IMPL-NON_WEB_TOOLS_TOOLBAR.yaml) |
| Open tags tree | By Tag (footer) | — | `openTagsTree` → `OPEN_SIDE_PANEL` | popup |
| Open index | Bookmarks index | — | `OPEN_BOOKMARKS_INDEX` / `openBookmarksIndex` | SW `_openBookmarksIndexTab` (tabs.create + `REQUEST_SIDE_PANEL_CLOSE`) |
| Search Bookmarks | Search Bookmarks | — | `OPEN_BOOKMARKS_INDEX` + `{ q }` | [IMPL-LIBRARY_SEARCH_ENTRY] `OPEN_LIBRARY_SEARCH` |
| linkHealthChecksEnabled | Enable link health checks | `linkHealthChecksEnabled` | — | ConfigManager / Options |
| link health hint | (Details help text) | — | `GET_LINK_HEALTH` | `formatLinkHealthHint` / `refreshLinkHealthHint` |
| Open import | Browser bookmark import | — | `openBrowserBookmarkImport` | chrome.tabs.create |
| Save page archive | Save page archive | — | `capturePageArchive` → `CAPTURE_PAGE_ARCHIVE` | PopupController |
| Archive association feedback | archive saved / bookmark and archive saved | — | `CAPTURE_PAGE_ARCHIVE` result | [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] |
| Open Offline Reader | Open offline Reader | — | `openOfflineReader` | `src/ui/reader/reader.html` |
| Save page screenshot | Save page screenshot | — | `capturePageScreenshot` → `CAPTURE_PAGE_SCREENSHOT` | PopupController |

### Overlay action IDs (`OVERLAY_ACTION_IDS`)

| ID | Meaning |
|----|---------|
| `refresh` | Refresh overlay data |
| `close` | Close overlay |
| `tag-added` | Tag added from overlay |
| `tag-removed` | Tag removed from overlay |
| `togglePrivate` | Flip private/shared |
| `toggleReadLater` | Flip toread |

### Popup action IDs (`POPUP_ACTION_IDS`)

`showHoverboard`, `togglePrivate`, `readLater`, `deletePin`, `addTag`, `removeTag`, `search`, `refreshData`, `reloadExtension`, `openOptions`, `openBookmarksIndex`, `openBrowserBookmarkImport`, `openTagsTree`, `storageBackendChange`, `showHoverOnPageLoadChange`, `retry`

---

## Named concepts

- **overlay** — Transparent/fixed on-page UI for current bookmark status and tags.
- **persistent popup session** — Popup stays open across actions (no automatic `window.close`).
- **badge indicators** — Not bookmarked / no tags / private / to-read markers (defaults `-`, `0`, `*`, `!`).
- **quick access** — Manifest `commands` and context-menu entries for side panel, options, index, import, and standalone Browser Bookmarks page (legacy command id `open-side-panel-browser-bookmarks`).
- **tools toolbar** — Compact badge popup on non-web tabs; five launchers to full-page tools (not side panel). Canonical detail in [`side-panel.md`](side-panel.md).
- **tool page shell** — Shared brand-row / layout CSS for standalone tool pages; version via `initToolPageVersion`.
- **UI action contract** — Single source of truth mapping action IDs ↔ messages for tests and inspector (`src/shared/ui-action-contract.js`).
- **CONTENT_MESSAGE_TYPES** — Content-script handled types (`TOGGLE_HOVER`, `HIDE_OVERLAY`, `GET_OVERLAY_STATE`, …).
- **non-scriptable URL** — Target where inject/suggested-tags scripting must precheck-skip; expected skips record **injectionOutcome**, not error spam.
- **injectionOutcome** — Structured inspector action (`phase`, `trigger`, `reason`: `missing_url` \| `restricted_scheme` \| `extensions_gallery` \| `ok`).
- **Search Bookmarks** — Popup/This Page library-search entry; opens Index with encoded query; does not replace Search tabs.
- **Title/Notes Details** — Editable Title and Notes bound to `currentPin.description` / `currentPin.extended`; Notes disabled for Browser backend.
- **Offline Reader** — Full-page tool surface that renders only stored sanitized archive content and presents screenshot artifacts separately.
- **archive association feedback** — Popup/This Page result messaging for the archive action, including explicit cleanup failure rather than masked success.

---

## Pseudo-code block names

| Preferred term / concept | Procedure / block (existing) | Owning IMPL |
|--------------------------|------------------------------|-------------|
| Toggle overlay | handlers for `TOGGLE_HOVER` | [IMPL-OVERLAY](../implementation-decisions/IMPL-OVERLAY.yaml) |
| Overlay config update | `UPDATE_OVERLAY_CONFIG` | [IMPL-OVERLAY_CONTROLS](../implementation-decisions/IMPL-OVERLAY_CONTROLS.yaml) |
| Persistent popup | `(proposed) POPUP_SESSION_LIFECYCLE` | [IMPL-POPUP_SESSION](../implementation-decisions/IMPL-POPUP_SESSION.yaml) |
| Classify script inject URL | `CLASSIFY_SCRIPT_INJECTION_URL` | [IMPL-POPUP_SESSION](../implementation-decisions/IMPL-POPUP_SESSION.yaml) |
| Record injection outcome | `RECORD_INJECTION_OUTCOME` | [IMPL-UI_INSPECTOR](../implementation-decisions/IMPL-UI_INSPECTOR.yaml) |
| Icon click toggle | `(proposed) ICON_CLICK_SIDE_PANEL_TOGGLE` | [IMPL-ICON_CLICK_BEHAVIOR](../implementation-decisions/IMPL-ICON_CLICK_BEHAVIOR.yaml) |
| Tools toolbar launchers | `TOOLS_TOOLBAR_PAGE` | [IMPL-NON_WEB_TOOLS_TOOLBAR](../implementation-decisions/IMPL-NON_WEB_TOOLS_TOOLBAR.yaml) |
| Tool page version | `initToolPageVersion` | Shared `tool-page-version.js` |
| Action → message map | `POPUP_ACTION_TO_MESSAGE` | [IMPL-UI_ACTION_CONTRACT](../implementation-decisions/IMPL-UI_ACTION_CONTRACT.yaml) |
| Notes editable by backend | `NOTES_EDITABLE_FOR_BACKEND` | [IMPL-BOOKMARK_NOTES_UI](../implementation-decisions/IMPL-BOOKMARK_NOTES_UI.yaml) |
| Build Title/Notes save payload | `BUILD_BOOKMARK_NOTES_SAVE_PAYLOAD` | [IMPL-BOOKMARK_NOTES_UI](../implementation-decisions/IMPL-BOOKMARK_NOTES_UI.yaml) |
| Sync Title/Notes fields | `SYNC_BOOKMARK_NOTES_FIELDS` | [IMPL-BOOKMARK_NOTES_UI](../implementation-decisions/IMPL-BOOKMARK_NOTES_UI.yaml) |
| Persist Title/Notes | `SAVE_BOOKMARK_DETAILS` | [IMPL-BOOKMARK_NOTES_UI](../implementation-decisions/IMPL-BOOKMARK_NOTES_UI.yaml) |
| Open library search | `OPEN_LIBRARY_SEARCH` | [IMPL-LIBRARY_SEARCH_ENTRY](../implementation-decisions/IMPL-LIBRARY_SEARCH_ENTRY.yaml) |
| Open Offline Reader | `OPEN_OFFLINE_READER` | [IMPL-OFFLINE_READER_MODE](../implementation-decisions/IMPL-OFFLINE_READER_MODE.yaml) |
| Archive association feedback | `ARCHIVE_ASSOCIATION_RESULT_BOUNDARY` | [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] |

---

## Alphabetical index

| Term | Section |
|------|---------|
| archive association feedback | Preferred terms / Named concepts |
| badge | Preferred terms |
| CONTENT_MESSAGE_TYPES | Named concepts |
| dark theme / light theme | Preferred terms |
| Hoverboard | Preferred terms |
| hover | Preferred terms |
| icon click opens side panel | Preferred terms |
| injectionOutcome | Preferred terms |
| non-scriptable URL | Preferred terms |
| Offline Reader | Preferred terms / Named concepts |
| overlay | Preferred terms |
| OVERLAY_ACTION_IDS | Naming bridge |
| persistent popup session | Named concepts |
| POPUP_ACTION_IDS | Naming bridge |
| popup | Preferred terms |
| Quick Actions | Preferred terms |
| quick access | Preferred terms |
| SAVE_BOOKMARK_DETAILS | Pseudo-code block names |
| Search Bookmarks | Preferred terms / Named concepts |
| Save page archive | Preferred terms / Naming bridge |
| Save page screenshot | Preferred terms / Naming bridge |
| Show Hover | Preferred terms |
| Show on page load | Preferred terms |
| SYNC_BOOKMARK_NOTES_FIELDS | Pseudo-code block names |
| Title/Notes Details | Preferred terms / Named concepts |
| tool page shell | Preferred terms / Named concepts |
| tools toolbar | Preferred terms / Named concepts |
| UI action contract | Named concepts |
