# Deferred bookmark-manager features (decision 1A)

Product decision **1A** (metadata-first): Hoverboard stores pin metadata (URL, title, notes, tags, flags), not page archives.

The following items from common self-hosted bookmark managers are **explicitly out of backlog** until a new product decision supersedes 1A:

| Feature | Status |
|---------|--------|
| Full-text **content archiving** (save page body) | Out of scope |
| Full-text search over **archived** content | Out of scope |
| **Reader / offline reading** mode | Out of scope |
| **Screenshot** page archives (product) | Out of scope ([IMPL-SCREENSHOT_MODE] is demo capture only) |
| Public / cloud **REST** API | Out of scope (use [Local Query API](LOCAL_API.md) on localhost instead) |
| **Webhooks** | Deferred |
| Native **mobile apps** | Out of scope (Chromium extension; Safari deferred) |
| True multi-user **collaboration ACLs** | Out of scope (see [COLLECTIONS_AND_COLLABORATION.md](COLLECTIONS_AND_COLLABORATION.md)) |

Shipped under the phased plan instead: Title/Notes UI, Local Query API, library search entry, aggregate snapshot, File write API, link health (including R1a inhibit/timeout and R1b opt-in/This Page hint), and R1c collections N/A closeout with collections-as-tags documentation.

## Shipped vs deferred

- **Shipped under 1A/2B:** [Local Query API](LOCAL_API.md), link health, and collections modeled through tags, By Tag, and Browser folders ([COLLECTIONS_AND_COLLABORATION.md](COLLECTIONS_AND_COLLABORATION.md)).
- **Accepted 2B limitations:** Start the Local Query API through the documented CLI/install path; no Options one-click launcher is provided. The aggregate snapshot omits Pinboard by default for privacy; adding it requires a future explicit opt-in requirement.
- **Deferred under 1A:** The Phase 4 items above remain the only reopen path and require a written product decision that supersedes 1A.
