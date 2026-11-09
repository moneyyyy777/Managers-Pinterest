@echo off
chcp 65001 >nul
cd /d "%~dp0"

:menu
cls
echo ================================================================================
echo       CREATIVE FABRICA ANALYTICS — ИНТЕРАКТИВНЫЙ ЦЕНТР УПРАВЛЕНИЯ
echo ================================================================================
echo.
echo   [1] БЫСТРОЕ ОБНОВЛЕНИЕ (Скачать только новые данные за сегодня/вчера)
echo       ↳ Сканирует страницы вперед (до 100 стр) и останавливается сам,
echo         когда дойдет до уже сохраненных записей.
echo.
echo   [2] ПРИНУДИТЕЛЬНАЯ ПРОВЕРКА N СТРАНИЦ (Выбрать: 10, 20, 50, 100...)
echo       ↳ Сканирует ровно столько страниц со стр. 1, сколько укажете,
echo         сверяет строки с базой и дописывает/обновляет данные.
echo.
echo   [3] ГЛУБОКАЯ РЕВИЗИЯ ВСЕЙ ИСТОРИИ (Стр. 1 до конца с до-сбором)
echo       ↳ Полный проход по всем страницам: находит упущенные записи,
echo         обновляет конверсии ($0.00 -^> $9.40) и дописывает их в базу.
echo.
echo   [4] АНАЛИЗ И АУДИТ ПОТЕРЬ (Мгновенно без браузера)
echo       ↳ Сверка синих галочек в Visits с Referrals, расчет $0.00 -^> $9.40,
echo         генерация текста тикета в поддержку (missing-referrals-ticket.txt).
echo.
echo   [5] ОБНОВИТЬ + ОТПРАВИТЬ В GITHUB (Sync)
echo       ↳ Скачать новое + пересчитать аналитику + git commit и push.
echo.
echo   [6] АВТОРИЗАЦИЯ В АККАУНТЕ (Login)
echo.
echo   [7] ПРОВЕРКА ЗАЩИТЫ (Stealth Verify)
echo.
echo   [0] ВЫХОД
echo ================================================================================
set /p choice="Введите номер действия [1-7] или 0 для выхода: "

if "%choice%"=="1" goto update
if "%choice%"=="2" goto check_pages
if "%choice%"=="3" goto recheck_all
if "%choice%"=="4" goto analyze
if "%choice%"=="5" goto sync
if "%choice%"=="6" goto auth
if "%choice%"=="7" goto stealth
if "%choice%"=="0" exit /b
goto menu

:update
cls
echo Запуск быстрого обновления...
call npm run update
pause
goto menu

:check_pages
cls
set /p user_pages="Сколько страниц проверить со стр. 1? (например: 10, 20, 50, 100) [по умолчанию 20]: "
if "%user_pages%"=="" set user_pages=20
echo Запуск принудительной проверки %user_pages% страниц...
call node src/cli.js --stats --pages %user_pages% --restart
pause
goto menu

:recheck_all
cls
echo Запуск глубокой ревизии всей истории со стр. 1 до самого конца...
call node src/cli.js --stats --pages all --restart
pause
goto menu

:analyze
cls
echo Запуск анализа...
call node src/analyzer.js
pause
goto menu

:sync
cls
echo Запуск сбора и пуша в GitHub...
call npm run sync
pause
goto menu

:auth
cls
call npm run auth
pause
goto menu

:stealth
cls
call npm run verify-stealth
pause
goto menu
