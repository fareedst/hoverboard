# 🛡️ Immutable Requirements - Hoverboard Extension

> **🚨 CRITICAL FOR AI ASSISTANTS**: These requirements are UNCHANGEABLE and must NEVER be modified. All code changes must be checked against these requirements for conflicts.

## 📑 Purpose

This document establishes the core, unchangeable requirements for the Hoverboard extension that must be preserved across all development phases and iterations.

## 🔗 TIED Requirements Reference

**⚠️ IMPORTANT**: All immutable requirements are now documented in the TIED requirements file. This file serves as a quick reference and compliance checklist.

👉 **See `tied/requirements.yaml` and `tied/requirements/` for complete immutable requirements:**

### Immutable Requirements (Major Version Change Required)
- `[REQ-EXTENSION_IDENTITY]` - Extension Identity Preservation
- `[REQ-CORE_UX_PRESERVATION]` - Core User Experience Preservation
- `[REQ-MANIFEST_V3_MIGRATION]` - Manifest V3 Migration
- `[REQ-PINBOARD_COMPATIBILITY]` - Pinboard API Compatibility
- `[REQ-CHROME_STORAGE_USAGE]` - Chrome Storage API Usage
- `[REQ-RECENT_TAGS_SYSTEM]` - Recent Tags System

### Core Functional Requirements
- `[REQ-SMART_BOOKMARKING]` - Smart Bookmarking
- `[REQ-TAG_MANAGEMENT]` - Tag Management
- `[REQ-DARK_THEME]` - Dark Theme Support
- `[REQ-OVERLAY_SYSTEM]` - Overlay System
- `[REQ-BADGE_INDICATORS]` - Badge Indicators
- `[REQ-SITE_MANAGEMENT]` - Site Management
- `[REQ-SEARCH_FUNCTIONALITY]` - Search Functionality
- `[REQ-PRIVACY_CONTROLS]` - Privacy Controls

**For architecture decisions that fulfill these requirements:**
👉 See `tied/architecture-decisions.yaml` and `tied/architecture-decisions/`

**For implementation details:**
👉 See `tied/implementation-decisions.yaml` and `tied/implementation-decisions/`

**For semantic token registry:**
👉 See `tied/semantic-tokens.yaml` and `tied/semantic-tokens.md`

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

All AI assistants and developers must validate their changes against the immutable requirements in `tied/requirements.yaml`:

- [ ] **Extension Identity**: Preserves core extension purpose and branding (`[REQ:EXTENSION_IDENTITY]`)
- [ ] **Core Functionality**: Maintains all essential user features (`[REQ:CORE_UX_PRESERVATION]`, `[REQ:SMART_BOOKMARKING]`-`[REQ:PRIVACY_CONTROLS]`)
- [ ] **API Integration**: Preserves Pinboard API compatibility (`[REQ:PINBOARD_COMPATIBILITY]`)
- [ ] **Security Standards**: Meets all security and privacy requirements (`[REQ:CHROME_STORAGE_USAGE]`, `[REQ:PRIVACY_CONTROLS]`)
- [ ] **Migration Compatibility**: Supports smooth V2 to V3 transition (`[REQ:MANIFEST_V3_MIGRATION]`)
- [ ] **Performance Standards**: Maintains or improves performance (see architecture decisions)
- [ ] **Code Quality**: Meets all quality and documentation standards (see TIED principles)

## 🛡️ Final Notice

**These requirements form the immutable foundation of the Hoverboard extension. Any proposed changes that conflict with these requirements must be rejected or require formal override procedures.**

**🤖 AI Assistants**: Always validate your planned changes against `tied/requirements.yaml` before implementation. If conflicts exist, stop and request clarification rather than proceeding with conflicting changes.

**📚 TIED Coordination**: All requirements, architecture decisions, and implementation decisions are coordinated through the `tied/` folder. Always reference TIED files for the authoritative source of truth. 