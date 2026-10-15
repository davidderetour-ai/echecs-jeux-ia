#!/bin/bash
# Alicia : activation du rôle Original par le propriétaire uniquement.
set -u
BASE="$(cd "$(dirname "$0")" && pwd)"
RUBY="/usr/bin/ruby"
if [ ! -x "$RUBY" ];then RUBY="$(command -v ruby || true)";fi
if [ -z "$RUBY" ];then echo "Ruby introuvable.";exit 1;fi
"$RUBY" "$BASE/original-activate.rb"
read -r -p "Entrée pour fermer..." _
