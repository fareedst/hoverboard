# 🤖 AI Assistant Context Documentation Index - Hoverboard Extension

> **⭐ CRITICAL**: This is the MASTER INDEX for all AI assistants working on the Hoverboard extension project. All AI assistants MUST start here and follow the priority order below.

## 📑 Master Icon Legend

> **🛡️ STANDARDIZED SYSTEM**: This legend defines the OFFICIAL icon meanings for all context documentation. Each icon has exactly ONE meaning to eliminate AI assistant confusion.

### 🔥 PRIORITY HIERARCHY (Execution Order)
| Icon | Priority Level | Meaning | Usage |
|------|---------------|---------|-------|
| ⭐ | **CRITICAL** | Must execute first, blocking, highest impact | Critical features, urgent actions, blocking issues |
| 🔺 | **HIGH** | Important, execute with documentation | High-value tasks, important features |
| 🔶 | **MEDIUM** | Evaluate conditionally, balanced consideration | Secondary features, conditional updates |
| 🔻 | **LOW** | Execute last, minimal impact | Cleanup tasks, minor updates, optional items |

### 📋 PROCESS EXECUTION (Sequential Phases)
| Icon | Phase | Meaning | Usage |
|------|--------|---------|-------|
| 🚀 | **PHASE 1** | Foundation requirements, initial validation | Pre-work, setup, validation |
| ⚡ | **PHASE 2** | Core work, main implementation | Primary tasks, core implementation |
| 🔄 | **PHASE 3** | Follow-up work, iterative processes | Conditional references, cleanup |
| 🏁 | **PHASE 4** | Process completion, final wrap-up | Final references, completion tasks |

### 📑 PROCESS STEPS (Within Phases)
| Icon | Step | Meaning | Usage |
|------|------|---------|-------|
| 1️⃣ | **STEP 1** | First step, initial analysis | Discovery, search, analysis |
| 2️⃣ | **STEP 2** | Second step, planning/documentation | Preparation, documentation, planning |
| 3️⃣ | **STEP 3** | Third step, execution/implementation | Action, implementation, execution |
| ✅ | **COMPLETE** | Step or process successfully finished | Completion status, success indicators |

### 🗂️ DOCUMENT CATEGORIES (Navigation)
| Icon | Category | Meaning | Usage |
|------|----------|---------|-------|
| 📑 | **PURPOSE** | Document purpose, overview, introduction | Section headers, document introductions |
| 📋 | **CHECKLIST** | Process checklist, step-by-step guide | Checklist documents, process guides |
| 📊 | **ANALYSIS** | Data analysis, metrics, assessment | Analysis sections, data presentations |
| 📖 | **REFERENCE** | Reference material, specifications | Technical specs, reference guides |

### 🔧 ACTION CATEGORIES
| Icon | Action | Meaning | Usage |
|------|--------|---------|-------|
| 🔍 | **SEARCH** | Search, find, discover, analyze | Search actions, discovery tasks |
| 📝 | **DOCUMENT** | Write, update, document, record | Documentation tasks, update actions |
| 🔧 | **CONFIGURE** | Configure, modify, adjust, tune | Configuration tasks, modifications |
| 🛡️ | **PROTECT** | Protect, secure, validate, guard | Security tasks, validation actions |

## 📑 AI Assistant Quick Start Guide

### 🚀 PHASE 1: CRITICAL VALIDATION [Execute FIRST - MANDATORY]

Before making ANY code changes, AI assistants MUST:

1. **🛡️ [Immutable Requirements Check](immutable.md)** - Verify no conflicts with unchangeable specifications
2. **📋 [Feature Tracking Registry](feature-tracking.md)** - Find or create Feature ID for your task
3. **🔍 AI Assistant Compliance** - Review token requirements and response format
4. **⭐ [AI Assistant Protocol](ai-assistant-protocol.md)** - Follow the appropriate change protocol

### ⚡ PHASE 2: CORE DOCUMENTATION [Execute SECOND - HIGH PRIORITY]

For understanding and implementing changes:

5. **🏗️ Architecture** - System design and technical components (see [Architecture Overview](../architecture/README.md))
6. **📝 Requirements** - Implementation requirements and constraints  
7. **🧪 Testing** - Test coverage requirements and validation standards (see [Testing Documentation](../development/testing/README.md))
8. **📖 Specification** - User-facing features and behaviors

### 🔄 PHASE 3: CONDITIONAL REFERENCES [Execute THIRD - MEDIUM PRIORITY]

Reference only if your changes affect these areas:

9. **⚙️ Implementation Decisions** - IF making architectural decisions
10. **🔧 Validation Automation** - IF adding validation processes
11. **🔄 Migration Status** - For tracking migration progress (see [Migration Progress](../migration/progress/))
12. **📈 Implementation Status** - For progress tracking

### 🏁 PHASE 4: PROCESS REFERENCES [Execute LAST - LOW PRIORITY]

Reference only for process understanding (NEVER modify):

13. **📋 Context File Checklist** - File update guidelines
14. **🔒 Enforcement Mechanisms** - Validation rules
15. **🚫 Change Rejection Criteria** - Common rejection scenarios
16. **📚 Feature Documentation Standards** - Documentation guidelines

## ⭐ AI Assistant Priority Matrix

### 🔥 CRITICAL ACTIONS [NEVER SKIP]
```
┌─ 🛡️ Check immutable.md for conflicts
├─ 📋 Verify Feature ID exists in feature-tracking.md  
├─ 🔍 Review ai-assistant-compliance.md requirements
└─ ⭐ Follow ai-assistant-protocol.md for change type
```

### 🔺 HIGH PRIORITY [ALWAYS EXECUTE]
```
┌─ 🏗️ Update architecture.md if technical changes
├─ 📝 Update requirements.md if new requirements
├─ 🧪 Update testing.md if test changes
└─ 📖 Update specification.md if user-facing changes
```

### 🔶 MEDIUM PRIORITY [EVALUATE CONDITIONALLY]
```
┌─ ⚙️ Update implementation-decisions.md if architectural
├─ 🔧 Update validation-automation.md if validation changes
├─ 🔄 Update migration-status.md if migration changes
└─ 📈 Update implementation-status.md for progress
```

### ❌ NEVER MODIFY [REFERENCE ONLY]
```
┌─ 🛡️ immutable.md - Only check for conflicts
├─ 🔒 enforcement-mechanisms.md - Process reference only
├─ 📋 context-file-checklist.md - Guidelines only
└─ 🚫 change-rejection-criteria.md - Reference only
```

## 📑 Change Type Quick Reference

When you know your change type, jump directly to the protocol:

| Change Type | Icon | Protocol Section | Priority | Documentation Impact |
|-------------|------|------------------|----------|---------------------|
| **New Feature** | 🆕 | NEW FEATURE Protocol (see [AI Assistant Protocol](ai-assistant-protocol.md)) | ⭐ CRITICAL | Full documentation cascade |
| **Modify Existing** | 🔧 | MODIFICATION Protocol (see [AI Assistant Protocol](ai-assistant-protocol.md)) | ⭐ CRITICAL | Impact analysis required |
| **Bug Fix** | 🐛 | BUG FIX Protocol (see [AI Assistant Protocol](ai-assistant-protocol.md)) | 🔶 MEDIUM | Minimal documentation |
| **Config Change** | ⚙️ | CONFIG CHANGE Protocol (see [AI Assistant Protocol](ai-assistant-protocol.md)) | 🔶 MEDIUM | Configuration focus |
| **API/Interface** | 🔌 | API CHANGE Protocol (see [AI Assistant Protocol](ai-assistant-protocol.md)) | ⭐ CRITICAL | Interface documentation |
| **Test Only** | 🧪 | TEST ADDITION Protocol (see [AI Assistant Protocol](ai-assistant-protocol.md)) | 🔻 LOW | Testing documentation |
| **Performance** | 🚀 | PERFORMANCE Protocol (see [AI Assistant Protocol](ai-assistant-protocol.md)) | 🔶 MEDIUM | Architecture documentation |
| **Refactoring** | 🔄 | REFACTORING Protocol (see [AI Assistant Protocol](ai-assistant-protocol.md)) | 🔻 LOW | Structural documentation |

## 🔍 Token Search Quick Commands

```bash
# Search for existing feature tokens
grep -r "// [A-Z]+-[0-9]+" docs/context/

# Find specific token patterns
grep -r "MV3-[0-9]+" docs/context/   # Manifest V3 migration
grep -r "CFG-[0-9]+" docs/context/   # Configuration system
grep -r "UTIL-[0-9]+" docs/context/  # Shared utilities
grep -r "LOG-[0-9]+" docs/context/   # Logging system
grep -r "PIN-[0-9]+" docs/context/   # Pinboard integration
grep -r "UI-[0-9]+" docs/context/    # User interface

# Validate all changes
npm test && npm run lint
```

## ✅ AI Assistant Validation Checklist

Before submitting any code changes, verify:

- [ ] 🔍 Searched for existing tokens related to your changes
- [ ] 📋 Referenced specific Feature ID from feature-tracking.md
- [ ] ⭐ Followed appropriate protocol from ai-assistant-protocol.md
- [ ] 🏷️ Added implementation tokens to all modified code
- [ ] 📝 Updated all required documentation files
- [ ] 🧪 All tests pass (`npm test`)
- [ ] 🔧 All lint checks pass (`npm run lint`)
- [ ] 🏁 Marked task complete in feature-tracking.md

## ⭐ Critical Reminders for AI Assistants

1. **🛡️ IMMUTABLE REQUIREMENTS**: Never modify anything that conflicts with `immutable.md`
2. **📋 FEATURE TRACKING**: Every code change MUST have a corresponding Feature ID
3. **🏷️ IMPLEMENTATION TOKENS**: Every modified function/method needs `// FEATURE-ID: Description`
4. **📝 DOCUMENTATION SYNC**: Update ALL affected context files, not just code
5. **✅ VALIDATION**: Run tests and linting before marking tasks complete

## 📞 Emergency Quick Reference

If you're unsure about anything:

1. **🔍 Search First**: Use `grep -r "relevant-term" docs/context/`
2. **📋 Check Feature Registry**: Look in feature-tracking.md for existing features
3. **⭐ Follow Protocol**: Use ai-assistant-protocol.md for your change type
4. **🛡️ Check Immutable**: Verify no conflicts with immutable.md
5. **🧪 Validate Changes**: Run `npm test && npm run lint`

**🤖 This index serves as your primary navigation hub for the Hoverboard extension project. Bookmark this document and always start here!** 