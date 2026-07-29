# Tags and AI tagging (canonical)

**Scope:** **Current**, **Recent**, **Suggested**, and **Session** tags; sanitization; sort modes (A–Z / Frequency / Relevance); selection→tag input; **Tag with AI** flow (Readability, providers, session auto-apply). **Vocabulary only** — ranking and provider call algorithms stay in IMPL.

**Excludes:** Pin field `tags` wire format details beyond naming (see [`bookmarks.md`](bookmarks.md)); bulk index tag ops UI names that belong to the index page (see [`bookmarks-index.md`](bookmarks-index.md)); IPC message catalog (see [`ipc-messaging.md`](ipc-messaging.md)).

**Traceability:** [REQ-RECENT_TAGS_SYSTEM](../requirements/REQ-RECENT_TAGS_SYSTEM.yaml) · [REQ-SUGGESTED_TAGS_FROM_CONTENT](../requirements/REQ-SUGGESTED_TAGS_FROM_CONTENT.yaml) · [REQ-SUGGESTED_TAGS_DEDUPLICATION](../requirements/REQ-SUGGESTED_TAGS_DEDUPLICATION.yaml) · [REQ-SUGGESTED_TAGS_CASE_PRESERVATION](../requirements/REQ-SUGGESTED_TAGS_CASE_PRESERVATION.yaml) · [REQ-TAG_INPUT_SANITIZATION](../requirements/REQ-TAG_INPUT_SANITIZATION.yaml) · [REQ-TAG_MANAGEMENT](../requirements/REQ-TAG_MANAGEMENT.yaml) · [REQ-THIS_PAGE_TAG_SORT](../requirements/REQ-THIS_PAGE_TAG_SORT.yaml) · [REQ-SELECTION_TO_TAG_INPUT](../requirements/REQ-SELECTION_TO_TAG_INPUT.yaml) · [REQ-AI_TAGGING_POPUP](../requirements/REQ-AI_TAGGING_POPUP.yaml) · [REQ-AI_TAGGING_CONFIG](../requirements/REQ-AI_TAGGING_CONFIG.yaml) · [ARCH-TAG_SYSTEM](../architecture-decisions/ARCH-TAG_SYSTEM.yaml) · [ARCH-SUGGESTED_TAGS](../architecture-decisions/ARCH-SUGGESTED_TAGS.yaml) · [ARCH-AI_TAGGING_FLOW](../architecture-decisions/ARCH-AI_TAGGING_FLOW.yaml) · [IMPL-TAG_SYSTEM](../implementation-decisions/IMPL-TAG_SYSTEM.yaml) · [IMPL-SUGGESTED_TAGS](../implementation-decisions/IMPL-SUGGESTED_TAGS.yaml) · [IMPL-SESSION_TAGS](../implementation-decisions/IMPL-SESSION_TAGS.yaml) · [IMPL-AI_TAGGING_POPUP_UI](../implementation-decisions/IMPL-AI_TAGGING_POPUP_UI.yaml) · [IMPL-AI_TAGGING_READABILITY](../implementation-decisions/IMPL-AI_TAGGING_READABILITY.yaml) · [IMPL-AI_TAGGING_PROVIDER](../implementation-decisions/IMPL-AI_TAGGING_PROVIDER.yaml)

**See also:** [`bookmarks.md`](bookmarks.md) · [`side-panel.md`](side-panel.md) · [`ui-surfaces.md`](ui-surfaces.md) · [`config-and-privacy.md`](config-and-privacy.md) · [`ipc-messaging.md`](ipc-messaging.md) · [`domain-references.md`](domain-references.md)

---

## Preferred terms vs synonyms

| Preferred | Avoid / demote | Notes |
|-----------|----------------|-------|
| **Current Tags** | bookmark tags (UI) | Tags already on this pin |
| **Recent Tags** | user recent tags | User-driven recent chips from shared/user state — **not** `getRecentBookmarks` |
| **Suggested Tags** | content tags, AI chips (alone) | From page content and/or AI; deduped vs current |
| **Session tags** | auto-applied AI tags | Tags applied this session; AI hits that match are auto-applied |
| **Tag with AI** | AI suggest button | Preferred action label |
| **sanitizeTag** | normalize tag | Validation/normalization before save |
| **Sort tags** | chip order | A–Z \| Frequency \| Relevance (side panel This Page) |
| **Frequency** (sort) | usage sort | Order by `hoverboard_tag_frequency` |
| **Relevance** (sort) | in-page sort | DOM relevance / in-page frequency tiers |
| **case preservation** | keep casing | Suggested chips keep original casing |
| **deduplication** | hide duplicates | Hide suggested already on bookmark |
| **selection → tag input** | selection prefill | Prefill tag box from page selection |
| **Readability extraction** | main article extract | Readability.js path for AI content |
| **TagService** | tag manager | Owning service for tag ops |

---

## Naming bridge: tags and AI

| Canonical concept | UI label | Config / storage key | Message / code | TIED |
|-------------------|----------|----------------------|----------------|------|
| Recent tags list | Recent Tags | `hoverboard_recent_tags_shared`, `hoverboard_user_recent_tags_state_v2` | `GET_USER_RECENT_TAGS`, `ADD_TAG_TO_RECENT` | [REQ-RECENT_TAGS_SYSTEM](../requirements/REQ-RECENT_TAGS_SYSTEM.yaml) |
| Recent tags memory | — | `recentTagsSharedMemoryKey` | `RecentTagsMemoryManager` | [IMPL-TAG_SYSTEM](../implementation-decisions/IMPL-TAG_SYSTEM.yaml) |
| Tag frequency | Frequency sort | `hoverboard_tag_frequency` | TagService / UIManager | [REQ-THIS_PAGE_TAG_SORT](../requirements/REQ-THIS_PAGE_TAG_SORT.yaml) |
| Suggested from content | Suggested Tags | demo: `hoverboard_demo_suggested_tags` | `IMPL-SUGGESTED_TAGS` | [REQ-SUGGESTED_TAGS_FROM_CONTENT](../requirements/REQ-SUGGESTED_TAGS_FROM_CONTENT.yaml) |
| Session tags | (auto-apply) | `hoverboard_session_tags` | `GET_SESSION_TAGS`, `RECORD_SESSION_TAGS` | [IMPL-SESSION_TAGS](../implementation-decisions/IMPL-SESSION_TAGS.yaml) |
| AI request | Tag with AI | `aiApiKey`, `aiProvider`, `aiTagLimit` | `GET_PAGE_CONTENT`, `GET_AI_TAGS` | [REQ-AI_TAGGING_POPUP](../requirements/REQ-AI_TAGGING_POPUP.yaml) |
| Selection prefill | — | — | `GET_PAGE_SELECTION`, `normalizeSelectionForTagInput` | [REQ-SELECTION_TO_TAG_INPUT](../requirements/REQ-SELECTION_TO_TAG_INPUT.yaml) |
| Activity window | — | `recentTagsActivityWindowMinutes` | — | [REQ-RECENT_TAGS_SYSTEM](../requirements/REQ-RECENT_TAGS_SYSTEM.yaml) |
| Display cap | — | `recentTagsMaxDisplayCount` | — | same |
| List size cap | — | `recentTagsMaxListSize` | — | same |

---

## Named concepts

### Tag surfaces

- **Current Tags** — Tags on the active pin.
- **Recent Tags** — User-driven recent list (shared memory + user state v2).
- **Suggested Tags** — Content- and/or AI-derived candidates, case-preserved, deduped against current.
- **Session tags** — Tags recorded this extension session; overlap with AI suggestions is auto-applied to the bookmark.
- **TAG_UPDATED** — Message for tag-change synchronization across surfaces.

### AI tagging

- **Tag with AI** — Popup/side-panel action; enabled when AI API key set and tab is http(s).
- **AI provider** — `openai` \| Gemini (config `aiProvider`).
- **aiTagLimit** — Max tags returned (default 64).
- **Readability extraction** — Prefer main-article text via Readability.js when content script present.
- **GET_PAGE_CONTENT / GET_AI_TAGS** — Message pair for extract → provider → chips.

---

## Pseudo-code block names

| Preferred term / concept | Procedure / block (existing) | Owning IMPL |
|--------------------------|------------------------------|-------------|
| Sanitize tag | `sanitizeTag` | [IMPL-TAG_SYSTEM](../implementation-decisions/IMPL-TAG_SYSTEM.yaml) |
| Recent tags user list | `getUserRecentTags` | [IMPL-TAG_SYSTEM](../implementation-decisions/IMPL-TAG_SYSTEM.yaml) |
| Normalize selection | `normalizeSelectionForTagInput` | [IMPL-SELECTION_TO_TAG_INPUT](../implementation-decisions/IMPL-SELECTION_TO_TAG_INPUT.yaml) |
| Suggested pipeline | `(proposed) BUILD_SUGGESTED_TAGS` | [IMPL-SUGGESTED_TAGS](../implementation-decisions/IMPL-SUGGESTED_TAGS.yaml) |
| Session record | `recordSessionTags` / `getSessionTags` | [IMPL-SESSION_TAGS](../implementation-decisions/IMPL-SESSION_TAGS.yaml) |
| AI request | `(proposed) REQUEST_AI_TAGS` | [IMPL-AI_TAGGING_PROVIDER](../implementation-decisions/IMPL-AI_TAGGING_PROVIDER.yaml) |
| Readability extract | `(proposed) EXTRACT_PAGE_CONTENT_READABILITY` | [IMPL-AI_TAGGING_READABILITY](../implementation-decisions/IMPL-AI_TAGGING_READABILITY.yaml) |

---

## Alphabetical index

| Term | Section |
|------|---------|
| AI provider | AI tagging |
| case preservation | Preferred terms |
| Current Tags | Preferred terms |
| deduplication | Preferred terms |
| Frequency (sort) | Preferred terms |
| Recent Tags | Preferred terms |
| Readability extraction | AI tagging |
| Relevance (sort) | Preferred terms |
| sanitizeTag | Pseudo-code block names |
| selection → tag input | Preferred terms |
| Session tags | Named concepts |
| Sort tags | Preferred terms |
| Suggested Tags | Preferred terms |
| Tag with AI | Preferred terms |
| TagService | Preferred terms |
