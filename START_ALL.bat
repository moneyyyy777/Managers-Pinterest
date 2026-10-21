@echo off
chcp 65001 >nul
title Запуск всех сервисов Artify + Manager Studio

echo ==========================================================
echo 🚀 ЗАПУСК ВСЕХ СЕРВИСОВ: Artify Studio + Manager Studio
echo ==========================================================

cd /d "%~dp0"

echo 🛠️ Запуск админки Artify Studio (Port 3333)...
start "Artify Admin Server" /min cmd /c "cd Websites\CloudFlare\artify-studio && node scripts\admin\server.js"

echo 🌐 Запуск локального сайта Astro (Port 4321)...
start "Artify Astro Site" /min cmd /c "cd Websites\CloudFlare\artify-studio && npx astro dev --port 4321 --host"

echo 🏷️ Запуск Pinterest Manager Studio (Port 3001)...
cd manager_gui
call start_windows.bat
