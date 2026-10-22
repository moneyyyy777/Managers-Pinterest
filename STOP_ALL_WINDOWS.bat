@echo off
chcp 65001 >nul
echo ==========================================================
echo 🛑 Остановка всех фоновых сервисов Artify + Manager
echo ==========================================================

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3333" ^| findstr "LISTENING"') do (
    echo Остановка сервера админки (PID %%a)...
    taskkill /f /pid %%a >nul 2>nul
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4321" ^| findstr "LISTENING"') do (
    echo Остановка сайта Astro (PID %%a)...
    taskkill /f /pid %%a >nul 2>nul
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo Остановка Manager Studio (PID %%a)...
    taskkill /f /pid %%a >nul 2>nul
)

echo.
echo ✅ Все фоновые сервисы остановлены.
pause
