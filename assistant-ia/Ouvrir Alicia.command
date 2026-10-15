#!/bin/bash
# Alicia pour macOS Big Sur 11 : ouvrir l'interface sur CET ordinateur.
# Aucun droit administrateur, aucun logiciel installe, aucune connexion cloud requise.
set -u
BASE="$(cd "$(dirname "$0")" && pwd)"
PORT=8765
URL="http://127.0.0.1:$PORT/"
DATA="$HOME/Library/Application Support/Alicia"
mkdir -p "$DATA" || exit 1
if [ ! -f "$BASE/index.html" ]; then
 echo "Alicia : fichier index.html introuvable dans $BASE"; read -r -p "Entrée pour fermer..." _; exit 1
fi
if ! command -v ruby >/dev/null 2>&1; then
 echo "Ruby absent : Alicia ne peut pas démarrer son interface locale sur ce Mac."; read -r -p "Entrée pour fermer..." _; exit 1
fi
if curl --max-time 2 -fsS "$URL" >/dev/null 2>&1; then
 if ! curl --max-time 2 -fsS "$URL" | grep -q '<title>Alicia'; then
  echo "Le port $PORT est déjà utilisé par un autre programme. Alicia n'y touchera pas."
  read -r -p "Entrée pour fermer..." _;exit 1
 fi
else
 echo "Démarrage de l'interface Alicia sur ce Mac..."
 nohup ruby -rwebrick -e '
  dir=ARGV.fetch(0)
  log=WEBrick::Log.new(File::NULL,WEBrick::Log::ERROR)
  server=WEBrick::HTTPServer.new(
    :Port=>8765,:BindAddress=>"127.0.0.1",
    :DocumentRoot=>dir,:Logger=>log,:AccessLog=>[])
  trap("TERM"){server.shutdown}
  trap("INT"){server.shutdown}
  server.start
 ' "$BASE" >"$DATA/serveur.log" 2>&1 </dev/null &
 attempts=0
 while [ "$attempts" -lt 20 ]; do
  if curl --max-time 1 -fsS "$URL" | grep -q '<title>Alicia'; then break;fi
  sleep 0.5
  attempts=$((attempts+1))
 done
fi
if ! curl --max-time 2 -fsS "$URL" | grep -q '<title>Alicia'; then
 echo "Alicia n'a pas démarré. Consulte : $DATA/serveur.log"
 echo "Ruby doit fournir WEBrick. La version de ton Mac reste inchangée."
 read -r -p "Entrée pour fermer..." _;exit 1
fi
echo "Alicia est accessible localement dans Safari à l'adresse $URL"
echo "L'interface et les outils de calcul fonctionnent ; pour discuter avec l'IA hors ligne, il faudra ajouter un modèle compatible avec ton Mac."
open -a Safari "$URL" || open "$URL"
