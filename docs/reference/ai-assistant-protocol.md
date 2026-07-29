# AI Assistant Feature Update Protocol - Hoverboard Extension

> **🤖 MANDATORY FOR ALL AI ASSISTANTS**: This document defines the REQUIRED protocol for all code changes. Failure to follow this protocol invalidates any code modifications.

## 🚨 CRITICAL COMPLIANCE REQUIREMENTS

### **🛡️ MANDATORY PRE-WORK VALIDATION** (Priority 1 - Must Execute First)
Before making ANY code changes:

1. **📋 Task Verification**: The task MUST exist in `feature-tracking.md` with a valid Feature ID
2. **🔍 Compliance Check**: Review `ai-assistant-compliance.md` for mandatory token referencing requirements
3. **📁 File Impact Analysis**: Use this guide to determine which documentation files require updates
4. **🛡️ Immutable Check**: Verify no changes violate requirements in `immutable.md`

### **✅ MANDATORY POST-WORK COMPLETION** (Priority 2 - Must Execute Last)
After ALL code changes are complete:

1. **🧪 Full Test Suite**: All tests must pass (`npm test`)
2. **🔧 Lint Compliance**: All lint checks must pass (`npm run lint`)
3. **📝 Documentation Updates**: All required documentation files updated per this protocol
4. **🏁 Task Completion**: Update task status to "Completed" in `feature-tracking.md`

> **🚨 CRITICAL NOTE FOR AI ASSISTANTS**: When marking a task as completed in the feature registry table, you MUST also update the detailed subtask blocks to show all subtasks as completed with checkmarks [x]. Failure to update both locations creates documentation inconsistency and violates documentation enforcement requirements.

## 🤖 AI Assistant Decision Engine

### 🔍 Step 1: Task Identification and Validation (EXECUTE FIRST)
```
REQUIRED: Before any code modification
├─ 📋 Does Feature ID exist in feature-tracking.md? → YES: Continue | NO: STOP - Create task first
├─ 🔍 Are implementation tokens required? → Check ai-assistant-compliance.md
├─ 📁 Which files need documentation updates? → Use workflows below
└─ 🛡️ Any immutable requirement conflicts? → Check immutable.md
```

### 🎯 Step 2: Change Type Classification (EXECUTE SECOND)
```
What type of change are you making?
├─ 🆕 NEW FEATURE → Execute: NEW FEATURE Protocol [Priority: CRITICAL]
├─ 🔧 MODIFY EXISTING → Execute: MODIFICATION Protocol [Priority: CRITICAL]
├─ 🐛 BUG FIX → Execute: BUG FIX Protocol [Priority: MEDIUM]
├─ ⚙️ CONFIG CHANGE → Execute: CONFIG CHANGE Protocol [Priority: MEDIUM]
├─ 🔌 API/INTERFACE → Execute: API CHANGE Protocol [Priority: CRITICAL]
├─ 🧪 TEST ONLY → Execute: TEST ADDITION Protocol [Priority: LOW]
├─ 🚀 PERFORMANCE → Execute: PERFORMANCE Protocol [Priority: MEDIUM]
└─ 🔄 REFACTORING → Execute: REFACTORING Protocol [Priority: LOW]
```

### ✅ Step 3: Execute Protocol and Validate (EXECUTE THIRD)
```
For each protocol:
├─ 📝 Update REQUIRED files (marked with ✅ CRITICAL PRIORITY)
├─ 📊 Evaluate CONDITIONAL files (marked with ⚠️ MEDIUM PRIORITY)
├─ ❌ Skip files marked as SKIP (NO ACTION)
├─ 🔧 Add implementation tokens to code (MANDATORY)
├─ ✅ Run validation checks (MANDATORY)
└─ 🏁 Mark task complete in feature-tracking.md (MANDATORY)
```

## 🔧 AI Assistant Change Protocols

### 🆕 NEW FEATURE Protocol [PRIORITY: CRITICAL]
**🚨 MANDATORY ACTIONS (Execute in Order):**

**Phase 1: Pre-Implementation Validation 🔍**
1. **📋 Feature ID Verification**: Must exist in feature-tracking.md with valid `[IMPL-CODE_STYLE] [ARCH-CODE_QUALITY] [REQ-CODE_QUALITY] (was FEATURE-001)` format
2. **🛡️ Immutable Check**: Verify no conflicts with immutable.md requirements
3. **🔍 Dependency Analysis**: Identify dependencies on other features or systems

**Phase 2: Documentation Updates 📝**
4. **✅ CRITICAL PRIORITY - Update REQUIRED files:**
   - ✅ `feature-tracking.md` - Add feature entry with status "In Progress"
   - ✅ `specification.md` - Document user-facing behavior
   - ✅ `requirements.md` - Add implementation requirements
   - ✅ `architecture.md` - Document technical implementation
   - ✅ `testing.md` - Add test coverage requirements

5. **⚠️ MEDIUM PRIORITY - Evaluate CONDITIONAL files:**
   - ⚠️ `implementation-decisions.md` - IF making significant architectural decisions
   - ⚠️ `validation-automation.md` - IF adding new validation processes
   - ⚠️ `migration-status.md` - IF feature affects migration process
   - ⚠️ `ai-assistant-compliance.md` - IF feature involves AI assistant guidance

**Phase 3: Implementation 💻**
6. **🏷️ Add implementation tokens:**
   ```javascript
   // FEATURE-ID: Brief description of implementation
   ```

**Phase 4: Quality Assurance ✅**
7. **🚫 NEVER modify these files:**
   - ❌ `immutable.md` - Only check for conflicts
   - ❌ `enforcement-mechanisms.md` - Reference only
   - ❌ Process files (`context-file-checklist.md`, etc.) - Reference only

**🏁 COMPLETION CRITERIA (All Must Pass):**
- ✅ All tests pass
- ✅ All lint checks pass
- ✅ All required documentation updated
- ✅ Feature status set to "Completed" in `feature-tracking.md`

### 🔧 MODIFICATION Protocol [PRIORITY: CRITICAL]
**🚨 MANDATORY ACTIONS (Execute in Order):**

**Phase 1: Feature Discovery 🔍**
1. **📋 Lookup existing Feature ID** in feature-tracking.md
2. **🆔 Create modification entry** - Add `-[IMPL-CODE_STYLE] [ARCH-CODE_QUALITY] [REQ-CODE_QUALITY] (was MOD-001)` suffix to Feature ID
3. **🛡️ Immutable Check**: Verify modifications don't violate core requirements

**Phase 2: Impact Analysis 📊**
4. **🔍 Impact Analysis:**
   - Find "Implementation Tokens" for the feature
   - Identify all files listed in the feature's registry entry
   - Update ALL files containing the modified feature

**Phase 3: Documentation Updates 📝**
5. **✅ CRITICAL PRIORITY - Update files based on impact:**
   - ✅ `feature-tracking.md` - Update feature entry with modification suffix
   - ⚠️ `specification.md` - IF user-facing behavior changes
   - ⚠️ `requirements.md` - IF implementation requirements change
   - ⚠️ `architecture.md` - IF technical implementation changes
   - ⚠️ `testing.md` - IF test requirements change
   - ⚠️ `implementation-decisions.md` - IF architectural decisions change

**Phase 4: Implementation 💻**
6. **🏷️ Update implementation tokens:**
   ```javascript
   // [IMPL-CODE_STYLE] [ARCH-CODE_QUALITY] [REQ-CODE_QUALITY] (was FEATURE-ID-MOD-001): Modification description
   ```

**🏁 COMPLETION CRITERIA:**
- ✅ All affected files updated per feature registry
- ✅ All tests pass
- ✅ All lint checks pass
- ✅ Modification documented in `feature-tracking.md`

### 🐛 BUG FIX Protocol [PRIORITY: MEDIUM]
**🚨 MINIMAL ACTIONS (Streamlined Process):**

**Phase 1: Impact Assessment 🔍**
1. **📊 Check if bug affects documented behavior**
2. **🛡️ Verify fix doesn't violate immutable requirements**

**Phase 2: Selective Updates 📝**
3. **⚠️ Update files ONLY if necessary:**
   - ⚠️ `feature-tracking.md` - ONLY if fix affects documented behavior
   - ❌ SKIP: `specification.md` - Unless bug affects documented behavior
   - ❌ SKIP: `requirements.md` - Unless bug reveals requirement gap
   - ❌ SKIP: `architecture.md` - Unless architectural issue
   - ❌ SKIP: `testing.md` - Unless adding regression tests

**Phase 3: Implementation 💻**
4. **🏷️ Add implementation tokens** to code changes

**🏁 COMPLETION CRITERIA:**
- ✅ All tests pass
- ✅ All lint checks pass
- ✅ Minimal documentation updates only

### ⚙️ CONFIG CHANGE Protocol [PRIORITY: MEDIUM]
**🚨 MANDATORY ACTIONS:**

**Phase 1: Pre-Implementation Validation 🔍**
1. **🛡️ Immutable Check**: Verify configuration changes don't violate core requirements
2. **📋 Feature ID Check**: Identify related configuration features

**Phase 2: Documentation Updates 📝**
3. **✅ CRITICAL PRIORITY - Update REQUIRED files:**
   - ✅ `feature-tracking.md` - Update configuration-related features
   - ✅ `specification.md` - IF user-visible configuration changes
   - ✅ `requirements.md` - Update configuration requirements

**Phase 3: Optional Updates 📋**
4. **❌ Usually SKIP:**
   - ❌ `architecture.md` - Unless configuration architecture changes
   - ❌ `testing.md` - Unless configuration testing changes

**🏁 COMPLETION CRITERIA:**
- ✅ Configuration changes documented
- ✅ All tests pass
- ✅ All lint checks pass

### 🔌 API CHANGE Protocol [PRIORITY: CRITICAL]
**🚨 MANDATORY ACTIONS:**

**Phase 1: Pre-Implementation Validation 🔍**
1. **🛡️ Immutable Check**: Verify API changes maintain Pinboard compatibility
2. **📋 Feature ID Analysis**: Identify affected API-related features

**Phase 2: Core Documentation 📝**
3. **✅ CRITICAL PRIORITY - Update REQUIRED files:**
   - ✅ `feature-tracking.md` - Update API-related features
   - ✅ `specification.md` - Document API behavior changes
   - ✅ `architecture.md` - Update interface documentation

**Phase 3: Impact Evaluation 📊**
4. **⚠️ MEDIUM PRIORITY - Evaluate CONDITIONAL files:**
   - ⚠️ `requirements.md` - IF API requirements change
   - ⚠️ `testing.md` - IF API testing requirements change
   - ⚠️ `implementation-decisions.md` - IF API design decisions change

**🏁 COMPLETION CRITERIA:**
- ✅ API compatibility maintained
- ✅ All interface documentation updated
- ✅ All tests pass including API tests

### 🧪 TEST ADDITION Protocol [PRIORITY: LOW]
**🚨 MINIMAL ACTIONS:**

**Phase 1: Test Scope Analysis 🔍**
1. **📋 Feature ID Identification**: Link tests to existing feature IDs
2. **🧪 Test Coverage Analysis**: Identify coverage gaps

**Phase 2: Selective Updates 📝**
3. **⚠️ Update ONLY if necessary:**
   - ⚠️ `testing.md` - IF adding new test categories or frameworks
   - ❌ SKIP: Most other documentation unless tests reveal gaps

**Phase 3: Implementation 💻**
4. **🏷️ Add test tokens** to test files

**🏁 COMPLETION CRITERIA:**
- ✅ All tests pass including new tests
- ✅ Test coverage metrics maintained or improved

### 🚀 PERFORMANCE Protocol [PRIORITY: MEDIUM]
**🚨 MANDATORY ACTIONS:**

**Phase 1: Performance Impact Analysis 🔍**
1. **📊 Baseline Measurement**: Establish current performance metrics
2. **🛡️ Immutable Check**: Ensure performance changes don't violate requirements

**Phase 2: Documentation Updates 📝**
3. **✅ CRITICAL PRIORITY - Update REQUIRED files:**
   - ✅ `architecture.md` - Document performance optimizations
   - ⚠️ `requirements.md` - IF performance requirements change
   - ⚠️ `testing.md` - IF performance testing requirements change

**🏁 COMPLETION CRITERIA:**
- ✅ Performance improvements measured and documented
- ✅ No performance regressions in critical paths

### 🔄 REFACTORING Protocol [PRIORITY: LOW]
**🚨 MINIMAL ACTIONS:**

**Phase 1: Refactoring Scope Analysis 🔍**
1. **📋 Feature Impact**: Identify features affected by refactoring
2. **🛡️ Behavioral Preservation**: Ensure no behavior changes

**Phase 2: Selective Updates 📝**
3. **⚠️ Update ONLY if necessary:**
   - ⚠️ `architecture.md` - IF structural changes are significant
   - ❌ SKIP: Most other documentation if behavior unchanged

**Phase 3: Implementation 💻**
4. **🏷️ Update implementation tokens** in refactored code

**🏁 COMPLETION CRITERIA:**
- ✅ All existing tests pass unchanged
- ✅ Code quality metrics improved
- ✅ No behavior regressions

## 📋 Protocol Compliance Checklist

Before submitting any changes, verify:

- [ ] 🛡️ Checked immutable.md for conflicts
- [ ] 📋 Valid Feature ID exists in feature-tracking.md
- [ ] 🏷️ Implementation tokens added to all modified code
- [ ] 📝 All required documentation files updated
- [ ] 🧪 All tests pass (`npm test`)
- [ ] 🔧 All lint checks pass (`npm run lint`)
- [ ] ✅ Feature status updated in both registry table and detailed subtasks
- [ ] 🏁 All completion criteria met for protocol type

## 🚨 Emergency Protocol Escalation

If protocol compliance cannot be achieved:

1. **🛑 STOP**: Do not proceed with changes
2. **📋 Document**: Record specific compliance obstacles
3. **🔍 Analyze**: Determine if immutable requirements conflict
4. **📞 Escalate**: Request guidance rather than bypassing protocol
5. **⚠️ Risk Assessment**: Evaluate impact of non-compliance

## 🤖 AI Assistant Quick Reference Commands

```bash
# Before starting work
grep -r "FEATURE-ID" docs/context/feature-tracking.md
grep -r "// YOUR-FEATURE" src-new/

# During implementation
npm test
npm run lint

# Token search patterns
grep -r "// MV3-[0-9]+" src-new/   # Manifest V3 features
grep -r "// CFG-[0-9]+" src-new/   # Configuration features
grep -r "// UTIL-[0-9]+" src-new/  # Utility features
grep -r "// LOG-[0-9]+" src-new/   # Logging features
grep -r "// PIN-[0-9]+" src-new/   # Pinboard features
grep -r "// UI-[0-9]+" src-new/    # UI features

# Validation
npm test && npm run lint && echo "✅ All validations pass"
```

## 🏁 Final Protocol Reminder

**🤖 Every AI assistant must follow this protocol without exception. The protocol ensures:**

1. **🔒 Code Quality**: Consistent, testable, maintainable code
2. **📝 Documentation Sync**: Code and documentation always aligned
3. **🛡️ Requirement Compliance**: All changes respect immutable requirements
4. **🧪 Quality Assurance**: Comprehensive testing and validation
5. **📋 Feature Tracking**: Complete traceability of all changes

**Failure to follow this protocol invalidates any code changes and requires rework.** 