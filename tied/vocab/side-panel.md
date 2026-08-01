# Side panel (canonical)

**Scope:** Chrome **side panel** surfaces: tab IDs and labels (**This Page**, **By Tag**, **Tabs**), panel DOM IDs, browser-tabs workflow (open / recently closed / both, search scopes, gather/distribute), tags tree, and related full-page tools (**Browser Bookmarks**, **Visit History**). **Vocabulary only** — list/filter algorithms stay in IMPL.

**Excludes:** Popup-only chrome when not shared with This Page (see [`ui-surfaces.md`](ui-surfaces.md)); pin/backend field semantics ([`bookmarks.md`](bookmarks.md), [`storage-backends.md`](storage-backends.md)); Local Bookmarks Index full page ([`bookmarks-index.md`](bookmarks-index.md)).

**Traceability:** [REQ-SIDE_PANEL_POPUP_EQUIVALENT](../requirements/REQ-SIDE_PANEL_POPUP_EQUIVALENT.yaml) · [REQ-SIDE_PANEL_TAGS_TREE](../requirements/REQ-SIDE_PANEL_TAGS_TREE.yaml) · [REQ-SIDE_PANEL_BROWSER_TABS](../requirements/REQ-SIDE_PANEL_BROWSER_TABS.yaml) · [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS](../requirements/REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS.yaml) · [REQ-SIDE_PANEL_BROWSER_BOOKMARKS](../requirements/REQ-SIDE_PANEL_BROWSER_BOOKMARKS.yaml) · [REQ-SIDE_PANEL_BOOKMARK_SEARCH](../requirements/REQ-SIDE_PANEL_BOOKMARK_SEARCH.yaml) · [REQ-TAB_SEARCH_NO_MATCH_UX](../requirements/REQ-TAB_SEARCH_NO_MATCH_UX.yaml) · [REQ-BOOKMARK_USAGE_TRACKING](../requirements/REQ-BOOKMARK_USAGE_TRACKING.yaml) · [ARCH-SIDE_PANEL_TABS](../architecture-decisions/ARCH-SIDE_PANEL_TABS.yaml) · [IMPL-SIDE_PANEL_TABS](../implementation-decisions/IMPL-SIDE_PANEL_TABS.yaml) · [IMPL-SIDE_PANEL_BROWSER_TABS](../implementation-decisions/IMPL-SIDE_PANEL_BROWSER_TABS.yaml) · [IMPL-SIDE_PANEL_TAGS_TREE](../implementation-decisions/IMPL-SIDE_PANEL_TAGS_TREE.yaml) · [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS](../implementation-decisions/IMPL-SIDE_PANEL_BROWSER_BOOKMARKS.yaml) · [IMPL-TAB_SEARCH_SERVICE](../implementation-decisions/IMPL-TAB_SEARCH_SERVICE.yaml)

**See also:** [`ui-surfaces.md`](ui-surfaces.md) · [`tags.md`](tags.md) · [`bookmarks.md`](bookmarks.md) · [`bookmarks-index.md`](bookmarks-index.md) · [`ipc-messaging.md`](ipc-messaging.md) · [`domain-references.md`](domain-references.md)

---

## Preferred terms vs synonyms

| Preferred | Avoid / demote | Notes |
|-----------|----------------|-------|
| **side panel** | sidebar, drawer | Chrome `sidePanel` UI (extension); not **Brave native sidebar** |
| **Brave native sidebar** | Brave side panel (for Brave’s own chrome) | Brave product sidebar (e.g. `Ctrl+B`); distinct from Hoverboard **side panel** |
| **Brave side-panel window arrange bug** | Hoverboard window snap bug | Browser-owned: with **side panel** or **Brave native sidebar** open, OS maximize/half-screen may overshoot or ignore arrange keys; see [brave-side-panel-window-arrange.md](../../docs/troubleshooting/brave-side-panel-window-arrange.md); upstream [brave-browser#55575](https://github.com/brave/brave-browser/issues/55575). No Hoverboard REQ token. |
| **This Page** | Bookmark tab (UI) | Popup-equivalent; `data-tab="bookmark"` |
| **By Tag** | tags tree (UI) | Hierarchical bookmarks-by-tag; `data-tab="tagsTree"` |
| **Tabs** (panel) | browser tabs panel | Open/closed tab manager; `data-tab="browserTabs"` |
| **Browser Bookmarks** (page) | Bookmarks (panel), browser bookmarks panel | Standalone full-page Chrome `bookmarks.getTree` UI (`browser-bookmarks.html`) — **not** a **side panel** tab; **not** Local Bookmarks Index; **not** **Browser storage (backend)** / Store B ([REQ-SIDE_PANEL_BROWSER_BOOKMARKS](../requirements/REQ-SIDE_PANEL_BROWSER_BOOKMARKS.yaml)) |
| **Visit History** (page) | Usage (panel), analytics tab | Standalone full-page Most Visited / Recently Visited / Navigation Graph (`visit-history.html`) — **not** a **side panel** tab; opened from **tools toolbar** ([REQ-BOOKMARK_USAGE_TRACKING](../requirements/REQ-BOOKMARK_USAGE_TRACKING.yaml)) |
| **web protocol** | http(s) page | Active tab URL is `http:` or `https:` ([REQ-NON_WEB_TOOLS_TOOLBAR](../requirements/REQ-NON_WEB_TOOLS_TOOLBAR.yaml)) |
| **tools toolbar** | non-web tools popup | Badge popup on non-**web protocol** tabs with launchers for full-page tools ([REQ-NON_WEB_TOOLS_TOOLBAR](../requirements/REQ-NON_WEB_TOOLS_TOOLBAR.yaml)) |
| **tool page shell** | standalone tool chrome | Shared full-page chrome (`tool-page-shell.css`) for Index, Import, Options, **Browser Bookmarks (page)**, **Visit History (page)** |
| **tool-page-version** | brand-row version | `initToolPageVersion` fills `[data-extension-version]` from the extension manifest |
| **tab source** | list source | `open` \| `recentlyClosed` \| `both` |
| **window scope** | window filter | `currentWindow` \| `all` |
| **search scope** | filter scope | `tabInfo` \| `pageText` \| `importantTags` (UI: Elements) |
| **list display mode** | row mode | `title` \| `url` \| `block` |
| **Gather into this window** | gather tabs | Move visible tabs into current window |
| **One window per tab** | distribute tabs | Each visible tab → own window |
| **Close tagged / Close untagged** | close by tag presence | Close tabs that have / lack bookmark tags |
| **Remove from list** | hide tab (×) | Hide from display without closing browser tab |
| **Close tab** | ✕ close | Actually close the browser tab |
| **importantTagSources** | Elements sources | Comma-separated DOM sources for Elements search |
| **no-match UX** | empty search feedback | Border feedback; preserve scroll in side panel |
| **to-read indicator** | read-later icon, toread badge | Per-row Tabs card marker when bookmark `toread` is yes (`.browser-tabs-card-toggle-toread`) |
| **private indicator** | lock icon, shared=no badge | Per-row Tabs card marker when bookmark `shared` is no (`.browser-tabs-card-toggle-private`) |
| **post-batch bookmark refresh** | reload bookmark flags | After Set/Clear to-read or Add tags, re-query `getCurrentBookmark` for all tabs (`refreshBookmarkDisplayForAllTabs`) |
| **window-focus Recent Tags refresh** | focus recent tags reload | On This Page, `windows.onFocusChanged` reloads Recent Tags (vs popup `visibilitychange`) |
| **tab-change This Page refresh** | tab activate refresh | `tabs.onActivated` / `onUpdated(complete)` → `refreshPopupData`; must not script **non-scriptable URL** tabs |
| **tabChangeRefresh** | tab change action | UI inspector `recordAction` id from `bindTabChangeRefresh` (`source`: `onActivated` \| `onUpdated`) before This Page refresh |
| **non-scriptable URL** | restricted URL (alone) | Browser forbids content scripting (restricted schemes + Chrome Web Store / extensions gallery hosts) — **not** user **inhibit URL** ([`config-and-privacy.md`](config-and-privacy.md)) |
| **index-open dismisses side panel** | close on bookmarks index | See [`bookmarks-index.md`](bookmarks-index.md); SW sends `REQUEST_SIDE_PANEL_CLOSE` when creating the index tab |
| **non-web dismisses side panel** | close on chrome:// | Active tab becomes non-**web protocol** → SW sends `REQUEST_SIDE_PANEL_CLOSE` ([REQ-NON_WEB_TOOLS_TOOLBAR](../requirements/REQ-NON_WEB_TOOLS_TOOLBAR.yaml)) |

---

## Naming bridge: tabs and panels

| Canonical concept | Legacy token / synonym | Notes |
|-------------------|------------------------|-------|
| **Browser Bookmarks (page)** | Token `REQ-SIDE_PANEL_BROWSER_BOOKMARKS` / `ARCH-SIDE_PANEL_BROWSER_BOOKMARKS` / `IMPL-SIDE_PANEL_BROWSER_BOOKMARKS`; UI synonym **Bookmarks (panel)** | Prefer **Browser Bookmarks (page)**; token IDs keep `SIDE_PANEL_` for history but behavior is standalone `browser-bookmarks.html`, not a side-panel tab |
| **Visit History (page)** | UI synonym **Usage (panel)**; storage tab id `usage` | Prefer **Visit History (page)** (`visit-history.html`); not a side-panel tab |

| Canonical concept | UI label | `data-tab` / panel id | Storage key | Message |
|-------------------|----------|----------------------|-------------|---------|
| This Page | This Page | `bookmark` / `#bookmarkPanel` | `hoverboard_sidepanel_active_tab` | popup-equivalent messages |
| By Tag | By Tag | `tagsTree` / `#tagsTreePanel` | `hoverboard_sidepanel_selected_tags`, `hoverboard_sidepanel_collapsed`, `hoverboard_sidepanel_config` | `OPEN_SIDE_PANEL` |
| Tabs | Tabs | `browserTabs` / `#browserTabsPanel` | `hoverboard_tabs_important_tag_sources` | `GET_RECENTLY_CLOSED_TABS`, `GET_TABS_PAGE_TEXT`, `GET_TABS_IMPORTANT_TAGS`, `GET_TAB_REFERRERS` |
| Browser Bookmarks (page) | Browser Bookmarks | (standalone page) | — | `tabs.create` browser-bookmarks.html |
| Visit History (page) | Visit History | (standalone page) `#visitHistoryPanel` | usage keys in [`bookmarks.md`](bookmarks.md) | `GET_BOOKMARK_USAGE*`, `GET_BOOKMARK_NAVIGATION_GRAPH`; tools toolbar `btn-visit-history` |
| Elements search | Elements | search scope `importantTags` | `hoverboard_tabs_important_tag_sources` | `GET_TABS_IMPORTANT_TAGS` |
| Tab search (title) | Search tabs by title | — | search history in TabSearchService | `SEARCH_TABS` |

---

## Named concepts

- **side panel tab** — One of three primary surfaces (**This Page**, **By Tag**, **Tabs**); persisted via `hoverboard_sidepanel_active_tab`.
- **Brave native sidebar** — Brave’s own sidebar chrome (not Hoverboard’s `chrome.sidePanel` document).
- **Brave side-panel window arrange bug** — When **side panel** or **Brave native sidebar** is open, OS maximize/half-screen may overshoot the display or ignore arrange keystrokes; browser-owned; documented in [brave-side-panel-window-arrange.md](../../docs/troubleshooting/brave-side-panel-window-arrange.md).
- **This Page** — Same job as popup for the active tab (quick actions, Save to, tags, search); no bottom footer toolbar in the side panel.
- **By Tag / tags tree** — Hierarchical tag navigation; “Show all tags” vs checked-only.
- **Tabs panel** — Manage open and recently closed browser tabs (`chrome.sessions` for closed).
- **Bookmarks panel** — Legacy name for Browser Bookmarks when it was a side-panel tab; now **Browser Bookmarks (page)**.
- **Visit History (page)** — Standalone page: **Most Visited**, **Recently Visited**, **Navigation Graph** (former Usage tab).
- **bookmark search (Next/Previous)** — Search within side-panel bookmark lists.
- **data-popup-ref** — Attribute bridging shared This Page / popup controls.
- **TabSearchService** — `searchAndNavigate` / `findNextTab` with circular wrap; `lastSearchText`, `searchHistory`.
- **Restore** — Reopen a recently closed tab from the Tabs panel.
- **to-read / private indicators** — Inline Tabs-row flags from bookmark state after `mergeBookmarkReplyIntoTab`.
- **post-batch bookmark refresh** — Re-apply bookmark tags/flags to all tab rows after batch bookmark actions.
- **window-focus Recent Tags refresh** — This Page reloads Recent Tags when the hosting browser window regains focus.
- **tab-change This Page refresh** — Browser tab activate/navigate-complete refreshes This Page via shared `PopupController`; skips inject on **non-scriptable URL**.
- **tabChangeRefresh** — Inspector action recorded when side-panel tab listeners schedule This Page refresh (`bindTabChangeRefresh`).
- **non-scriptable URL** — URL where Chrome rejects scripting (schemes + extensions gallery); distinct from user **inhibit URL**.

---

## Pseudo-code block names

| Preferred term / concept | Procedure / block (existing) | Owning IMPL |
|--------------------------|------------------------------|-------------|
| Active tab persist | `(proposed) PERSIST_SIDE_PANEL_TAB` | [IMPL-SIDE_PANEL_TABS](../implementation-decisions/IMPL-SIDE_PANEL_TABS.yaml) |
| Browser tabs list | `(proposed) LOAD_BROWSER_TABS_PANEL` | [IMPL-SIDE_PANEL_BROWSER_TABS](../implementation-decisions/IMPL-SIDE_PANEL_BROWSER_TABS.yaml) |
| Merge bookmark into tab row | `mergeBookmarkReplyIntoTab` | [IMPL-SIDE_PANEL_BROWSER_TABS](../implementation-decisions/IMPL-SIDE_PANEL_BROWSER_TABS.yaml) |
| Post-batch bookmark refresh | `refreshBookmarkDisplayForAllTabs` | [IMPL-SIDE_PANEL_BROWSER_TABS](../implementation-decisions/IMPL-SIDE_PANEL_BROWSER_TABS.yaml) |
| Window-focus Recent Tags | `bindWindowFocusRecentTagsRefresh` / `shouldInvokeLoadRecentTagsOnWindowFocusSync` | [IMPL-SIDE_PANEL_TABS](../implementation-decisions/IMPL-SIDE_PANEL_TABS.yaml) |
| Tab-change This Page refresh | `BIND_TAB_CHANGE_REFRESH` / `bindTabChangeRefresh` | [IMPL-SIDE_PANEL_TABS](../implementation-decisions/IMPL-SIDE_PANEL_TABS.yaml) |
| Recently closed | `(proposed) GET_RECENTLY_CLOSED_TABS` | [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS](../implementation-decisions/IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS.yaml) |
| Tags tree | `(proposed) RENDER_TAGS_TREE` | [IMPL-SIDE_PANEL_TAGS_TREE](../implementation-decisions/IMPL-SIDE_PANEL_TAGS_TREE.yaml) |
| Tab search navigate | `searchAndNavigate` / `findNextTab` | [IMPL-TAB_SEARCH_SERVICE](../implementation-decisions/IMPL-TAB_SEARCH_SERVICE.yaml) |
| No-match feedback | `(proposed) TAB_SEARCH_NO_MATCH_UI` | [IMPL-TAB_SEARCH_NO_MATCH_UI](../implementation-decisions/IMPL-TAB_SEARCH_NO_MATCH_UI.yaml) |
| Web-protocol allowlist | `IS_WEB_PROTOCOL_URL` / `isWebProtocolUrl` | [IMPL-NON_WEB_TOOLS_TOOLBAR](../implementation-decisions/IMPL-NON_WEB_TOOLS_TOOLBAR.yaml) |
| Non-web panel dismiss | `DISMISS_SIDE_PANEL_IF_NON_WEB` | [IMPL-NON_WEB_TOOLS_TOOLBAR](../implementation-decisions/IMPL-NON_WEB_TOOLS_TOOLBAR.yaml) |
| Badge popup sync | `SYNC_ACTION_POPUP_FOR_TAB` | [IMPL-NON_WEB_TOOLS_TOOLBAR](../implementation-decisions/IMPL-NON_WEB_TOOLS_TOOLBAR.yaml) |
| Tools toolbar launchers | `TOOLS_TOOLBAR_PAGE` | [IMPL-NON_WEB_TOOLS_TOOLBAR](../implementation-decisions/IMPL-NON_WEB_TOOLS_TOOLBAR.yaml) |
| Open Browser Bookmarks page | `OPEN_BROWSER_BOOKMARKS_PAGE` | [IMPL-NON_WEB_TOOLS_TOOLBAR](../implementation-decisions/IMPL-NON_WEB_TOOLS_TOOLBAR.yaml) |
| Visit History page init | `INIT_VISIT_HISTORY_PAGE` / `bindVisitHistoryPage` → `initVisitHistoryPage` | [IMPL-BOOKMARK_USAGE_TRACKING_UI](../implementation-decisions/IMPL-BOOKMARK_USAGE_TRACKING_UI.yaml) |
| Tool page version | `initToolPageVersion` | Shared `src/ui/styles/tool-page-version.js` (used by standalone tool pages) |

---

## Alphabetical index

| Term | Section |
|------|---------|
| Browser Bookmarks (page) | Preferred terms |
| Brave native sidebar | Preferred terms / Named concepts |
| Brave side-panel window arrange bug | Preferred terms / Named concepts |
| By Tag | Preferred terms |
| Close tagged / Close untagged | Preferred terms |
| Gather into this window | Preferred terms |
| importantTagSources | Preferred terms |
| list display mode | Preferred terms |
| mergeBookmarkReplyIntoTab | Pseudo-code block names |
| non-scriptable URL | Preferred terms |
| non-web dismisses side panel | Preferred terms |
| no-match UX | Preferred terms |
| One window per tab | Preferred terms |
| post-batch bookmark refresh | Preferred terms |
| private indicator | Preferred terms |
| Remove from list | Preferred terms |
| search scope | Preferred terms |
| side panel | Preferred terms |
| tab-change This Page refresh | Preferred terms |
| tabChangeRefresh | Preferred terms |
| tab source | Preferred terms |
| Tabs (panel) | Preferred terms |
| TabSearchService | Named concepts |
| This Page | Preferred terms |
| to-read indicator | Preferred terms |
| tool page shell | Preferred terms |
| tool-page-version | Preferred terms |
| tools toolbar | Preferred terms |
| Usage (panel) | Preferred terms (demoted synonym) |
| Visit History (page) | Preferred terms |
| web protocol | Preferred terms |
| window-focus Recent Tags refresh | Preferred terms |
| window scope | Preferred terms |
