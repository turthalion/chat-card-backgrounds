#!/usr/bin/env bash
set -euo pipefail

# --- Config ---
TAG_NAME=${1:-"0.0.0"}  # Pass tag name as first arg, defaults to 0.0.0
REPO="turthalion/chat-card-backgrounds"

echo "Building release for tag: $TAG_NAME"

# --- Substitute fields in module.json ---
# We create a temporary module.json with updated fields
jq \
  --arg version "$TAG_NAME" \
  --arg url "https://github.com/$REPO" \
  --arg manifest "https://github.com/$REPO/releases/download/$TAG_NAME/module.json" \
  --arg download "https://github.com/$REPO/releases/download/$TAG_NAME/chat-card-backgrounds.zip" \
  '.version=$version | .url=$url | .manifest=$manifest | .download=$download' \
  module.json > module.tmp.json

mv module.tmp.json module.json

echo "Updated module.json with release info."

# --- Create zip ---
ZIP_NAME="chat-card-backgrounds.zip"
zip -r "./$ZIP_NAME" module.json CHANGELOG.md LICENSE README.md module/ styles/ templates/

echo "Created $ZIP_NAME"

