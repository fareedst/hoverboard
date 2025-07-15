# [IMMUTABLE-REQ-TAG-003] Recent Tags Behavior Specification

## Overview

This document defines the immutable requirements for the Recent tags list behavior in the Hoverboard browser extension. The current implementation populates the Recent tags list from tags found in recent bookmarks, which is not the desired behavior.

## Problem Statement

The current Recent tags list is populated using tags in the recent bookmarks (the other 14 bookmarks have no tags). This is not desired behavior. The Recent tags list should be user-driven and reflect tags that users have actually added to sites.

## Requirements

### [IMMUTABLE-REQ-TAG-003] Recent Tags List Behavior

**Semantic Token:** `[IMMUTABLE-REQ-TAG-003]`

#### Core Requirements

1. **Empty Initial State**
   - When launching the extension, the Recent tags list shall be empty
   - No tags shall be pre-populated from existing bookmarks
   - The list shall start fresh for each user session

2. **User-Driven Population**
   - A tag is added to the Recent tags list only when the user adds that tag to any site
   - Tags are added to the list in chronological order (most recently used first)
   - The list shall be stored in shared memory that is cleared when the extension is reloaded
   - Tags are added only to the current tab/site, not to all tabs

3. **Cross-Window Consistency**
   - The Recent tags list shall be the same for all windows that use the extension
   - Changes to the list in one window shall be immediately reflected in other windows
   - The list shall be stored in shared memory (not persistent storage)

4. **Current Site Exclusion**
   - A tag shall not be displayed in the popup when the tag is already assigned to the current site
   - The Recent tags list shall filter out tags that are currently applied to the active bookmark
   - This prevents duplicate tag suggestions and improves user experience

#### Technical Specifications

1. **Storage Strategy**
   - Use shared memory (chrome.runtime.getBackgroundPage() or similar) for Recent tags list
   - Store as array of tag objects with metadata: `{name: string, lastUsed: Date, count: number}`
   - Maximum list size: 50 tags (configurable)
   - Memory is cleared when extension is reloaded/restarted

2. **Tag Addition Logic**
   - Trigger when user adds tag via popup or overlay to current tab only
   - Add to list only if not already present
   - Update lastUsed timestamp and increment count
   - Sort by lastUsed (most recent first)
   - Tag is added only to the current site/bookmark, not globally

3. **Display Logic**
   - Filter out tags already assigned to current site
   - Display up to 10 tags in popup (configurable)
   - Show "No recent tags" when list is empty or all tags are filtered out

4. **Performance Considerations**
   - Cache the filtered list for current site
   - Update cache when tags are added/removed from current site
   - Use efficient array operations for filtering and sorting
   - Shared memory access should be optimized for cross-window communication

#### Implementation Boundaries

- **Scope:** Recent tags list behavior only
- **Not Included:** Tag suggestion algorithms, tag validation, or bookmark management
- **Dependencies:** Tag service, shared memory service, popup UI components
- **Platform Specific:** Chrome extension shared memory APIs, browser extension messaging

#### Success Criteria

1. Recent tags list starts empty on first launch
2. Tags appear in list only after user adds them to current site
3. List is consistent across all extension windows
4. Tags already on current site are not shown in recent list
5. List is cleared when extension is reloaded
6. Performance remains acceptable with up to 50 recent tags

## Related Documents

- [IMMUTABLE-REQ-TAG-001] - Tag Management System
- [IMMUTABLE-REQ-TAG-002] - Tab Search Feature
- Architecture Overview - Tag Service Integration
- Development Guide - Shared Memory Patterns

## Version History

- **v1.0** - Initial specification (2024-12-19)
- **v1.1** - Corrected tag scope and storage strategy (2024-12-19) 