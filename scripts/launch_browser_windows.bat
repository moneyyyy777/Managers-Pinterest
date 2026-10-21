@echo off
setlocal enabledelayedexpansion

set "PROFILE_DIR=%~dp0..\.browser_profile"
if not exist "%PROFILE_DIR%" mkdir "%PROFILE_DIR%"

rem Check if port 9222 is already open
curl -s http://127.0.0.1:9222/json/version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Browser already running on port 9222
    exit /b 0
)

set "CHROME_BIN="

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_BIN=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_BIN=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_BIN=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    set "CHROME_BIN=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    set "CHROME_BIN=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
)

if "%CHROME_BIN%"=="" (
    echo Error: Chromium/Chrome or Edge executable not found.
    exit /b 1
)

echo Launching browser on port 9222...
start "" "%CHROME_BIN%" --remote-debugging-port=9222 --user-data-dir="%PROFILE_DIR%" --no-first-run "https://aistudio.google.com"
echo Browser launched successfully.
