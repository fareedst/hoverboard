# Popup Show Hover Checkbox Requirements

**Date:** 2025-07-19  
**Status:** Requirements Analysis  
**Cross-References:** `[POPUP-ARCH-001]`, `[POPUP-CLOSE-BEHAVIOR-001]`, `[CFG-003]`, `[SHOW-HOVER-CHECKBOX-001]`

## 🎯 Problem Statement

The popup currently has a "Show Hover" button that toggles overlay visibility, but users cannot control the "Show hover overlay on page load" setting from the popup interface. This setting is only available in the options page, requiring users to navigate away from the popup to change this behavior.

**Current State:**
- ✅ **Show Hover button**: Toggles overlay visibility correctly
- ✅ **Options page**: Has checkbox for "Show hover overlay on page load"
- ❌ **Popup interface**: Missing checkbox for "Show hover overlay on page load" setting
- ❌ **User experience**: Requires navigation to options page for this setting

## 📋 Current Behavior Analysis

### Show Hover Button (`handleShowHoverboard`)
```javascript
// Current implementation in PopupController.js
async handleShowHoverboard () {
  try {
    await this.sendToTab({
      type: 'TOGGLE_HOVER',
      data: {
        bookmark: this.currentPin,
        tab: this.currentTab
      }
    })
    await this.updateOverlayState()
  } catch (error) {
    // ... error handling ...
  }
}
```

### Options Page Checkbox
```html
<!-- Current implementation in options.html -->
<div class="form-group">
  <label class="checkbox-label">
    <input type="checkbox" id="show-hover-on-load">
    <span class="checkmark"></span>
    Show hover overlay on page load
  </label>
</div>
```

### Configuration Database Field
```javascript
// Current implementation in config-manager.js
getDefaultConfiguration () {
  return {
    showHoverOnPageLoad: false, // No automatic hover to respect user intent
    // ... other settings
  }
}
```

## 🎯 Requirements Specification

### **Primary Requirement `[SHOW-HOVER-CHECKBOX-001]`
**The popup must include a checkbox to the right of the 'Show Hover' button that controls the "Show hover overlay on page load" setting**

**Rationale:**
- Users need quick access to this setting without navigating to options page
- Setting affects behavior across all pages, not just current page
- Provides immediate feedback and control over page load behavior
- Maintains consistency with existing popup interface patterns

### **Secondary Requirements**

#### **`[SHOW-HOVER-CHECKBOX-002]` - Database Field Manipulation**
The checkbox must manipulate the same database field as the existing configuration page row:
- **Database Field**: `showHoverOnPageLoad` (boolean)
- **Storage Key**: `hoverboard_settings` (via ConfigManager)
- **Default Value**: `false` (conservative default)
- **Persistence**: Changes must be saved immediately to storage

#### **`[SHOW-HOVER-CHECKBOX-003]` - UI Integration**
The checkbox must be properly integrated into the popup interface:
- **Position**: To the right of the Show Hover button
- **Label**: "Show on page load" (concise)
- **Tooltip**: "Show hover overlay automatically when pages load"
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Visual Design**: Consistent with existing popup styling

#### **`[SHOW-HOVER-CHECKBOX-004]` - State Synchronization**
The checkbox state must remain synchronized across all interfaces:
- **Options Page**: Checkbox state reflects popup changes
- **Popup**: Checkbox state reflects options page changes
- **Content Scripts**: Receive configuration updates immediately
- **Storage**: All changes persist across extension reloads

#### **`[SHOW-HOVER-CHECKBOX-005]` - User Experience**
The checkbox must provide clear user feedback:
- **Immediate Effect**: Changes take effect on next page load
- **Visual Feedback**: Clear indication of current state
- **Error Handling**: Graceful handling of storage failures
- **Help Text**: Clear explanation of what the setting does

## 🔧 Implementation Requirements

### **`[SHOW-HOVER-CHECKBOX-006]` - HTML Structure**
```html
<!-- New structure in popup.html -->
<div class="action-grid">
  <div class="show-hover-controls">
    <button id="showHoverBtn" class="action-icon-button" title="Show Hover - Display bookmark overlay" aria-label="Show hoverboard overlay">
      <span class="action-icon">👁️</span>
    </button>
    
    <div class="page-load-checkbox">
      <label class="checkbox-label">
        <input type="checkbox" id="showHoverOnPageLoad" title="Show hover overlay automatically when pages load">
        <span class="checkmark"></span>
        <span class="checkbox-text">Show on page load</span>
      </label>
    </div>
  </div>
  
  <!-- ... other action buttons ... -->
</div>
```

### **`[SHOW-HOVER-CHECKBOX-007]` - JavaScript Integration**
```javascript
// New method in PopupController.js
async handleShowHoverOnPageLoadChange() {
  try {
    const isChecked = this.elements.showHoverOnPageLoad.checked
    
    // Update configuration
    await this.configManager.updateConfig({
      showHoverOnPageLoad: isChecked
    })
    
    // Provide user feedback
    this.uiManager.showStatus(
      isChecked ? 'Hover will show on page load' : 'Hover will not show on page load',
      'success'
    )
    
    // Broadcast to content scripts
    await this.broadcastConfigUpdate()
    
  } catch (error) {
    this.errorHandler.handleError('Failed to update page load setting', error)
  }
}
```

### **`[SHOW-HOVER-CHECKBOX-008]` - Configuration Loading**
```javascript
// New method in PopupController.js
async loadShowHoverOnPageLoadSetting() {
  try {
    const config = await this.configManager.getConfig()
    this.elements.showHoverOnPageLoad.checked = config.showHoverOnPageLoad
  } catch (error) {
    this.errorHandler.handleError('Failed to load page load setting', error)
  }
}
```

## 🧪 Testing Requirements

### **`[SHOW-HOVER-CHECKBOX-009]` - Functional Testing**
1. **Checkbox State Test**
   - Verify checkbox reflects current configuration on popup load
   - Verify checkbox state persists across popup opens/closes
   - Verify checkbox state syncs with options page

2. **Configuration Update Test**
   - Verify checking/unchecking saves to storage immediately
   - Verify changes are reflected in options page
   - Verify content scripts receive configuration updates

3. **User Experience Test**
   - Verify clear visual feedback for state changes
   - Verify tooltip provides helpful information
   - Verify keyboard navigation works correctly

### **`[SHOW-HOVER-CHECKBOX-010]` - Integration Testing**
1. **Options Page Synchronization**
   - Verify popup changes reflect in options page
   - Verify options page changes reflect in popup
   - Verify no data loss during synchronization

2. **Content Script Integration**
   - Verify content scripts receive configuration updates
   - Verify page load behavior changes correctly
   - Verify no conflicts with existing overlay functionality

## 📚 Cross-Reference Coordination

### **Existing Requirements Coordination**
- **`[POPUP-CLOSE-BEHAVIOR-001]`**: Popup must remain open after checkbox changes
- **`[CFG-003]`**: Configuration management patterns must be followed
- **`[POPUP-ARCH-001]`**: Architecture must support new UI element
- **`[UI-BEHAVIOR-001]`**: UI behavior patterns must be consistent

### **Architectural Decisions**
- **`[SHOW-HOVER-CHECKBOX-ARCH-001]`**: Checkbox must use existing ConfigManager patterns
- **`[SHOW-HOVER-CHECKBOX-ARCH-002]`**: UI must integrate seamlessly with existing popup design
- **`[SHOW-HOVER-CHECKBOX-ARCH-003]`**: State synchronization must use existing message patterns

## 🎯 Success Criteria

### **`[SHOW-HOVER-CHECKBOX-011]` - Primary Success Criteria**
- ✅ Checkbox appears to the right of Show Hover button
- ✅ Checkbox controls `showHoverOnPageLoad` database field
- ✅ Changes save immediately to storage
- ✅ State synchronizes with options page
- ✅ Content scripts receive configuration updates
- ✅ No service worker errors or "Loading error" messages

### **`[SHOW-HOVER-CHECKBOX-012]` - User Experience Success Criteria**
- ✅ Clear visual feedback for state changes
- ✅ Intuitive placement and labeling
- ✅ Accessibility standards maintained
- ✅ No regression in existing functionality
- ✅ Smooth operation without requiring page reloads

## 📝 Documentation Requirements

### **`[SHOW-HOVER-CHECKBOX-013]` - Implementation Documentation**
- Document new HTML structure and CSS classes
- Document new JavaScript methods and event handlers
- Document configuration update patterns
- Document testing procedures and results

### **`[SHOW-HOVER-CHECKBOX-014]` - User Documentation**
- Update user guides to explain new checkbox functionality
- Document the relationship between popup and options page settings
- Provide troubleshooting guidance for configuration issues

### **`[SHOW-HOVER-CHECKBOX-015]` - Bug Fix Documentation**
- Document the service worker message type fix
- Explain the use of existing `updateOverlayConfig` message type
- Document error handling improvements for message broadcasting

## 🔍 Semantic Tokens

### **Primary Tokens**
- **`[SHOW-HOVER-CHECKBOX-001]`**: Primary requirement for popup checkbox
- **`[SHOW-HOVER-CHECKBOX-002]`**: Database field manipulation requirement
- **`[SHOW-HOVER-CHECKBOX-003]`**: UI integration requirement
- **`[SHOW-HOVER-CHECKBOX-004]`**: State synchronization requirement
- **`[SHOW-HOVER-CHECKBOX-005]`**: User experience requirement

### **Implementation Tokens**
- **`[SHOW-HOVER-CHECKBOX-006]`**: HTML structure requirement
- **`[SHOW-HOVER-CHECKBOX-007]`**: JavaScript integration requirement
- **`[SHOW-HOVER-CHECKBOX-008]`**: Configuration loading requirement

### **Testing Tokens**
- **`[SHOW-HOVER-CHECKBOX-009]`**: Functional testing requirement
- **`[SHOW-HOVER-CHECKBOX-010]`**: Integration testing requirement

### **Success Criteria Tokens**
- **`[SHOW-HOVER-CHECKBOX-011]`**: Primary success criteria
- **`[SHOW-HOVER-CHECKBOX-012]`**: User experience success criteria

### **Documentation Tokens**
- **`[SHOW-HOVER-CHECKBOX-013]`**: Implementation documentation requirement
- **`[SHOW-HOVER-CHECKBOX-014]`**: User documentation requirement
- **`[SHOW-HOVER-CHECKBOX-015]`**: Bug fix documentation requirement

### **Architectural Tokens**
- **`[SHOW-HOVER-CHECKBOX-ARCH-001]`**: ConfigManager pattern requirement
- **`[SHOW-HOVER-CHECKBOX-ARCH-002]`**: UI integration requirement
- **`[SHOW-HOVER-CHECKBOX-ARCH-003]`**: Message pattern requirement 