# Bookmarks and pin model (canonical)

**Scope:** Hoverboard **bookmark** / **pin** record shape (Pinboard-compatible fields), UI↔API dual names, create/update times, bookmark state synchronization, **badge** display values derived from bookmark state, and **usage tracking** fields. **Vocabulary only** — save/sync algorithms stay in IMPL.

**Excludes:** Which backend stores a pin (see [`storage-backends.md`](storage-backends.md)); Local Bookmarks Index / Netscape import UI (see [`bookmarks-index.md`](bookmarks-index.md)); tag chip systems (see [`tags.md`](tags.md)); Visit History page chrome (see [`side-panel.md`](side-panel.md)).

**Traceability:** [REQ-PINBOARD_COMPATIBILITY](../requirements/REQ-PINBOARD_COMPATIBILITY.yaml) · [REQ-BOOKMARK_CREATE_UPDATE_TIMES](../requirements/REQ-BOOKMARK_CREATE_UPDATE_TIMES.yaml) · [REQ-BOOKMARK_STATE_SYNCHRONIZATION](../requirements/REQ-BOOKMARK_STATE_SYNCHRONIZATION.yaml) · [REQ-BADGE_INDICATORS](../requirements/REQ-BADGE_INDICATORS.yaml) · [REQ-BOOKMARK_USAGE_TRACKING](../requirements/REQ-BOOKMARK_USAGE_TRACKING.yaml) · [REQ-SMART_BOOKMARKING](../requirements/REQ-SMART_BOOKMARKING.yaml) · [ARCH-PINBOARD_API](../architecture-decisions/ARCH-PINBOARD_API.yaml) · [ARCH-BADGE](../architecture-decisions/ARCH-BADGE.yaml) · [IMPL-PINBOARD_API](../implementation-decisions/IMPL-PINBOARD_API.yaml) · [IMPL-BOOKMARK_CREATE_UPDATE_TIMES](../implementation-decisions/IMPL-BOOKMARK_CREATE_UPDATE_TIMES.yaml) · [IMPL-BOOKMARK_STATE_SYNC](../implementation-decisions/IMPL-BOOKMARK_STATE_SYNC.yaml) · [IMPL-BADGE](../implementation-decisions/IMPL-BADGE.yaml) · [IMPL-BOOKMARK_USAGE_TRACKING](../implementation-decisions/IMPL-BOOKMARK_USAGE_TRACKING.yaml)

**See also:** [`storage-backends.md`](storage-backends.md) · [`tags.md`](tags.md) · [`side-panel.md`](side-panel.md) · [`ui-surfaces.md`](ui-surfaces.md) · [`domain-references.md`](domain-references.md) · `docs/development/ai-development/PINBOARD_TERMINOLOGY_COMPLETION_SUMMARY.md`

---

## Preferred terms vs synonyms

| Preferred | Avoid / demote | Notes |
|-----------|----------------|-------|
| **bookmark** | site, post (alone) | Product prose for a saved URL record |
| **pin** | bookmark object (code) | Pinboard-shaped in-memory/API record; `newPin` / `currentPin` |
| **Pinboard** | pinboard backend only | Product/API at pinboard.in — distinct from **pin** |
| **description** | title (API field) | Pinboard field = page title; CSV export may label “Title” |
| **extended** | notes (API field) | Pinboard notes body; UI/CSV often “Notes” |
| **Read Later** | queued, to-read (UI) | Preferred UI for `toread === 'yes'` |
| **Not marked** | unread clear | UI for `toread === 'no'` after terminology update |
| **Private** / **Public** | shared yes/no (UI) | UI maps `shared === 'no'` → Private |
| **Toggle Privacy** | toggle shared | Quick action flipping private/public |
| **badge display value** | badge text | Toolbar badge string from bookmark/tag state |
| **bookmark state synchronization** | live sync | Propagating pin/tag changes across popup/overlay/SW — **not** Sync backend |
| **usage tracking** | analytics (alone) | Local visit counts and nav edges for bookmarks |
| **empty / stub bookmark** | incomplete pin | Missing time, tags, and description |

---

## Naming bridge: pin fields and UI

| Canonical concept | UI label | Pin / API field | Config / storage | Code |
|-------------------|----------|-----------------|------------------|------|
| Page title | Title (CSV/index; Details) | `description` | — | `newPin().description`; [REQ-BOOKMARK_NOTES_UI] popup/This Page `#bookmarkTitleInput` |
| Notes | Notes (Details) | `extended` | — | `newPin().extended`; [REQ-BOOKMARK_NOTES_UI] `#bookmarkNotesInput` (disabled for Browser backend) |
| Tags on pin | Current Tags | `tags` (string or array) | — | TagService |
| Private flag | Private / Toggle Privacy | `shared`: `'yes'`\|`'no'` | — | `isPrivate` in UI state |
| Read Later flag | Read Later | `toread`: `'yes'`\|`'no'` | — | `toggleReadLater` |
| Create time | Created | `dt` / `time` | — | [REQ-BOOKMARK_CREATE_UPDATE_TIMES](../requirements/REQ-BOOKMARK_CREATE_UPDATE_TIMES.yaml) |
| Update time | Updated | `updated_at` / `time` | — | same |
| Auth for Pinboard API | Pinboard API Token | — | `hoverboard_auth_token` | `hasAuthToken` |
| Visit count | Visits / Most Visited | — | `hoverboard_bookmark_usage` | usage tracker |
| Nav edge | Navigation Graph / referrer | — | `hoverboard_bookmark_nav_edges` | usage tracker |
| Not bookmarked badge | Badge not bookmarked | — | `badgeTextIfNotBookmarked` (default `-`) | BadgeManager |
| No tags badge | Badge no tags | — | `badgeTextIfBookmarkedNoTags` (default `0`) | BadgeManager |
| Private badge | Badge private | — | `badgeTextIfPrivate` (default `*`) | BadgeManager |
| To-read badge | Badge to-read | — | `badgeTextIfQueued` (default `!`) | BadgeManager |

---

## Named concepts

- **pin** — Record from `newPin` / `minEmpty`: `url`, `description`, `extended`, `tags`, `dt`, `hash`, `meta`, `others`, `shared`, `toread`.
- **currentPin** — In-memory pin for the active tab in popup / This Page.
- **Pinboard API endpoints** — `/posts/get`, `/posts/add`, `/posts/delete`, `/posts/recent` (v1).
- **BOOKMARK_UPDATED** — Message broadcasting pin changes for cross-surface sync.
- **badge display value** — Computed toolbar badge text (tag count and/or private/to-read markers).
- **usage tracking** — Per-URL visit stats in `hoverboard_bookmark_usage`; referrer edges in `hoverboard_bookmark_nav_edges`.
- **Most Visited / Recently Visited / Navigation Graph** — Visit History page views over usage data (UI names; see [`side-panel.md`](side-panel.md)).
- **inbound links** — Referrers pointing at a bookmarked URL (`GET_BOOKMARK_INBOUND_LINKS`).

---

## Pseudo-code block names

| Preferred term / concept | Procedure / block (existing) | Owning IMPL |
|--------------------------|------------------------------|-------------|
| Create pin shape | `newPin` / `minEmpty` (code; `(proposed) NEW_PIN`) | [IMPL-DOM_UTILITIES](../implementation-decisions/IMPL-DOM_UTILITIES.yaml) |
| Create/update times | `(proposed) ENSURE_BOOKMARK_TIMES` | [IMPL-BOOKMARK_CREATE_UPDATE_TIMES](../implementation-decisions/IMPL-BOOKMARK_CREATE_UPDATE_TIMES.yaml) |
| State sync broadcast | handlers for `BOOKMARK_UPDATED` | [IMPL-BOOKMARK_STATE_SYNC](../implementation-decisions/IMPL-BOOKMARK_STATE_SYNC.yaml) |
| Badge value | `getBadgeDisplayValue` | [IMPL-URL_TAGS_DISPLAY](../implementation-decisions/IMPL-URL_TAGS_DISPLAY.yaml) / [IMPL-BADGE](../implementation-decisions/IMPL-BADGE.yaml) |
| Record visit / edges | `(proposed) RECORD_BOOKMARK_USAGE` | [IMPL-BOOKMARK_USAGE_TRACKING](../implementation-decisions/IMPL-BOOKMARK_USAGE_TRACKING.yaml) |

---

## Alphabetical index

| Term | Section |
|------|---------|
| badge display value | Naming bridge |
| bookmark | Preferred terms |
| bookmark state synchronization | Preferred terms |
| BOOKMARK_UPDATED | Named concepts |
| currentPin | Named concepts |
| description | Preferred terms |
| empty / stub bookmark | Preferred terms |
| extended | Preferred terms |
| inbound links | Named concepts |
| Not marked | Preferred terms |
| pin | Preferred terms |
| Pinboard | Preferred terms |
| Private / Public | Preferred terms |
| Read Later | Preferred terms |
| Toggle Privacy | Preferred terms |
| usage tracking | Named concepts |
