# Hoverboard Safari Extension

This directory contains the Safari App Extension version of Hoverboard.

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the extension:
   ```bash
   npm run build
   ```

3. Validate the extension:
   ```bash
   npm run validate
   ```

## Loading in Safari

1. Open Safari
2. Go to Safari > Preferences > Advanced
3. Check "Show Develop menu in menu bar"
4. Go to Develop > Show Extension Builder
5. Click the + button and select "Add Extension"
6. Navigate to this directory and select it

## Architecture

This Safari extension uses the same codebase as the Chrome extension but with Safari-specific adaptations:

- Uses Manifest V2 instead of V3
- Uses background scripts instead of service workers
- Uses browser_action instead of action
- Includes Safari-specific API shims

## Semantic Tokens

- `SAFARI-EXT-IMPL-001`: Safari implementation details
- `SAFARI-EXT-API-001`: Safari API abstraction
- `SAFARI-EXT-SHIM-001`: Safari platform detection
- `SAFARI-EXT-STORAGE-001`: Safari storage management
- `SAFARI-EXT-MESSAGING-001`: Safari message passing
