# 🛡️ Immutable Requirements - Hoverboard Extension

> **🚨 CRITICAL FOR AI ASSISTANTS**: These requirements are UNCHANGEABLE and must NEVER be modified. All code changes must be checked against these requirements for conflicts.

## 📑 Purpose

This document establishes the core, unchangeable requirements for the Hoverboard extension that must be preserved across all development phases and iterations.

## 🛡️ Core Extension Identity

### **Extension Metadata (NEVER CHANGE)**
- **Name**: "Hoverboard"
- **Purpose**: Pinboard.in bookmarking interface enhancement
- **Target Platform**: Chrome/Chromium-based browsers
- **Architecture**: Browser extension with content script injection

### **Core User Experience (PRESERVE)**
- **Primary Function**: Enhance Pinboard.in bookmarking workflow
- **Hover Interface**: Non-intrusive overlay on webpage hover
- **Quick Actions**: Add/edit bookmarks without leaving current page
- **Tag Management**: Recent tags and quick tag insertion
- **Private Bookmarking**: Support for private bookmark management

## 🔧 Technical Immutable Requirements

### **Manifest V3 Migration (CRITICAL)**
- **Target**: Manifest V3 compliance (current: V2)
- **Service Worker**: Replace background scripts with service worker
- **Permissions**: Maintain current functionality while using V3 permissions
- **Content Scripts**: Preserve injection patterns and functionality

### **API Integration (PRESERVE)**
- **Pinboard API**: Maintain compatibility with Pinboard.in API
- **Authentication**: Token-based authentication (preserve current method)
- **API Endpoints**: Preserve all current Pinboard API integrations
- **Rate Limiting**: Respect Pinboard API rate limits

### **Data Storage (MAINTAIN)**
- **Chrome Storage API**: Use chrome.storage.sync for user settings
- **Local Storage**: Use chrome.storage.local for temporary data
- **Configuration**: Preserve user configuration migration capability
- **Privacy**: No external data collection or tracking

## 🎯 Feature Immutable Specifications

### **Hover Interface (CORE FUNCTIONALITY)**
- **Trigger**: Mouse hover activation on webpage elements
- **Overlay**: Semi-transparent overlay with bookmark interface
- **Non-Intrusive**: Must not interfere with normal webpage interaction
- **Responsive**: Adapt to different screen sizes and page layouts

### **Bookmark Management (PRESERVE ALL)**
- **Add Bookmarks**: Quick bookmark creation with URL, title, description, tags
- **Edit Bookmarks**: Modify existing bookmark details
- **Tag Management**: Display recent tags, add new tags, tag suggestions
- **Private Toggle**: Support for private/public bookmark settings
- **Delete/Archive**: Support for bookmark removal and archiving

### **Recent Tags System (MAINTAIN)**
- **Tag History**: Preserve recently used tags across sessions
- **Tag Suggestions**: Smart tag completion and suggestions
- **Tag Storage**: Maintain tag history in sync storage
- **Tag Display**: Show recent tags in bookmark interface

### **Configuration System (PRESERVE COMPATIBILITY)**
- **User Settings**: All current user-configurable options must remain
- **Migration**: Support migration from V2 configuration to V3
- **Backwards Compatibility**: Preserve existing user settings during updates
- **Reset Functionality**: Allow users to reset to default configuration

## 🚨 Security Immutable Requirements

### **Permissions (MINIMAL NECESSARY)**
- **Host Permissions**: Only "http://*/*" and "https://*/*" as needed
- **Storage Permission**: "storage" for user settings and data
- **Tabs Permission**: "tabs" for current tab URL detection
- **No Excessive Permissions**: Avoid requesting unnecessary permissions

### **Content Security Policy (STRICT)**
- **No Inline Scripts**: All JavaScript in separate files
- **No eval()**: No dynamic code execution
- **Secure Origins**: Only HTTPS for API communications
- **CSP Compliance**: Full Content Security Policy compliance

### **Privacy Protection (ABSOLUTE)**
- **No Tracking**: No user behavior tracking or analytics
- **No External Services**: No third-party service integrations beyond Pinboard
- **Local Processing**: All data processing happens locally
- **User Control**: User has complete control over their data

## 🔄 Migration Immutable Constraints

### **V2 to V3 Migration (PRESERVE FUNCTIONALITY)**
- **Feature Parity**: All V2 features must work in V3
- **User Data**: No loss of user settings or configuration
- **Performance**: Maintain or improve performance in V3
- **Stability**: No regression in extension stability

### **Code Architecture (MAINTAIN PATTERNS)**
- **Modular Structure**: Preserve modular code organization
- **Error Handling**: Maintain robust error handling patterns
- **Logging**: Preserve debugging and logging capabilities
- **Testing**: Maintain test coverage for critical functionality

## 📋 Development Process Immutable Rules

### **Code Quality (NON-NEGOTIABLE)**
- **ESLint Compliance**: All code must pass ESLint validation
- **Test Coverage**: Critical paths must have test coverage
- **Documentation**: All public APIs must have JSDoc documentation
- **Code Review**: All changes must be validated before implementation

### **Version Control (PRESERVE)**
- **Semantic Versioning**: Maintain semantic version numbering
- **Change Documentation**: All changes must be documented
- **Backwards Compatibility**: No breaking changes without major version bump
- **Release Process**: Maintain structured release process

## ⚠️ Immutable Violation Detection

### **Automatic Checks (ENFORCE)**
- **Manifest Validation**: Automatic validation of manifest.json structure
- **Permission Validation**: Check for permission scope creep
- **API Compatibility**: Validate Pinboard API integration integrity
- **Test Regression**: Prevent functionality regression through testing

### **Manual Review Points (CRITICAL)**
- **Security Review**: All permission and security changes require review
- **User Experience**: All UX changes must preserve core experience
- **API Changes**: All external API interactions require validation
- **Performance Impact**: Performance regressions require justification

## 🚨 Emergency Override Procedures

### **When Immutable Changes Required**
1. **Document Necessity**: Clear technical or security justification
2. **Impact Analysis**: Full analysis of user and system impact
3. **Migration Plan**: Detailed plan for transitioning users
4. **Rollback Strategy**: Clear rollback procedure if issues arise
5. **User Communication**: Clear communication to users about changes

### **Override Authorization Required**
- **Technical Lead Approval**: For architectural changes
- **Security Review**: For security-related modifications
- **User Experience Review**: For core UX changes
- **Community Input**: For significant feature modifications

## ✅ Compliance Validation

All AI assistants and developers must validate their changes against these immutable requirements:

- [ ] **Extension Identity**: Preserves core extension purpose and branding
- [ ] **Core Functionality**: Maintains all essential user features
- [ ] **API Integration**: Preserves Pinboard API compatibility
- [ ] **Security Standards**: Meets all security and privacy requirements
- [ ] **Migration Compatibility**: Supports smooth V2 to V3 transition
- [ ] **Performance Standards**: Maintains or improves performance
- [ ] **Code Quality**: Meets all quality and documentation standards

## 🛡️ Final Notice

**These requirements form the immutable foundation of the Hoverboard extension. Any proposed changes that conflict with these requirements must be rejected or require formal override procedures.**

**🤖 AI Assistants**: Always validate your planned changes against this document before implementation. If conflicts exist, stop and request clarification rather than proceeding with conflicting changes. 