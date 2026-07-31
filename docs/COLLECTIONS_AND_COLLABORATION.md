# Collections and collaboration (Hoverboard model)

## Collections = tags (and folders)

Hoverboard does **not** introduce a separate Collections product object.

| Need | How Hoverboard models it |
|------|---------------------------|
| Group related bookmarks | **Tags** on the pin (`tags` field) |
| Nested groups | Tag segments / By Tag tree; Browser backend maps folder path → tags (`ENSURE_TAG_FOLDERS`) |
| Browse by group | Side panel **By Tag** tab; Local Bookmarks Index tag filters |
| Chrome folders | Side panel **Bookmarks** tab (Chrome tree) and/or Browser storage backend |

Prefer flat tags for Local/File/Sync/Pinboard; use nested folders when saving to **Browser** storage if you want native Chrome hierarchy.

By Tag is tag→URL sections, not path-segment trees; slash tags are sanitized.

## Collaboration = File share (ad hoc)

There are **no** multi-user ACLs, invites, or shared-collection servers.

| Approach | Notes |
|----------|--------|
| **File storage** | Point Storage Mode / Save to **File** at a shared folder (cloud-synced directory). Peers with the same `hoverboard-bookmarks.json` can read/write that file via the native host. |
| **Pinboard** | Optional cloud share/privacy via Pinboard’s own model (`shared` / Private). |
| **Export/Import** | CSV/JSON on the Index; Netscape HTML via Browser Bookmarks tab. |

Conflict handling for simultaneous File edits is best-effort (last writer wins). For team workflows that need true multi-user sync, use Pinboard or an external tool—not Hoverboard ACLs.
