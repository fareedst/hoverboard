# Commit message guidelines (TIED projects)

This file is copied into your project's `tied/` directory when you set up TIED. Use it as the commit message quick reference for this project.

Full process definitions: **[processes.md](processes.md)** — see [PROC-COMMIT_MESSAGES](processes.md) and [PROC-RELEASE](processes.md).

## Format

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

- **Subject**: 50 characters or fewer; imperative, present tense; no leading capital; no period at end.
- **Body / footer lines**: 100 characters or fewer.

## Types

| Type | Use for |
|------|--------|
| build | Build system or external dependencies |
| ci | CI configuration and scripts |
| chore | Repo maintenance, no code/docs change |
| docs | Documentation only |
| feat | A new feature |
| fix | A bug fix |
| perf | Performance improvement |
| refactor | Code change that neither fixes a bug nor adds a feature |
| style | Formatting, whitespace; no meaning change |
| test | Adding or correcting tests |

## Scopes

Use the area affected (e.g. `tied`, `docs`, `tests`, `ui`, `features`). Optional but recommended. For TIED work use scope `tied`. Projects may define their own scopes; see [processes.md](processes.md) § PROC-COMMIT_MESSAGES for the full list.

## Revert

Header: `revert: ` + original commit header. Body: `This reverts commit <hash>.`

## Footer

- **Breaking changes**: `BREAKING CHANGE:` then describe the break.
- **Issues**: `Closes #123` or `Fixes #123`.

## TIED traceability

In the body or footer, optionally reference requirement or decision tokens (e.g. `REQ-*`, `ARCH-*`, `IMPL-*`) for traceability.

## Release versioning ([PROC-RELEASE](processes.md))

- **Major**: Breaking changes  
- **Minor**: New features  
- **Patch**: Bug fixes  
- **Build**: Development builds  
