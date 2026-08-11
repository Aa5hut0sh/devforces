#!/bin/bash
set -e

REPO_DIR="/home/ubuntu/devforces"
NGINX_CONF="/etc/nginx/sites-available/devforces"
NGINX_ENABLED="/etc/nginx/sites-enabled/devforces"

# symlink config from repo — editing the file in repo automatically updates nginx after reload
sudo ln -sf "$REPO_DIR/nginx/devforces.conf" "$NGINX_CONF"
sudo ln -sf "$NGINX_CONF" "$NGINX_ENABLED"

# remove default site if exists
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t && sudo systemctl reload nginx
echo "Nginx configured from repo"