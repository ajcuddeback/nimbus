#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_STAGE="export"
STAGING="/tmp/nimbus-frontend-build"
DEST="/var/www/nimbus"

echo "==> Building Angular app..."
DOCKER_BUILDKIT=1 docker build \
  --target "$BUILD_STAGE" \
  --output "type=local,dest=$STAGING" \
  "$REPO_ROOT/app"

echo "==> Deploying to $DEST..."
sudo rsync -av --delete "$STAGING/" "$DEST/"
sudo chown -R www-data:www-data "$DEST"

echo "==> Done. Cleaning up staging dir..."
rm -rf "$STAGING"

echo "==> Frontend deployed successfully."
