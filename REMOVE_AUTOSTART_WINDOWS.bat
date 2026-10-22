@echo off
chcp 65001 >nul
set "SHORTCUT=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\ArtifyServices.lnk"

if exist "%SHORTCUT%" (
    del /f /q "%SHORTCUT%"
    echo ✅ Тихий автозапуск Windows удалён из автозагрузки.
) else (
    echo ℹ️ Ярлык автозапуска не найден.
)
pause
