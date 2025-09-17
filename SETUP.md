# Development Setup Guide

This guide will help you set up the Hoverboard browser extension for development and contribution.

## Prerequisites

### Required Software

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Chrome Browser** - For Chrome extension development
- **Safari Browser** - For Safari extension development (macOS only)
- **Xcode** - For Safari App Extension development (macOS only)

### Optional Software

- **Visual Studio Code** - Recommended editor with extensions
- **Chrome DevTools** - For debugging
- **Safari Web Inspector** - For Safari debugging

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/fareedst/hoverboard.git
cd hoverboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Extension

```bash
# Build Chrome extension
npm run build:dev

# Build Safari extension (macOS only)
npm run safari:build
```

### 4. Load in Browser

#### Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder

#### Safari
1. Open Safari
2. Go to Safari > Preferences > Extensions
3. Enable "Developer mode"
4. Click "Turn On" next to Hoverboard

## Development Workflow

### Daily Development

```bash
# Start development mode with hot reload
npm run dev

# Run tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Lint code
npm run lint
npm run lint:fix
```

### Building for Distribution

```bash
# Build production version
npm run build:prod

# Create release packages
npm run release

# Create Chrome-only release
npm run release:chrome

# Create Safari-only release
npm run release:safari
```

## Project Structure

```
hoverboard/
├── .github/                 # GitHub workflows and templates
├── docs/                    # Documentation
├── icons/                   # Extension icons
├── safari/                  # Safari App Extension
├── scripts/                 # Build and utility scripts
├── src/                     # Source code
│   ├── core/               # Core functionality
│   ├── features/           # Feature implementations
│   ├── shared/             # Shared utilities
│   └── ui/                 # User interface
├── tests/                  # Test files
├── dist/                   # Built extension (generated)
└── releases/               # Release packages (generated)
```

## Development Environment Setup

### VS Code Setup

1. **Install Recommended Extensions:**
   - ESLint
   - Prettier
   - Chrome Extension Pack
   - Safari Extension Pack

2. **Configure Settings:**
   ```json
   {
     "editor.formatOnSave": true,
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     },
     "files.exclude": {
       "**/node_modules": true,
       "**/dist": true,
       "**/coverage": true
     }
   }
   ```

### Chrome Development

1. **Enable Developer Mode:**
   - Go to `chrome://extensions/`
   - Toggle "Developer mode" in top right

2. **Load Extension:**
   - Click "Load unpacked"
   - Select the `dist` folder

3. **Debug:**
   - Use Chrome DevTools
   - Check `chrome://extensions/` for errors
   - Use `chrome://extensions/shortcuts` for keyboard shortcuts

### Safari Development

1. **Enable Developer Mode:**
   - Safari > Preferences > Advanced
   - Check "Show Develop menu in menu bar"

2. **Load Extension:**
   - Build with `npm run safari:build`
   - Double-click the `.safariextz` file
   - Enable in Safari Preferences > Extensions

3. **Debug:**
   - Use Safari Web Inspector
   - Check Console for errors
   - Use Safari > Develop > Extension

## Testing

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test types
npm run test:unit
npm run test:integration
npm run test:e2e
```

### Test Structure

- **Unit Tests**: `tests/unit/` - Individual function testing
- **Integration Tests**: `tests/integration/` - Component interaction
- **E2E Tests**: `tests/e2e/` - End-to-end workflows
- **Performance Tests**: `tests/performance/` - Performance metrics

### Writing Tests

1. **Create test file** in appropriate directory
2. **Import dependencies** and modules to test
3. **Write test cases** with descriptive names
4. **Mock external dependencies**
5. **Test both success and failure cases**

## Building and Packaging

### Chrome Extension

```bash
# Development build
npm run build:dev

# Production build
npm run build:prod

# Create release package
npm run release:chrome
```

### Safari Extension

```bash
# Setup Safari environment
npm run safari:setup

# Build Safari extension
npm run safari:build

# Validate Safari extension
npm run safari:validate

# Create release package
npm run release:safari
```

## Debugging

### Common Issues

1. **Extension not loading:**
   - Check manifest.json syntax
   - Verify all files exist
   - Check browser console for errors

2. **Content scripts not running:**
   - Verify matches patterns in manifest
   - Check for JavaScript errors
   - Ensure proper permissions

3. **Storage not working:**
   - Check storage permissions
   - Verify storage API usage
   - Check for quota exceeded errors

### Debug Tools

- **Chrome DevTools**: For Chrome extension debugging
- **Safari Web Inspector**: For Safari extension debugging
- **Browser Console**: For runtime errors
- **Extension Management**: For permission and loading issues

## Contributing

### Before Contributing

1. **Read CONTRIBUTING.md**
2. **Check existing issues**
3. **Fork the repository**
4. **Create a feature branch**

### Development Process

1. **Make changes** following the style guide
2. **Add tests** for new functionality
3. **Update documentation** if needed
4. **Run test suite** to ensure nothing breaks
5. **Submit pull request** with description

### Code Style

- **JavaScript**: Follow ESLint configuration
- **HTML**: Use semantic markup
- **CSS**: Follow BEM methodology
- **Git**: Use conventional commit messages

## Troubleshooting

### Build Issues

```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist/
npm run build:dev
```

### Test Issues

```bash
# Clear test cache
npm test -- --clearCache

# Run specific test
npm test -- --testNamePattern="specific test name"
```

### Extension Issues

1. **Reload extension** in browser
2. **Check console** for errors
3. **Verify permissions** in browser settings
4. **Clear extension data** if needed

## Getting Help

- **GitHub Issues**: For bug reports
- **GitHub Discussions**: For questions
- **Pull Requests**: For code review
- **Documentation**: Check existing docs

## Next Steps

1. **Read the code** to understand the architecture
2. **Run the tests** to see what's working
3. **Try the extension** in both Chrome and Safari
4. **Pick an issue** to work on
5. **Submit a pull request**

Happy coding! 🚀
