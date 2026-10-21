@echo off
chcp 65001 >nul
title Отправка всех изменений на GitHub (Push)
cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel% equ 0 (
    python sync_push.py %*
) else (
    py sync_push.py %*
)

pause
