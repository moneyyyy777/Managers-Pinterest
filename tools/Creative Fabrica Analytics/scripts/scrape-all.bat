@echo off
cd /d "%~dp0\.."
node src/cli.js --stats --pages all --no-analyze %*
pause
