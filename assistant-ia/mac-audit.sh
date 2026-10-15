#!/bin/bash
# ALICIA MAC AUDIT V1 - LECTURE SEULE. Ne modifie rien et n'envoie rien.
# Consulte le script avant de l'executer. bash mac-audit.sh
set -u
echo "ALICIA_MAC_AUDIT_V1"
if command -v sw_vers >/dev/null 2>&1; then
  echo "OS_VERSION=$(sw_vers -productVersion 2>/dev/null || echo inconnu)"
else
  echo "OS_VERSION=inconnu"
fi
if command -v sysctl >/dev/null 2>&1; then
  echo "MAC_MODEL=$(sysctl -n hw.model 2>/dev/null || echo inconnu)"
  memory="$(sysctl -n hw.memsize 2>/dev/null || echo 0)"
  case "$memory" in
    *[!0-9]*|'') memory=0 ;;
  esac
  if [ "$memory" -gt 0 ]; then
    echo "RAM_GIB=$((memory / 1073741824))"
  else
    echo "RAM_GIB=inconnue"
  fi
else
  echo "MAC_MODEL=inconnu"
  echo "RAM_GIB=inconnue"
fi
echo "ARCH=$(uname -m 2>/dev/null || echo inconnue)"
space="$(df -k / 2>/dev/null | awk 'NR==2 {print $4}')"
case "$space" in
  *[!0-9]*|'') echo "DISK_FREE_GIB=inconnu" ;;
  *) echo "DISK_FREE_GIB=$((space / 1048576))" ;;
esac
echo "END_ALICIA_MAC_AUDIT_V1"
echo "Diagnostic uniquement : aucun fichier modifie, aucun logiciel installe, aucune donnee envoyee."
