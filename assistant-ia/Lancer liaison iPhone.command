#!/bin/bash
# Alicia — liaison iPhone <-> Mac, Wi-Fi local, avec code de session.
set -u
BASE="$(cd "$(dirname "$0")" && pwd)"
RUBY="/usr/bin/ruby"
if [ ! -x "$RUBY" ];then RUBY="$(command -v ruby || true)";fi
if [ -z "$RUBY" ] || ! "$RUBY" -rwebrick -e "exit 0" >/dev/null 2>&1;then
 echo "Impossible d'ouvrir la liaison : Ruby/WEBrick absent.";exit 1
fi
echo "Cette liaison échange uniquement des messages texte. Pas de contrôle du Mac."
echo "Pour les documents et photos, utilise AirDrop ou iCloud Drive."
"$RUBY" "$BASE/mac-iphone-bridge.rb" --lan
