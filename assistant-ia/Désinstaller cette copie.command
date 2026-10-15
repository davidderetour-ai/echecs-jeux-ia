#!/bin/bash
# Alicia — désinstallation manuelle UNIQUEMENT sur cet ordinateur.
# Jamais de suppression distante ni de fichier personnel.
set -u
LOCATION="$HOME/Applications/Alicia"
MARKER="$HOME/Library/Application Support/Alicia/original-status.json"
echo "=== Alicia : aide à la désinstallation locale ==="
if [ -f "$MARKER" ];then
 echo "Cette installation a été déclarée Original après vérification du propriétaire."
 echo "Ce script ne supprimera rien. Le propriétaire doit gérer lui-même une éventuelle désinstallation."
 exit 0
fi
echo "Cette installation est considérée comme une copie."
echo "Si tu veux la désinstaller, arrête d'abord ses services et déplace toi-même le dossier suivant vers la Corbeille :"
echo "$LOCATION"
echo "Le raccourci Bureau/Alicia.command peut aussi être déplacé manuellement."
echo "Aucun fichier n'a été supprimé. Aucun appareil distant n'est concerné."
if [ -d "$HOME/Applications" ];then open "$HOME/Applications" || true;fi
