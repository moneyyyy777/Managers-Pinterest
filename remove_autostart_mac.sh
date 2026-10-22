#!/usr/bin/env bash
PLIST_FILE="$HOME/Library/LaunchAgents/com.artify.manager-services.plist"
launchctl unload "$PLIST_FILE" 2>/dev/null || true
rm -f "$PLIST_FILE"

echo "=========================================================="
echo "🛑 Автозагрузка на macOS отключена."
echo "=========================================================="
