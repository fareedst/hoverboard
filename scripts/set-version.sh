#!/usr/bin/env bash
#
# set-version.sh
#
# Sets the version number in all relevant files.
# Usage: ./scripts/set-version.sh <version>
# Example: ./scripts/set-version.sh 1.0.6.11172
#

set_version() {
  local new_version="$1"

  # Validate version format (basic check)
  if [[ ! "$new_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(\.[0-9]+)?$ ]]; then
    echo "Error: Invalid version format. Expected format: X.Y.Z or X.Y.Z.W"
    echo "Example: 1.0.6.11172"
    exit 1
  fi

  if [ -z "$new_version" ]; then
    echo "Error: Version number is required"
    echo "Usage: $0 <version>"
    echo "Example: $0 1.0.6.11172"
    exit 1
  fi

  # Files to update
  local files=(
    "package.json"
    "manifest.json"
  )
  # "safari/manifest.json"
  # "safari/package.json"
  # "safari-manifest.json"

  echo "Setting version to: $new_version"
  echo ""

  # Update each file
  local updated_count=0
  for file in "${files[@]}"; do
    if [ -f "$file" ]; then
      # macOS BSD sed requires -i '' for in-place editing
      if sed -i '' -E "s/(\"version\"[[:space:]]*:[[:space:]]*\")[^\"]*(\")/\1${new_version}\2/" "$file" 2>/dev/null; then
        echo "✓ Updated $file"
        updated_count=$((updated_count + 1))
      else
        # Try Linux-style sed if macOS version fails
        if sed -i -E "s/(\"version\"[[:space:]]*:[[:space:]]*\")[^\"]*(\")/\1${new_version}\2/" "$file" 2>/dev/null; then
          echo "✓ Updated $file"
          updated_count=$((updated_count + 1))
        else
          echo "✗ Failed to update $file"
        fi
      fi
    else
      echo "⚠ File not found: $file (skipping)"
    fi
  done

  echo ""
  if [ $updated_count -gt 0 ]; then
    echo "Successfully updated version in $updated_count file(s)"
    echo ""
    echo "Note: package-lock.json will be updated automatically when you run 'npm install'"
  else
    echo "Error: No files were updated"
    exit 1
  fi
}

# Run the function
set_version "$@"

