# [IMMUTABLE-REQ-TAG-004] Overlay Window Tag Persistence

**Date**: 2025-07-14  
**Status**: Immutable Requirement  
**Version**: 1.1  
**Semantic Token**: `[IMMUTABLE-REQ-TAG-004]`

## 🎯 Overview

This document defines the immutable requirements for implementing tag persistence in the overlay window. Currently, tags added in the overlay window are displayed in the UI but are not made permanent. This requirement ensures that adding a tag in the overlay window processes new tags similar to the popup window, making them permanent in the site's record and immediately displaying them in the Current tags list.

## 📋 Core Requirements

### [IMMUTABLE-REQ-TAG-004] Overlay Window Tag Persistence

**Semantic Token**: `[IMMUTABLE-REQ-TAG-004]`

#### Primary Requirements

1. **Tag Persistence**: Tags added in the overlay window must be permanently saved to the site's record
2. **Immediate Display**: Tags must immediately appear in the Current tags list after being added
3. **Popup Consistency**: Overlay tag processing must be identical to popup window processing
4. **User Feedback**: Clear success/error messages must be provided for all tag operations
5. **Error Handling**: Graceful handling of network failures and validation errors

#### Technical Specifications

**Tag Input Processing**:
- Validate tag format and length before processing
- Send `saveTag` message to background service for persistence
- Update local content object immediately for display
- Refresh overlay with updated local content
- Show success/error feedback messages

**Recent Tags Processing**:
- Process recent tag clicks with persistence
- Send `saveTag` message for each selected tag
- Update local content immediately for display
- Refresh overlay with updated content
- Provide user feedback for all operations

**Message Flow**:
1. User inputs tag (via typing or clicking recent tag)
2. Tag is validated for format and length
3. `saveTag` message sent to background service
4. Tag immediately added to local content for display
5. Overlay refreshed with updated local content
6. Success/error message displayed to user

#### Security Requirements

**Tag Validation**:
- Maximum length: 50 characters
- Prohibited characters: `<`, `>`, `{`, `}`
- Empty or whitespace-only tags rejected
- Duplicate tags prevented

**Input Sanitization**:
- Trim whitespace from tag input
- Validate tag format before processing
- Prevent XSS and injection attacks

#### Success Criteria

1. **✅ Tag Persistence**: Tags added in overlay are permanently saved to site's record
2. **✅ Tag Display**: Tags immediately appear in Current tags list after being added
3. **✅ Popup Consistency**: Overlay processing matches popup window behavior
4. **✅ User Feedback**: Clear success/error messages for all operations
5. **✅ Error Handling**: Graceful handling of network and validation errors
6. **✅ Content Refresh**: Overlay updates with latest bookmark data
7. **✅ Validation**: Real-time tag format validation
8. **✅ UX Enhancement**: Smooth animations and responsive feedback

#### Error Handling Requirements

**Network Failures**:
- Display error message when tag persistence fails
- Maintain UI functionality during network outages
- Provide retry mechanism for failed operations

**Validation Errors**:
- Show specific error messages for invalid tag formats
- Prevent invalid tags from being processed
- Maintain input field state for user correction

**Service Unavailable**:
- Graceful degradation when background service unavailable
- Fallback behavior maintains UI functionality
- Clear communication of service status

#### Performance Requirements

**Response Time**:
- Tag display must be immediate (< 100ms)
- Message feedback must appear within 500ms
- Overlay refresh must complete within 1 second

**Memory Management**:
- Proper cleanup of message elements
- Efficient tag storage and retrieval
- Minimal memory footprint for overlay operations

#### Compatibility Requirements

**Browser Support**:
- Chrome Extension Manifest V3
- Content script compatibility
- Service worker message passing

**Existing Functionality**:
- Maintain backward compatibility with current overlay
- Preserve existing tag management features
- No disruption to current user workflows

## 🔧 Implementation Constraints

### Technical Constraints

**Chrome Extension Architecture**:
- Content script isolation requires message passing
- Service worker communication for persistence
- Limited direct API access from content script

**Message Passing**:
- Asynchronous communication with background
- Error handling for message failures
- Timeout handling for slow responses

**UI Responsiveness**:
- Non-blocking tag operations
- Immediate visual feedback
- Smooth animations and transitions

### Security Constraints

**Content Script Limitations**:
- Restricted access to page content
- Limited cross-origin communication
- Sandboxed execution environment

**Tag Validation**:
- Client-side validation for immediate feedback
- Server-side validation for persistence
- Consistent validation across all entry points

## 📊 Acceptance Criteria

### Functional Requirements

1. **Tag Addition**: Users can add tags via overlay input or recent tags
2. **Immediate Display**: Tags appear in Current tags list immediately after addition
3. **Persistence**: Tags are permanently saved to site's record
4. **Validation**: Invalid tags are rejected with clear error messages
5. **Feedback**: Success/error messages are displayed for all operations

### Non-Functional Requirements

1. **Performance**: Tag operations complete within specified time limits
2. **Reliability**: System handles network failures gracefully
3. **Usability**: Interface remains responsive during operations
4. **Security**: Tag validation prevents malicious input

### Testing Requirements

1. **Unit Tests**: Comprehensive testing of tag persistence logic
2. **Integration Tests**: End-to-end workflow testing
3. **E2E Tests**: Full user scenario testing
4. **Manual Tests**: Interactive testing of core functionality

## 🎯 Success Metrics

### User Experience Metrics

1. **Tag Display Time**: Tags appear in Current tags list within 100ms
2. **Feedback Time**: Success/error messages appear within 500ms
3. **Error Rate**: Less than 1% of tag operations fail
4. **User Satisfaction**: Positive feedback on tag persistence functionality

### Technical Metrics

1. **Message Success Rate**: 99%+ successful message passing
2. **Memory Usage**: Minimal increase in memory footprint
3. **Performance**: No degradation in overlay responsiveness
4. **Reliability**: System handles all error conditions gracefully

## 📝 Change History

**Version 1.1** (2025-07-14):
- Added requirement for immediate tag display in Current tags list
- Updated message flow to include local content updates
- Enhanced success criteria to include tag display verification
- Added performance requirements for immediate visual feedback

**Version 1.0** (2025-07-14):
- Initial immutable requirements for overlay tag persistence
- Basic tag persistence and validation requirements
- Error handling and user feedback specifications 