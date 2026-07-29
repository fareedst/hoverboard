# Popup Show Hover Checkbox Semantic Tokens

**Date:** 2025-07-19  
**Status:** Token Definition  
**Cross-References:** All popup show hover checkbox documents

## 🎯 Overview

This document defines all semantic tokens used in the popup show hover checkbox requirements, implementation plan, and architectural decisions. These tokens provide cross-references and traceability across all related documentation.

## 📋 Primary Requirements Tokens

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-001)]` - Primary Requirement**
**Definition**: The popup must include a checkbox to the right of the 'Show Hover' button that controls the "Show hover overlay on page load" setting

**Usage**: 
- Requirements specification
- Implementation planning
- Testing criteria
- Success validation

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-006)]` - HTML structure requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-007)]` - JavaScript integration requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-009)]` - Testing requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-011)]` - Success criteria

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-002)]` - Database Field Manipulation**
**Definition**: The checkbox must manipulate the same database field as the existing configuration page row

**Usage**:
- Requirements specification
- Implementation planning
- Configuration management
- Storage validation

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-007)]` - JavaScript integration requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-008)]` - Configuration loading requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-001)]` - ConfigManager pattern requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-008)]` - Storage efficiency requirement

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-003)]` - UI Integration**
**Definition**: The checkbox must be properly integrated into the popup interface

**Usage**:
- Requirements specification
- Implementation planning
- UI design
- Accessibility validation

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-006)]` - HTML structure requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-002)]` - UI integration requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-012)]` - User experience success criteria

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-004)]` - State Synchronization**
**Definition**: The checkbox state must remain synchronized across all interfaces

**Usage**:
- Requirements specification
- Implementation planning
- Integration testing
- State management

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-007)]` - JavaScript integration requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-010)]` - Integration testing requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-003)]` - Message pattern requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-004)]` - Configuration state synchronization requirement

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-005)]` - User Experience**
**Definition**: The checkbox must provide clear user feedback

**Usage**:
- Requirements specification
- Implementation planning
- User experience validation
- Accessibility standards

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-007)]` - JavaScript integration requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-012)]` - User experience success criteria
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-002)]` - UI integration requirement

## 🔧 Implementation Tokens

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-006)]` - HTML Structure**
**Definition**: HTML structure modification requirement

**Usage**:
- Implementation planning
- HTML development
- Structure validation

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-001)]` - Primary requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-003)]` - UI integration requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-TASK-001)]` - HTML structure task

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-007)]` - JavaScript Integration**
**Definition**: JavaScript integration requirement

**Usage**:
- Implementation planning
- JavaScript development
- Integration validation

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-001)]` - Primary requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-002)]` - Database field manipulation requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-004)]` - State synchronization requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-005)]` - User experience requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-TASK-002)]` - JavaScript integration task

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-008)]` - Configuration Loading**
**Definition**: Configuration loading requirement

**Usage**:
- Implementation planning
- Configuration management
- Loading validation

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-002)]` - Database field manipulation requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-001)]` - ConfigManager pattern requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-TASK-003)]` - Configuration management task

## 🧪 Testing Tokens

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-009)]` - Functional Testing**
**Definition**: Functional testing requirement

**Usage**:
- Testing planning
- Test development
- Quality assurance

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-001)]` - Primary requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-002)]` - Database field manipulation requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-003)]` - UI integration requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-TASK-005)]` - Testing implementation task

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-010)]` - Integration Testing**
**Definition**: Integration testing requirement

**Usage**:
- Testing planning
- Integration test development
- Quality assurance

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-004)]` - State synchronization requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-TASK-005)]` - Testing implementation task

## 🎯 Success Criteria Tokens

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-011)]` - Primary Success Criteria**
**Definition**: Primary success criteria

**Usage**:
- Success validation
- Implementation verification
- Quality assurance

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-001)]` - Primary requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-002)]` - Database field manipulation requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-004)]` - State synchronization requirement

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-012)]` - User Experience Success Criteria**
**Definition**: User experience success criteria

**Usage**:
- User experience validation
- Accessibility verification
- Quality assurance

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-003)]` - UI integration requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-005)]` - User experience requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-002)]` - UI integration requirement

## 📝 Documentation Tokens

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-013)]` - Implementation Documentation**
**Definition**: Implementation documentation requirement

**Usage**:
- Code documentation
- Change documentation
- Maintenance documentation

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-TASK-006)]` - Documentation task

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-014)]` - User Documentation**
**Definition**: User-facing documentation requirement

**Usage**:
- User guides
- Help content
- Troubleshooting documentation

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-TASK-006)]` - Documentation task

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-015)]` - Bug Fix Documentation**
**Definition**: Bug fix documentation requirement

**Usage**:
- Bug fix documentation
- Error resolution documentation
- Service worker message type fixes

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-TASK-006)]` - Documentation task
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-003)]` - Message pattern requirement

## 🏗️ Task Tokens

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-TASK-001)]` - HTML Structure and CSS Styling**
**Definition**: Task for HTML structure modification and CSS styling

**Usage**:
- Project planning
- Implementation scheduling
- Resource allocation

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-006)]` - HTML structure requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-003)]` - UI integration requirement

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-TASK-002)]` - JavaScript Integration**
**Definition**: Task for JavaScript integration

**Usage**:
- Implementation planning
- Code development
- Testing coordination

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-007)]` - JavaScript integration requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-008)]` - Configuration loading requirement

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-TASK-003)]` - Configuration Management Integration**
**Definition**: Task for configuration management integration

**Usage**:
- Implementation planning
- Configuration development
- Testing coordination

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-002)]` - Database field manipulation requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-008)]` - Configuration loading requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-001)]` - ConfigManager pattern requirement

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-TASK-004)]` - Content Script Integration**
**Definition**: Task for content script integration

**Usage**:
- Implementation planning
- Integration development
- Testing coordination

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-004)]` - State synchronization requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-006)]` - Configuration update handling requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-007)]` - Page load behavior integration requirement

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-TASK-005)]` - Testing Implementation**
**Definition**: Task for testing implementation

**Usage**:
- Testing planning
- Test development
- Quality assurance

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-009)]` - Functional testing requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-010)]` - Integration testing requirement

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-TASK-006)]` - Documentation Updates**
**Definition**: Task for documentation updates

**Usage**:
- Documentation planning
- Documentation development
- Maintenance coordination

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-013)]` - Implementation documentation requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-014)]` - User documentation requirement

## 🏗️ Architectural Tokens

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-001)]` - ConfigManager Pattern Usage**
**Definition**: Checkbox must use existing ConfigManager patterns

**Usage**:
- Architectural planning
- Implementation guidance
- Pattern compliance

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-002)]` - Database field manipulation requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-008)]` - Configuration loading requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-008)]` - Storage efficiency requirement

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-002)]` - UI Integration Pattern**
**Definition**: UI must integrate seamlessly with existing popup design

**Usage**:
- Architectural planning
- UI design guidance
- Integration compliance

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-003)]` - UI integration requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-012)]` - User experience success criteria

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-003)]` - Message Pattern Usage**
**Definition**: State synchronization must use existing message patterns

**Usage**:
- Architectural planning
- Communication guidance
- Pattern compliance

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-004)]` - State synchronization requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-009)]` - Message passing efficiency requirement

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-004)]` - Configuration State Synchronization**
**Definition**: Configuration state synchronization must use existing patterns

**Usage**:
- Architectural planning
- State management guidance
- Pattern compliance

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-004)]` - State synchronization requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-001)]` - ConfigManager pattern requirement

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-005)]` - Event Handling Architecture**
**Definition**: Event handling must use existing patterns

**Usage**:
- Architectural planning
- Event handling guidance
- Pattern compliance

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-007)]` - JavaScript integration requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-005)]` - User experience requirement

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-006)]` - Configuration Update Handling**
**Definition**: Content script configuration updates must use existing patterns

**Usage**:
- Architectural planning
- Content script guidance
- Pattern compliance

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-004)]` - State synchronization requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-TASK-004)]` - Content script integration task

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-007)]` - Page Load Behavior Integration**
**Definition**: Page load behavior must use existing patterns

**Usage**:
- Architectural planning
- Page load behavior guidance
- Pattern compliance

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-002)]` - Database field manipulation requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-TASK-004)]` - Content script integration task

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-008)]` - Storage Efficiency**
**Definition**: Storage efficiency must use existing patterns

**Usage**:
- Architectural planning
- Storage guidance
- Efficiency compliance

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-002)]` - Database field manipulation requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-001)]` - ConfigManager pattern requirement

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-009)]` - Message Passing Efficiency**
**Definition**: Message passing efficiency must use existing patterns

**Usage**:
- Architectural planning
- Message passing guidance
- Efficiency compliance

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-004)]` - State synchronization requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-003)]` - Message pattern requirement

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-010)]` - Integration with Existing Systems**
**Definition**: Integration with existing systems must be seamless

**Usage**:
- Architectural planning
- Integration guidance
- System compliance

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-004)]` - State synchronization requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-001)]` - ConfigManager pattern requirement

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-011)]` - Error Handling Integration**
**Definition**: Error handling must use existing patterns

**Usage**:
- Architectural planning
- Error handling guidance
- Pattern compliance

**Cross-References**:
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-007)]` - JavaScript integration requirement
- `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-005)]` - User experience requirement

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-012)]` - Architectural Success Criteria**
**Definition**: Architectural success criteria

**Usage**:
- Success validation
- Implementation verification
- Quality assurance

**Cross-References**:
- All architectural tokens
- All implementation tokens
- All success criteria tokens

### **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-013)]` - Platform Success Criteria**
**Definition**: Platform success criteria

**Usage**:
- Platform validation
- Cross-browser verification
- Quality assurance

**Cross-References**:
- All architectural tokens
- All platform-specific considerations
- All success criteria tokens

## 📚 Cross-Reference Coordination

### **Existing Requirements Coordination**
- **`[[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] (was POPUP-CLOSE-BEHAVIOR-001)]`**: ✅ Popup must remain open after checkbox changes
- **`[[IMPL-FEATURE_FLAGS] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] (was CFG-003)]`**: ✅ Configuration management patterns must be followed
- **`[[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] (was POPUP-ARCH-001)]`**: ✅ Architecture must support new UI element
- **`[[IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION] (was UI-BEHAVIOR-001)]`**: ✅ UI behavior patterns must be consistent

### **Architectural Decisions**
- **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-001)]`**: ✅ Checkbox must use existing ConfigManager patterns
- **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-002)]`**: ✅ UI must integrate seamlessly with existing popup design
- **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-003)]`**: ✅ State synchronization must use existing message patterns
- **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-004)]`**: ✅ Configuration state synchronization must use existing patterns
- **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-005)]`**: ✅ Event handling must use existing patterns
- **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-006)]`**: ✅ Content script configuration updates must use existing patterns
- **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-007)]`**: ✅ Page load behavior must use existing patterns
- **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-008)]`**: ✅ Storage efficiency must use existing patterns
- **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-009)]`**: ✅ Message passing efficiency must use existing patterns
- **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-010)]`**: ✅ Integration with existing systems must be seamless
- **`[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-011)]`**: ✅ Error handling must use existing patterns

## 🎯 Token Usage Guidelines

### **Primary Requirements**
- Use `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-001)]` through `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-005)]` for requirements specification
- Use `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-006)]` through `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-008)]` for implementation requirements
- Use `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-009)]` through `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-010)]` for testing requirements
- Use `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-011)]` through `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-012)]` for success criteria
- Use `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-013)]` through `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-014)]` for documentation requirements

### **Implementation Tasks**
- Use `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-TASK-001)]` through `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-TASK-006)]` for task planning
- Use `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-001)]` through `[[IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] (was SHOW-HOVER-CHECKBOX-ARCH-013)]` for architectural decisions

### **Cross-Reference Coordination**
- All tokens must coordinate with existing requirements
- All architectural decisions must coordinate with existing patterns
- All implementation tasks must coordinate with existing systems
- All success criteria must coordinate with existing validation 