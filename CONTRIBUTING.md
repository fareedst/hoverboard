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
- [Commit Message Guidelines](#commit-message-guidelines)

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

See [Commit Message Guidelines](#commit-message-guidelines) for format, types, and list of scopes. Keep commits focused and descriptive.

## Commit Message Guidelines

We use a consistent format for git commit messages so that history is readable and, if needed, changelogs can be generated from commits.

### Commit Message Format

Each commit message has a **header**, an optional **body**, and an optional **footer**. The header uses a **type**, an optional **scope**, and a **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

Keep the **subject** (header line) to 50 characters or fewer so it stays readable in logs and UIs. Keep body and footer lines to 100 characters or fewer.

The footer may contain a [closing reference to an issue](https://help.github.com/articles/closing-issues-via-commit-messages/) (e.g. `Closes #123`).

**Examples:**

```
docs(changelog): update changelog to v1.5.0
```

```
fix(ui): correct popup theme when system preference changes

Popup now re-reads prefers-color-scheme on visibility change.
Fixes #42
```

### Revert

To revert a previous commit, start the header with `revert: ` followed by the original commit header. In the body write: `This reverts commit <hash>.` (replace `<hash>` with the SHA of the reverted commit.)

### Type

Use exactly one of:

| Type | Use for |
|------|--------|
| **build** | Build system or external dependencies (e.g. scripts, manifest, tooling) |
| **ci** | CI configuration and scripts (e.g. `.github/workflows/`) |
| **chore** | Repo maintenance, no code/docs change |
| **docs** | Documentation only |
| **feat** | A new feature |
| **fix** | A bug fix |
| **perf** | A change that improves performance |
| **refactor** | A change that neither fixes a bug nor adds a feature |
| **style** | Formatting, whitespace, semicolons; no meaning change |
| **test** | Adding or correcting tests |

### Scope

The scope is the name of the area affected (as someone reading history or a changelog would understand it). It is optional but recommended.

**Supported scopes:**

| Scope | Area |
|-------|------|
| **core** | Service worker, message handling, badge manager (`src/core/`) |
| **ui** | Popup, options, side-panel, bookmarks-table, components, styles (`src/ui/`) |
| **features** | Content scripts, overlay, storage, AI, pinboard, search, tagging (`src/features/`) |
| **shared** | Shared utilities, logger, ErrorHandler, message-schemas (`src/shared/`) |
| **config** | Config manager and config service (`src/config/`) |
| **offscreen** | Offscreen file-bookmark I/O (`src/offscreen/`) |
| **safari** | Safari App Extension (`safari/`) |
| **tied** | TIED methodology: requirements, architecture, implementation, semantic tokens (`tied/`, `semantic-tokens.yaml`) |
| **docs** | Documentation outside `tied/` (`docs/`) |
| **tests** | Test files, harnesses, Playwright E2E |
| **build** | Build scripts, manifest, tooling (`scripts/`, `manifest.json`) |
| **ci** | CI configuration (e.g. `.github/workflows/`) |
| **changelog** | Release notes in `CHANGELOG.md` |

**Exceptions:**

- **packaging**: Use only when a change affects package/output layout across the repo (e.g. manifest or build layout for all outputs). Otherwise use **build**.
- **Empty scope**: Allowed for `style`, `test`, `refactor`, or `docs` when the change spans many areas (e.g. `style: normalize line endings`).

**Recommended for future use** (add as the codebase grows):

- **popup**, **side-panel**, **options** – when UI work is often scoped to a single surface.
- **storage**, **content**, **ai** – when features are split more finely than a single `features` scope.

### Subject

- Keep to **50 characters or fewer** (the full header line: `type(scope): subject`).
- Use imperative, present tense: "change" not "changed" nor "changes".
- Do not capitalize the first letter.
- No period at the end.

### Body

Use imperative, present tense. Include motivation for the change and how it differs from previous behavior when it helps.

### Footer

- **Breaking changes**: Start with `BREAKING CHANGE:` (with a space or two newlines). The rest of the message describes the break.
- **Issues**: Use `Closes #123` or `Fixes #123` to link and close issues.

### TIED and commit messages

When a commit implements or touches a specific requirement or decision, you may reference TIED tokens in the body or footer (e.g. `REQ-SIDE_PANEL_TAGS_TREE`, `ARCH-*`, `IMPL-*`). This is optional but encouraged for traceability. Commit format is defined here; for token discipline in code and docs see [AGENTS.md](AGENTS.md) and `ai-principles.md`.

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
