#!/usr/bin/env bash

# Pinterest Workspace & Artify Studio — Silent Background Launcher for macOS
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# 1. Admin Server (порт 3333)
ADMIN_PID=$(lsof -ti :3333 || true)
if [ -z "$ADMIN_PID" ]; then
    (cd "$DIR/Websites/CloudFlare/artify-studio" && nohup node scripts/admin/server.js > /dev/null 2>&1 &)
fi

# 2. Local Astro Site (порт 4321)
SITE_PID=$(lsof -ti :4321 || true)
if [ -z "$SITE_PID" ]; then
    (cd "$DIR/Websites/CloudFlare/artify-studio" && nohup npx astro dev --port 4321 --host > /dev/null 2>&1 &)
fi

# 3. Manager Studio (порт 3001)
MGR_PID=$(lsof -ti :3001 || true)
if [ -z "$MGR_PID" ]; then
    (cd "$DIR/manager_gui" && nohup npm run dev > /dev/null 2>&1 &)
fi
