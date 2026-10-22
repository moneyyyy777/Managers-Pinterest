@echo off
chcp 65001 >nul
echo 🛑 Очистка порта 8501 (Streamlit QC)...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8501" ^| findstr "LISTENING"') do (
    echo Завершение процесса PID %%a...
    taskkill /f /pid %%a >nul 2>nul
)

echo ✅ Порт 8501 свободен! Теперь можно снова нажать кнопку в студии.
pause
