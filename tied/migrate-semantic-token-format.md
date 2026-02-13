# Migration Guide: Semantic Token Format (Colon to Hyphen)

**TIED Methodology Version**: 1.3.0  
**Audience**: AI Agents and Contributors

This document provides step-by-step instructions for migrating a project from the **old colon-based token format** (`[TYPE:IDENTIFIER]`) to the **new hyphen-based format** (`[TYPE-IDENTIFIER]`).

---

## Why This Change?

The colon (`:`) character is **invalid in filenames** on many operating systems (particularly Windows). Previously, this required different patterns for tokens in text vs. filenames:

| Context | Old Format | New Format |
|---------|------------|------------|
| In text/code | `[IMPL:MODULE_VALIDATION]` | `[IMPL-MODULE_VALIDATION]` |
| In filenames | `IMPL-MODULE_VALIDATION.md` | `IMPL-MODULE_VALIDATION.md` |

**Benefits of the new format:**
1. **Single regex pattern** works for both text and filenames
2. **Consistent mental model** - tokens look the same everywhere
3. **Simplified tooling** - no format translation needed
4. **Easier searchability** - agents can use one pattern for all contexts

---

## Pre-Migration Checklist

Before starting migration:

- [ ] Confirm project uses TIED methodology
- [ ] Create a backup or ensure git history is clean
- [ ] Identify all files containing semantic tokens
- [ ] Review the scope of changes (documentation, code, tests)

---

## Migration Process

### Step 1: Identify All Files with Tokens

Find all files containing old-format tokens:

```bash
# Find all files with old-format tokens
grep -rEl '\[(REQ|ARCH|IMPL|TEST|PROC):' .

# Count occurrences per file
grep -rcE '\[(REQ|ARCH|IMPL|TEST|PROC):' . | grep -v ':0$'
```

### Step 2: Replace Tokens in Documentation (Markdown Files)

Use sed or your editor to replace all token types:

```bash
# Replace [REQ:*] → [REQ-*]
find . -name "*.md" -exec sed -i '' 's/\[REQ:/[REQ-/g' {} \;

# Replace [ARCH:*] → [ARCH-*]
find . -name "*.md" -exec sed -i '' 's/\[ARCH:/[ARCH-/g' {} \;

# Replace [IMPL:*] → [IMPL-*]
find . -name "*.md" -exec sed -i '' 's/\[IMPL:/[IMPL-/g' {} \;

# Replace [TEST:*] → [TEST-*]
find . -name "*.md" -exec sed -i '' 's/\[TEST:/[TEST-/g' {} \;

# Replace [PROC:*] → [PROC-*]
find . -name "*.md" -exec sed -i '' 's/\[PROC:/[PROC-/g' {} \;
```

**Note for Linux:** Use `sed -i` instead of `sed -i ''`.

### Step 3: Replace Tokens in Source Code

Update code comments with token references:

```bash
# For Go files
find . -name "*.go" -exec sed -i '' 's/\[REQ:/[REQ-/g' {} \;
find . -name "*.go" -exec sed -i '' 's/\[ARCH:/[ARCH-/g' {} \;
find . -name "*.go" -exec sed -i '' 's/\[IMPL:/[IMPL-/g' {} \;
find . -name "*.go" -exec sed -i '' 's/\[TEST:/[TEST-/g' {} \;
find . -name "*.go" -exec sed -i '' 's/\[PROC:/[PROC-/g' {} \;

# For Python files
find . -name "*.py" -exec sed -i '' 's/\[REQ:/[REQ-/g' {} \;
find . -name "*.py" -exec sed -i '' 's/\[ARCH:/[ARCH-/g' {} \;
find . -name "*.py" -exec sed -i '' 's/\[IMPL:/[IMPL-/g' {} \;
find . -name "*.py" -exec sed -i '' 's/\[TEST:/[TEST-/g' {} \;
find . -name "*.py" -exec sed -i '' 's/\[PROC:/[PROC-/g' {} \;

# For TypeScript/JavaScript files
find . -name "*.ts" -name "*.js" -exec sed -i '' 's/\[REQ:/[REQ-/g' {} \;
find . -name "*.ts" -name "*.js" -exec sed -i '' 's/\[ARCH:/[ARCH-/g' {} \;
find . -name "*.ts" -name "*.js" -exec sed -i '' 's/\[IMPL:/[IMPL-/g' {} \;
find . -name "*.ts" -name "*.js" -exec sed -i '' 's/\[TEST:/[TEST-/g' {} \;
find . -name "*.ts" -name "*.js" -exec sed -i '' 's/\[PROC:/[PROC-/g' {} \;
```

### Step 4: Universal Replacement Script

For a complete migration, use this comprehensive script:

```bash
#!/bin/bash
# migrate-token-format.sh
# Migrates semantic tokens from colon to hyphen format

set -e

echo "Starting semantic token format migration..."

# Function to replace in files matching a pattern
replace_tokens() {
    local file_pattern="$1"
    echo "Processing $file_pattern files..."
    
    find . -name "$file_pattern" -type f | while read -r file; do
        # Skip node_modules, .git, etc.
        if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *".git"* ]]; then
            continue
        fi
        
        # Check if file contains old-format tokens
        if grep -qE '\[(REQ|ARCH|IMPL|TEST|PROC):' "$file" 2>/dev/null; then
            echo "  Updating: $file"
            sed -i '' 's/\[REQ:/[REQ-/g' "$file"
            sed -i '' 's/\[ARCH:/[ARCH-/g' "$file"
            sed -i '' 's/\[IMPL:/[IMPL-/g' "$file"
            sed -i '' 's/\[TEST:/[TEST-/g' "$file"
            sed -i '' 's/\[PROC:/[PROC-/g' "$file"
        fi
    done
}

# Process common file types
replace_tokens "*.md"
replace_tokens "*.go"
replace_tokens "*.py"
replace_tokens "*.ts"
replace_tokens "*.js"
replace_tokens "*.java"
replace_tokens "*.rs"
replace_tokens "*.swift"
replace_tokens "*.kt"
replace_tokens "*.rb"
replace_tokens "*.sh"
replace_tokens "*.yaml"
replace_tokens "*.yml"
replace_tokens "*.json"
replace_tokens "*.svg"

echo "Migration complete!"
echo ""
echo "Verification:"
remaining=$(grep -rcE '\[(REQ|ARCH|IMPL|TEST|PROC):' . 2>/dev/null | grep -v ':0$' | wc -l)
if [ "$remaining" -eq 0 ]; then
    echo "  ✅ No old-format tokens remaining"
else
    echo "  ⚠️  Found $remaining files with old-format tokens:"
    grep -rlE '\[(REQ|ARCH|IMPL|TEST|PROC):' . 2>/dev/null
fi
```

### Step 5: Update TIED Version Reference

Update the TIED methodology version in your documentation:

```bash
# Update version references
sed -i '' 's/TIED Methodology Version.*: 1.2.0/TIED Methodology Version**: 1.3.0/g' tied/*.md
```

### Step 6: Verify Migration

After migration, verify no old-format tokens remain:

```bash
# Verify no old-format tokens exist
grep -rE '\[(REQ|ARCH|IMPL|TEST|PROC):' .

# If this returns results, those files need manual attention
```

---

## Post-Migration Verification

### Verification Checklist

- [ ] No files contain old-format tokens (`[TYPE:]`)
- [ ] All files use new hyphen format (`[TYPE-]`)
- [ ] Token cross-references are still valid
- [ ] Tests pass
- [ ] Documentation renders correctly
- [ ] TIED version updated to 1.3.0

### Validation Commands

```bash
# Count new-format tokens (should match old count)
grep -rcE '\[(REQ|ARCH|IMPL|TEST|PROC)-' . | grep -v ':0$'

# Verify token registry is consistent
yq 'keys' tied/semantic-tokens.yaml | sort -u

# Check for any broken references
# (Compare tokens in code vs. tokens in registry)
```

---

## Special Cases

### Test Names with Underscores

Test function names that embed tokens typically use underscores instead of hyphens:

| Token | Test Function Name |
|-------|-------------------|
| `[REQ-USER_LOGIN]` | `TestUserLogin_REQ_USER_LOGIN` |
| `[IMPL-PASSWORD_HASH]` | `testPasswordHash_IMPL_PASSWORD_HASH` |

The underscore format in test names remains unchanged - it's the bracketed tokens in comments and documentation that change.

### Token References in Grep Patterns

Update any grep patterns in scripts:

```bash
# Old pattern
grep -r "\[REQ:FEATURE\]" .

# New pattern
grep -r "\[REQ-FEATURE\]" .
```

### Files That Don't Need Changes

- **Filenames**: Already use hyphen format (`IMPL-MODULE_VALIDATION.md`)
- **Test names**: Continue using underscore format (`REQ_FEATURE`)
- **External documentation**: References to old format in external systems

---

## Rollback Procedure

If migration needs to be reverted:

1. Restore from git:
   ```bash
   git checkout -- .
   ```

2. Or reverse the sed replacements:
   ```bash
   find . -name "*.md" -exec sed -i '' 's/\[REQ-/[REQ:/g' {} \;
   find . -name "*.md" -exec sed -i '' 's/\[ARCH-/[ARCH:/g' {} \;
   find . -name "*.md" -exec sed -i '' 's/\[IMPL-/[IMPL:/g' {} \;
   find . -name "*.md" -exec sed -i '' 's/\[TEST-/[TEST:/g' {} \;
   find . -name "*.md" -exec sed -i '' 's/\[PROC-/[PROC:/g' {} \;
   ```

---

## AI Agent Workflow Summary

When asked to migrate semantic token format:

1. **Identify** all files containing old-format tokens
2. **Backup** the current state (ensure clean git history)
3. **Run** the migration script or manual sed commands
4. **Verify** no old-format tokens remain
5. **Update** TIED version to 1.3.0
6. **Test** that all references still work
7. **Report** migration summary to user

---

## Token Format Reference

### Old Format (TIED v1.2.0 and earlier)
```
[TYPE:IDENTIFIER]

Examples:
[REQ:USER_LOGIN]
[ARCH:AUTHENTICATION]
[IMPL:PASSWORD_HASH]
[TEST:LOGIN_FLOW]
[PROC:TOKEN_AUDIT]
```

### New Format (TIED v1.3.0+)
```
[TYPE-IDENTIFIER]

Examples:
[REQ-USER_LOGIN]
[ARCH-AUTHENTICATION]
[IMPL-PASSWORD_HASH]
[TEST-LOGIN_FLOW]
[PROC-TOKEN_AUDIT]
```

### Unified Regex Pattern (works for both text and filenames)
```regex
\[?(REQ|ARCH|IMPL|TEST|PROC)-([A-Z_]+)\]?
```

---

**Last Updated**: 2026-01-17
