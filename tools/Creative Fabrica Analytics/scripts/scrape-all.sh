#!/usr/bin/env bash
cd "$(dirname "$0")/.." || exit 1
node src/cli.js --stats --pages all --no-analyze "$@"
