@echo off
chcp 65001 >nul
title Artify Studio - Admin Control Panel

:menu
cls
echo ======================================================
echo        ARTIFY STUDIO — ПАНЕЛЬ УПРАВЛЕНИЯ (WINDOWS)
echo ======================================================
echo.
echo  [1] 🚀 Запустить Админку (http://localhost:3333)
echo  [2] 🌐 Запустить Сайт-витрину (http://localhost:4321)
echo  [3] ⚡ Запустить ВСЁ (Админка + Сайт)
echo  [4] 🛑 ОСТАНОВИТЬ всё (закрыть Node.js процессы)
echo  [5] 🔄 Подтянуть обновления из Git (git pull)
echo  [0] 🚪 Закрыть
echo ======================================================
set /p choice="Выберите действие [0-5]: "

if "%choice%"=="1" goto start_admin
if "%choice%"=="2" goto start_site
if "%choice%"=="3" goto start_all
if "%choice%"=="4" goto stop_all
if "%choice%"=="5" goto git_pull
if "%choice%"=="0" exit

echo Неверный ввод.
timeout /t 1 >nul
goto menu

:start_admin
echo Запуск админки на http://localhost:3333...
start cmd /k "npm run admin"
start http://localhost:3333
goto menu

:start_site
echo Запуск сайта на http://localhost:4321...
start cmd /k "npm run dev"
start http://localhost:4321
goto menu

:start_all
echo Запуск админки и сайта...
start cmd /k "npm run admin"
start cmd /k "npm run dev"
start http://localhost:3333
start http://localhost:4321
goto menu

:stop_all
echo Остановка Node.js процессов...
taskkill /F /IM node.exe >nul 2>&1
echo Сервисы выключены.
pause
goto menu

:git_pull
echo Обновление проекта...
git pull origin main
pause
goto menu
