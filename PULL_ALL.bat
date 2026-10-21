@echo off
chcp 65001 >nul
title Обновление проекта Artify + Manager Studio (Pull)
cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel% equ 0 (
    python sync_pull.py %*
) else (
    py sync_pull.py %*
)

pause
