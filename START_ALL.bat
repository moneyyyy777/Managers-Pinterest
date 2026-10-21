@echo off
chcp 65001 >nul
title Запуск всех сервисов Artify + Manager Studio

echo ==========================================================
echo 🚀 ЗАПУСК ВСЕХ СЕРВИСОВ: Artify Studio + Manager Studio
echo ==========================================================

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Ошибка: Node.js не найден. Установите Node.js 18+ с https://nodejs.org
    pause
    exit /b 1
)

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Ошибка: Git не найден. Установите Git for Windows с https://git-scm.com
    pause
    exit /b 1
)

if not exist "Websites\CloudFlare\artify-studio\node_modules" (
    echo 📦 Первичная установка npm зависимостей для Artify Studio...
    cd "Websites\CloudFlare\artify-studio"
    call npm install
    cd /d "%~dp0"
)

echo 🛠️ Запуск админки Artify Studio (Port 3333)...
start "Artify Admin Server" /min cmd /c "cd Websites\CloudFlare\artify-studio && node scripts\admin\server.js"

echo 🌐 Запуск локального сайта Astro (Port 4321)...
start "Artify Astro Site" /min cmd /c "cd Websites\CloudFlare\artify-studio && npx astro dev --port 4321 --host"

echo 🏷️ Запуск Pinterest Manager Studio (Port 3001)...
cd manager_gui
call start_windows.bat
