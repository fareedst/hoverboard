#!/usr/bin/env bash
# [PROC-TOKEN_VALIDATION] Validate that TIED semantic tokens referenced in code/tests exist in tied/semantic-tokens.yaml.
# Usage: ./scripts/validate_tokens.sh [dirs...]; default dirs: src tests
set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REGISTRY="${REPO_ROOT}/tied/semantic-tokens.yaml"
DIRS=("${@:-src tests}")

if [[ ! -f "$REGISTRY" ]]; then
  echo "ERROR: Registry not found: $REGISTRY" >&2
  exit 1
fi

# Extract token refs like [REQ-X], [ARCH-Y], [IMPL-Z], [TEST-W] from code (no SAFARI-* per plan)
found_tokens=$(mktemp)
trap 'rm -f "$found_tokens"' EXIT
for dir in "${DIRS[@]}"; do
  full_dir="${REPO_ROOT}/${dir}"
  [[ -d "$full_dir" ]] || continue
  grep -rhoE '\[(REQ|ARCH|IMPL|TEST)-[A-Z0-9_]+\]' "$full_dir" 2>/dev/null || true
done | sort -u > "$found_tokens"

missing=0
while IFS= read -r ref; do
  [[ -z "$ref" ]] && continue
  token="${ref#[}"
  token="${token%]}"
  if ! grep -q "^${token}:" "$REGISTRY"; then
    echo "MISSING: $ref (not in semantic-tokens.yaml)"
    ((missing++)) || true
  fi
done < "$found_tokens"

if [[ $missing -gt 0 ]]; then
  echo "---"
  echo "FAIL: $missing token(s) referenced in code/tests are not in tied/semantic-tokens.yaml"
  exit 1
fi
echo "PASS: All referenced TIED tokens are registered in tied/semantic-tokens.yaml"
