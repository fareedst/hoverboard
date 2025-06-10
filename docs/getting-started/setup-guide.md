# Pinboard API Setup Guide

## Issue: Extension Showing Test Data Instead of Live Data

If your Hoverboard extension is displaying empty bookmarks or test data instead of your actual Pinboard bookmarks, it's because the Pinboard API token is not configured.

## Root Cause

The extension requires a Pinboard API token to access your bookmark data. When no token is configured:

1. API calls fail with "No authentication token configured" error
2. The extension falls back to empty bookmark data
3. This appears as "test data" or placeholder content in the UI

## Solution: Configure Your Pinboard API Token

### Step 1: Get Your Pinboard API Token

1. **Go to Pinboard Settings**: Navigate to [https://pinboard.in/settings/password](https://pinboard.in/settings/password)
2. **Find Your API Token**: Look for the section labeled "API Token"
3. **Copy the Token**: It will be in the format `username:XXXXXXXXXXXXXXXXXX`

### Step 2: Configure the Extension

1. **Open Extension Options**: 
   - Right-click the Hoverboard extension icon in Chrome
   - Select "Options" from the context menu
   - OR go to `chrome://extensions/` → Find Hoverboard → Click "Options"

2. **Enter Your API Token**:
   - In the "Authentication" section, paste your API token into the "Pinboard API Token" field
   - The format should be: `your_username:XXXXXXXXXXXXXXXXXX`

3. **Test the Connection**:
   - Click the "Test Connection" button to verify your token works
   - You should see a success message if the token is valid

4. **Save Settings**:
   - Click "Save Settings" to store your configuration

### Step 3: Verify Live Data

1. **Reload the Extension**: Click the Hoverboard icon in your toolbar
2. **Check Your Data**: You should now see your actual Pinboard bookmarks instead of empty/test data
3. **Test Show Hover**: Navigate to a bookmarked page and click "Show Hover" to see real bookmark data

## Troubleshooting

### "Failed to connect" Error
- **Check Token Format**: Ensure it's `username:token` with no extra spaces
- **Verify Token**: Go back to Pinboard settings and copy the token again
- **Check Internet**: Ensure you have an internet connection

### Still Showing Empty Data
- **Refresh the Page**: Reload the current tab after configuring the token
- **Clear Extension Cache**: Disable and re-enable the extension
- **Check Console**: Open Developer Tools (F12) and look for error messages

### Token Security
- **Private Token**: Your API token is stored securely in Chrome's sync storage
- **No Sharing**: Never share your API token with others
- **Regenerate**: If compromised, regenerate your token on Pinboard settings

## Expected Behavior After Setup

### ✅ With API Token Configured:
- Extension shows your actual Pinboard bookmarks
- Bookmark tags and descriptions are displayed
- You can add/edit/delete bookmarks
- Recent bookmarks appear in the popup
- Badge shows bookmark status (bookmarked/not bookmarked)

### ❌ Without API Token:
- Extension shows empty bookmark objects
- No tags or descriptions appear
- Cannot save new bookmarks
- Popup shows placeholder data
- Badge may not update correctly

## API Token Format Example

```
your_pinboard_username:1234567890ABCDEF1234
```

**Note**: Replace `your_pinboard_username` with your actual Pinboard username and the token part with your actual API token from Pinboard settings.

## Need Help?

If you continue to have issues:

1. **Check Pinboard Status**: Visit [pinboard.in](https://pinboard.in) to ensure the service is working
2. **Regenerate Token**: Create a new API token on Pinboard settings
3. **Browser Console**: Check for error messages in the browser's Developer Tools
4. **Extension Console**: Check the service worker console for detailed error logs

## Privacy Note

Your Pinboard API token is stored locally in Chrome's secure storage and is only used to communicate with the Pinboard API. The Hoverboard extension does not send your token to any third-party services. 