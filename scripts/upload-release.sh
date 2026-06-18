#!/usr/bin/env bash
# Upload locally built Linux bundles to a GitHub Release.
# Requires: gh CLI (https://cli.github.com/) authenticated with repo access.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${1:-}"
TAG="${2:-}"

if [[ -z "$VERSION" ]]; then
  VERSION="$(node -p "require('$ROOT/package.json').version")"
fi
if [[ -z "$TAG" ]]; then
  TAG="v${VERSION}"
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "error: gh CLI not found. Install from https://cli.github.com/" >&2
  echo "  Or upload manually: GitHub → Releases → Draft new release → attach files." >&2
  exit 1
fi

BUNDLE="$ROOT/src-tauri/target/release/bundle"
DEB="$BUNDLE/deb/AuraOS_${VERSION}_amd64.deb"
RPM="$BUNDLE/rpm/AuraOS-${VERSION}-1.x86_64.rpm"
APPIMAGE="$BUNDLE/appimage/AuraOS_${VERSION}_amd64.AppImage"

for f in "$DEB" "$RPM" "$APPIMAGE"; do
  if [[ ! -f "$f" ]]; then
    echo "error: missing artifact: $f" >&2
    echo "  Run: make release" >&2
    exit 1
  fi
done

echo "Creating release $TAG with:"
echo "  $DEB"
echo "  $RPM"
echo "  $APPIMAGE"

gh release create "$TAG" \
  "$DEB" \
  "$RPM" \
  "$APPIMAGE" \
  --title "AuraOS ${VERSION}" \
  --generate-notes

echo "Done: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/releases/tag/${TAG}"
