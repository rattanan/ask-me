#!/usr/bin/env bash
set -euo pipefail
if [[ "$EUID" -ne 0 ]]; then
  echo "Run: sudo bash /opt/apps/ask-me/deploy/setup-https.sh"
  exit 1
fi
site=/etc/nginx/sites-available/ask-me.rattanan.dev
if [[ ! -e "$site" ]]; then
  install -m 644 /opt/apps/ask-me/deploy/ask-me.nginx.conf "$site"
fi
ln -sfn "$site" /etc/nginx/sites-enabled/ask-me.rattanan.dev
nginx -t
systemctl reload nginx
certbot --nginx --non-interactive --agree-tos --register-unsafely-without-email --redirect -d ask-me.rattanan.dev
nginx -t
systemctl reload nginx
systemctl enable --now certbot.timer
