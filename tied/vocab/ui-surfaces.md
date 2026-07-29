# UI surfaces: overlay, popup, badge, quick access (canonical)

**Scope:** On-page **overlay** / **hover**, toolbar **popup**, **badge**, **theme**, **quick access** (extension commands + context menu), and **icon-click** behavior (side panel vs popup). **Vocabulary only** — show/hide and action-dispatch algorithms stay in IMPL.

**Excludes:** Side-panel tab interiors (see [`side-panel.md`](side-panel.md)); Options site-management and AI keys (see [`config-and-privacy.md`](config-and-privacy.md)); pin field semantics (see [`bookmarks.md`](bookmarks.md)).

**Traceability:** [REQ-OVERLAY_SYSTEM](../requirements/REQ-OVERLAY_SYSTEM.yaml) · [REQ-OVERLAY_AUTO_SHOW_CONTROL](../requirements/REQ-OVERLAY_AUTO_SHOW_CONTROL.yaml) · [REQ-OVERLAY_CONTROL_LAYOUT](../requirements/REQ-OVERLAY_CONTROL_LAYOUT.yaml) · [REQ-OVERLAY_REFRESH_ACTION](../requirements/REQ-OVERLAY_REFRESH_ACTION.yaml) · [REQ-POPUP_PERSISTENT_SESSION](../requirements/REQ-POPUP_PERSISTENT_SESSION.yaml) · [REQ-DARK_THEME](../requirements/REQ-DARK_THEME.yaml) · [REQ-BADGE_INDICATORS](../requirements/REQ-BADGE_INDICATORS.yaml) · [REQ-QUICK_ACCESS_ENTRY](../requirements/REQ-QUICK_ACCESS_ENTRY.yaml) · [REQ-ICON_CLICK_BEHAVIOR](../requirements/REQ-ICON_CLICK_BEHAVIOR.yaml) · [ARCH-OVERLAY](../architecture-decisions/ARCH-OVERLAY.yaml) · [ARCH-POPUP_SESSION](../architecture-decisions/ARCH-POPUP_SESSION.yaml) · [ARCH-THEME](../architecture-decisions/ARCH-THEME.yaml) · [ARCH-QUICK_ACCESS_ENTRY](../architecture-decisions/ARCH-QUICK_ACCESS_ENTRY.yaml) · [IMPL-OVERLAY](../implementation-decisions/IMPL-OVERLAY.yaml) · [IMPL-POPUP_SESSION](../implementation-decisions/IMPL-POPUP_SESSION.yaml) · [IMPL-THEME](../implementation-decisions/IMPL-THEME.yaml) · [IMPL-ICON_CLICK_BEHAVIOR](../implementation-decisions/IMPL-ICON_CLICK_BEHAVIOR.yaml) · [IMPL-UI_ACTION_CONTRACT](../implementation-decisions/IMPL-UI_ACTION_CONTRACT.yaml)

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
| **Quick Actions** | action row | Show Hover, Toggle Privacy, Read Later, Delete |

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
| Open tags tree | By Tag (footer) | — | `openTagsTree` → `OPEN_SIDE_PANEL` | popup |
| Open index | Bookmarks index | — | `OPEN_BOOKMARKS_INDEX` / `openBookmarksIndex` | SW `_openBookmarksIndexTab` (tabs.create + `REQUEST_SIDE_PANEL_CLOSE`) |
| Open import | Browser bookmark import | — | `openBrowserBookmarkImport` | chrome.tabs.create |

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
- **quick access** — Manifest `commands` and context-menu entries for side panel, options, index, import, Bookmarks tab.
- **UI action contract** — Single source of truth mapping action IDs ↔ messages for tests and inspector (`src/shared/ui-action-contract.js`).
- **CONTENT_MESSAGE_TYPES** — Content-script handled types (`TOGGLE_HOVER`, `HIDE_OVERLAY`, `GET_OVERLAY_STATE`, …).

---

## Pseudo-code block names

| Preferred term / concept | Procedure / block (existing) | Owning IMPL |
|--------------------------|------------------------------|-------------|
| Toggle overlay | handlers for `TOGGLE_HOVER` | [IMPL-OVERLAY](../implementation-decisions/IMPL-OVERLAY.yaml) |
| Overlay config update | `UPDATE_OVERLAY_CONFIG` | [IMPL-OVERLAY_CONTROLS](../implementation-decisions/IMPL-OVERLAY_CONTROLS.yaml) |
| Persistent popup | `(proposed) POPUP_SESSION_LIFECYCLE` | [IMPL-POPUP_SESSION](../implementation-decisions/IMPL-POPUP_SESSION.yaml) |
| Icon click toggle | `(proposed) ICON_CLICK_SIDE_PANEL_TOGGLE` | [IMPL-ICON_CLICK_BEHAVIOR](../implementation-decisions/IMPL-ICON_CLICK_BEHAVIOR.yaml) |
| Action → message map | `POPUP_ACTION_TO_MESSAGE` | [IMPL-UI_ACTION_CONTRACT](../implementation-decisions/IMPL-UI_ACTION_CONTRACT.yaml) |

---

## Alphabetical index

| Term | Section |
|------|---------|
| badge | Preferred terms |
| CONTENT_MESSAGE_TYPES | Named concepts |
| dark theme / light theme | Preferred terms |
| Hoverboard | Preferred terms |
| hover | Preferred terms |
| icon click opens side panel | Preferred terms |
| overlay | Preferred terms |
| OVERLAY_ACTION_IDS | Naming bridge |
| persistent popup session | Named concepts |
| POPUP_ACTION_IDS | Naming bridge |
| popup | Preferred terms |
| Quick Actions | Preferred terms |
| quick access | Preferred terms |
| Show Hover | Preferred terms |
| Show on page load | Preferred terms |
| UI action contract | Named concepts |
