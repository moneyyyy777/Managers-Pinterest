#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_FILE="$PLIST_DIR/com.artify.manager-services.plist"

chmod +x "$DIR/start_all_background.sh"
mkdir -p "$PLIST_DIR"

# Выгружаем старую службу, если была
launchctl unload "$PLIST_FILE" 2>/dev/null || true

cat <<EOF > "$PLIST_FILE"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.artify.manager-services</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>$DIR/start_all_background.sh</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>AbandonProcessGroup</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/artify_services.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/artify_services.log</string>
</dict>
</plist>
EOF

launchctl load "$PLIST_FILE"

echo "=========================================================="
echo "✅ Автозагрузка на macOS успешно настроена!"
echo "🚀 Сервисы Artify Studio запущены и будут автоматически"
echo "   включаться при каждом входе в систему без открытия окон."
echo "=========================================================="
