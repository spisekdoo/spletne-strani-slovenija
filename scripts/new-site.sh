#!/usr/bin/env bash
# scripts/new-site.sh — scaffold a new client site
#
# Usage: ./scripts/new-site.sh <slug> "<Ime podjetja>" "<Kraj>"
# Example: ./scripts/new-site.sh avtomehanika-kd "Avtomehanika Kd" "Koper"
#
# Creates:
#   sites/<slug>/index.html
#   sites/<slug>/assets/
#
# Then you:
#   1. Edit sites/<slug>/index.html (replace content with Ollama/M3-generated)
#   2. Generate token: python3 -c "import secrets; print(secrets.token_hex(8))"
#   3. Add token to KV: wrangler kv:key put --binding=TOKENS "<token>" "<slug>"
#   4. Commit + push

set -euo pipefail

SLUG="${1:?Usage: $0 <slug> '<Ime>' '<Kraj>'}"
IME="${2:?Missing 'Ime podjetja'}"
KRAJ="${3:?Missing 'Kraj'}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE_DIR="$ROOT/sites/$SLUG"

if [ -d "$SITE_DIR" ]; then
  echo "ERROR: $SITE_DIR already exists" >&2
  exit 1
fi

mkdir -p "$SITE_DIR/assets"

# Copy example as starting point
cp "$ROOT/sites/_example/index.html" "$SITE_DIR/index.html"

# Replace placeholders with real values (basic sed substitution)
# NOTE: this is a starting point. Edit further in your editor or with Ollama.
sed -i \
  -e "s|Avtomehanika Kd|$IME|g" \
  -e "s|Koper|$KRAJ|g" \
  -e "s|avtomehanika-kd|$SLUG|g" \
  -e "s|avtomehanika-kd\.si|$SLUG.si|g" \
  -e "s|info@avtomehanika-kd\.si|info@$SLUG.si|g" \
  -e "s|+386 5 123 4567|+386 5 000 0000|g" \
  -e "s|051 234 567|051 000 000|g" \
  -e "s|../../shared/|/shared/|g" \
  -e "s|../assets/|/sites/$SLUG/assets/|g" \
  "$SITE_DIR/index.html"

# Generate a fresh token for this site
TOKEN=$(python3 -c "import secrets; print(secrets.token_hex(8))")

echo "✅ Site scaffolded: $SITE_DIR"
echo "✅ Token: $TOKEN"
echo ""
echo "Next steps:"
echo "  1. Edit $SITE_DIR/index.html"
echo "  2. cd $ROOT"
echo "  3. wrangler kv:key put --binding=TOKENS \"$TOKEN\" \"$SLUG\""
echo "  4. git add sites/$SLUG && git commit -m 'feat: add $SLUG site'"
echo "  5. git push"
echo "  6. Share URL: https://spletne-strani-slovenija.pages.dev/?t=$TOKEN"
