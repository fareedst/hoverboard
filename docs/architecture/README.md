# 🏗️ Hoverboard Extension Architecture

This directory contains comprehensive documentation about the system architecture, design decisions, and technical implementation of the Hoverboard browser extension.

## 📚 Architecture Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| **[Architecture Overview](overview.md)** | Complete system architecture and technical design | Developers, Technical Leads |
| **[Popup Architecture](popup-architecture.md)** | Detailed popup component architecture and planning | Frontend Developers |
| **[Migration Complete](migration-complete.md)** | Post-migration architecture status and outcomes | Project Managers, Developers |

## 🎯 Key Architectural Concepts

### System Components
- **Content Scripts** - Page interaction and DOM manipulation
- **Background Service Worker** - Core extension logic and API communication
- **Popup Interface** - User interaction and configuration
- **Options Page** - Advanced settings and preferences

### Design Principles
- **Manifest V3 Compliance** - Modern extension architecture
- **Modular Design** - Clean separation of concerns
- **Performance Optimization** - Efficient resource usage
- **Cross-Browser Compatibility** - Chrome, Firefox, Edge, and future Safari support via unified browser API abstraction ([SAFARI-EXT-SHIM-001]).
- See also: [Architecture Overview](overview.md#cross-browser-api-abstraction-and-debug-logging-safari-ext-shim-001-2025-07-15) and `src/shared/utils.js` for implementation details.

## 🔗 Related Documentation

- **[Migration Documentation](../migration/README.md)** - Manifest V3 migration details
- **[Development Guide](../development/README.md)** - Implementation guidelines
- **[Getting Started](../getting-started/README.md)** - Setup and installation

## 🎯 For Different Roles

### 👨‍💻 **For Developers**
- Start with **[Architecture Overview](overview.md)** for system understanding
- Review **[Popup Architecture](popup-architecture.md)** for UI component details
- Check **[Migration Complete](migration-complete.md)** for current state

### 🏗️ **For Technical Leads**
- **[Architecture Overview](overview.md)** - Complete technical design
- **[Migration Complete](migration-complete.md)** - Implementation status
- Related: **[Migration Plan](../migration/migration-plan.md)**

### 📊 **For Project Managers**
- **[Migration Complete](migration-complete.md)** - Project outcomes
- **[Architecture Overview](overview.md)** - High-level system design
- Related: **[Migration Progress](../migration/progress/)** 