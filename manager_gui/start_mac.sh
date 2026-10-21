#!/usr/bin/env bash

# Pinterest Manager Studio — macOS Startup Script
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "📌 Запуск Pinterest Manager Studio (Port 3001)"
echo "=========================================================="

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Ошибка: Node.js не найден. Установите Node.js 18+."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей npm..."
    npm install
fi

# Check if port 3001 is already running
PORT_PID=$(lsof -ti :3001 || true)
if [ -n "$PORT_PID" ]; then
    echo "⚠️ Порт 3001 уже занят PID $PORT_PID. Перезапуск процесса..."
    kill -9 $PORT_PID 2>/dev/null || true
    sleep 1
fi

echo "🚀 Сервер запущен:"
echo "   👉 Локально:    http://localhost:3001"
echo "   👉 По сети:     http://0.0.0.0:3001"
echo "   👉 Tailscale:   http://<tailscale-ip>:3001"
echo "=========================================================="

exec npm run dev
