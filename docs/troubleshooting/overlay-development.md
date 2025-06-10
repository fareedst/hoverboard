# Hoverboard Overlay Development Environment

This document explains how to develop and test the Hoverboard overlay interface with real bookmark data without requiring the full browser extension framework.

## 🎯 Purpose

The Hoverboard overlay development environment allows you to:

- **Test with Real Data**: Load actual bookmarks from Pinboard API or JSON input
- **Rapid Iteration**: Make changes and see results immediately without extension reloading
- **Visual Debugging**: Debug overlay positioning, styling, and interactions in isolation
- **API Integration Testing**: Test real Pinboard API calls through a CORS proxy
- **UI/UX Development**: Perfect the overlay interface before integration

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────┐
│ Enhanced Test Environment           │
├─────────────────────────────────────┤
│ • Real Data Loading                 │
│ • Overlay Recreation                │
│ • Interactive Testing               │
│ • Debug Console                     │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Development Server (Optional)       │
├─────────────────────────────────────┤
│ • CORS Proxy for Pinboard API      │
│ • Static File Serving              │
│ • Error Handling                    │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Pinboard API                        │
├─────────────────────────────────────┤
│ • Real Bookmark Data               │
│ • User's Actual Tags               │
│ • Privacy Settings                  │
└─────────────────────────────────────┘
```

## 🚀 Quick Start

### Option 1: Basic Development (File Protocol)

1. **Open the test page directly:**
   ```bash
   open test-overlay-enhanced.html
   ```

2. **Load sample data:**
   - Click "Load Sample Bookmark" for immediate testing
   - Or paste JSON data from real bookmarks
   - Or use the complex example for edge case testing

### Option 2: Full Development Server (Recommended)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev:overlay
   # or directly: node dev-server.js
   ```

3. **Open in browser:**
   ```
   http://localhost:3000
   ```

4. **Set up Pinboard API access:**
   - Get your API token from [Pinboard Settings](https://pinboard.in/settings/password)
   - Enter in format: `username:API_TOKEN`
   - Click "Save" to store in localStorage

## 📋 Development Workflow

### 1. Load Real Data

**Method A: URL Query**
```javascript
// Enter a URL that exists in your Pinboard bookmarks
https://developer.mozilla.org/en-US/docs/Web/JavaScript
```

**Method B: JSON Input**
```javascript
{
  "description": "JavaScript Array Methods Guide",
  "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array",
  "tags": ["javascript", "programming", "reference", "mdn"],
  "shared": "yes",
  "toread": "no",
  "hash": "abc123def456"
}
```

**Method C: API Integration**
```javascript
// With development server running and API token saved
// Real data is automatically fetched from Pinboard
```

### 2. Test Overlay Features

- **Tag Management**: Add/remove tags with real-time updates
- **Privacy Toggle**: Switch between public/private states
- **Read Later**: Toggle read status
- **Visual States**: Test different data combinations
- **Error Handling**: Test with malformed or missing data

### 3. Debug and Iterate

- **Toggle Debug Mode**: Enable detailed console logging
- **Inspect Data**: View current bookmark state in real-time
- **Test Edge Cases**: Empty tags, long descriptions, special characters
- **Performance**: Test with large tag lists

## 🔧 API Integration

### Development Server Endpoints

```
GET /api/health
- Health check and endpoint listing

GET /api/pinboard/posts/get?url=<URL>&auth_token=<TOKEN>
- Get bookmark data for specific URL
- Returns normalized bookmark object

GET /api/pinboard/posts/all?auth_token=<TOKEN>&tag=<TAG>&count=<COUNT>
- Get all bookmarks (for future features)
- Optional filtering by tag
```

### Real Data Format

```javascript
{
  "description": "Page title or custom description",
  "url": "https://example.com",
  "tags": ["tag1", "tag2", "tag3"],  // Always normalized to array
  "shared": "yes|no",                // "no" = private
  "toread": "yes|no",               // "yes" = read later
  "hash": "unique_bookmark_id",      // Pinboard's internal ID
  "time": "2023-12-07T10:30:00Z"    // ISO timestamp
}
```

## 🎨 Styling and Design

### Overlay Styling Hierarchy

```css
.hoverboard-overlay
├── .overlay-header
│   ├── .overlay-title
│   └── .overlay-close
└── .overlay-content
    ├── .page-info
    │   ├── .page-title
    │   └── .page-url
    ├── .section (tags)
    │   ├── .section-title
    │   ├── .tags-container
    │   │   └── .tag.removable
    │   └── .add-tag-row
    │       ├── .tag-input
    │       └── .add-tag-btn
    └── .section (actions)
        ├── .actions-grid
        │   ├── .action-btn.private|public
        │   └── .action-btn.to-read|read
        └── .bottom-actions
            ├── .refresh-btn
            └── .delete-btn
```

### Design Principles

- **Consistent with Extension**: Matches production overlay styles
- **Modern UI**: Clean, professional appearance
- **Accessible**: High contrast, keyboard navigation
- **Responsive**: Adapts to different content sizes
- **Animated**: Smooth transitions and hover effects

## 🧪 Testing Scenarios

### Basic Functionality
- [ ] Load bookmark with tags
- [ ] Add new tags
- [ ] Remove existing tags
- [ ] Toggle privacy status
- [ ] Toggle read status
- [ ] Close overlay

### Edge Cases
- [ ] Empty bookmark (no tags, no description)
- [ ] Very long descriptions (>100 characters)
- [ ] Many tags (>10 tags)
- [ ] Special characters in tags/descriptions
- [ ] Unicode/emoji content
- [ ] Invalid data formats

### Error Conditions
- [ ] Network failures
- [ ] Invalid API tokens
- [ ] Malformed JSON input
- [ ] Missing required fields
- [ ] API rate limiting

### Performance
- [ ] Large tag collections
- [ ] Rapid interactions
- [ ] Memory usage over time
- [ ] Animation performance

## 🐛 Debugging

### Enable Debug Mode

```javascript
// In browser console
toggleDebug();

// Or click the "Toggle Debug" button
```

### Debug Output Examples

```javascript
[Hoverboard Debug] Bookmark data loaded {description: "...", tags: [...]}
[Hoverboard Debug] Tag added "newtag"
[Hoverboard Debug] Privacy toggled "no"
[Hoverboard Debug] Real bookmark loaded via proxy {...}
```

### Common Issues

**CORS Errors**
- Use development server for API calls
- Check Pinboard API token format
- Verify network connectivity

**Styling Issues**
- Check CSS specificity conflicts
- Verify overlay z-index positioning
- Test in different browsers

**Data Loading Problems**
- Validate JSON format
- Check API token permissions
- Verify URL encoding

## 🔄 Integration with Extension

### Syncing Changes

1. **Test in development environment**
2. **Copy verified styles to `overlay-styles.css`**
3. **Update `overlay-manager.js` with new logic**
4. **Test in full extension context**
5. **Verify cross-browser compatibility**

### Key Files to Update

```
src-new/features/content/
├── overlay-manager.js      # Core overlay logic
├── overlay-styles.css      # Production styles
├── tag-renderer.js         # Tag display logic
└── dom-utils.js           # DOM manipulation helpers
```

## 📊 Performance Monitoring

### Key Metrics

- **Overlay Creation Time**: Should be <100ms
- **Tag Rendering**: Should handle 20+ tags smoothly
- **Memory Usage**: Monitor for leaks during development
- **Animation Performance**: 60fps target

### Profiling Tools

```javascript
// Measure overlay creation time
console.time('overlay-creation');
showOverlay();
console.timeEnd('overlay-creation');

// Monitor memory usage
console.log('Memory:', performance.memory);
```

## 🚀 Deployment

### Production Checklist

- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Cross-browser testing complete
- [ ] Accessibility validation passed
- [ ] Security review completed
- [ ] Documentation updated

### Build Process

```bash
# Development build
npm run build:dev

# Production build
npm run build:prod

# Test extension
npm run test
```

## 📞 Support

### Resources

- **Extension Documentation**: `README.md`
- **API Reference**: [Pinboard API Docs](https://pinboard.in/api/)
- **Browser Extension Docs**: [Chrome Extension APIs](https://developer.chrome.com/docs/extensions/)

### Common Questions

**Q: Can I test without Pinboard API access?**
A: Yes! Use the sample data buttons or paste JSON from existing bookmarks.

**Q: How do I sync changes back to the extension?**
A: Copy verified CSS/JS changes to the appropriate files in `src-new/features/content/`.

**Q: Why use a development server?**
A: To avoid CORS issues when making real API calls to Pinboard from the browser.

---

*Happy developing! 🎯* 