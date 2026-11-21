#!/bin/sh
# Renders the share card and the store images from store/card.html with headless Chrome.
set -e
cd "$(dirname "$0")/.."
chrome="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
# Headless Chrome has a minimum window width, so the small tile renders at 2x and scale 0.5.
shot() { "$chrome" --headless=new --hide-scrollbars --force-device-scale-factor="${4:-1}" --window-size="$1" --screenshot="$2" "file://$PWD/store/card.html$3" 2>/dev/null; }
shot 1200,630 docs/og.png
shot 1280,800 store/screenshot-1280x800.png
shot 880,560 store/promo-440x280.png "?small" 0.5
