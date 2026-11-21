#!/bin/sh
# Zips extension/ into hideaireplies.zip. With a tag argument (v1.2.3), first checks manifest.json has that version.
set -e
cd "$(dirname "$0")/.."
if [ -n "$1" ]; then
  v=$(python3 -c 'import json; print(json.load(open("extension/manifest.json"))["version"])')
  [ "v$v" = "$1" ] || { echo "manifest.json says $v but the tag is $1"; exit 1; }
fi
rm -f hideaireplies.zip
cd extension && zip -qrX ../hideaireplies.zip . -x '.*'
