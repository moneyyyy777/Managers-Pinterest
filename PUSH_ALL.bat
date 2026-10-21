@echo off
chcp 65001 >nul
python sync_push.py %*
pause
