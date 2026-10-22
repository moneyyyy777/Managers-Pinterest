@echo off
cd /d "%~dp0"

:: 1. Проверяем порт 3333
netstat -ano | findstr ":3333" | findstr "LISTENING" >nul
if %errorlevel% neq 0 (
    cd /d "%~dp0Websites\CloudFlare\artify-studio"
    start "" /b node scripts\admin\server.js
)

:: 2. Проверяем порт 4321
netstat -ano | findstr ":4321" | findstr "LISTENING" >nul
if %errorlevel% neq 0 (
    cd /d "%~dp0Websites\CloudFlare\artify-studio"
    start "" /b npx astro dev --port 4321 --host
)

:: 3. Проверяем порт 3001
netstat -ano | findstr ":3001" | findstr "LISTENING" >nul
if %errorlevel% neq 0 (
    cd /d "%~dp0manager_gui"
    start "" /b npm run dev
)
