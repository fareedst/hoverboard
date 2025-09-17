# Contributing to Hoverboard

Thank you for your interest in contributing to Hoverboard! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Cross-Browser Compatibility](#cross-browser-compatibility)
- [Documentation](#documentation)

## Code of Conduct

This project follows a code of conduct that we expect all contributors to adhere to. By participating, you agree to uphold this code.

### Our Pledge

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what's best for the community
- Show empathy towards other community members

### Our Standards

**Positive behavior:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what's best for the community

**Unacceptable behavior:**
- Harassment, trolling, or inflammatory comments
- Personal attacks or political discussions
- Public or private harassment
- Any conduct inappropriate in a professional setting

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Chrome browser for development
- Safari browser for testing (macOS required)
- Basic knowledge of JavaScript, HTML, and CSS

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/fareedst/hoverboard.git
   cd hoverboard
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/originalowner/hoverboard.git
   ```

## Development Setup

### Installation

```bash
# Install dependencies
npm install

# Build the extension
npm run build:dev

# Run tests
npm test

# Start development mode with hot reload
npm run dev
```

### Safari Development

```bash
# Setup Safari development environment
npm run safari:setup

# Build Safari extension
npm run safari:build

# Validate Safari extension
npm run safari:validate
```

## Project Structure

```
hoverboard/
├── src/                    # Source code
│   ├── core/              # Core functionality
│   ├── features/          # Feature implementations
│   ├── shared/            # Shared utilities
│   └── ui/                # User interface components
├── safari/                # Safari-specific code
├── tests/                 # Test files
├── docs/                  # Documentation
├── .github/               # GitHub workflows and templates
└── dist/                  # Built extension (generated)
```

### Key Directories

- **`src/core/`**: Service worker, message handling, badge management
- **`src/features/`**: Content scripts, pinboard integration, tagging
- **`src/ui/`**: Popup, options page, components
- **`src/shared/`**: Utilities, error handling, logging
- **`safari/`**: Safari App Extension specific code
- **`tests/`**: Unit, integration, and e2e tests

## Contributing Guidelines

### Before You Start

1. **Check existing issues** - Look for open issues or discussions
2. **Start small** - Begin with documentation, bug fixes, or small features
3. **Ask questions** - Use GitHub Discussions for questions
4. **Follow the style guide** - See [Style Guide](#style-guide) below

### Types of Contributions

- **Bug fixes**: Fix existing issues
- **New features**: Add new functionality
- **Documentation**: Improve or add documentation
- **Tests**: Add or improve test coverage
- **Safari improvements**: Enhance Safari compatibility
- **Performance**: Optimize existing code

### Semantic Tokens

This project uses semantic tokens for cross-referencing. All features must include appropriate tokens:

- `CHROME-EXT-*`: Chrome-specific features
- `SAFARI-EXT-*`: Safari-specific features
- `CORE-*`: Core functionality
- `UI-*`: User interface features
- `TEST-*`: Testing-related features

## Pull Request Process

### Before Submitting

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the style guide

3. **Add tests** for new functionality

4. **Update documentation** if needed

5. **Run the test suite**:
   ```bash
   npm run test:ci
   ```

6. **Build and test** the extension:
   ```bash
   npm run build:dev
   # Test in Chrome and Safari
   ```

### Pull Request Guidelines

1. **Use descriptive titles** and descriptions
2. **Reference issues** using `Fixes #123` or `Closes #123`
3. **Include screenshots** for UI changes
4. **Keep PRs focused** - one feature/fix per PR
5. **Update documentation** as needed
6. **Follow the PR template**

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** on both Chrome and Safari
4. **Documentation review** if applicable

## Testing

### Test Types

- **Unit Tests**: Individual function testing
- **Integration Tests**: Component interaction testing
- **E2E Tests**: End-to-end user workflows
- **Cross-Browser Tests**: Chrome and Safari compatibility

### Running Tests

```bash
# All tests
npm test

# Specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Writing Tests

- Use descriptive test names
- Test both success and failure cases
- Include edge cases
- Mock external dependencies
- Test cross-browser compatibility

## Cross-Browser Compatibility

### Chrome Development

- Use Manifest V3 APIs
- Test with latest Chrome version
- Ensure all permissions are necessary
- Follow Chrome extension best practices

### Safari Development

- Use Safari App Extension APIs
- Test with latest Safari version
- Include Safari-specific optimizations
- Follow Apple's guidelines

### Shared Code

- Use `webextension-polyfill` for compatibility
- Implement feature detection
- Provide graceful degradation
- Test on both platforms

## Documentation

### Code Documentation

- Use JSDoc for functions and classes
- Include parameter and return types
- Document complex algorithms
- Add usage examples

### README Updates

- Update feature lists
- Add new installation steps
- Update screenshots
- Keep version information current

### API Documentation

- Document all public APIs
- Include examples
- Note browser compatibility
- Update when APIs change

## Style Guide

### JavaScript

- Use ES6+ features
- Follow ESLint configuration
- Use meaningful variable names
- Add comments for complex logic
- Use consistent indentation (2 spaces)

### HTML/CSS

- Use semantic HTML
- Follow BEM methodology for CSS
- Use CSS custom properties
- Ensure accessibility
- Test responsive design

### Git

- Use conventional commit messages
- Keep commits focused
- Write descriptive commit messages
- Use present tense ("Add feature" not "Added feature")

## Release Process

### Version Numbering

- **Major**: Breaking changes
- **Minor**: New features
- **Patch**: Bug fixes
- **Build**: Development builds

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] Version bumped
- [ ] Changelog updated
- [ ] Cross-browser tested
- [ ] Release notes written

## Getting Help

- **GitHub Discussions**: For questions and ideas
- **GitHub Issues**: For bug reports
- **Code Review**: Ask for help in PRs
- **Documentation**: Check existing docs first

## Recognition

Contributors will be recognized in:
- README contributors section
- Release notes
- Project documentation

Thank you for contributing to Hoverboard! 🚀
