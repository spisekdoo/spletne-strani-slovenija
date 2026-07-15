#!/usr/bin/env bash
# scripts/validate-site.sh — check that a site has the required structure
#
# Usage: ./scripts/validate-site.sh <slug>
# Example: ./scripts/validate-site.sh avtomehanika-kd

set -euo pipefail

SLUG="${1:?Usage: $0 <slug>}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE_DIR="$ROOT/sites/$SLUG"

ERRORS=0

if [ ! -d "$SITE_DIR" ]; then
  echo "❌ Directory missing: $SITE_DIR" >&2
  exit 1
fi

if [ ! -f "$SITE_DIR/index.html" ]; then
  echo "❌ Missing: $SITE_DIR/index.html" >&2
  ERRORS=$((ERRORS + 1))
fi

if [ ! -d "$SITE_DIR/assets" ]; then
  echo "⚠️  Missing: $SITE_DIR/assets/ (optional, but recommended)" >&2
fi

# Quick HTML sanity check
if [ -f "$SITE_DIR/index.html" ]; then
  if ! grep -q '<html' "$SITE_DIR/index.html"; then
    echo "❌ No <html> tag in index.html" >&2
    ERRORS=$((ERRORS + 1))
  fi
  if ! grep -q 'lang=' "$SITE_DIR/index.html"; then
    echo "⚠️  No lang= attribute in <html> tag" >&2
  fi
  if ! grep -q 'viewport' "$SITE_DIR/index.html"; then
    echo "⚠️  No viewport meta tag (mobile-unfriendly)" >&2
  fi
fi

if [ $ERRORS -eq 0 ]; then
  echo "✅ Site $SLUG looks valid"
  exit 0
else
  echo "❌ $ERRORS error(s) found" >&2
  exit 1
fi
