# Side panel (canonical)

**Scope:** Chrome **side panel** surfaces: tab IDs and labels (**This Page**, **By Tag**, **Tabs**, **Bookmarks**, **Usage**), panel DOM IDs, browser-tabs workflow (open / recently closed / both, search scopes, gather/distribute), tags tree, browser bookmarks panel, and Usage panel views. **Vocabulary only** — list/filter algorithms stay in IMPL.

**Excludes:** Popup-only chrome when not shared with This Page (see [`ui-surfaces.md`](ui-surfaces.md)); pin/backend field semantics ([`bookmarks.md`](bookmarks.md), [`storage-backends.md`](storage-backends.md)); Local Bookmarks Index full page ([`bookmarks-index.md`](bookmarks-index.md)).

**Traceability:** [REQ-SIDE_PANEL_POPUP_EQUIVALENT](../requirements/REQ-SIDE_PANEL_POPUP_EQUIVALENT.yaml) · [REQ-SIDE_PANEL_TAGS_TREE](../requirements/REQ-SIDE_PANEL_TAGS_TREE.yaml) · [REQ-SIDE_PANEL_BROWSER_TABS](../requirements/REQ-SIDE_PANEL_BROWSER_TABS.yaml) · [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS](../requirements/REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS.yaml) · [REQ-SIDE_PANEL_BROWSER_BOOKMARKS](../requirements/REQ-SIDE_PANEL_BROWSER_BOOKMARKS.yaml) · [REQ-SIDE_PANEL_BOOKMARK_SEARCH](../requirements/REQ-SIDE_PANEL_BOOKMARK_SEARCH.yaml) · [REQ-TAB_SEARCH_NO_MATCH_UX](../requirements/REQ-TAB_SEARCH_NO_MATCH_UX.yaml) · [REQ-BOOKMARK_USAGE_TRACKING](../requirements/REQ-BOOKMARK_USAGE_TRACKING.yaml) · [ARCH-SIDE_PANEL_TABS](../architecture-decisions/ARCH-SIDE_PANEL_TABS.yaml) · [IMPL-SIDE_PANEL_TABS](../implementation-decisions/IMPL-SIDE_PANEL_TABS.yaml) · [IMPL-SIDE_PANEL_BROWSER_TABS](../implementation-decisions/IMPL-SIDE_PANEL_BROWSER_TABS.yaml) · [IMPL-SIDE_PANEL_TAGS_TREE](../implementation-decisions/IMPL-SIDE_PANEL_TAGS_TREE.yaml) · [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS](../implementation-decisions/IMPL-SIDE_PANEL_BROWSER_BOOKMARKS.yaml) · [IMPL-TAB_SEARCH_SERVICE](../implementation-decisions/IMPL-TAB_SEARCH_SERVICE.yaml)

**See also:** [`ui-surfaces.md`](ui-surfaces.md) · [`tags.md`](tags.md) · [`bookmarks.md`](bookmarks.md) · [`bookmarks-index.md`](bookmarks-index.md) · [`ipc-messaging.md`](ipc-messaging.md) · [`domain-references.md`](domain-references.md)

---

## Preferred terms vs synonyms

| Preferred | Avoid / demote | Notes |
|-----------|----------------|-------|
| **side panel** | sidebar, drawer | Chrome `sidePanel` UI |
| **This Page** | Bookmark tab (UI) | Popup-equivalent; `data-tab="bookmark"` |
| **By Tag** | tags tree (UI) | Hierarchical bookmarks-by-tag; `data-tab="tagsTree"` |
| **Tabs** (panel) | browser tabs panel | Open/closed tab manager; `data-tab="browserTabs"` |
| **Bookmarks** (panel) | browser bookmarks panel | Chrome `bookmarks.getTree` UI — **not** Local Bookmarks Index |
| **Usage** (panel) | analytics tab | Most Visited / Recently Visited / Navigation Graph |
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

---

## Naming bridge: tabs and panels

| Canonical concept | UI label | `data-tab` / panel id | Storage key | Message |
|-------------------|----------|----------------------|-------------|---------|
| This Page | This Page | `bookmark` / `#bookmarkPanel` | `hoverboard_sidepanel_active_tab` | popup-equivalent messages |
| By Tag | By Tag | `tagsTree` / `#tagsTreePanel` | `hoverboard_sidepanel_selected_tags`, `hoverboard_sidepanel_collapsed`, `hoverboard_sidepanel_config` | `OPEN_SIDE_PANEL` |
| Tabs | Tabs | `browserTabs` / `#browserTabsPanel` | `hoverboard_tabs_important_tag_sources` | `GET_RECENTLY_CLOSED_TABS`, `GET_TABS_PAGE_TEXT`, `GET_TABS_IMPORTANT_TAGS`, `GET_TAB_REFERRERS` |
| Browser bookmarks | Bookmarks | `browserBookmarks` | — | browser bookmarks API |
| Usage | Usage | `usage` / `#usagePanel` | usage keys in [`bookmarks.md`](bookmarks.md) | `GET_BOOKMARK_USAGE*`, `GET_BOOKMARK_NAVIGATION_GRAPH` |
| Elements search | Elements | search scope `importantTags` | `hoverboard_tabs_important_tag_sources` | `GET_TABS_IMPORTANT_TAGS` |
| Tab search (title) | Search tabs by title | — | search history in TabSearchService | `SEARCH_TABS` |

---

## Named concepts

- **side panel tab** — One of five primary surfaces; persisted via `hoverboard_sidepanel_active_tab`.
- **This Page** — Same job as popup for the active tab (quick actions, Save to, tags, search).
- **By Tag / tags tree** — Hierarchical tag navigation; “Show all tags” vs checked-only.
- **Tabs panel** — Manage open and recently closed browser tabs (`chrome.sessions` for closed).
- **Bookmarks panel** — Browser bookmark tree (Chrome bookmarks API), distinct from Hoverboard-stored pins.
- **Usage panel** — **Most Visited**, **Recently Visited**, **Navigation Graph**.
- **bookmark search (Next/Previous)** — Search within side-panel bookmark lists.
- **data-popup-ref** — Attribute bridging shared This Page / popup controls.
- **TabSearchService** — `searchAndNavigate` / `findNextTab` with circular wrap; `lastSearchText`, `searchHistory`.
- **Restore** — Reopen a recently closed tab from the Tabs panel.
- **to-read / private indicators** — Inline Tabs-row flags from bookmark state after `mergeBookmarkReplyIntoTab`.
- **post-batch bookmark refresh** — Re-apply bookmark tags/flags to all tab rows after batch bookmark actions.
- **window-focus Recent Tags refresh** — This Page reloads Recent Tags when the hosting browser window regains focus.

---

## Pseudo-code block names

| Preferred term / concept | Procedure / block (existing) | Owning IMPL |
|--------------------------|------------------------------|-------------|
| Active tab persist | `(proposed) PERSIST_SIDE_PANEL_TAB` | [IMPL-SIDE_PANEL_TABS](../implementation-decisions/IMPL-SIDE_PANEL_TABS.yaml) |
| Browser tabs list | `(proposed) LOAD_BROWSER_TABS_PANEL` | [IMPL-SIDE_PANEL_BROWSER_TABS](../implementation-decisions/IMPL-SIDE_PANEL_BROWSER_TABS.yaml) |
| Merge bookmark into tab row | `mergeBookmarkReplyIntoTab` | [IMPL-SIDE_PANEL_BROWSER_TABS](../implementation-decisions/IMPL-SIDE_PANEL_BROWSER_TABS.yaml) |
| Post-batch bookmark refresh | `refreshBookmarkDisplayForAllTabs` | [IMPL-SIDE_PANEL_BROWSER_TABS](../implementation-decisions/IMPL-SIDE_PANEL_BROWSER_TABS.yaml) |
| Window-focus Recent Tags | `bindWindowFocusRecentTagsRefresh` / `shouldInvokeLoadRecentTagsOnWindowFocusSync` | [IMPL-SIDE_PANEL_TABS](../implementation-decisions/IMPL-SIDE_PANEL_TABS.yaml) |
| Recently closed | `(proposed) GET_RECENTLY_CLOSED_TABS` | [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS](../implementation-decisions/IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS.yaml) |
| Tags tree | `(proposed) RENDER_TAGS_TREE` | [IMPL-SIDE_PANEL_TAGS_TREE](../implementation-decisions/IMPL-SIDE_PANEL_TAGS_TREE.yaml) |
| Tab search navigate | `searchAndNavigate` / `findNextTab` | [IMPL-TAB_SEARCH_SERVICE](../implementation-decisions/IMPL-TAB_SEARCH_SERVICE.yaml) |
| No-match feedback | `(proposed) TAB_SEARCH_NO_MATCH_UI` | [IMPL-TAB_SEARCH_NO_MATCH_UI](../implementation-decisions/IMPL-TAB_SEARCH_NO_MATCH_UI.yaml) |

---

## Alphabetical index

| Term | Section |
|------|---------|
| Bookmarks (panel) | Preferred terms |
| By Tag | Preferred terms |
| Close tagged / Close untagged | Preferred terms |
| Gather into this window | Preferred terms |
| importantTagSources | Preferred terms |
| list display mode | Preferred terms |
| mergeBookmarkReplyIntoTab | Pseudo-code block names |
| no-match UX | Preferred terms |
| One window per tab | Preferred terms |
| post-batch bookmark refresh | Preferred terms |
| private indicator | Preferred terms |
| Remove from list | Preferred terms |
| search scope | Preferred terms |
| side panel | Preferred terms |
| tab source | Preferred terms |
| Tabs (panel) | Preferred terms |
| TabSearchService | Named concepts |
| This Page | Preferred terms |
| to-read indicator | Preferred terms |
| Usage (panel) | Preferred terms |
| window-focus Recent Tags refresh | Preferred terms |
| window scope | Preferred terms |
