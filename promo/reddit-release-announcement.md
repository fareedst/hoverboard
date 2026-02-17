# Reddit release announcement – Hoverboard (local-first)

Copy-paste ready post for announcing the updated Hoverboard extension. Update the version in the title if needed before posting.

---

## Suggested subreddits

- **r/chrome** – Chrome extensions and browser tips
- **r/selfhosted** – Local-first and file-based control
- **r/privacy** – Privacy-focused tooling
- **r/Pinboard** – Pinboard users (optional cloud sync)
- **r/bookmarks** or **r/productivity** – If they allow soft promo

---

## Title (choose one)

- Hoverboard v1.0.11 – Tag-first bookmark extension: aggregate tags across all your sites, local or file storage
- Hoverboard v1.0.11 – Local-first bookmark and tagging extension: browser storage or a single file, no account required
- Released: Hoverboard – local-first Chrome bookmark and tagging extension with optional file storage and Pinboard sync

---

## Body (copy below the line)

---

**Hoverboard** is a tag-based Chrome extension that **aggregates tags across all the sites you're interested in**—one tag vocabulary, search and filter by tag, recent tags across all your bookmarks. The big change in this release: **it's fully local-first** and works without any account or API.

**Storage options (you choose):**

- **Local (default)** – Everything stays in your browser (`chrome.storage.local`). No sign-up, no cloud.
- **File** – One JSON file in a folder you pick. Use a cloud-synced folder (Dropbox, Drive, etc.) to share or sync, or keep it on one machine. Optional native host lets you use a path like `~/.hoverboard`; otherwise use the browser folder picker.
- **Sync** – Chrome's built-in sync across devices (same profile). ~100 KB quota, so best for smaller lists.
- **Pinboard (optional)** – If you use Pinboard.in, you can still sync there via API token.

Your tags and bookmarks stay under your control in the backend you choose. You can **move individual bookmarks** between Local, File, and Sync from the popup. No lock-in.

**Why this matters:**

- **One tag system** – All your bookmarks share one tag vocabulary; filter and search by tag across every site you've saved.
- **Privacy** – Your bookmarks and tags can stay entirely on your device or in a file you control.
- **Sharing** – Put the file in a shared or synced folder and use it from multiple machines or with others.
- **No account** – Use it immediately with local or file storage; Pinboard is optional.

Tag-centric workflow: smart tag suggestions from page content (meta, headings, links, etc.), recent tags across all bookmarks, and a **Local Bookmarks Index** where you search and **filter by tag** across all local/file/sync bookmarks (with a Storage column). Dark theme, overlay on the page. Works in Chrome, Brave, and other Chromium browsers (Edge, Opera, Vivaldi). Manifest V3.

**Get it:** https://github.com/fareedst/hoverboard (Releases for download; load as unpacked). MIT licensed.

If you've been looking for a **tag-based**, local-first bookmark system that aggregates everything you save—without a mandatory cloud account—this might be what you need.

---

## Optional tweaks by subreddit

- **r/Pinboard:** Add after "No lock-in.": *Pinboard users: you can keep using the API and still use Local/File for everything else.*
- **r/privacy (or strict subs):** Shorten to one short paragraph: tag aggregation across your bookmarks, local or file storage, no account, link to GitHub; drop the feature list.
- **Chrome Web Store:** When the extension is on the store, replace the GitHub link with the store URL and mention "Chrome Web Store" in the Get it line.

---

## Checklist before posting

1. Pick a title and subreddit(s).
2. Paste the body (trim if needed for subreddit rules).
3. Confirm link: https://github.com/fareedst/hoverboard (or Chrome Web Store when available).
4. Post.
