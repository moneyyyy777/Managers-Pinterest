#!/usr/bin/env bash

# Pinterest Workspace & Artify Studio — Silent Background Launcher for macOS
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

LOG_DIR="$HOME/Library/Logs"
mkdir -p "$LOG_DIR"

echo "=== Artify background launch: $(date) ===" >> "$LOG_DIR/artify_services.log"

# 1. Admin Server (порт 3333)
ADMIN_PID=$(lsof -ti :3333 2>/dev/null || true)
if [ -z "$ADMIN_PID" ]; then
    echo "Starting Admin Server..." >> "$LOG_DIR/artify_services.log"
    (cd "$DIR/Websites/CloudFlare/artify-studio" && nohup node scripts/admin/server.js >> "$LOG_DIR/artify_admin.log" 2>&1 &)
fi

# 2. Local Astro Site (порт 4321)
SITE_PID=$(lsof -ti :4321 2>/dev/null || true)
if [ -z "$SITE_PID" ]; then
    echo "Starting Astro Site..." >> "$LOG_DIR/artify_services.log"
    (cd "$DIR/Websites/CloudFlare/artify-studio" && nohup npx astro dev --port 4321 --host >> "$LOG_DIR/artify_site.log" 2>&1 &)
fi

# 3. Manager Studio (порт 3001)
MGR_PID=$(lsof -ti :3001 2>/dev/null || true)
if [ -z "$MGR_PID" ]; then
    echo "Starting Manager Studio..." >> "$LOG_DIR/artify_services.log"
    (cd "$DIR/manager_gui" && nohup npm run dev >> "$LOG_DIR/artify_studio.log" 2>&1 &)
fi
