@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ==========================================================
echo 🚀 Настройка тихого автозапуска для Windows
echo ==========================================================

set "TARGET=%~dp0START_ALL_SILENT.vbs"
set "SHORTCUT=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\ArtifyServices.lnk"

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT%'); $s.TargetPath = '%TARGET%'; $s.WorkingDirectory = '%~dp0'; $s.Save()"

echo.
echo ✅ Автозагрузка успешно настроена!
echo При включении компьютера все сервисы (3333, 4321, 3001)
echo будут автоматически включаться в тихом фоновом режиме БЕЗ окон терминала.
echo.
echo Запускаем сервисы прямо сейчас...
wscript.exe "%TARGET%"
echo ✅ Готово! Сервисы работают в фоне.
echo.
pause
