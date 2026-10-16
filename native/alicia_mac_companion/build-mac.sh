#!/bin/bash
# Compilation locale du compagnon Alicia (Mac).
# N'installe aucun logiciel, ne demande aucun Apple ID et n'efface rien.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="$ROOT/build"
APP="$OUT/AliciaRenouvellement.app"
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "À compiler sur un Mac uniquement." >&2
  exit 1
fi
if ! command -v xcrun >/dev/null 2>&1 || ! xcrun --find swiftc >/dev/null 2>&1; then
  echo "Compilateur Swift absent : installer les outils Apple compatibles avec ce Mac." >&2
  exit 1
fi
if [[ -e "$APP" ]]; then
  echo "Une version existe déjà : $APP" >&2
  echo "Le script ne l'écrase pas. Déplace-la manuellement avant de recommencer." >&2
  exit 1
fi
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|arm64) ;;
  *) echo "Architecture Mac non reconnue." >&2; exit 1 ;;
esac
mkdir -p "$APP/Contents/MacOS"
cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleDevelopmentRegion</key><string>fr</string>
<key>CFBundleExecutable</key><string>AliciaRenouvellement</string>
<key>CFBundleIdentifier</key><string>fr.alicia.renouvellement.mac</string>
<key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
<key>CFBundleName</key><string>Alicia Renouvellement</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>0.1.0</string>
<key>CFBundleVersion</key><string>1</string>
<key>LSMinimumSystemVersion</key><string>11.0</string>
<key>NSHighResolutionCapable</key><true/>
</dict></plist>
PLIST
xcrun --sdk macosx swiftc -parse-as-library -target "$ARCH-apple-macos11.0" \
  "$ROOT/AliciaRenewalMac.swift" \
  -framework AppKit -framework SwiftUI \
  -o "$APP/Contents/MacOS/AliciaRenouvellement"
echo "Application Mac créée : $APP"
echo "Ouvre-la dans le Finder pour voir AltServer et la date iPhone déclarée."
echo "AltServer n'a pas été lancé automatiquement et aucun système n'a été modifié."
