# CITDP notes — index-open dismisses side panel

**Tracker:** `tied/working/REQ-LOCAL_BOOKMARKS_INDEX_20260729183500.yaml`  
**Tokens:** [REQ-LOCAL_BOOKMARKS_INDEX], [ARCH-LOCAL_BOOKMARKS_INDEX], [IMPL-LOCAL_BOOKMARKS_INDEX] (reuse [REQ-ICON_CLICK_BEHAVIOR] close message)

## change-definition

When the Local Bookmarks Index tab is **created** via popup, command, or context menu, dismiss any already-open **side panel** via `REQUEST_SIDE_PANEL_CLOSE`. Do not dismiss on index page refresh. Toolbar icon may reopen the panel.

## impact

- `src/core/service-worker.js` — `_openBookmarksIndexTab`, command/menu/message
- `src/core/message-handler.js` — `OPEN_BOOKMARKS_INDEX`
- `src/ui/popup/PopupController.js` — send message instead of direct `tabs.create`
- Side panel close listener unchanged
- Options `href` open: **out of scope** (LEAP follow-up)

## risk-assessment

| Risk | Mitigation |
|------|------------|
| Broadcast closes panel in other windows | Accepted (Chrome has no window-scoped close API); visibility guard on panel |
| Refresh re-closes after icon reopen | Index init must not send close (1B) |
| Popup still creates tab locally | Centralize in SW; unit test |

## test-strategy

- Unit: command / menu / `OPEN_BOOKMARKS_INDEX` → `tabs.create` + `REQUEST_SIDE_PANEL_CLOSE`
- Unit: popup sends `OPEN_BOOKMARKS_INDEX`
- Guard: bookmarks-table init does not send close
- Existing icon-toggle tests remain green

## LEAP out-of-scope

Options page bookmarks-index `href` does not dismiss side panel; evaluate later if needed.
