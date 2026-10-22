@echo off
chcp 65001 >nul
echo 🛑 Очистка порта 8501 (Streamlit QC)...

powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8501 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8501" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>nul
)

echo.
echo ✅ Порт 8501 успешно освобожден!
pause
