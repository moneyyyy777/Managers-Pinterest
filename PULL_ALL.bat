@echo off
chcp 65001 >nul
python "%~dp0sync_pull.py" %*
pause
