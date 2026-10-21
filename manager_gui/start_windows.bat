@echo off
chcp 65001 > nul
setlocal

title Pinterest Manager Studio (Port 3001)

echo ==========================================================
echo 📌 Pinterest Manager Studio — Windows Startup
echo ==========================================================

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Ошибка: Node.js не найден в PATH. Установите Node.js 18+ с сайта nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo 📦 Установка зависимостей npm...
    call npm install
)

echo 🚀 Запуск веб-интерфейса на порту 3001...
echo    👉 Локально:    http://localhost:3001
echo    👉 В Tailscale: http://^<ваш-tailscale-ip^>:3001
echo ==========================================================

call npm run dev

pause
