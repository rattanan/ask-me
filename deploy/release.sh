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
current_script=$(pm2 jlist | node -e 'let s="";process.stdin.on("data",c=>s+=c);process.stdin.on("end",()=>{console.log(JSON.parse(s).find(p=>p.name==="ask-me")?.pm2_env.pm_exec_path || "")})')
if [[ -n "$current_script" && "$current_script" != "/opt/apps/ask-me/.runtime/current/server.js" ]]; then
  # PM2 reload does not update an existing process's script or cwd.
  pm2 delete ask-me
fi
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save
