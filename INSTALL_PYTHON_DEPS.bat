@echo off
chcp 65001 >nul
title Установка Python зависимостей (Streamlit, Openpyxl, Playwright)

echo ==========================================================
echo 🐍 Установка необходимых библиотек для Pinterest Manager
echo ==========================================================

where python >nul 2>nul
if %errorlevel% neq 0 (
    where py >nul 2>nul
    if %errorlevel% neq 0 (
        echo ❌ Python не найден! Установите Python 3.10+ с https://python.org
        pause
        exit /b 1
    ) else (
        set PY_CMD=py
    )
) else (
    set PY_CMD=python
)

echo.
echo 📦 Проверка и обновление pip...
%PY_CMD% -m pip install --upgrade pip

echo.
echo 📦 Установка Streamlit, Openpyxl, Pandas, Playwright...
%PY_CMD% -m pip install streamlit openpyxl pandas playwright watchdog

echo.
echo 🎭 Установка браузера Chromium для автоматизаций Playwright...
%PY_CMD% -m playwright install chromium

echo.
echo ==========================================================
echo ✅ Все библиотеки успешно установлены!
echo Теперь Streamlit QC (порт 8501) готов к работе.
echo ==========================================================
pause
