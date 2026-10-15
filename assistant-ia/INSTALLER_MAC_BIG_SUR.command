#!/bin/bash
# Installation locale d'Alicia dans le dossier utilisateur, macOS Big Sur compatible.
# Ne modifie pas macOS, ne demande jamais sudo et ne telecharge aucun logiciel.
set -eu
BASE="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/Applications/Alicia"
SHORTCUT="$HOME/Desktop/Alicia.command"
FILES="
index.html
styles.css
app.js
avatar.js
expression-core.mjs
tool-finder.js
data-lab.js
data-core.mjs
mac-lab.js
mac-core.mjs
mac-audit.sh
mac-improve.sh
github-health.js
github-proposal-core.mjs
success-metrics.mjs
sw.js
manifest.webmanifest
icon.svg
Ouvrir Alicia.command
"
echo "=== Installation Alicia pour macOS Big Sur 11 ==="
echo "Installation dans : $DEST"
echo "Aucun accès administrateur, aucun fichier système modifié."
if [ "$(uname -s)" != "Darwin" ];then
 echo "Cet installateur fonctionne uniquement sur Mac.";exit 1
fi
for f in $FILES; do
 if [ ! -f "$BASE/$f" ];then echo "Fichier nécessaire absent : $f";exit 2;fi
done
if [ -e "$DEST" ] && [ ! -d "$DEST" ];then
 echo "Un fichier porte déjà le nom $DEST. Rien n'a été modifié.";exit 3
fi
mkdir -p "$DEST"
for f in $FILES;do
 cp "$BASE/$f" "$DEST/$f"
done
chmod u+x "$DEST/Ouvrir Alicia.command"
# Ne jamais remplacer silencieusement un fichier existant du Bureau.
if [ ! -e "$SHORTCUT" ];then
 cat >"$SHORTCUT" <<'LAUNCH'
#!/bin/bash
# Raccourci utilisateur pour ouvrir Alicia (pas de sudo).
bash "$HOME/Applications/Alicia/Ouvrir Alicia.command"
LAUNCH
 chmod u+x "$SHORTCUT"
 echo "Raccourci Alicia.command créé sur ton Bureau."
else
 echo "Un raccourci Alicia.command existe déjà sur le Bureau : conservé sans modification."
fi
echo "Installation de l'interface terminée. Ouverture dans Safari..."
bash "$DEST/Ouvrir Alicia.command"
