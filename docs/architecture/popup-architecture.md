# Hoverboard Extension Popup Architecture Plan

## Overview

This document outlines the complete popup architecture for the Hoverboard browser extension, including component interactions, screen flows, refresh strategies, and implementation patterns for re-implementation.

## Component Architecture

### 1. **Main Popup** (`src/browser_action/`)
- **Files**: `browser_action.html`, `browser_action.js`, `browser_action.css`
- **Purpose**: Primary interface when clicking the extension icon
- **Dimensions**: 320x400px overlay window
- **Lifecycle**: Created on icon click, destroyed on close
- **Features**: 
  - Quick bookmark actions (private, to-read, delete)
  - Tag management interface
  - Search functionality
  - Overlay activation controls

### 2. **Configuration Page** (`src/options_custom/`)
- **Files**: `index.html`, `settings.js`, `manifest.js`
- **Purpose**: Extension settings and preferences
- **Lifecycle**: Created when opened, persists until tab closed
- **Features**:
  - API token configuration
  - UI preferences (tooltips, auto-show settings)
  - Badge text customization
  - Recent posts count configuration

### 3. **Content Script Overlay** (`src/inject/`)
- **Files**: `inject.js`, `hoverInjector.js`, `in_overlay.js`, `inject.css`
- **Purpose**: In-page overlay showing bookmark information
- **Lifecycle**: Injected on page load, persists until navigation
- **Features**:
  - Hover-based bookmark display
  - Tag management directly on web pages
  - Recent tags suggestions
  - Dynamic content injection

### 4. **Overlay Testing Page** (`test-overlay-enhanced.html`, `dev-server.js`)
- **Purpose**: Development environment for testing overlay functionality
- **URL**: `http://localhost:3000`
- **Features**:
  - Real-time overlay testing
  - API endpoint simulation
  - Bookmark data visualization
  - Development debugging tools

## Screen Flow & Click Launch Patterns

### Browser Icon Interactions

#### Left Click → Main Popup
```
User clicks icon → Check current tab → Load bookmark data → Render popup
                                    ↓
                          Update icon badge/color based on bookmark state
```

**Refresh Requirements**:
- Load current tab URL and title
- Fetch bookmark data from API/cache
- Update recent tags list
- Refresh icon state

#### Right Click → Context Menu
- **"Options"** → Configuration Page
- **"Show Overlay"** → Activate overlay on current tab

### Main Popup Navigation

#### Show Overlay Button
**Flow**:
```
Show Overlay click → Send message to content script → Create/show overlay → Close popup
                                                   ↓
                                        Pass current bookmark data to overlay
```

#### Settings Button
**Flow**:
```
Settings click → chrome.runtime.openOptionsPage() → Load config page → Close popup
                                                  ↓
                                        Load current settings from storage
```

#### Tag Operations
- **"Add Tag"** → API call → Refresh popup + icon + overlay
- **"Remove Tag"** → API call → Update all components
- **"Toggle Private"** → API call → Refresh all components with new state
- **"Delete Bookmark"** → API call → Reset icon + hide overlay

### Configuration Page Links

#### Test Overlay Button
**Flow**:
```
Test click → Open new tab to localhost:3000 → Load test environment → Initialize with current settings
                                           ↓
                                    Pass API token and preferences to test page
```

#### Save Settings
**Flow**:
```
Save → chrome.storage → Broadcast to all components → Refresh all interfaces
```

### Overlay Interactions

#### Tag Management
- **Add Tag** → API call → Refresh popup + icon + overlay
- **Remove Tag** → API call → Update all components  
- **Toggle Privacy** → API call → Update icon color + all interfaces

#### Overlay Controls
- **Close X** → Hide overlay (content script stays ready)
- **Add Bookmark** → API call → Show full bookmark interface

## Communication Architecture

### Message Passing System
```
Background Script (Service Worker - Message Router)
    ↕ chrome.runtime.sendMessage/onMessage
Main Popup ↔ Content Scripts ↔ Options Page
    ↕ chrome.tabs.sendMessage        ↕
Testing Page (HTTP proxy via dev-server)
```

### Cross-Component Message Flow

#### Popup → Overlay Communication
```javascript
// In popup
async function updateOverlay(action, data) {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.tabs.sendMessage(tabs[0].id, {
    action: `OVERLAY_${action}`,
    data: data,
    timestamp: Date.now()
  });
}

// Usage examples
await updateOverlay('REFRESH', { bookmark: newBookmarkData });
await updateOverlay('SHOW', { bookmark: bookmarkData });
await updateOverlay('HIDE');
```

#### Configuration → All Components
```javascript
async function broadcastSettingsChange(newSettings) {
  // Update background script
  await chrome.runtime.sendMessage({
    action: 'SETTINGS_UPDATED',
    data: newSettings
  });
  
  // Update all tabs with overlays
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'SETTINGS_UPDATED',
        data: newSettings
      });
    } catch (e) {
      // Tab might not have content script
    }
  }
}
```

## Icon State Management

### Icon Update Triggers

#### Real-time Updates (0-100ms)
- Tab activation/switching
- URL navigation  
- Bookmark add/delete
- Tag count changes

#### Icon State Calculation
```javascript
function calculateIconState(bookmark) {
  const hasBookmark = bookmark && bookmark.url;
  const tagCount = hasBookmark ? bookmark.tags.length : 0;
  const isPrivate = hasBookmark && bookmark.shared === 'no';
  const isToRead = hasBookmark && bookmark.toread === 'yes';

  return {
    // Icon appearance
    icon: hasBookmark ? "icons/bookmarked.png" : "icons/unbookmarked.png",
    
    // Badge text (number of tags)
    badgeText: hasBookmark ? tagCount.toString() : "",
    
    // Badge background color
    badgeBackgroundColor: isPrivate ? "#FF6B6B" : 
                         isToRead ? "#FFE066" : "#4ECDC4",
    
    // Title tooltip
    title: hasBookmark ? 
      `${bookmark.description || 'Bookmarked'} • ${tagCount} tags${isPrivate ? ' • Private' : ''}${isToRead ? ' • Read Later' : ''}` :
      "Not bookmarked • Click to add"
  };
}
```

### Visual States
- **🔘 Gray (unbookmarked)** → No bookmark exists
- **🔘 Blue (bookmarked)** → Bookmark exists  
- **🔘 Red (private)** → Private bookmark
- **🔘 Yellow (to-read)** → Marked for reading

### Badge Display
- **Empty** → No bookmark
- **Number** → Tag count
- **"P"** → Private indicator
- **"!"** → To-read indicator

## Component Refresh Strategy

### Refresh Priority Levels

#### High Priority Refresh Events (0-100ms)
- **Bookmark Created**: Update icon, refresh popup, show overlay
- **Bookmark Deleted**: Update icon, refresh popup, hide overlay
- **Tag Added/Removed**: Update icon badge, refresh popup/overlay
- **Privacy Toggled**: Update icon color, refresh popup/overlay

#### Medium Priority Refresh Events (100-500ms)
- **Settings Changed**: Refresh all components gradually
- **API Token Updated**: Validate and refresh data sources
- **Tab Switched**: Update icon for new tab

#### Low Priority Refresh Events (500ms+)
- **Window Focus**: Refresh current tab icon
- **Extension Updated**: Refresh all states
- **Cache Expired**: Background refresh of data

### Component-Specific Refresh Scenarios

#### Main Popup Refresh
**When to Refresh**:
- Popup opens (always)
- Tag added/removed
- Privacy toggled
- Bookmark deleted
- Settings changed

**Refresh Implementation**:
```javascript
class PopupRefreshManager {
  async refreshAll() {
    await this.loadCurrentTab();
    await this.loadBookmarkData();
    await this.loadRecentTags();
    await this.loadSettings();
    this.render();
  }
  
  async refreshAfterTagChange() {
    await this.loadBookmarkData();
    await this.loadRecentTags();
    this.render();
    this.notifyOverlay();
  }
}
```

#### Overlay Refresh
**When to Refresh**:
- Page loads (if auto-show enabled)
- Bookmark data changes
- Settings updated
- Manual refresh triggered

**Auto-refresh Implementation**:
```javascript
class OverlayRefreshManager {
  setupAutoRefresh() {
    // Listen for page navigation
    let lastUrl = location.href;
    new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        this.refreshForNewUrl();
      }
    }).observe(document, { subtree: true, childList: true });
    
    // Listen for popup changes
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'BOOKMARK_UPDATED') {
        this.refreshBookmarkData(message.data);
      }
    });
  }
}
```

## Detailed Refresh Scenarios

### Scenario 1: User Adds Tag in Popup

**Timeline**:
```
T+0ms:     User types tag and clicks Add
T+0ms:     Popup shows "Adding..." state
T+0ms:     Send API request to add tag
T+50ms:    Update popup UI optimistically
T+100ms:   Send message to overlay to update
T+200ms:   API responds with success
T+250ms:   Update browser icon badge (+1)
T+300ms:   Refresh popup with server data
T+350ms:   Refresh overlay with server data
```

**Components Affected**:
- ✅ Popup (immediate optimistic update)
- ✅ Browser Icon (badge text change)
- ✅ Overlay (if visible on same tab)
- ❌ Config Page (not affected)

### Scenario 2: User Toggles Privacy in Overlay

**Timeline**:
```
T+0ms:     User clicks privacy toggle
T+0ms:     Overlay shows loading state
T+0ms:     Send API request to update privacy
T+50ms:    Update overlay UI optimistically
T+100ms:   Send message to popup (if open)
T+150ms:   API responds with success
T+200ms:   Update browser icon color
T+250ms:   Refresh overlay with server data
T+300ms:   Refresh popup with server data (if open)
```

**Components Affected**:
- ✅ Overlay (immediate optimistic update)
- ✅ Browser Icon (color change)
- ✅ Popup (if open on same tab)
- ❌ Config Page (not affected)

### Scenario 3: User Navigates to New Page

**Timeline**:
```
T+0ms:     URL change detected
T+0ms:     Hide current overlay
T+50ms:    Browser icon starts loading state
T+100ms:   Check for bookmark at new URL
T+200ms:   API responds with bookmark data (or null)
T+250ms:   Update browser icon for new bookmark state
T+300ms:   Show overlay if auto-show enabled and bookmark exists
T+500ms:   Popup updates if open (new URL data)
```

**Components Affected**:
- ✅ Browser Icon (new bookmark state)
- ✅ Overlay (hide old, show new if applicable)
- ✅ Popup (if open, new page data)
- ❌ Config Page (not affected)

## Performance Optimizations

### Debouncing & Throttling
```javascript
// Prevent excessive refreshes from rapid user actions
const debouncedRefresh = debounce(async (action, data) => {
  await refreshComponents(action, data);
}, 100);
```

### Optimistic Updates
```javascript
// Show changes immediately, sync with server later
function optimisticTagAdd(tag) {
  // 1. Update UI immediately
  updateUIWithNewTag(tag);
  
  // 2. Send API request
  apiAddTag(tag).then(response => {
    // 3. Sync with server response
    syncWithServerData(response);
  }).catch(error => {
    // 4. Revert on error
    revertTagAdd(tag);
    showError(error);
  });
}
```

### Selective Component Updates
```javascript
// Only refresh components that need updates
function selectiveRefresh(changeType, data) {
  const affectedComponents = getAffectedComponents(changeType);
  
  affectedComponents.forEach(component => {
    refreshComponent(component, data);
  });
}
```

## Error Handling & Fallbacks

### Network Failures
```javascript
async function handleNetworkError(component, operation) {
  // Show cached data
  const cachedData = await getCachedData(operation);
  if (cachedData) {
    component.renderWithCache(cachedData);
  }
  
  // Show error state
  component.showError('Unable to sync with Pinboard. Showing cached data.');
  
  // Retry with exponential backoff
  retryWithBackoff(operation, component);
}
```

### Component Failures
```javascript
// Graceful degradation
if (!overlaySupported) {
  // Fall back to popup-only mode
  disableOverlayFeatures();
  showPopupOnlyMessage();
}
```

## Modern Implementation Structure

### Proposed Project Structure
```
src/
├── background/           # Service Worker
│   ├── service-worker.js
│   ├── message-handler.js
│   └── api-client.js
├── popup/               # Main Popup
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── options/             # Configuration
│   ├── options.html
│   ├── options.js
│   └── options.css
├── content/             # Content Scripts
│   ├── overlay.js
│   ├── overlay.css
│   └── injector.js
├── shared/              # Shared Utilities
│   ├── message-client.js
│   ├── storage-manager.js
│   └── constants.js
└── dev/                 # Development Tools
    ├── test-server.js
    └── test-overlay.html
```

### Manifest V3 Structure
```json
{
  "manifest_version": 3,
  "name": "Hoverboard",
  "version": "2.0.0",
  "background": {
    "service_worker": "src/background/service-worker.js",
    "type": "module"
  },
  "action": {
    "default_popup": "src/popup/popup.html"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/overlay.js", "src/content/injector.js"],
      "css": ["src/content/overlay.css"]
    }
  ],
  "options_page": "src/options/options.html",
  "permissions": ["storage", "tabs", "activeTab", "scripting"],
  "host_permissions": ["https://api.pinboard.in/*"]
}
```

## Testing Environment Integration

### Development Server
- **URL**: `http://localhost:3000`
- **Purpose**: Real-time overlay testing and API simulation
- **Features**:
  - Proxy to Pinboard API
  - Real bookmark data testing
  - Hot reload for development
  - Debug logging and metrics

### API Endpoints
```
GET /api/pinboard/posts/get?url=<URL>&auth_token=<TOKEN>
GET /api/pinboard/posts/all?auth_token=<TOKEN>&tag=<TAG>&count=<COUNT>
GET /api/health
```

## Implementation Guidelines

### Message Router Pattern
- Centralized message handling in background script
- Type-safe message definitions
- Error handling with fallbacks
- Request/response correlation with timeouts

### State Management
- Chrome storage for persistence
- In-memory caching for performance  
- Optimistic updates with rollback
- Component-specific refresh strategies

### User Experience
- Instant visual feedback (0ms)
- Graceful error handling
- Offline capability with cached data
- Accessibility compliance (ARIA, keyboard navigation)

This architecture ensures clean separation of concerns, maintainable code, and excellent user experience across all extension components while supporting modern browser extension standards and development practices. 