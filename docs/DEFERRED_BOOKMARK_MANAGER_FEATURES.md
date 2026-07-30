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

Shipped under the phased plan instead: Title/Notes UI, Local Query API, library search entry, aggregate snapshot, File write API, link health, collections-as-tags documentation.
