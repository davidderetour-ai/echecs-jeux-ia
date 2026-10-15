#!/bin/bash
# Alicia — consulter les dépôts GitHub depuis le Mac, sans jeton enregistré.
BASE="$(cd "$(dirname "$0")" && pwd)"
RUBY="/usr/bin/ruby"
if [ ! -x "$RUBY" ];then RUBY="$(command -v ruby || true)";fi
if [ -z "$RUBY" ];then echo "Ruby est absent de ce Mac.";exit 1;fi
"$RUBY" "$BASE/github-mac.rb"
echo ""
read -r -p "Appuie sur Entrée pour fermer..." _
