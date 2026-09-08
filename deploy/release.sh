#!/usr/bin/env bash
set -euo pipefail
cd /opt/apps/ask-me
# Build outside the directory used by the running process.
NEXT_BUILD_DIR=.next-build npm run build
release="/opt/apps/ask-me/.runtime/releases/$(date +%Y%m%d%H%M%S)-$(git rev-parse --short HEAD)"
mkdir -p "$release"
cp -a .next-build/standalone/. "$release/"
mkdir -p "$release/.next-build/static"
if [[ -d .runtime/current/.next-build/static ]]; then
  cp -a .runtime/current/.next-build/static/. "$release/.next-build/static/"
fi
cp -a .next-build/static/. "$release/.next-build/static/"
cp -a public "$release/public"
install -m 600 .env "$release/.env"
ln -s "$release" .runtime/next
mv -Tf .runtime/next .runtime/current
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save
