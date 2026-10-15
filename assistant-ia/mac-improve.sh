#!/bin/bash
# Alicia Mac : une amélioration réversible et soumise à permission.
# Réglage autorisé : désactivation de l'animation d'ouverture dans le Dock.
# Ne pas lancer avec sudo. Compatible avec Bash 3.2 de macOS Big Sur.
set -u
umask 077

ACTION="help"
if [ "$#" -gt 0 ];then ACTION="$1";fi
DIR="$HOME/Library/Application Support/Alicia"
BACKUP="$DIR/dock-launchanim-original.txt"
DOMAIN="com.apple.dock"
KEY="launchanim"

usage() {
cat <<'TEXT'
Alicia — optimisation douce et réversible.
  bash mac-improve.sh preview : aperçu sans modification
  bash mac-improve.sh status  : valeur actuelle et sauvegarde
  bash mac-improve.sh apply   : demande d'accord avant modification
  bash mac-improve.sh verify  : contrôle de la nouvelle valeur
  bash mac-improve.sh undo    : retour arrière avec accord

Action limitée au Dock. Pas de sudo, pas de suppression de données personnelles.
L'action ne rend pas Ollama compatible avec macOS Big Sur.
TEXT
}
case "$ACTION" in
 help|-h|--help) usage;exit 0;;
 preview|status|apply|verify|undo) :;;
 *) usage;exit 2;;
esac
if [ "$(uname -s)" != "Darwin" ];then
 echo "Ce script nécessite macOS." >&2;exit 2
fi
if [ "$(id -u)" = "0" ];then
 echo "Refus : ne lance pas ce script avec sudo ou en root." >&2;exit 2
fi
if ! command -v defaults >/dev/null 2>&1;then
 echo "L'outil macOS defaults est introuvable." >&2;exit 2
fi

read_value() {
 local value
 if value="$(defaults read "$DOMAIN" "$KEY" 2>/dev/null)";then
  case "$value" in
   1|true|TRUE|YES) printf '1';;
   0|false|FALSE|NO) printf '0';;
   *) printf 'INVALID';;
  esac
 else
  printf 'ABSENT'
 fi
}
CURRENT="$(read_value)"
if [ "$CURRENT" = "INVALID" ];then
 echo "Le réglage actuel n'est pas reconnu ; aucune modification." >&2;exit 2
fi
SAVED=""
if [ -f "$BACKUP" ];then
 SAVED="$(cat "$BACKUP")"
 case "$SAVED" in ABSENT|0|1) :;; *)
  echo "Le fichier de sauvegarde est invalide." >&2;exit 2;;esac
fi
confirm() {
 if [ ! -t 0 ];then
  echo "L'accord doit être donné dans un Terminal interactif." >&2;return 1
 fi
 printf 'Écris OUI ALICIA puis Entrée pour CETTE action : '
 IFS= read -r USER_APPROVAL || return 1
 if [ "$USER_APPROVAL" != "OUI ALICIA" ];then
  echo "Action refusée, rien de modifié.";return 1
 fi
}
restart_dock() {
 if ! killall Dock >/dev/null 2>&1;then
  echo "Le changement est enregistré mais le Dock n'a pas pu redémarrer immédiatement."
 fi
}
case "$ACTION" in
 preview)
  echo "Réglage actuel : $CURRENT (ABSENT : réglage macOS par défaut)."
  echo "Proposition : désactiver l'animation d'ouverture des applications depuis le Dock."
  echo "Avantage : animation moins présente, pas d'amélioration CPU ou mémoire garantie."
  echo "Sauvegarde créée seulement après accord : $BACKUP"
  echo "Le Dock redémarrera brièvement. Aucun fichier personnel supprimé."
  echo "Pour revenir en arrière : bash mac-improve.sh undo"
  echo "APERÇU UNIQUEMENT : rien n'a été modifié."
 ;;
 status|verify)
  echo "Réglage actuel : $CURRENT"
  if [ -f "$BACKUP" ];then echo "Sauvegarde d'origine : présente";else echo "Sauvegarde d'origine : absente";fi
  if [ "$ACTION" = "verify" ];then
   if [ "$CURRENT" = "0" ];then echo "Vérification réussie : animation désactivée.";
   else echo "Vérification : l'animation n'est pas explicitement désactivée.";fi
  fi
 ;;
 apply)
  echo "Action exacte : régler com.apple.dock launchanim à false."
  echo "Cela ne rendra pas un logiciel incompatible compatible avec Big Sur."
  echo "Réglage actuel : $CURRENT"
  if [ "$CURRENT" = "0" ];then echo "Déjà désactivé : aucune modification.";exit 0;fi
  if [ -e "$BACKUP" ] || [ -L "$BACKUP" ];then
   echo "Une sauvegarde existe déjà : annule d'abord la modification précédente." >&2;exit 2
  fi
  confirm || exit 3
  if [ -L "$DIR" ];then echo "Dossier de sauvegarde inattendu." >&2;exit 4;fi
  mkdir -p "$DIR" || exit 4
  printf '%s\n' "$CURRENT" > "$BACKUP" || exit 4
  if ! defaults write "$DOMAIN" "$KEY" -bool false;then
   echo "Échec du réglage ; la sauvegarde est conservée." >&2;exit 4
  fi
  restart_dock
  AFTER="$(read_value)"
  if [ "$AFTER" = "0" ];then
   echo "SUCCÈS : nouvelle valeur vérifiée. Annulation possible : bash mac-improve.sh undo"
  else
   echo "Valeur inattendue ($AFTER). La sauvegarde est conservée." >&2;exit 5
  fi
 ;;
 undo)
  if [ ! -f "$BACKUP" ];then echo "Aucune sauvegarde Alicia : rien à annuler.";exit 0;fi
  echo "Revenir à la valeur initiale : $SAVED ; valeur actuelle : $CURRENT."
  confirm || exit 3
  case "$SAVED" in
   ABSENT) defaults delete "$DOMAIN" "$KEY" >/dev/null 2>&1 || {
     echo "Restauration échouée, sauvegarde conservée." >&2;exit 4;}
   ;;
   0) defaults write "$DOMAIN" "$KEY" -bool false || exit 4;;
   1) defaults write "$DOMAIN" "$KEY" -bool true || exit 4;;
  esac
  restart_dock
  AFTER="$(read_value)"
  if [ "$AFTER" != "$SAVED" ];then
   echo "Restauration non confirmée. Sauvegarde conservée." >&2;exit 5
  fi
  rm -f "$BACKUP" || exit 4
  echo "RESTAURATION RÉUSSIE : état d'origine retrouvé."
 ;;
esac
