#!/usr/bin/env bash

# Pinterest Workspace & Artify Studio — Full Stack Launcher (macOS)
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "🚀 ЗАПУСК ВСЕХ СЕРВИСОВ: Artify Studio + Manager Studio"
echo "=========================================================="

# 1. Запуск админки Artify Studio (порт 3333)
ADMIN_PID=$(lsof -ti :3333 || true)
if [ -z "$ADMIN_PID" ]; then
    echo "🛠️ Запуск Visual Admin Server (Port 3333)..."
    (cd "$DIR/Websites/CloudFlare/artify-studio" && nohup node scripts/admin/server.js > /dev/null 2>&1 &)
    sleep 1
else
    echo "🛠️ Админка уже активна (Port 3333, PID $ADMIN_PID)"
fi

# 2. Запуск локального сайта Astro (порт 4321)
SITE_PID=$(lsof -ti :4321 || true)
if [ -z "$SITE_PID" ]; then
    echo "🌐 Запуск локального сайта Astro (Port 4321)..."
    (cd "$DIR/Websites/CloudFlare/artify-studio" && nohup npx astro dev --port 4321 --host > /dev/null 2>&1 &)
    sleep 1
else
    echo "🌐 Локальный сайт уже активен (Port 4321, PID $SITE_PID)"
fi

# 3. Запуск Pinterest Manager Studio (порт 3001)
echo "🏷️ Запуск Pinterest Manager Studio (Port 3001)..."
exec "$DIR/manager_gui/start_mac.sh"
