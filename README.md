# 🚀 Hoverboard - Modern Pinboard Browser Extension

A modern Manifest V3 browser extension that provides seamless Pinboard integration with hover overlays and enhanced bookmark management.

## ✨ Features

- **Hover Overlays**: View bookmark information by hovering over links
- **Modern UI**: Clean, responsive popup interface
- **Quick Actions**: Toggle privacy, read-later status, and manage tags
- **Tag Management**: Add, remove, and organize bookmark tags
- **Search Integration**: Search through your bookmarks
- **Cross-Browser**: Compatible with Chrome, Firefox, and Edge

## 🏗️ Architecture

This extension is built with modern Manifest V3 architecture:

```
src/
├── core/                 # Service worker and core functionality
├── ui/                   # User interface components
│   ├── popup/           # Browser action popup
│   ├── options/         # Extension options page
│   └── styles/          # Shared CSS and design tokens
├── features/            # Feature modules
│   └── content/         # Content scripts and overlays  
├── shared/              # Shared utilities and libraries
└── config/              # Configuration files
```

## 🔧 Development

### Prerequisites

- Node.js 18+
- Chrome/Firefox Developer Mode enabled

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Build extension: `npm run build`

### Loading the Extension

1. Open Chrome/Firefox extension management page
2. Enable "Developer mode"
3. Click "Load unpacked" and select this directory
4. The extension will use `manifest.json` (Manifest V3)

## 📖 Configuration

Configure your Pinboard API token in the extension options page:

1. Right-click the extension icon
2. Select "Options"
3. Enter your Pinboard API token
4. Save settings

## 🧪 Testing

- Run unit tests: `npm test`
- Run linting: `npm run lint`
- Run all checks: `npm run validate`

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

- [Getting Started Guide](docs/getting-started/README.md) - Setup and installation
- [Migration Documentation](docs/migration/README.md) - Manifest V3 migration project
- [Development Guide](docs/development/README.md) - Development workflow and standards
- [Architecture Overview](docs/architecture/README.md) - System design and components
- [Troubleshooting Guide](docs/troubleshooting/README.md) - Problem resolution

**📖 [Complete Documentation Index](docs/README.md)** - Full documentation structure and navigation

## 🤝 Contributing

1. Follow the coding standards in `.eslintrc.yml`
2. Write tests for new features
3. Update documentation as needed
4. Submit pull requests with clear descriptions

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [Pinboard API Documentation](https://pinboard.in/api/)
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)

---

**Version**: 1.0.0  
**Manifest**: V3  
**Author**: Fareed Stevenson
