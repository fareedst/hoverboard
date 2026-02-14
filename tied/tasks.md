# Tasks and Incomplete Subtasks

**TIED Methodology Version**: 2.1.0

**⚠️ OPTIONAL TEMPLATE**: As of TIED 2.0.0, task tracking via `tasks.md` is **optional**. The core TIED value is in the **traceability chain** (requirements → architecture → implementation → tests → code) maintained through semantic tokens and decision documentation, not in task tracking artifacts. Agents may maintain planning state in-session (e.g., conversation-based todo lists) or document work breakdown in `implementation-decisions`. Use this template only if your project benefits from a shared task list for human visibility.

## Overview
This document tracks all tasks and subtasks for implementing this project. Tasks are organized by priority and implementation phase.

## Priority Levels

- **P0 (Critical)**: Must have - Core functionality, blocks other work
- **P1 (Important)**: Should have - Enhanced functionality, better error handling
- **P2 (Nice-to-Have)**: Could have - UI/UX improvements, convenience features
- **P3 (Future)**: Won't have now - Deferred features, experimental ideas

## Task Format

```markdown
## P0: Task Name [REQ-IDENTIFIER] [ARCH-IDENTIFIER] [IMPL-IDENTIFIER]

**Status**: 🟡 In Progress | ✅ Complete | ⏸️ Blocked | ⏳ Pending

**Description**: Brief description of what this task accomplishes.

**Dependencies**: List of other tasks/tokens this depends on.

**Subtasks**:
- [ ] Subtask 1 [REQ-X] [IMPL-Y]
- [ ] Subtask 2 [REQ-X] [IMPL-Z]
- [ ] Subtask 3 [TEST-X]
- [ ] Token audit & validation [PROC-TOKEN_AUDIT] [PROC-TOKEN_VALIDATION]

**Completion Criteria**:
- [ ] All subtasks complete
- [ ] Code implements requirement
- [ ] Tests pass with semantic token references
- [ ] Documentation updated
- [ ] `[PROC-TOKEN_AUDIT]` and `[PROC-TOKEN_VALIDATION]` outcomes logged

**Priority Rationale**: Why this is P0/P1/P2/P3
```

## Task Management Rules

1. **Subtasks are Temporary**
   - Subtasks exist only while the parent task is in progress
   - Remove subtasks when parent task completes

2. **Priority Must Be Justified**
   - Each task must have a priority rationale
   - Priorities follow: Tests/Code/Functions > DX > Infrastructure > Security

3. **Semantic Token References Required**
   - Every task MUST reference at least one semantic token
   - Cross-reference to related tokens

4. **Token Audits & Validation Required**
   - Every task must include a `[PROC-TOKEN_AUDIT]` subtask and capture its result
   - `./scripts/validate_tokens.sh` (or repo-specific equivalent) must run before closing the task, with results logged under `[PROC-TOKEN_VALIDATION]`

5. **Completion Criteria Must Be Met**
   - All criteria must be checked before marking complete
   - Documentation must be updated

## Task Status Icons

- 🟡 **In Progress**: Actively being worked on
- ✅ **Complete**: All criteria met, subtasks removed
- ⏸️ **Blocked**: Waiting on dependency
- ⏳ **Pending**: Not yet started

## Active Tasks

## P0: Setup TIED Methodology [REQ-TIED_SETUP] [ARCH-TIED_STRUCTURE] [IMPL-TIED_FILES]

**Status**: ✅ Complete

**Description**: Initialize the project with the TIED directory structure and documentation files.

**Dependencies**: None

**Subtasks**:
- [x] Create `tied/` directory
- [x] Instantiate documentation files from templates
- [x] Update `.cursorrules`
- [x] Register semantic tokens

**Completion Criteria**:
- [x] All subtasks complete
- [x] Code implements requirement
- [x] Documentation updated

**Priority Rationale**: P0 because this is the foundation for all future work.

## P0: Promote Processes into Core Methodology [REQ-TIED_SETUP] [ARCH-TIED_STRUCTURE] [IMPL-TIED_FILES]

**Status**: ✅ Complete

**Description**: Align every methodology reference (docs, templates, registry files) to TIED v1.1.0 after elevating Processes into the primary TIED workflow.

**Dependencies**: None

**Subtasks**:
- [x] Update TIED version references across methodology docs and guides
- [x] Update all template files and project copies with the new version marker
- [x] Refresh `VERSION`, `CHANGELOG.md`, and supporting metadata to announce v1.1.0

**Completion Criteria**:
- [x] All semantic references cite TIED v1.1.0
- [x] VERSION file, changelog, and documentation agree on the new version
- [x] Tasks and supporting docs reflect completion of this work

**Priority Rationale**: Processes are now a primary TIED concern; all consumers must see the v1.1.0 upgrade immediately to maintain alignment.

## Phase 2: Core Components

### Task 2.1: Core Feature Implementation
**Status:** ⏳ Pending  
**Priority:** P0 (Critical)  
**Semantic Tokens:** `[REQ-EXAMPLE_FEATURE]`, `[ARCH-EXAMPLE_DECISION]`, `[IMPL-EXAMPLE_IMPLEMENTATION]`

**Description**: Implement the core feature according to requirements and architecture.

**Subtasks**:
- [ ] Identify logical modules and document module boundaries [REQ-MODULE_VALIDATION]
- [ ] Define module interfaces and validation criteria [REQ-MODULE_VALIDATION]
- [ ] Develop Module 1 independently
- [ ] Validate Module 1 independently (unit tests, contract tests, edge cases, error handling) [REQ-MODULE_VALIDATION]
- [ ] Develop Module 2 independently
- [ ] Validate Module 2 independently (unit tests, contract tests, edge cases, error handling) [REQ-MODULE_VALIDATION]
- [ ] Integrate validated modules [REQ-MODULE_VALIDATION]
- [ ] Write integration tests for combined behavior
- [ ] Write end-to-end tests [REQ-EXAMPLE_FEATURE]
- [ ] Run `[PROC-TOKEN_AUDIT]` + `./scripts/validate_tokens.sh` and record outcomes [PROC-TOKEN_VALIDATION]

**Completion Criteria**:
- [ ] All modules identified and documented
- [ ] All modules validated independently before integration
- [ ] Integration tests pass
- [ ] All documentation updated
- [ ] Token audit + validation logged

## File-Based Storage and Per-Bookmark Routing (Plan)

### P0: File-based storage module [REQ-FILE_BOOKMARK_STORAGE] [ARCH-FILE_BOOKMARK_PROVIDER] [IMPL-FILE_BOOKMARK_SERVICE]
**Status**: ✅ Complete  
**Description**: File-based bookmark provider; single directory, single JSON file; file I/O behind adapter; unit tests with mocked adapter.  
**Priority Rationale**: P0 — Foundation; tested before UI (REQ-MODULE_VALIDATION).

### P0: Storage index and bookmark router [REQ-PER_BOOKMARK_STORAGE_BACKEND] [ARCH-STORAGE_INDEX_AND_ROUTER] [IMPL-STORAGE_INDEX] [IMPL-BOOKMARK_ROUTER]
**Status**: ✅ Complete  
**Description**: Per-URL storage index; BookmarkRouter delegates to pinboard/local/file; getRecentBookmarks aggregates; migration from local bookmarks.  
**Priority Rationale**: P0 — Core behavior; required before move UI.

### P1: File I/O context and directory picker [REQ-FILE_BOOKMARK_STORAGE] [ARCH-FILE_BOOKMARK_PROVIDER] [IMPL-FILE_BOOKMARK_SERVICE]
**Status**: ✅ Complete  
**Description**: Options "Select folder"; directory handle in IndexedDB; offscreen document for read/write; MessageFileBookmarkAdapter.  
**Priority Rationale**: P1 — Real file persistence.

### P1: Move bookmark UI [REQ-MOVE_BOOKMARK_STORAGE_UI] [ARCH-MOVE_BOOKMARK_UI] [IMPL-MOVE_BOOKMARK_UI]
**Status**: ✅ Complete  
**Description**: Popup Storage select (Pinboard | Local | File); getStorageBackendForUrl, moveBookmarkToStorage.  
**Priority Rationale**: P1 — Per-bookmark storage and move between methods.

### P2: Local bookmarks index and “all bookmarks” view [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX]
**Status**: ✅ Complete  
**Description**: Index page uses getAggregatedBookmarksForIndex; Storage column (Local | File); CSV export includes Storage.  
**Priority Rationale**: P2 — Consistency of “where are my bookmarks”.


