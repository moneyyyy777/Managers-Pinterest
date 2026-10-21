#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROFILE_DIR="$PROJECT_ROOT/.browser_profile"

mkdir -p "$PROFILE_DIR"

if curl -s http://127.0.0.1:9222/json/version > /dev/null 2>&1; then
  echo "Browser already running on port 9222"
  exit 0
fi

BROWSER_BIN=""
if [ -x "/Applications/Chromium.app/Contents/MacOS/Chromium" ]; then
  BROWSER_BIN="/Applications/Chromium.app/Contents/MacOS/Chromium"
elif [ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
  BROWSER_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
elif command -v google-chrome >/dev/null 2>&1; then
  BROWSER_BIN="google-chrome"
elif command -v chromium >/dev/null 2>&1; then
  BROWSER_BIN="chromium"
elif command -v chromium-browser >/dev/null 2>&1; then
  BROWSER_BIN="chromium-browser"
fi

if [ -z "$BROWSER_BIN" ]; then
  echo "Error: Neither Chromium nor Google Chrome executable found." >&2
  exit 1
fi

echo "Launching browser from: $BROWSER_BIN"
nohup "$BROWSER_BIN" --remote-debugging-port=9222 --user-data-dir="$PROFILE_DIR" --no-first-run --no-default-browser-check "https://aistudio.google.com" > /dev/null 2>&1 &

echo "Browser launch initiated in background on port 9222."
