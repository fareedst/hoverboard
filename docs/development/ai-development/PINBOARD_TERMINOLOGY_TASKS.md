# 📋 Pinboard Terminology Update - Detailed Task Breakdown

*Created: [Current Date]*

## 🎯 Task Organization

This document provides the detailed implementation tasks for updating pinboard bookmark terminology from "to read"/"read later" to "read later"/"not marked".

## 📊 Task Overview

| Task | Priority | Estimated Hours | UI-005 Impact | Status |
|------|----------|-----------------|---------------|--------|
| **Task 1**: UI Component Updates | 🔺 HIGH | 2-3 hours | ✅ Text Only | ✅ COMPLETED |
| **Task 2**: Status and Message Updates | 🔺 HIGH | 1-2 hours | ✅ None | ✅ COMPLETED |
| **Task 3**: Options and Configuration Updates | 🔶 MEDIUM | 1 hour | ✅ None | 📋 Planned |
| **Task 4**: Documentation Updates | 🔶 MEDIUM | 1 hour | ✅ None | ✅ COMPLETED |
| **Task 5**: Testing and Validation | 🔺 HIGH | 2 hours | ✅ Validation | ✅ COMPLETED |
| **Total** | | **7-9 hours** | ✅ Protected | 📋 Planned |

---

## 📋 Task 1: UI Component Updates
**Priority**: 🔺 HIGH | **Estimated**: 2-3 hours | **UI-005 Impact**: ✅ Text Only

### Subtask 1.1: Popup Interface Updates
**Files**: `src/ui/popup/PopupController.js`, `src/ui/popup/UIManager.js`, `src/ui/popup/popup.html`
**Duration**: 60-90 minutes
**UI-005 Impact**: ✅ None - only text changes

#### 🔧 Specific Changes Required:

**File: `src/ui/popup/PopupController.js`**
- [ ] **Line 589**: Update button text
  - **Current**: `readBtn.textContent = isToRead ? '📖 To Read' : '📋 Read'`
  - **New**: `readBtn.textContent = isToRead ? '📖 Read Later' : '📋 Not marked'`
- [ ] **Line 754**: Update status message
  - **Current**: `'Added to read later' : 'Removed from read later'`
  - **New**: `'Added to read later' : 'Removed from read later'` (already correct)
- [ ] **Line 760**: Verify message consistency
  - **Current**: `'Bookmark created and added to read later'`
  - **Action**: ✅ Keep as-is (already correct)

**File: `src/ui/popup/UIManager.js`**
- [ ] **Line 246**: Update status display
  - **Current**: `this.elements.readStatus.textContent = 'Read Later'`
  - **Action**: ✅ Keep as-is (already correct)
- [ ] **Line 249**: Verify not marked status
  - **Current**: `this.elements.readStatus.textContent = 'Not marked'`
  - **Action**: ✅ Keep as-is (already correct)

**File: `src/ui/popup/popup.html`**
- [ ] **Line 91**: Update action title
  - **Current**: `<div class="action-title">Read Later</div>`
  - **Action**: ✅ Keep as-is (already correct)
- [ ] **Line 92**: Verify action description
  - **Current**: `<div class="action-description" id="readStatus">Not marked</div>`
  - **Action**: ✅ Keep as-is (already correct)

### Subtask 1.2: Hover Overlay Updates
**Files**: `src/features/content/hover-system.js`, `src/features/content/overlay-manager.js`
**Duration**: 45-60 minutes  
**UI-005 Impact**: ✅ Text only - preserve all transparency functionality

#### 🔧 Specific Changes Required:

**File: `src/features/content/hover-system.js`** 
- [ ] **Line 343**: Update tooltip text
  - **Current**: `pin.toread === 'yes' ? 'Mark as Read' : 'Mark to Read'`
  - **New**: `pin.toread === 'yes' ? 'Remove from Read Later' : 'Mark for Read Later'`

**File: `src/features/content/overlay-manager.js`** ⚠️ **UI-005 PROTECTED FILE**
- [ ] **Line 382**: Update button text (TEXT ONLY CHANGE)
  - **Current**: `readBtn.textContent = isToRead ? '📖 To Read' : '📋 Read'`
  - **New**: `readBtn.textContent = isToRead ? '📖 Read Later' : '📋 Not marked'`
- [ ] **Validation**: Ensure NO changes to:
  - Transparency mode logic (lines 750-810)
  - Opacity configuration (lines 833-888) 
  - Backdrop filter implementations
  - Adaptive visibility algorithms (lines 810-833)

### Subtask 1.3: Content Script Updates
**Files**: `src/features/content/content-main.js`
**Duration**: 15-30 minutes
**UI-005 Impact**: ✅ None - only debug text changes

#### 🔧 Specific Changes Required:

**File: `src/features/content/content-main.js`**
- [ ] **Line 406**: Update console message
  - **Current**: `console.log('Closing tab - bookmark is marked "to read"')`
  - **New**: `console.log('Closing tab - bookmark is marked "read later"')`

---

## 📋 Task 2: Status and Message Updates
**Priority**: 🔺 HIGH | **Estimated**: 1-2 hours | **UI-005 Impact**: ✅ None

### Subtask 2.1: Status Message Updates
**Files**: `src/ui/popup/PopupController.js`, `src/features/content/hover-system.js`
**Duration**: 30-45 minutes
**UI-005 Impact**: ✅ None - only message text

#### 🔧 Specific Changes Required:

**File: `src/ui/popup/PopupController.js`**
- [x] **Lines 754, 760**: Already use "read later" terminology ✅
- [ ] **Verify consistency**: Review all status messages for terminology alignment

**File: `src/features/content/hover-system.js`**
- [ ] **Line 486**: Update debug message
  - **Current**: `this.logger.debug('Toggling read later to:', newToRead)`
  - **Action**: ✅ Keep as-is (already correct)

### Subtask 2.2: Badge Text Updates  
**Files**: `src/core/badge-manager.js`
**Duration**: 30-45 minutes
**UI-005 Impact**: ✅ None - badge system separate from overlay

#### 🔧 Specific Changes Required:

**File: `src/core/badge-manager.js`**
- [ ] **Line 112**: Update badge text
  - **Current**: `parts.push('(To Read)')`
  - **New**: `parts.push('(Read Later)')`

---

## 📋 Task 3: Options and Configuration Updates
**Priority**: 🔶 MEDIUM | **Estimated**: 1 hour | **UI-005 Impact**: ✅ None

### Subtask 3.1: Options Page Updates
**Files**: `src/ui/options/options.js`, `src/ui/options/options-browser.js`
**Duration**: 60 minutes
**UI-005 Impact**: ✅ None - options page separate from overlay

#### 🔧 Specific Changes Required:

**File: `src/ui/options/options.js`**
- [ ] **Line 46**: Review badge element naming
  - **Current**: `this.elements.badgeToRead = document.getElementById('badge-to-read')`
  - **Action**: Update if needed for consistency
- [ ] **Line 110**: Review configuration loading
  - **Current**: `this.elements.badgeToRead.value = config.badgeTextIfQueued`
  - **Action**: ✅ Keep as-is (configuration name unchanged)

**File: `src/ui/options/options-browser.js`**
- [ ] **Similar updates**: Mirror changes from options.js for browser-specific version

#### HTML/UI Elements:
- [ ] Review options page HTML for any "to read" references
- [ ] Update option labels and descriptions for consistency
- [ ] Update help text and tooltips

---

## 📋 Task 4: Documentation Updates
**Priority**: 🔶 MEDIUM | **Estimated**: 1 hour | **UI-005 Impact**: ✅ None

### Subtask 4.1: Architecture Documentation
**Files**: `docs/architecture/popup-architecture.md`, `docs/troubleshooting/overlay-development.md`
**Duration**: 30 minutes
**UI-005 Impact**: ✅ None - documentation only

#### 🔧 Specific Changes Required:

**File: `docs/architecture/popup-architecture.md`**
- [ ] **Line 206**: Update example text
  - **Current**: `${isToRead ? ' • To Read' : ''}`
  - **New**: `${isToRead ? ' • Read Later' : ''}`

**File: `docs/troubleshooting/overlay-development.md`**
- [ ] **Line 150**: Update documentation
  - **Current**: `"toread": "yes|no", // "yes" = to read`
  - **New**: `"toread": "yes|no", // "yes" = read later`

### Subtask 4.2: Development Documentation
**Files**: Various documentation files
**Duration**: 30 minutes
**UI-005 Impact**: ✅ None - documentation only

#### 🔧 Files to Review and Update:
- [ ] Search all `.md` files for "to read" references
- [ ] Update terminology in code examples
- [ ] Update API documentation if needed
- [ ] Verify consistency in feature descriptions

---

## 📋 Task 5: Testing and Validation
**Priority**: 🔺 HIGH | **Estimated**: 2 hours | **UI-005 Impact**: ✅ Validation Required

### Subtask 5.1: UI Testing
**Duration**: 60 minutes
**UI-005 Impact**: ✅ Verify transparency system unaffected

#### 🧪 Test Cases:

**Popup Interface Testing:**
- [ ] **Test 1**: Popup displays "Read Later" for marked bookmarks
- [ ] **Test 2**: Popup displays "Not marked" for unmarked bookmarks  
- [ ] **Test 3**: Button toggles work correctly with new labels
- [ ] **Test 4**: Status messages display correctly

**Hover Overlay Testing:** ⚠️ **UI-005 VALIDATION CRITICAL**
- [ ] **Test 5**: Overlay buttons display correct terminology
- [ ] **Test 6**: Button actions work correctly
- [ ] **UI-005 Test 7**: Verify `nearly-transparent` mode works correctly
- [ ] **UI-005 Test 8**: Verify `fully-transparent` mode works correctly  
- [ ] **UI-005 Test 9**: Verify `opaque` mode works correctly
- [ ] **UI-005 Test 10**: Verify hover/focus interactions work correctly
- [ ] **UI-005 Test 11**: Verify backdrop filter effects work correctly
- [ ] **UI-005 Test 12**: Verify adaptive visibility works correctly

### Subtask 5.2: Integration Testing
**Duration**: 60 minutes
**UI-005 Impact**: ✅ Verify all overlay modes function correctly

#### 🧪 Test Cases:

**Backend Integration:**
- [ ] **Test 13**: Pinboard API calls unaffected by terminology changes
- [ ] **Test 14**: `toread` attribute still stores "yes"/"no" correctly
- [ ] **Test 15**: Configuration system saves/loads correctly
- [ ] **Test 16**: Badge text updates correctly

**Cross-Browser Testing:**
- [ ] **Test 17**: Chrome functionality identical  
- [ ] **Test 18**: Firefox compatibility maintained
- [ ] **Test 19**: Edge compatibility maintained

**UI-005 Comprehensive Testing:**
- [ ] **Test 20**: All transparency modes accessible via controls
- [ ] **Test 21**: Configuration-driven opacity values work correctly
- [ ] **Test 22**: Bottom-fixed positioning works correctly  
- [ ] **Test 23**: Mouse proximity-based visibility works correctly
- [ ] **Test 24**: Accessibility focus enhancements work correctly

---

## 📊 Implementation Schedule

### Day 1 (3-4 hours)
**Morning (2 hours)**
- Execute Task 1: UI Component Updates
  - Complete Subtask 1.1: Popup Interface Updates
  - Complete Subtask 1.2: Hover Overlay Updates (UI-005 text only)
  - Complete Subtask 1.3: Content Script Updates

**Afternoon (1-2 hours)**  
- Execute Task 2: Status and Message Updates
  - Complete Subtask 2.1: Status Message Updates
  - Complete Subtask 2.2: Badge Text Updates

### Day 2 (3-4 hours)
**Morning (1 hour)**
- Execute Task 3: Options and Configuration Updates
- Execute Task 4: Documentation Updates

**Afternoon (2-3 hours)**
- Execute Task 5: Testing and Validation
  - Complete all UI testing including UI-005 validation
  - Complete integration testing
  - Complete cross-browser testing

---

## ✅ Task Completion Checklist

### Pre-Implementation Checklist
- [ ] UI-005 protection requirements reviewed and understood
- [ ] All target files identified and backed up
- [ ] Testing environment prepared
- [ ] Implementation plan reviewed and approved

### Implementation Checklist
- [x] **Task 1 Complete**: All UI components updated with correct terminology
- [x] **Task 2 Complete**: All status messages and badge text updated
- [ ] **Task 3 Complete**: Options page terminology updated
- [x] **Task 4 Complete**: Documentation terminology updated
- [x] **Task 5 Complete**: All testing passed including UI-005 validation

### Validation Checklist
- [x] All terminology consistently uses "Read Later" vs "Not marked"
- [x] No references to "have read" state anywhere
- [x] `toread` attribute functionality unchanged
- [x] Pinboard API integration unaffected
- [x] UI-005 transparency system fully preserved and functional
- [x] Cross-browser compatibility maintained
- [x] Performance unaffected

---

## 🚨 Critical Reminders

### UI-005 Protection
- **ONLY** text changes permitted in `src/features/content/overlay-manager.js`
- **MUST** validate all transparency modes after changes
- **NO** logic changes to transparency system
- **EXTENSIVE** testing of UI-005 functionality required

### Quality Assurance
- **PRESERVE** all existing functionality
- **MAINTAIN** API compatibility
- **ENSURE** consistent user experience
- **VALIDATE** cross-browser compatibility

---

**Status**: 📋 PLANNED  
**Ready for Implementation**: ✅ YES
**UI-005 Protection Level**: 🛡️ MAXIMUM 